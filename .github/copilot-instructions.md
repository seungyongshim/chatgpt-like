# ChatGPT-like Blazor WebAssembly App - AI Coding Instructions

## Architecture Overview

This is a **Blazor WebAssembly chat application** that mimics ChatGPT functionality. The app runs entirely in the browser with:

- **Single Page Application**: Everything happens in `Pages/Index.razor` (~1500 lines)
- **Local API Integration**: Connects to `http://localhost:4141` for OpenAI-compatible chat completions
- **Dual Storage Strategy**: IndexedDB with localStorage fallback for chat sessions
- **Mobile-First UI**: Responsive design with mobile sidebar navigation

## Key Components & Patterns

### 1. Chat Service Architecture (`Services/ChatService.cs`)
- **IChatService Interface**: `GetModelsAsync()`, `GetResponseAsync()`, `GetUsageAsync()`
- **OpenAI API Compatibility**: Expects `/v1/models` and `/v1/chat/completions` endpoints
- **Usage Tracking**: Parses `quota_snapshots.premium_interactions` structure
- **Error Resilience**: Graceful fallbacks for model discovery

### 2. Data Persistence Strategy
**Primary**: IndexedDB via JavaScript interop (`wwwroot/js/indexeddb.js`)
```csharp
// C# calls JavaScript functions
await JS.InvokeVoidAsync("saveSessionsToIndexedDB", dtos);
var sessions = await JS.InvokeAsync<List<SessionDto>>("loadSessionsFromIndexedDB");
```

**Fallback**: localStorage for compatibility
```csharp
// Automatic fallback in SaveSessions() method
var json = System.Text.Json.JsonSerializer.Serialize(dtos);
await JS.InvokeVoidAsync("localStorage.setItem", "CHAT_SESSIONS", json);
```

### 3. Session Management Patterns
- **Session Structure**: `Session { Guid Id, string Title, List<ChatMessage> History }`
- **Auto-Title Generation**: Uses first 20 chars of first user message + "…"
- **Minimum Session Rule**: Always keeps at least 1 session active
- **System Message Handling**: Always first message, editable but not deletable

### 4. State Management
- **Component State**: All state lives in Index.razor component
- **Settings Persistence**: Model settings stored per-model as `MODEL_SETTINGS::{modelName}`
- **Theme Persistence**: Dark mode stored as `THEME_PREFERENCE` (light/dark)

## Development Workflows

### Build & Run
```powershell
cd "c:\2026\chatgpt-like\src\Sample.Wasm"
dotnet build    # Builds the WebAssembly app
dotnet run      # Starts dev server
```

### CSS Architecture
- **CSS Variables**: Theme system using `--bg-primary`, `--text-primary`, etc.
- **Dark Mode**: Toggle via `data-theme="dark"` attribute on `<html>`
- **Mobile Breakpoint**: `@media (max-width: 768px)` for responsive behavior

### Dependencies & External Services
- **Microsoft.Extensions.AI**: For chat completions and model abstraction
- **Bootstrap 5.3.3**: UI components (loaded from CDN)
- **Open Iconic**: Icon font for UI elements
- **Local AI Service**: Must run on `localhost:4141` with OpenAI-compatible endpoints

## Critical Implementation Details

### Message Editing System
- **Inline Editing**: Click any message to edit in-place
- **System Message Special Case**: Editable but resets to default instead of deleting
- **Auto-resize Textareas**: JavaScript interop for dynamic height adjustment
- **Message Regeneration**: Resend user messages to get new AI responses

### Mobile UI Patterns
- **Sidebar Navigation**: Transforms to overlay on mobile
- **Safe Area Handling**: Uses `env(safe-area-inset-bottom)` for iOS
- **Touch-Friendly**: Larger touch targets and gesture-based interactions

### JavaScript Interop Functions
Key functions exposed to C#:
- `initializeIndexedDB()`: Initialize storage
- `saveSessionsToIndexedDB(sessions)`: Persist chat data
- `copyToClipboard(text)`: Cross-browser clipboard
- `autoResizeTextarea(elementId)`: Dynamic textarea sizing

## Troubleshooting & Debugging

### Common Issues
- **IndexedDB Failures**: App automatically falls back to localStorage
- **API Connection**: Check `http://localhost:4141` availability in DevTools
- **Theme Persistence**: Stored in localStorage as `THEME_PREFERENCE`
- **Model Loading**: Falls back to manual input if model list API fails

### Development Tools
- **Browser DevTools**: IndexedDB inspection in Application tab
- **Console Logging**: Extensive logging for session saves/loads
- **Settings Panel**: Built-in connection testing and data clearing tools

## Project-Specific Conventions

- **C# Property Naming**: Use PascalCase for DTOs (Id, Title, History)
- **JavaScript Interop**: Convert to camelCase for JavaScript consumption
- **Error Handling**: Prefer graceful degradation over exceptions
- **Responsive Design**: Mobile-first approach with desktop enhancements
- **Korean UI**: Interface text is primarily in Korean

When modifying this codebase, always test both desktop and mobile layouts, ensure IndexedDB operations have localStorage fallbacks, and verify the local API service is running for full functionality.
