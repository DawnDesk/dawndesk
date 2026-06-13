import { useEffect, useState } from 'react'
import {
  Blocks,
  FileText,
  Maximize2,
  Minimize2,
  Puzzle,
  WandSparkles,
} from 'lucide-react'
import { PluginIcon } from '../PluginIcon'
import { getPluginEntryDocument } from '../../ipc/host'
import type { PluginMeta } from '../../store/appStore'

type PluginShellProps = {
  activePlugin: PluginMeta | null
  onOpenStore: () => void
}

const primaryButton =
  'inline-flex min-h-[38px] items-center justify-center gap-[var(--dd-space-2)] justify-self-start rounded-[var(--dd-radius-md)] border border-transparent bg-[var(--dd-accent)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] font-extrabold text-[var(--dd-accent-contrast)] shadow-[var(--dd-shadow-sm)] transition-[background,color,transform,border-color] duration-150 hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] active:scale-[0.98] active:bg-[var(--dd-accent-active)] disabled:cursor-not-allowed disabled:opacity-70'

type PluginDocumentState = {
  document: string | null
  error: string | null
  pluginId: string | null
}

export function PluginShell({ activePlugin, onOpenStore }: PluginShellProps) {
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
      <section className="grid min-h-0 flex-1 place-content-center justify-items-center gap-[var(--dd-space-4)] p-[var(--dd-space-8)] text-center">
        <img
          alt=""
          className="mb-[var(--dd-space-2)] h-auto w-[clamp(92px,11vw,132px)] rounded-[var(--dd-radius-xl)] bg-[radial-gradient(circle_at_50%_42%,var(--dd-logo-glow),transparent_58%),linear-gradient(180deg,var(--dd-logo-wash),var(--dd-logo-wash-soft)),var(--dd-bg-elevated)] drop-shadow-[var(--dd-shadow-yellow)]"
          src="/logo.png"
        />
        <h1 className="m-0 text-[1.9rem] font-bold tracking-normal text-[var(--dd-text-primary)]">
          Welcome to DawnDesk
        </h1>
        <p className="m-0 text-[var(--dd-text-secondary)]">
          Your productivity, your plugins, your workspace.
        </p>
        <div className="my-[var(--dd-space-4)] grid grid-cols-3 gap-[var(--dd-space-5)] max-[900px]:grid-cols-1">
          <article className="grid min-h-[174px] w-[220px] content-center justify-items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-lg)] border border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-card-sheen),transparent),var(--dd-bg-elevated)] p-[var(--dd-space-5)] shadow-[var(--dd-shadow-sm)] transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-[var(--dd-border-strong)]">
            <span className="grid place-items-center text-[var(--dd-accent)]" aria-hidden="true">
              <Puzzle size={34} />
            </span>
            <strong className="text-[var(--dd-text-primary)]">Plugin Powered</strong>
            <p className="m-0 text-[0.86rem] text-[var(--dd-text-secondary)]">
              Install plugins to extend DawnDesk to your workflow.
            </p>
          </article>
          <article className="grid min-h-[174px] w-[220px] content-center justify-items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-lg)] border border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-card-sheen),transparent),var(--dd-bg-elevated)] p-[var(--dd-space-5)] shadow-[var(--dd-shadow-sm)] transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-[var(--dd-border-strong)]">
            <span className="grid place-items-center text-[var(--dd-accent)]" aria-hidden="true">
              <WandSparkles size={34} />
            </span>
            <strong className="text-[var(--dd-text-primary)]">AI Assisted</strong>
            <p className="m-0 text-[0.86rem] text-[var(--dd-text-secondary)]">
              Use AI prompts and saved chats to get things done.
            </p>
          </article>
          <article className="grid min-h-[174px] w-[220px] content-center justify-items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-lg)] border border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-card-sheen),transparent),var(--dd-bg-elevated)] p-[var(--dd-space-5)] shadow-[var(--dd-shadow-sm)] transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-[var(--dd-border-strong)]">
            <span className="grid place-items-center text-[var(--dd-accent)]" aria-hidden="true">
              <Blocks size={34} />
            </span>
            <strong className="text-[var(--dd-text-primary)]">All in One</strong>
            <p className="m-0 text-[0.86rem] text-[var(--dd-text-secondary)]">
              Notes, finance, media, dev tools and more in one place.
            </p>
          </article>
        </div>
        <button
          className={`${primaryButton} mx-auto mt-[var(--dd-space-2)] !justify-self-center self-center`}
          type="button"
          onClick={onOpenStore}
        >
          Explore Plugin Store
        </button>
      </section>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 p-0 max-[900px]:px-[var(--dd-space-4)]">
      <article
        className={
          isFullscreen
            ? 'fixed inset-0 z-30 flex min-w-0 flex-col overflow-hidden border-0 bg-[var(--dd-bg-base)] animate-[panelIn_180ms_ease_both]'
            : 'flex min-w-0 flex-1 flex-col overflow-hidden border-l border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-panel-sheen),transparent),var(--dd-bg-surface)] shadow-[var(--dd-shadow-md)] animate-[panelIn_260ms_ease_both]'
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
