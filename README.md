# DawnDesk

> The all-in-one desktop productivity suite. Extensible by design.

DawnDesk is a Tauri-based desktop application that serves as the host shell for a plugin-based productivity ecosystem. The core app ships with an AI engine, a settings panel, and a plugin manager. All productivity features — photo editing, notes, finance tracking, and more — are installable plugins that run inside DawnDesk.

---

## Architecture overview

```
dawndesk (this repo)        — Tauri host: AI engine, settings, plugin shell
dawndesk/ui                 — Shared design system and component library
dawndesk/registry           — Plugin marketplace index
dawndesk/plugin-*           — Individual plugin repositories
```

The host app does not contain any productivity features itself. It provides:

- A sidebar for navigating installed plugins
- An AI panel powered by an LLM that can invoke tools across all installed plugins
- A settings panel for managing the app, data paths, API keys, and plugins
- A plugin shell that loads, sandboxes, and runs plugin frontends and their Rust sidecars

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | React 18 + TypeScript + Vite |
| Styling | @dawndesk/ui (design tokens + components) |
| Backend | Rust |
| Database | SQLite via sqlx |
| AI | Anthropic / OpenAI via configurable provider |
| Package manager | pnpm |

---

## Repository structure

```
dawndesk/
├── src/                        # React frontend
│   ├── core/
│   │   ├── AIPanel/            # AI chat interface
│   │   ├── Settings/           # App-wide settings
│   │   ├── PluginShell/        # Loads plugin frontends into WebView
│   │   ├── Sidebar/            # Plugin navigation
│   │   └── PluginStore/        # Browse and install plugins
│   ├── store/                  # Zustand global state
│   ├── ipc/                    # Typed wrappers for Tauri invoke calls
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── ai/
│   │   │   ├── engine.rs       # LLM calls, streaming, tool dispatch
│   │   │   └── registry.rs     # Dynamic tool registry from installed plugins
│   │   ├── plugins/
│   │   │   ├── manager.rs      # Install, uninstall, load, list
│   │   │   ├── manifest.rs     # plugin.manifest.json parsing and validation
│   │   │   └── sidecar.rs      # Rust sidecar process lifecycle
│   │   ├── settings/
│   │   │   └── config.rs       # App config, data paths, API keys
│   │   ├── db.rs               # SQLite connection and migrations
│   │   └── ipc/                # Tauri commands exposed to frontend
│   │       ├── ai.rs
│   │       ├── plugins.rs
│   │       └── settings.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- [Rust](https://rustup.rs) stable (1.77+)
- Tauri CLI: `cargo install tauri-cli`
- Platform dependencies: see [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### Development

```bash
git clone https://github.com/dawndesk/dawndesk.git
cd dawndesk
pnpm install
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

Produces a platform-native installer in `src-tauri/target/release/bundle/`.

---

## Plugin system

DawnDesk discovers plugins from `{data_dir}/dawndesk/plugins/`. Each plugin is a folder containing:

```
{plugin-id}/
├── plugin.manifest.json    # Identity, permissions, AI tools declared
├── index.html              # Plugin frontend entry point
├── assets/                 # Frontend build assets
└── sidecar/
    └── {plugin-id}-backend # Compiled Rust binary (platform-specific)
```

### Installing a plugin

Users can install plugins through the built-in plugin store (which reads from `dawndesk/registry`) or manually by placing a plugin folder in the plugins directory.

### AI tool registration

On startup, the host reads every installed plugin's `plugin.manifest.json` and registers their declared `aiTools` into the global tool registry. When the AI receives a tool call, the host routes it to the correct plugin's sidecar over IPC.

---

## IPC contract

The host exposes a set of Tauri commands that plugins (running in sandboxed WebViews) call through the `@dawndesk/ui` IPC bridge. Plugins cannot call Tauri APIs directly — all communication is mediated by the host.

Key commands:
- `plugin_get_data` / `plugin_set_data` — scoped key-value storage per plugin
- `ai_call` — request AI completion from within a plugin
- `plugin_emit` / `plugin_listen` — cross-plugin event bus (host-mediated)
- `open_file` / `save_file` — native file dialogs with permission gating

Full IPC specification: see [`dawndesk/ui`](https://github.com/dawndesk/ui) → `src/ipc/`.

---

## Data directory

DawnDesk stores all user data under a single configurable root:

```
{data_root}/
├── dawndesk.db             # Main SQLite database (AI history, settings)
├── config.json             # App configuration
└── plugins/
    ├── notes/              # Notes plugin data
    ├── finance-manager/    # Finance plugin data
    └── ...                 # One folder per installed plugin
```

The default data root is the OS app data directory. Users can change it to a cloud-synced folder (iCloud Drive, Dropbox, etc.) from Settings → Data.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Before contributing a new feature, check whether it belongs in the host app or as a plugin. The host should remain minimal — only features that every user needs regardless of installed plugins belong here.

---

## License

MIT — see [LICENSE](./LICENSE).
