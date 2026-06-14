import { useEffect, useState } from 'react'
import {
  ChartNoAxesCombined,
  Code2,
  FileText,
  FolderOpen,
  Image,
  Maximize2,
  Minimize2,
  Package,
  Puzzle,
  Search,
  Trash2,
  Video,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import { PluginIcon } from '../PluginIcon'
import { getPluginEntryDocument } from '../../ipc/host'
import type { PluginMeta } from '../../store/appStore'

type PluginShellProps = {
  activePlugin: PluginMeta | null
  busyPluginId: string | null
  onDelete: (id: string) => void
  onOpenPlugin: (id: string) => void
  onOpenStore: () => void
  plugins: PluginMeta[]
}

const primaryButton =
  'inline-flex min-h-[38px] items-center justify-center gap-[var(--dd-space-2)] justify-self-start rounded-[var(--dd-radius-md)] border border-transparent bg-[var(--dd-accent)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] font-extrabold text-[var(--dd-accent-contrast)] shadow-[var(--dd-shadow-sm)] transition-[background,color,transform,border-color] duration-150 hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] active:scale-[0.98] active:bg-[var(--dd-accent-active)] disabled:cursor-not-allowed disabled:opacity-70'
const secondaryButton =
  'inline-flex min-h-9 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-sm)] border border-[rgba(148,163,184,0.14)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-4)] text-[0.9rem] font-bold text-[var(--dd-text-primary)] transition-[border-color,background,transform] hover:-translate-y-px hover:border-[rgba(250,204,21,0.28)] hover:bg-[rgba(255,255,255,0.045)] disabled:cursor-not-allowed disabled:opacity-65'
const localPanel =
  'border border-[rgba(148,163,184,0.16)] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.28)]'

type PluginDocumentState = {
  document: string | null
  error: string | null
  pluginId: string | null
}

export function PluginShell({
  activePlugin,
  busyPluginId,
  onDelete,
  onOpenPlugin,
  onOpenStore,
  plugins,
}: PluginShellProps) {
  const activePluginId = activePlugin?.id ?? null
  const [pluginLoad, setPluginLoad] = useState<PluginDocumentState>({
    document: null,
    error: null,
    pluginId: null,
  })
  const [fullscreenState, setFullscreenState] = useState({
    pluginId: null as string | null,
    value: false,
  })
  const pluginDocument = pluginLoad.pluginId === activePluginId ? pluginLoad.document : null
  const pluginError = pluginLoad.pluginId === activePluginId ? pluginLoad.error : null
  const isFullscreen = fullscreenState.pluginId === activePluginId ? fullscreenState.value : false

  useEffect(() => {
    let alive = true

    async function loadPluginDocument() {
      if (!activePluginId) return

      try {
        const html = await getPluginEntryDocument(activePluginId)
        if (alive) {
          setPluginLoad({
            document: html,
            error: null,
            pluginId: activePluginId,
          })
        }
      } catch (error) {
        if (alive) {
          setPluginLoad({
            document: null,
            error: error instanceof Error ? error.message : 'Unable to load plugin UI',
            pluginId: activePluginId,
          })
        }
      }
    }

    loadPluginDocument()

    return () => {
      alive = false
    }
  }, [activePluginId])

  useEffect(() => {
    if (!isFullscreen) return

    function exitOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setFullscreenState((current) =>
          current.pluginId === activePluginId ? { ...current, value: false } : current,
        )
      }
    }

    window.addEventListener('keydown', exitOnEscape)

    return () => {
      window.removeEventListener('keydown', exitOnEscape)
    }
  }, [activePluginId, isFullscreen])

  if (!activePlugin) {
    return (
      <LocalPluginPage
        busyPluginId={busyPluginId}
        onDelete={onDelete}
        onOpenPlugin={onOpenPlugin}
        onOpenStore={onOpenStore}
        plugins={plugins}
      />
    )
  }

  return (
    <section className="flex min-h-0 flex-1 p-0 max-[900px]:px-[var(--dd-space-4)]">
      <article
        className={
          isFullscreen
            ? 'fixed inset-0 z-30 flex min-w-0 flex-col overflow-hidden border-0 bg-[var(--dd-bg-base)] animate-[panelIn_180ms_ease_both]'
            : 'flex min-w-0 flex-1 flex-col overflow-hidden border-l border-[var(--dd-border)] bg-black shadow-[var(--dd-shadow-md)] animate-[panelIn_260ms_ease_both]'
        }
      >
        <header
          className={
            isFullscreen
              ? 'flex min-h-11 items-center justify-between border-b border-[var(--dd-border-soft)] px-[var(--dd-space-3)]'
              : 'flex min-h-16 items-center justify-between border-b border-[var(--dd-border-soft)] px-[var(--dd-space-4)]'
          }
        >
          <div className="inline-flex items-center gap-[var(--dd-space-2)]">
            <PluginIcon
              fallback={FileText}
              icon={activePlugin.icon}
              label={activePlugin.name}
              size={isFullscreen ? 'xs' : 'sm'}
            />
            <strong className={isFullscreen ? 'text-sm' : ''}>{activePlugin.name}</strong>
          </div>
          <div className="inline-flex items-center gap-[var(--dd-space-1)]">
            <button
              className="grid size-8 place-items-center rounded-[var(--dd-radius-sm)] border border-transparent bg-transparent p-0 text-[var(--dd-text-secondary)] transition-[background,border-color,color,transform] duration-150 hover:-translate-y-px hover:border-[var(--dd-border)] hover:bg-[var(--dd-bg-elevated)] hover:text-[var(--dd-text-primary)]"
              aria-label={isFullscreen ? 'Minimize plugin view' : 'Maximize plugin view'}
              title={isFullscreen ? 'Minimize plugin view' : 'Maximize plugin view'}
              type="button"
              onClick={() =>
                setFullscreenState((current) => ({
                  pluginId: activePlugin.id,
                  value: current.pluginId === activePlugin.id ? !current.value : true,
                }))
              }
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 p-0">
          {pluginDocument ? (
            <iframe
              className="h-full min-h-[calc(100vh-128px)] w-full border-0 bg-white"
              srcDoc={pluginDocument}
              title={activePlugin.name}
            />
          ) : pluginError ? (
            <div className="grid min-h-full place-content-center p-[var(--dd-space-8)] text-center">
              <h2 className="m-0 mb-[var(--dd-space-2)] text-base">Plugin UI failed to load</h2>
              <p className="m-0 max-w-xl text-[var(--dd-text-secondary)]">{pluginError}</p>
            </div>
          ) : activePlugin.entryPath ? (
            <div className="grid min-h-full place-content-center p-[var(--dd-space-8)] text-center">
              <h2 className="m-0 mb-[var(--dd-space-2)] text-base">Loading plugin</h2>
              <p className="m-0 max-w-xl text-[var(--dd-text-secondary)]">
                Preparing {activePlugin.name}.
              </p>
            </div>
          ) : (
            <div className="grid min-h-full place-content-center p-[var(--dd-space-8)] text-center">
              <h2 className="m-0 mb-[var(--dd-space-2)] text-base">Plugin UI not found</h2>
              <p className="m-0 max-w-xl text-[var(--dd-text-secondary)]">
                This plugin is installed, but its package does not include an index.html entry.
              </p>
            </div>
          )}
        </div>
      </article>
    </section>
  )
}

