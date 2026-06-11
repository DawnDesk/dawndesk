# @dawndesk/ui — Agent Context

> This file lives at `agents/UI.md` in `dawndesk/ui`.
> Read `agents/AGENTS.md` first for org-wide rules.

---

## What this repo is

The shared package every DawnDesk plugin installs. It provides:
- CSS design tokens (colors, typography, spacing, radius)
- React component library (Button, Input, Dialog, etc.)
- `<PluginPanel>` — the required wrapper every plugin renders inside
- `useDawnDesk()` — the IPC bridge hook
- Utility hooks (useTheme, useShortcut)

**Package name:** `@dawndesk/ui`
**Installed by plugins via:** `pnpm add @dawndesk/ui`

---

## Repository structure

```
ui/
├── src/
│   ├── tokens/
│   │   ├── colors.css           ← All --dd-* color tokens, light + dark
│   │   ├── typography.css       ← Font face declarations + --dd-font-* tokens
│   │   └── spacing.css          ← --dd-space-* and --dd-radius-* tokens
│   ├── components/
│   │   ├── PluginPanel/         ← Required wrapper (index.tsx + styles.css)
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Textarea/
│   │   ├── Select/
│   │   ├── Checkbox/
│   │   ├── Toggle/
│   │   ├── Slider/
│   │   ├── Badge/
│   │   ├── Tag/
│   │   ├── Tooltip/
│   │   ├── Dialog/
│   │   ├── DropdownMenu/
│   │   ├── ContextMenu/
│   │   ├── Tabs/
│   │   ├── Accordion/
│   │   ├── Card/
│   │   ├── Separator/
│   │   ├── ScrollArea/
│   │   ├── Skeleton/
│   │   ├── Spinner/
│   │   ├── EmptyState/
│   │   ├── AIChat/              ← Embeddable AI chat panel for plugins
│   │   ├── CommandPalette/      ← Ctrl+K interface
│   │   └── Shortcut/            ← Keyboard shortcut display
│   ├── ipc/
│   │   ├── bridge.ts            ← Raw Tauri invoke() wrappers
│   │   └── hooks.ts             ← useDawnDesk() implementation
│   ├── hooks/
│   │   ├── useTheme.ts          ← Returns current theme, subscribe to changes
│   │   ├── useShortcut.ts       ← Register keyboard shortcuts
│   │   └── usePluginInfo.ts     ← Returns pluginInfo from host
│   └── index.ts                 ← Re-exports everything
├── package.json
└── vite.config.ts               ← Builds as library (ESM + CJS + types)
```

---

## Adding a new component

Requirements before adding a component here:
1. It must be used by **at least 2 different plugins** — otherwise it belongs in the plugin that needs it
2. It must use only `--dd-*` tokens for all visual properties (no hardcoded values)
3. It must support both light and dark themes automatically
4. It must be exported from `src/index.ts`
5. It must have a TypeScript interface for all props

### Component file template

```tsx
// src/components/MyComponent/index.tsx
import React from 'react';
import styles from './styles.module.css';

export interface MyComponentProps {
  /** Brief description of prop */
  label: string;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function MyComponent({
  label,
  variant = 'default',
  disabled = false,
  children,
  onClick,
}: MyComponentProps) {
  return (
    <div
      className={`${styles.root} ${styles[variant]} ${disabled ? styles.disabled : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      {label}
      {children}
    </div>
  );
}
```

```css
/* src/components/MyComponent/styles.module.css */
.root {
  /* Always use tokens */
  background: var(--dd-bg-surface);
  color: var(--dd-text-primary);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius-md);
  padding: var(--dd-space-2) var(--dd-space-3);
  font-family: var(--dd-font-body);
}

.primary {
  background: var(--dd-accent);
  color: #fff;
  border-color: var(--dd-accent);
}

.danger {
  background: var(--dd-danger);
  color: #fff;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Design tokens — full reference

### Colors (light mode defaults; dark overrides via `[data-theme="dark"]`)

```css
:root {
  /* Backgrounds */
  --dd-bg-base: #f8f7f4;
  --dd-bg-surface: #ffffff;
  --dd-bg-elevated: #ffffff;

  /* Text */
  --dd-text-primary: #1a1a1a;
  --dd-text-secondary: #4a4a4a;
  --dd-text-muted: #9a9a9a;

  /* Accent (amber-gold) */
  --dd-accent: #d4930a;
  --dd-accent-hover: #b87d08;
  --dd-accent-muted: #fdf3dc;

  /* Borders */
  --dd-border: #e5e3de;
  --dd-border-strong: #c9c6bf;

  /* Status */
  --dd-danger: #dc2626;
  --dd-success: #16a34a;
  --dd-warning: #d97706;

  /* Typography */
  --dd-font-display: 'Syne', sans-serif;
  --dd-font-body: 'DM Sans', sans-serif;
  --dd-font-mono: 'JetBrains Mono', monospace;

  /* Spacing (4px base) */
  --dd-space-1: 4px;
  --dd-space-2: 8px;
  --dd-space-3: 12px;
  --dd-space-4: 16px;
  --dd-space-5: 20px;
  --dd-space-6: 24px;
  --dd-space-7: 28px;
  --dd-space-8: 32px;
  --dd-space-9: 40px;
  --dd-space-10: 48px;

  /* Radius */
  --dd-radius-sm: 4px;
  --dd-radius-md: 8px;
  --dd-radius-lg: 12px;
  --dd-radius-xl: 20px;
}

[data-theme="dark"] {
  --dd-bg-base: #141412;
  --dd-bg-surface: #1e1d1b;
  --dd-bg-elevated: #2a2927;
  --dd-text-primary: #f0ede8;
  --dd-text-secondary: #a8a49e;
  --dd-text-muted: #6b6760;
  --dd-accent: #e8a81c;
  --dd-accent-hover: #f0b830;
  --dd-accent-muted: #2d2410;
  --dd-border: #2e2c29;
  --dd-border-strong: #4a4844;
}
```

---

## IPC bridge implementation guide

When adding a new IPC capability to the bridge:

1. Add the raw invoke wrapper to `ipc/bridge.ts`:
```typescript
export async function pluginGetData(key: string): Promise<unknown> {
  return invoke('plugin_get_data', { key });
}
```

2. Expose it in `useDawnDesk()` in `ipc/hooks.ts`:
```typescript
export function useDawnDesk() {
  // ...
  return {
    getData: async <T>(key: string) => pluginGetData(key) as Promise<T>,
    // ...
  };
}
```

3. The corresponding Tauri command must already exist in `dawndesk/dawndesk` → `src-tauri/src/ipc/`.

---

## Build output

```
dist/
├── index.js        ← ESM
├── index.cjs       ← CJS
├── index.d.ts      ← Types
└── tokens.css      ← Must be imported separately by plugins
```

Plugins import:
```typescript
import '@dawndesk/ui/tokens.css';  // In main.tsx (once)
import { Button, PluginPanel, useDawnDesk } from '@dawndesk/ui';
```

---

## What agents should NOT do here

- Add components used by only one plugin
- Hardcode colors or spacing that should be tokens
- Add network calls or Tauri calls outside of `ipc/bridge.ts`
- Break the exports in `index.ts` — plugins depend on these
- Change existing token names without a major version bump
