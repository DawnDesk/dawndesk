# DawnDesk Registry — Agent Context

> This file lives at `agents/REGISTRY.md` in `dawndesk/registry`.
> Read `agents/AGENTS.md` first for org-wide rules.

---

## What this repo is

The plugin marketplace index. It is a JSON file (`index.json`) that DawnDesk fetches to power the plugin store UI. It does NOT host plugin files — only URLs pointing to GitHub Release artifacts.

---

## Repository structure

```
registry/
├── index.json          ← The plugin index (only file agents usually edit)
├── schema.json         ← JSON Schema for validating index.json entries
├── scripts/
│   ├── validate.js     ← Run in CI: validates index.json against schema
│   └── update.js       ← Called by plugin release workflows to auto-open PRs
└── web/                ← Static site source for plugins.dawndesk.app
```

---

## index.json — full entry spec

```json
{
  "id": "notes",
  "name": "Notes",
  "description": "Clean, fast note-taking with AI writing assistance.",
  "author": "dawndesk",
  "repository": "https://github.com/dawndesk/plugin-notes",
  "icon": "https://raw.githubusercontent.com/dawndesk/plugin-notes/main/icon.svg",
  "category": "productivity",
  "tags": ["notes", "writing", "markdown"],
  "latestVersion": "1.0.0",
  "minHostVersion": "1.0.0",
  "verified": true,
  "releases": {
    "windows-x86_64": {
      "url": "https://github.com/dawndesk/plugin-notes/releases/download/v1.0.0/notes-windows-x86_64.dawndesk-plugin",
      "checksum": "sha256:abc123..."
    },
    "macos-x86_64": {
      "url": "...",
      "checksum": "sha256:..."
    },
    "macos-aarch64": {
      "url": "...",
      "checksum": "sha256:..."
    },
    "linux-x86_64": {
      "url": "...",
      "checksum": "sha256:..."
    }
  }
}
```

### Categories
`productivity` | `media` | `finance` | `development` | `utilities` | `ai`

### verified field
- `true` — built and maintained by DawnDesk team
- `false` — community plugin (reviewed but third-party)

---

## How versions are updated

Plugin release workflows call `scripts/update.js` which opens a PR to this repo updating `latestVersion`, `releases` URLs, and checksums. Agents do not need to do this manually for official plugins.

For a manual update:
1. Get the new version's artifact URLs from the GitHub Release
2. Download each `.sha256` file to get the checksum value
3. Update `latestVersion`, all 4 `releases[platform].url` and `releases[platform].checksum` fields
4. Update `updatedAt` at the top level of `index.json`
5. Run `node scripts/validate.js` to verify

---

## Adding a new official plugin entry

```bash
# 1. Clone the registry
git clone https://github.com/dawndesk/registry
cd registry

# 2. Add entry to index.json (in the plugins array)
# Use the template above — fill every field

# 3. Validate
node scripts/validate.js

# 4. Open PR with title: "Add plugin: {plugin-name}"
```

---

## Validation rules (enforced by CI)

- `id` must be lowercase, alphanumeric + hyphens only
- `id` must match the GitHub repo name (`plugin-{id}`)
- `category` must be one of the allowed values
- All 4 platforms must have `url` and `checksum`
- `checksum` must start with `sha256:`
- `minHostVersion` must be semver
- `icon` must be an absolute HTTPS URL
- No duplicate `id` values

CI runs `scripts/validate.js` on every PR. PRs with validation failures are not merged.
