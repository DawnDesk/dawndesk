# Creating a New Plugin — Agent Checklist

> This file lives at `agents/NEW_PLUGIN.md`.
> Read `agents/AGENTS.md` and `agents/PLUGIN.md` before using this checklist.

---

## Step 1 — Bootstrap from template

```bash
# Clone the plugin template
git clone https://github.com/dawndesk/plugin-template plugin-{name}
cd plugin-{name}

# Install dependencies
pnpm install
```

Do not start from scratch. Always clone from `plugin-template`.

---

## Step 2 — Set plugin identity

Edit `plugin.manifest.json`:
- [ ] `id`: lowercase, hyphenated (e.g. `finance-manager`)
- [ ] `name`: Human-readable (e.g. `Finance Manager`)
- [ ] `version`: `"1.0.0"`
- [ ] `description`: One clear sentence
- [ ] `category`: one of `productivity | media | finance | development | utilities | ai`
- [ ] `permissions`: only what's actually needed — start minimal
- [ ] `aiTools`: define all tools (see `agents/AI_TOOLS.md`)

---

## Step 3 — Update package.json

```json
{
  "name": "@dawndesk/plugin-{name}",
  "version": "1.0.0",
  "description": "..."
}
```

---

## Step 4 — Update Cargo.toml

```toml
[package]
name = "plugin-{name}-sidecar"
version = "1.0.0"
```

---

## Step 5 — Implement the frontend

- [ ] `src/main.tsx` imports `@dawndesk/ui/tokens.css`
- [ ] `src/App.tsx` wraps everything in `<PluginPanel title="...">`
- [ ] All state persistence uses `useDawnDesk().getData`/`setData`
- [ ] No raw colors or spacing — only `--dd-*` tokens
- [ ] No direct Tauri imports
- [ ] No `localStorage` / `sessionStorage`

---

## Step 6 — Implement the sidecar

- [ ] `src-sidecar/main.rs` reads JSON lines from stdin, writes to stdout
- [ ] Every tool listed in `plugin.manifest.json` aiTools has a handler
- [ ] All handlers are registered in the `dispatch()` match
- [ ] Handlers return valid `ToolResult` JSON
- [ ] Missing optional params use safe defaults (no panics)

---

## Step 7 — Test locally

```bash
# Test frontend in isolation
pnpm dev

# Test sidecar tool handling
echo '{"id":"t1","tool":"your_tool","input":{"param":"value"}}' | cargo run --manifest-path src-sidecar/Cargo.toml

# Install into local DawnDesk for full integration test
pnpm build
cargo build --manifest-path src-sidecar/Cargo.toml
# Copy to {data_root}/plugins/{plugin-id}/ and launch DawnDesk
```

---

## Step 8 — Create GitHub repository

```bash
# Create repo under dawndesk org
gh repo create dawndesk/plugin-{name} --public --source=. --push
```

---

## Step 9 — Create first release

Push a tag to trigger the release workflow:
```bash
git tag v1.0.0
git push origin v1.0.0
```

The `release.yml` workflow will:
1. Build all 4 platform artifacts
2. Create a GitHub Release
3. Open a PR to `dawndesk/registry`

---

## Step 10 — Merge registry PR

Review and merge the auto-opened PR in `dawndesk/registry`. The plugin is now available in the DawnDesk plugin store.

---

## Plugin-specific AGENTS.md (create this in the repo root)

Every plugin repo needs an `AGENTS.md` at root. Template:

```markdown
# plugin-{name} — Agent Context

> Read agents/AGENTS.md and agents/PLUGIN.md first.

## What this plugin does
{One paragraph summary}

## Data model
{Describe the main data structures stored via setData/getData}

## AI tools
| Tool | Description | Key params |
|---|---|---|
| `tool_name` | What it does | param1, param2 |

## Frontend structure
{Describe main components and their roles}

## Sidecar structure
{Describe handlers and what they do}

## External dependencies
{Any native deps like ffmpeg, imagemagick, etc.}

## Known constraints
{Platform quirks, perf limits, permission requirements}
```

---

## Common mistakes to avoid

| Mistake | Correct approach |
|---|---|
| Using `localStorage` | Use `useDawnDesk().getData`/`setData` |
| Importing from `@tauri-apps/api` directly | Use `useDawnDesk()` IPC hook |
| Hardcoding `#ffffff` | Use `var(--dd-bg-surface)` |
| Writing to arbitrary paths | Use `openFile`/`saveFile` from IPC bridge |
| Defining tools without sidecar handlers | Every tool needs both declaration + handler |
| Not wrapping in `<PluginPanel>` | Always required — no exceptions |
| Starting from scratch instead of template | Always clone from `plugin-template` |
