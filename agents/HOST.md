# DawnDesk Host — Agent Context

> This file lives at `agents/HOST.md` in `dawndesk/dawndesk`.
> Read `agents/AGENTS.md` first for org-wide rules.

---

## What this repo is

The Tauri host app. It is **infrastructure only** — no productivity features live here.
It provides:
- Sidebar (plugin navigation)
- AI panel (LLM + tool dispatch across all plugins)
- Settings panel (data paths, API keys, themes, plugin management)
- Plugin shell (loads plugin frontends in sandboxed WebViews)
- Plugin manager (download, verify checksum, extract, register)
- Rust AI engine (streaming completions, dynamic tool registry)

**Rule:** If you're tempted to add a productivity feature here, it belongs in a plugin instead.

---

## Repository structure

```
dawndesk/
├── src/
│   ├── core/
│   │   ├── AIPanel/          ← AI chat UI, message history, tool call display
│   │   ├── Settings/         ← Settings tabs: General, Data, AI, Plugins, Theme
│   │   ├── PluginShell/      ← Mounts plugin WebViews, manages lifecycle
│   │   ├── Sidebar/          ← Plugin icon list, active state, drag-to-reorder
│   │   └── PluginStore/      ← Reads registry, install/uninstall UI
│   ├── store/                ← Zustand slices: app state, plugin list, AI state
│   ├── ipc/                  ← Typed wrappers for Tauri invoke calls
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── engine.rs     ← LLM provider abstraction, streaming, retry
│   │   │   └── registry.rs   ← Collects aiTools from all plugin manifests
│   │   ├── plugins/
│   │   │   ├── manager.rs    ← Install, uninstall, list, load
│   │   │   ├── manifest.rs   ← plugin.manifest.json parsing + validation
│   │   │   └── sidecar.rs    ← Sidecar process spawn, IPC, kill
│   │   ├── settings/
│   │   │   └── config.rs     ← Read/write config.json, data path resolution
│   │   ├── db.rs             ← SQLite init, migrations, connection pool
│   │   └── ipc/
│   │       ├── ai.rs         ← #[tauri::command] for AI calls
│   │       ├── plugins.rs    ← #[tauri::command] for plugin management
│   │       └── settings.rs   ← #[tauri::command] for settings R/W
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

---

## AI engine

### Provider abstraction (`ai/engine.rs`)
- Supports Anthropic and OpenAI via a `Provider` trait
- Configured by the user in Settings → AI (selects provider + pastes API key)
- All calls are streaming; the frontend receives chunks via Tauri events
- Tool call dispatch: when the model returns a tool call, `engine.rs` looks up the tool in `registry.rs` and routes to the correct plugin sidecar

### Tool registry (`ai/registry.rs`)
- On startup (and after any install/uninstall): scan all `plugin.manifest.json` files
- Collect all `aiTools` arrays and merge into a single tool list
- Annotate each tool with `pluginId` so dispatch knows which sidecar to call
- Expose this merged list to `engine.rs` at completion time

### Implementing a new AI feature in the host
1. Add the tool definition in the relevant plugin's manifest (not here)
2. The host picks it up automatically on next launch
3. If the feature is truly host-level (e.g. "list installed plugins"), define it in `ai/registry.rs` as a built-in tool

---

## Plugin lifecycle

```
User clicks Install
  → PluginStore calls plugin_install(id)
  → manager.rs downloads artifact URL from registry
  → Verifies SHA-256 checksum
  → Extracts to {data_root}/plugins/{id}/
  → Reads plugin.manifest.json
  → Registers AI tools in registry
  → Emits plugin_installed event to frontend

User clicks plugin in Sidebar
  → PluginShell receives activate(id)
  → Launches sidecar binary if not running
  → Mounts plugin index.html in sandboxed WebView
  → WebView can now call Tauri IPC commands (scoped to that plugin)

User uninstalls
  → Kills sidecar
  → Unmounts WebView
  → Deletes plugin folder (optionally keeps data folder)
  → Removes tools from registry
```

---

## IPC commands (Rust side — `ipc/`)

All commands are registered in `main.rs` via `tauri::generate_handler![]`.

### `ipc/plugins.rs`
```rust
plugin_list() → Vec<PluginMeta>
plugin_install(id: String) → Result<(), String>
plugin_uninstall(id: String, keep_data: bool) → Result<(), String>
plugin_get_data(plugin_id: String, key: String) → Option<String>
plugin_set_data(plugin_id: String, key: String, value: String) → Result<(), String>
plugin_emit(event: String, payload: String) → ()
```

### `ipc/ai.rs`
```rust
ai_chat(messages: Vec<Message>, stream: bool) → Result<String, String>
ai_tool_call(plugin_id: String, tool: String, input: Value) → Result<Value, String>
ai_get_tools() → Vec<ToolDefinition>
```

### `ipc/settings.rs`
```rust
settings_get() → AppConfig
settings_set(config: AppConfig) → Result<(), String>
settings_get_data_root() → String
settings_set_data_root(path: String) → Result<(), String>
```

---

## Database (`db.rs`)

Tables managed by the host (plugins do NOT use this DB directly):

```sql
-- AI conversation history
CREATE TABLE conversations (id, created_at, title);
CREATE TABLE messages (id, conversation_id, role, content, tool_calls, created_at);

-- Installed plugins
CREATE TABLE installed_plugins (id, name, version, installed_at, enabled);

-- Settings KV (overflow for things not in config.json)
CREATE TABLE settings (key PRIMARY KEY, value);
```

Plugins store their own data as JSON blobs via `plugin_get_data`/`plugin_set_data` — these are stored in a separate per-plugin SQLite file at `{data_root}/plugins/{id}/{id}.db`, not in the main DB.

---

## Frontend state (`store/`)

```typescript
// store/pluginsSlice.ts
interface PluginsState {
  installed: PluginMeta[];
  active: string | null;   // currently open plugin id
  loading: string[];       // plugin ids currently being installed
}

// store/aiSlice.ts
interface AIState {
  conversations: Conversation[];
  activeConversation: string | null;
  streaming: boolean;
  pendingToolCalls: ToolCall[];
}

// store/settingsSlice.ts
interface SettingsState {
  dataRoot: string;
  aiProvider: 'anthropic' | 'openai';
  theme: 'light' | 'dark' | 'system';
  // ...
}
```

---

## Things agents should NOT do here

- Add any domain-specific UI (notes editor, photo canvas, etc.) — that's a plugin
- Import from plugin repositories
- Give plugins direct filesystem access (always gate through IPC)
- Store plugin-specific data in `dawndesk.db`
- Hard-code an AI provider — always go through the `Provider` trait
