namespace Sample.Wasm.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.AI;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

public interface IChatService
{
    public Task<string[]> GetModelsAsync(CancellationToken ct = default);
    public Task<string> GetResponseAsync(IList<ChatMessage> history, string model, double? temperature = null, int? maxTokens = null, CancellationToken ct = default);
    public Task<UsageInfo> GetUsageAsync(CancellationToken ct = default);
}

public class UsageInfo
{
    public int? PremiumRequestsLeft { get; set; }
    public int? TotalPremiumRequests { get; set; }
    public int? PremiumRequestsUsed => 
        (this.TotalPremiumRequests.HasValue && this.PremiumRequestsLeft.HasValue) 
            ? this.TotalPremiumRequests.Value - this.PremiumRequestsLeft.Value 
            : null;
}

public class ChatService : IChatService
{
    private static readonly Uri BaseUri = new("http://localhost:4141");
    private readonly HttpClient httpClient;

    public ChatService(HttpClient httpClient) => this.httpClient = httpClient;

    public async Task<string[]> GetModelsAsync(CancellationToken ct = default)
    {
        // GET http://localhost:4141/v1/models
        using var req = new HttpRequestMessage(HttpMethod.Get, new Uri(BaseUri, "/v1/models"));
    using var res = await this.httpClient.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var root = doc.RootElement;

        // Try OpenAI-compatible shape: { data: [{ id: "model" }, ...] }
        if (root.TryGetProperty("data", out var dataEl) && dataEl.ValueKind == JsonValueKind.Array)
        {
            var list = new List<string>();
            foreach (var item in dataEl.EnumerateArray())
            {
                if (item.TryGetProperty("id", out var idEl))
                {
                    var id = idEl.GetString();
                    if (!string.IsNullOrWhiteSpace(id))
                    {
                        list.Add(id!);
                    }
                }
            }
            if (list.Count > 0)
            {
                return list.Distinct().ToArray();
            }
        }

        // Fallback: { models: ["model1", "model2"] }
        if (root.TryGetProperty("models", out var modelsEl) && modelsEl.ValueKind == JsonValueKind.Array)
        {
            var list = modelsEl.EnumerateArray().Select(x => x.GetString()).Where(s => !string.IsNullOrWhiteSpace(s))!.Cast<string>().ToArray();
            if (list.Length > 0)
            {
                return list;
            }
        }

        // As last resort, return empty list
        return Array.Empty<string>();
    }

    public async Task<string> GetResponseAsync(IList<ChatMessage> history, string model, double? temperature = null, int? maxTokens = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(model))
        {
            throw new ArgumentException("model is required", nameof(model));
        }

        var messages = new List<object>(capacity: history.Count);
        foreach (var m in history)
        {
            var role = m.Role == ChatRole.User ? "user" : (m.Role == ChatRole.System ? "system" : "assistant");
            messages.Add(new { role, content = m.Text ?? string.Empty });
        }

        var body = new Dictionary<string, object?>
        {
            ["model"] = model,
            ["messages"] = messages,
            ["temperature"] = temperature ?? 0.2,
            ["stream"] = false
        };
        if (maxTokens.HasValue)
        {
            body["max_tokens"] = maxTokens.Value;
        }

        using var req = new HttpRequestMessage(HttpMethod.Post, new Uri(BaseUri, "/v1/chat/completions"))
        {
            Content = JsonContent.Create(body, options: new JsonSerializerOptions(JsonSerializerDefaults.Web))
        };

    using var res = await this.httpClient.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var root = doc.RootElement;
        var content = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        return content ?? string.Empty;
    }

    public async Task<UsageInfo> GetUsageAsync(CancellationToken ct = default)
    {
        try
        {
            // GET http://localhost:4141/usage
            using var req = new HttpRequestMessage(HttpMethod.Get, new Uri(BaseUri, "/usage"));
            using var res = await this.httpClient.SendAsync(req, ct);
            res.EnsureSuccessStatusCode();
            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var root = doc.RootElement;

            var usageInfo = new UsageInfo();
            
            // quota_snapshots.premium_interactions 구조에서 정보 추출
            if (root.TryGetProperty("quota_snapshots", out var quotaSnapshotsEl) &&
                quotaSnapshotsEl.TryGetProperty("premium_interactions", out var premiumEl))
            {
                if (premiumEl.TryGetProperty("remaining", out var remainingEl) &&
                    remainingEl.ValueKind == JsonValueKind.Number)
                {
                    usageInfo.PremiumRequestsLeft = remainingEl.GetInt32();
                }
                
                if (premiumEl.TryGetProperty("entitlement", out var entitlementEl) &&
                    entitlementEl.ValueKind == JsonValueKind.Number)
                {
                    usageInfo.TotalPremiumRequests = entitlementEl.GetInt32();
                }
            }

            return usageInfo;
        }
        catch (Exception)
        {
            // 오류 발생 시 null 값들을 가진 UsageInfo 반환
            return new UsageInfo();
        }
    }
}
