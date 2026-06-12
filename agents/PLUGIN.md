# DawnDesk Plugin — Agent Context

> This file lives at `agents/PLUGIN.md` in every plugin repo (and in `plugin-template`).
> Read `agents/AGENTS.md` first for org-wide rules.

---

## What a plugin is

A plugin is a self-contained feature that runs *inside* DawnDesk. It is NOT a standalone app.
It consists of:
- A React frontend (builds to static `index.html` + assets)
- A Rust sidecar binary (handles backend logic for this plugin)
- `plugin.manifest.json` (identity, permissions, AI tools)

The host loads the frontend into a sandboxed WebView and spawns the sidecar as a child process.

---

## Folder structure (every plugin)

```
plugin-{name}/
├── plugin.manifest.json        ← Required. Describes the plugin to the host.
├── src/                        ← React frontend
│   ├── main.tsx                ← Entry: renders <App /> inside <PluginPanel>
│   ├── App.tsx
│   ├── components/             ← Plugin-specific components
│   ├── store/                  ← Zustand or React state (plugin-local)
│   └── styles/                 ← Only if truly necessary; prefer tokens
├── src-sidecar/                ← Rust sidecar source
│   ├── main.rs                 ← Entry: starts IPC listener, handles tool calls
│   ├── lib.rs
│   └── handlers/               ← One file per AI tool or feature area
├── index.html                  ← Vite entry point
├── vite.config.ts
├── package.json                ← Has @dawndesk/ui as dependency
├── tsconfig.json
└── .github/
    └── workflows/
        └── release.yml         ← Builds all 4 platform artifacts + opens registry PR
```

---

## plugin.manifest.json — full spec

```json
{
  "id": "notes",
  "name": "Notes",
  "version": "1.0.0",
  "minHostVersion": "1.0.0",
  "description": "Clean, fast note-taking with AI writing assistance.",
  "author": "dawndesk",
  "icon": "icon.svg",
  "category": "productivity",
  "permissions": [
    "data:read",
    "data:write",
    "file:open",
    "file:save"
  ],
  "aiTools": [
    {
      "name": "create_note",
      "description": "Creates a new note with the given title and content. Use when the user asks to save something as a note or write something down.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "The note title"
          },
          "content": {
            "type": "string",
            "description": "The note body in Markdown"
          }
        },
        "required": ["title", "content"]
      }
    }
  ]
}
```

### Permission values
| Permission | Grants |
|---|---|
| `data:read` | `getData()` |
| `data:write` | `setData()`, `deleteData()` |
| `file:open` | `openFile()`, `readFile()` |
| `file:save` | `saveFile()`, `writeFile()` |
| `events:emit` | `emit()` |
| `events:listen` | `onEvent()` |
| `ai:call` | `callAI()` |

---

## Frontend rules

### Every plugin root component must look like this:

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@dawndesk/ui/tokens.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

```tsx
// src/App.tsx
import { PluginPanel } from '@dawndesk/ui';
import { Button } from '@dawndesk/ui';
import MainView from './components/MainView';

export default function App() {
  return (
    <PluginPanel
      title="Plugin Name"
      toolbarActions={<Button variant="primary">New Item</Button>}
    >
      <MainView />
    </PluginPanel>
  );
}
```

### IPC usage pattern

```tsx
import { useDawnDesk } from '@dawndesk/ui';

export function useNotes() {
  const { getData, setData } = useDawnDesk();

  async function loadNotes() {
    return await getData<Note[]>('notes') ?? [];
  }

  async function saveNote(note: Note) {
    const notes = await loadNotes();
    const updated = [...notes.filter(n => n.id !== note.id), note];
    await setData('notes', updated);
  }

  return { loadNotes, saveNote };
}
```

### Do not:
- Use `localStorage` or `sessionStorage` (not persisted, not synced)
- Use raw `fetch()` for external APIs (no network permission by default)
- Import from `@tauri-apps/*` directly
- Import from another plugin
- Use hardcoded colors, fonts, or spacing values

---

## Sidecar (Rust backend)

The sidecar is a long-running process that handles AI tool calls routed to this plugin.
It communicates with the host over stdin/stdout using a simple JSON-lines protocol.

### main.rs pattern

```rust
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, Write};

#[derive(Deserialize)]
struct ToolCall {
    id: String,
    tool: String,
    input: serde_json::Value,
}

#[derive(Serialize)]
struct ToolResult {
    id: String,
    output: serde_json::Value,
    error: Option<String>,
}

fn main() {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut out = stdout.lock();

    for line in stdin.lock().lines() {
        let line = line.expect("Failed to read line");
        let call: ToolCall = serde_json::from_str(&line).expect("Invalid JSON");

        let result = dispatch(&call);
        let response = serde_json::to_string(&result).unwrap();
        writeln!(out, "{}", response).unwrap();
        out.flush().unwrap();
    }
}

fn dispatch(call: &ToolCall) -> ToolResult {
    match call.tool.as_str() {
        "create_note" => handlers::notes::create_note(call),
        "search_notes" => handlers::notes::search_notes(call),
        _ => ToolResult {
            id: call.id.clone(),
            output: serde_json::Value::Null,
            error: Some(format!("Unknown tool: {}", call.tool)),
        },
    }
}
```

### Handler pattern

```rust
// src-sidecar/handlers/notes.rs
use crate::{ToolCall, ToolResult};

pub fn create_note(call: &ToolCall) -> ToolResult {
    let title = call.input["title"].as_str().unwrap_or("Untitled");
    let content = call.input["content"].as_str().unwrap_or("");
    
    // Do work...
    
    ToolResult {
        id: call.id.clone(),
        output: serde_json::json!({ "success": true, "id": "new-note-id" }),
        error: None,
    }
}
```

---

## Release workflow

The `release.yml` GitHub Actions workflow must:
1. Build the React frontend (`pnpm build`)
2. Cross-compile the Rust sidecar for all 4 targets:
   - `x86_64-pc-windows-msvc`
   - `x86_64-apple-darwin`
   - `aarch64-apple-darwin`
   - `x86_64-unknown-linux-gnu`
3. Package each as `{plugin-id}-{platform}.dawndesk-plugin` (zip: `index.html` + `assets/` + sidecar binary + `plugin.manifest.json`)
4. Generate SHA-256 checksums
5. Create a GitHub Release with all 8 artifacts (4 plugins + 4 checksums)
6. Open a PR to `dawndesk/registry` updating `index.json` with the new version + URLs

---

## Testing a plugin locally

```bash
# In the plugin repo
pnpm install
pnpm dev       # Starts Vite dev server for the frontend only

# To test inside DawnDesk host:
# 1. Build: pnpm build && cargo build --manifest-path src-sidecar/Cargo.toml
# 2. Copy built artifacts to {data_root}/plugins/{plugin-id}/
# 3. Launch dawndesk host in dev mode — it will pick up the plugin
```

---

## Plugin-specific AGENTS.md

Each plugin repo also has its own `AGENTS.md` at the root that describes:
- What the plugin does
- Its data model
- All AI tools and what they do
- Any external dependencies (e.g. ffmpeg for video editor)
- Known constraints and gotchas

See plugin-specific files for details. This file covers the shared structure all plugins share.