function LocalPluginPage({
  busyPluginId,
  onDelete,
  onOpenPlugin,
  onOpenStore,
  plugins,
}: {
  busyPluginId: string | null
  onDelete: (id: string) => void
  onOpenPlugin: (id: string) => void
  onOpenStore: () => void
  plugins: PluginMeta[]
}) {
  const [query, setQuery] = useState('')
  const visiblePlugins = plugins.filter((plugin) => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return true

    return (
      plugin.name.toLowerCase().includes(normalized) ||
      plugin.description.toLowerCase().includes(normalized) ||
      plugin.category?.toLowerCase().includes(normalized)
    )
  })
  const totalTools = plugins.length
  const enabledPlugins = plugins.filter((plugin) => plugin.enabled).length

  return (
    <section className="relative min-h-0 flex-1 overflow-y-auto bg-black px-[var(--dd-space-7)] pb-[var(--dd-space-6)] pt-[var(--dd-space-6)] max-[900px]:px-[var(--dd-space-4)]">

      <div className="relative mx-auto grid w-full max-w-[1320px] gap-[var(--dd-space-5)]">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[var(--dd-space-5)] max-[860px]:grid-cols-1">
          <div>
            <h1 className="m-0 text-[clamp(2rem,3vw,2.65rem)] font-extrabold leading-tight tracking-normal text-[var(--dd-text-primary)]">
              Plugins
            </h1>
            <p className="m-0 mt-[var(--dd-space-2)] text-[0.98rem] text-[var(--dd-text-secondary)]">
              Manage local DawnDesk plugins installed on this device.
            </p>
          </div>
          <div className="grid grid-cols-[240px_auto] gap-[var(--dd-space-3)] max-[640px]:grid-cols-1">
            <label className="grid h-10 grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-3)] text-[var(--dd-text-muted)]">
              <Search size={17} aria-hidden="true" />
              <input
                className="min-w-0 border-0 bg-transparent text-[0.9rem] text-[var(--dd-text-primary)] outline-none placeholder:text-[var(--dd-text-muted)]"
                aria-label="Search local plugins"
                placeholder="Search local plugins..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button className={primaryButton} type="button" onClick={onOpenStore}>
              <Puzzle size={16} aria-hidden="true" />
              Browse Marketplace
            </button>
          </div>
        </header>

        <nav className="flex items-end gap-[var(--dd-space-6)] border-b border-[rgba(148,163,184,0.14)]" aria-label="Plugin views">
          <span className="relative min-h-12 px-[var(--dd-space-5)] pt-[var(--dd-space-3)] text-[0.95rem] font-semibold text-[var(--dd-accent)]">
            Installed
            <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-[var(--dd-accent)]" />
          </span>
          <button
            className="min-h-12 px-[var(--dd-space-5)] text-[0.95rem] font-semibold text-[var(--dd-text-secondary)] transition-colors hover:text-[var(--dd-text-primary)]"
            type="button"
            onClick={onOpenStore}
          >
            Marketplace
          </button>
        </nav>

        <section className="relative isolate min-h-[210px] overflow-hidden rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.14)] bg-[var(--dd-bg-surface)] p-[var(--dd-space-7)] shadow-[0_24px_70px_rgba(0,0,0,0.32)] max-[720px]:p-[var(--dd-space-5)]">
          <img
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src="/local-plugin.png"
          />
          <div className="" />
          <div className="max-w-[560px]">
            <h2 className="m-0 text-[clamp(1.75rem,3vw,2.45rem)] font-extrabold leading-tight text-[var(--dd-text-primary)]">
              Your local plugin workspace
            </h2>
            <p className="m-0 mt-[var(--dd-space-2)] max-w-[500px] text-[1rem] leading-7 text-[var(--dd-text-secondary)]">
              Launch installed tools, manage plugin packages, and keep DawnDesk focused around the extensions you actually use.
            </p>
            <div className="mt-[var(--dd-space-5)] flex flex-wrap gap-[var(--dd-space-3)]">
              <StatPill label="Installed" value={totalTools} />
              <StatPill label="Enabled" value={enabledPlugins} />
              <StatPill label="Available" value={Math.max(totalTools, 1)} />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-[var(--dd-space-4)]">
          <h2 className="m-0 text-[1.1rem] font-extrabold text-[var(--dd-text-primary)]">
            Installed Plugins
          </h2>
          <span className="text-[0.9rem] text-[var(--dd-text-muted)]">
            {visiblePlugins.length} shown
          </span>
        </div>

        {visiblePlugins.length === 0 ? (
          <article className={`${localPanel} grid min-h-[260px] place-items-center rounded-[var(--dd-radius-md)] p-[var(--dd-space-8)] text-center`}>
            <div>
              <Package className="mx-auto text-[var(--dd-accent)]" size={36} aria-hidden="true" />
              <h3 className="mb-0 mt-[var(--dd-space-3)] text-[1.12rem] text-[var(--dd-text-primary)]">
                No local plugins found
              </h3>
              <p className="m-0 mt-[var(--dd-space-2)] max-w-md text-[var(--dd-text-secondary)]">
                Install a plugin from the marketplace or adjust your search to see local tools.
              </p>
              <button className={`${primaryButton} mt-[var(--dd-space-5)]`} type="button" onClick={onOpenStore}>
                Explore Marketplace
              </button>
            </div>
          </article>
        ) : (
          <div className="grid gap-[var(--dd-space-4)] sm:grid-cols-2 xl:grid-cols-3">
            {visiblePlugins.map((plugin) => (
              <LocalPluginCard
                busy={busyPluginId === plugin.id}
                key={plugin.id}
                onDelete={() => onDelete(plugin.id)}
                onOpen={() => onOpenPlugin(plugin.id)}
                plugin={plugin}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex min-h-10 items-center gap-[var(--dd-space-2)] rounded-full border border-[rgba(250,204,21,0.22)] bg-[rgba(250,204,21,0.08)] px-[var(--dd-space-4)] text-[0.9rem] text-[var(--dd-text-secondary)]">
      <strong className="text-[var(--dd-accent)]">{value}</strong>
      {label}
    </span>
  )
}

function LocalPluginCard({
  busy,
  onDelete,
  onOpen,
  plugin,
}: {
  busy: boolean
  onDelete: () => void
  onOpen: () => void
  plugin: PluginMeta
}) {
  const Icon = getPluginIcon(plugin)

  return (
    <article className={`${localPanel} grid min-h-[190px] grid-rows-[auto_1fr_auto] gap-[var(--dd-space-4)] rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)]`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-3)]">
        <PluginIcon fallback={Icon} icon={plugin.icon} label={plugin.name} size="md" />
        <div className="min-w-0">
          <h3 className="m-0 truncate text-[1.04rem] font-extrabold text-[var(--dd-text-primary)]">
            {plugin.name}
          </h3>
          <span className="text-[0.86rem] text-[var(--dd-text-muted)]">
            {formatCategory(plugin.category)}  •  v{plugin.version}
          </span>
        </div>
        <span className={`size-2.5 rounded-full ${plugin.enabled ? 'bg-[var(--dd-success)]' : 'bg-[var(--dd-warning)]'}`} />
      </div>
      <p className="m-0 text-[0.93rem] leading-6 text-[var(--dd-text-secondary)]">
        {plugin.description}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-[var(--dd-space-3)]">
        <span className="inline-flex items-center gap-[var(--dd-space-2)] text-[0.84rem] text-[var(--dd-text-muted)]">
          <WandSparkles size={15} className="text-[var(--dd-accent)]" aria-hidden="true" />
          {plugin.entryPath ? 'Ready to launch' : 'UI entry missing'}
        </span>
        <div className="flex gap-[var(--dd-space-2)]">
          <button className={secondaryButton} disabled={busy} type="button" onClick={onOpen}>
            <FolderOpen size={15} aria-hidden="true" />
            Open
          </button>
          <button
            className={`${secondaryButton} !px-[var(--dd-space-3)] text-[var(--dd-danger)]`}
            disabled={busy}
            type="button"
            aria-label={`Delete ${plugin.name}`}
            onClick={onDelete}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}

function getPluginIcon(plugin: PluginMeta): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    finance: ChartNoAxesCombined,
    notes: FileText,
    'photo-editor': Image,
    'project-manager': Puzzle,
    'video-editor': Video,
    'dev-tools': Code2,
  }

  if (iconMap[plugin.id]) return iconMap[plugin.id]
  if (plugin.category?.toLowerCase().includes('media')) return Image
  if (plugin.category?.toLowerCase().includes('developer')) return Code2
  if (plugin.category?.toLowerCase().includes('finance')) return ChartNoAxesCombined

  return Package
}

function formatCategory(category?: string) {
  if (!category) return 'Plugin'
  const normalized = category.replace(/[-_]/g, ' ')
  return normalized.slice(0, 1).toUpperCase() + normalized.slice(1)
}
