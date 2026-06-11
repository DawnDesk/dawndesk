# DawnDesk — Agent Context (Root)

> This file is the entry point for any AI coding agent working across the DawnDesk GitHub organization.
> Place this file at the root of every repository, OR reference it from a repo-specific AGENTS.md.

---

## Organization overview

DawnDesk is a Tauri-based desktop productivity suite. The main app is a plugin shell — it has no productivity features itself. All features are installable plugins (separate repos) that run inside the host.

### Repository map

| Repo | Role |
|---|---|
| `dawndesk/dawndesk` | Main Tauri host app — AI engine, settings, plugin shell |
| `dawndesk/ui` | Shared design system + IPC bridge (`@dawndesk/ui`) |
| `dawndesk/plugin-template` | Template every plugin is cloned from |
| `dawndesk/registry` | Plugin marketplace JSON index |
| `dawndesk/plugin-notes` | Notes plugin |
| `dawndesk/plugin-photo-editor` | Photo editor plugin |
| `dawndesk/plugin-video-editor` | Video editor plugin |
| `dawndesk/plugin-finance-manager` | Finance & budgeting plugin |
| `dawndesk/plugin-workflow-builder` | Visual workflow automation plugin |
| `dawndesk/plugin-dev-tools` | Developer tools plugin |
| `dawndesk/plugin-project-manager` | Project & task management plugin |

---

## Tech stack (applies to all repos)

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | React 18 + TypeScript + Vite |
| Styling | `@dawndesk/ui` (design tokens + components) — **never raw CSS values** |
| Backend | Rust (stable 1.77+) |
| Database | SQLite via `sqlx` (host only; plugins use IPC data store) |
| AI | Anthropic / OpenAI via configurable provider |
| Package manager | pnpm 9+ |
| Node | 20+ |

---

## Ground rules for all agents

1. **Never use raw hex colors or px values in plugin frontends.** Always use `@dawndesk/ui` design tokens (`--dd-*` CSS custom properties).
2. **Plugins never call Tauri APIs directly.** All host communication goes through the `useDawnDesk()` IPC hook from `@dawndesk/ui`.
3. **The host stays minimal.** If a feature is plugin-specific, it belongs in a plugin, not `dawndesk/dawndesk`.
4. **One data root.** Plugins store data by calling `setData`/`getData` through the IPC bridge. They never write to arbitrary paths.
5. **plugin.manifest.json is the contract.** Every plugin must have a valid manifest. The host reads it on startup to register AI tools and permissions.
6. **Cross-plugin communication is host-mediated.** Use `emit`/`onEvent` from `useDawnDesk()` — never import from another plugin.
7. **Every plugin wraps its UI in `<PluginPanel>`.** This is not optional.
8. **Rust sidecars are per-plugin.** A plugin's backend logic lives in its own sidecar binary, not in the host.

---

## Key interfaces every agent must know

### plugin.manifest.json (every plugin)
```json
{
  "id": "plugin-id",
  "name": "Human Name",
  "version": "1.0.0",
  "minHostVersion": "1.0.0",
  "description": "One line description",
  "permissions": ["data:read", "data:write", "file:open", "file:save"],
  "aiTools": [
    {
      "name": "tool_name",
      "description": "What this tool does — seen by the AI",
      "inputSchema": {
        "type": "object",
        "properties": {
          "param": { "type": "string", "description": "..." }
        },
        "required": ["param"]
      }
    }
  ]
}
```

### IPC bridge (plugin frontend)
```typescript
import { useDawnDesk } from '@dawndesk/ui';

const {
  getData,        // getData<T>(key) → T
  setData,        // setData(key, value) → void
  deleteData,     // deleteData(key) → void
  callAI,         // callAI({ prompt, tools? }) → string
  emit,           // emit(event, payload) → void
  onEvent,        // onEvent(event, handler) → unsubscribe fn
  openFile,       // openFile({ filters }) → string path
  saveFile,       // saveFile({ defaultName, filters }) → string path
  readFile,       // readFile(path) → Uint8Array
  writeFile,      // writeFile(path, data) → void
  pluginInfo,     // { id, name, version, dataDir }
} = useDawnDesk();
```

### Tauri IPC commands (host → plugin boundary)
```
plugin_get_data / plugin_set_data  — scoped KV store
ai_call                            — AI completion request
plugin_emit / plugin_listen        — cross-plugin event bus
open_file / save_file              — native file dialogs
```

---

## Design tokens quick reference

```css
/* Backgrounds */
--dd-bg-base, --dd-bg-surface, --dd-bg-elevated

/* Text */
--dd-text-primary, --dd-text-secondary, --dd-text-muted

/* Accent */
--dd-accent, --dd-accent-hover, --dd-accent-muted

/* Borders */
--dd-border, --dd-border-strong

/* Status */
--dd-danger, --dd-success, --dd-warning

/* Typography */
--dd-font-display   /* Syne — headings */
--dd-font-body      /* DM Sans — body */
--dd-font-mono      /* JetBrains Mono — code */

/* Spacing (4px base) */
--dd-space-1 … --dd-space-10

/* Radius */
--dd-radius-sm (4px) --dd-radius-md (8px) --dd-radius-lg (12px) --dd-radius-xl (20px)
```

---

## Data directory layout

```
{data_root}/
├── dawndesk.db          ← Main SQLite (AI history, settings) — host only
├── config.json
└── plugins/
    ├── notes/           ← Notes plugin data (accessed only via IPC)
    ├── finance-manager/
    └── ...
```

---

## See also

- `agents/HOST.md` — detailed guide for working on `dawndesk/dawndesk`
- `agents/UI.md` — detailed guide for working on `dawndesk/ui`
- `agents/PLUGIN.md` — detailed guide for working on any plugin repo
- `agents/REGISTRY.md` — guide for working on `dawndesk/registry`
- `agents/AI_TOOLS.md` — how to define and implement AI tools in plugins
- `agents/NEW_PLUGIN.md` — step-by-step checklist for creating a new plugin
