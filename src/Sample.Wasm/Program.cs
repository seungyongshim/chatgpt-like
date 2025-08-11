using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Sample.Wasm;
using Sample.Wasm.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HttpClient 설정 - 타임아웃 문제 해결
builder.Services.AddScoped(sp => 
{
    var httpClient = new HttpClient 
    { 
        BaseAddress = new Uri(builder.HostEnvironment.BaseAddress),
        // 기본 타임아웃을 5분으로 설정 (AI 응답이 오래 걸릴 수 있음)
        Timeout = TimeSpan.FromMinutes(5)
    };
    return httpClient;
});
builder.Services.AddScoped<IChatService, ChatService>();

await builder.Build().RunAsync();
