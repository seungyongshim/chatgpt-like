# ChatGPT-like React App - AI Agent Instructions

## Project Overview
React 18 + TypeScript + Vite chat application with OpenAI-compatible backend integration. Features multi-session chat management, model configuration, and responsive UI with dark/light themes.

## Architecture & Key Patterns

### State Management (Zustand)
- **Single store**: `src/stores/chatStore.ts` manages all app state using Zustand
- **Session-first design**: Each chat session has independent history, system messages, and settings
- **Async actions**: All state mutations are async functions that handle persistence automatically
- Pattern: Always call `saveSessions()` after state changes that affect persistence

### Storage Strategy (Dual-Layer)
- **Primary**: IndexedDB via `src/services/storageService.ts`
- **Fallback**: localStorage for browser compatibility
- **Auto-initialization**: `StorageService.initializeStorage()` called on app start
- Key insight: Storage operations are async but include automatic fallback logic

### Service Layer Architecture
- **ChatService**: HTTP client for OpenAI-compatible APIs (`src/services/chatService.ts`)
- **AbortController pattern**: All API calls support cancellation with combined signals
- **Streaming support**: `getResponseStreaming()` uses async generators for real-time responses
- **Error boundaries**: Services handle timeouts, network errors, and malformed responses

### Component Structure
```
App.tsx (layout + initialization)
├── ChatSidebar (session management)
├── ChatContainer
│   ├── MessageList (virtualized messages)
│   └── ChatInput (controls + input)
├── SettingsPanel (overlay modal)
└── ThemeToggle (header utility)
```

## Development Workflows

### Local Development
```bash
npm run dev          # Vite dev server on localhost:5173
npm run build        # TypeScript compilation + Vite build
npm run preview      # Test production build locally
```

### GitHub Pages Deployment
- **Automatic**: Pushes to `master` trigger GitHub Actions CI/CD
- **Base path**: `vite.config.ts` dynamically sets base URL from `GITHUB_REPOSITORY` env var
- **SPA handling**: CI creates `404.html` copy for client-side routing
- **Environment**: Expects backend API at `http://localhost:4141` (configurable in `ChatService`)

## Critical Conventions

### CSS Organization
- **Bootstrap base**: Imported first in `main.tsx` 
- **Modular CSS**: Each component has dedicated CSS file (e.g., `chat-input.css`)
- **CSS custom properties**: Theme variables in `:root` and `[data-theme="dark"]`
- **Icon system**: Open Iconic fonts for consistent iconography

### Message Flow Pattern
1. User input → `setUserInput()` → local state sync
2. `sendMessage()` → abort controller setup → streaming response
3. Real-time UI updates via async generator chunks
4. Session persistence → IndexedDB/localStorage dual-write
5. Usage info refresh (background)

### Model Configuration
- **Per-model settings**: Temperature/max_tokens stored with model key prefix
- **Effective model**: Fallback logic when no model selected
- **Settings persistence**: `loadModelSettings()`/`saveModelSettings()` called on model changes

## Integration Points

### Backend API Contract
- **Models endpoint**: `GET /v1/models` (OpenAI-compatible format)
- **Chat completion**: `POST /v1/chat/completions` with streaming support
- **Usage info**: `GET /usage` (custom endpoint for quota tracking)
- **Headers**: Include `anthropic-beta: output-128k-2025-02-19` for compatibility

### Session Management
- **UUID generation**: Simple string replacement method in store
- **Title auto-generation**: From first user message (20 char limit + ellipsis)
- **System message inheritance**: New sessions inherit current system message
- **Deletion protection**: Minimum 1 session enforced

### Error Handling Strategy
- **Network errors**: Display in error banner above chat input
- **Streaming interruption**: Clean up partial assistant messages
- **Storage failures**: Graceful fallback from IndexedDB to localStorage
- **Model unavailability**: Allow manual model input when API unavailable

## File Naming & Location Patterns
- **Components**: PascalCase in `src/components/{Feature}/ComponentName.tsx`
- **Styles**: kebab-case in `src/styles/css/component-name.css`
- **Services**: camelCase in `src/services/serviceName.ts`
- **Types**: Shared interfaces in `src/services/types.ts`

## Performance Considerations
- **Message virtualization**: Consider implementing for very long conversations
- **Streaming optimization**: 3ms delays between chunks for smooth UI updates
- **Storage batching**: Session saves are debounced through state management
- **Theme persistence**: Immediate HTML attribute updates prevent flash

When modifying this codebase:
1. Always test both IndexedDB and localStorage fallback paths
2. Verify streaming cancellation works correctly with AbortController
3. Check theme switching in both light and dark modes
4. Test responsive behavior on mobile viewports
5. Ensure new API calls include proper timeout and error handling