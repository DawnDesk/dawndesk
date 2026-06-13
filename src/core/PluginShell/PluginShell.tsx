import { useEffect, useState } from 'react'
import {
  Blocks,
  ExternalLink,
  FileText,
  Maximize2,
  Minimize2,
  Puzzle,
  WandSparkles,
  X,
} from 'lucide-react'
import { getPluginEntryDocument } from '../../ipc/host'
import type { PluginMeta } from '../../store/appStore'

type PluginShellProps = {
  activePlugin: PluginMeta | null
  onClosePlugin: () => void
  onOpenStore: () => void
}

export function PluginShell({ activePlugin, onClosePlugin, onOpenStore }: PluginShellProps) {
  const [pluginDocument, setPluginDocument] = useState<string | null>(null)
  const [pluginError, setPluginError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    let alive = true
    setPluginDocument(null)
    setPluginError(null)
    setIsFullscreen(false)

    async function loadPluginDocument() {
      if (!activePlugin?.id) return

      try {
        const html = await getPluginEntryDocument(activePlugin.id)
        if (alive) setPluginDocument(html)
      } catch (error) {
        if (alive) {
          setPluginError(error instanceof Error ? error.message : 'Unable to load plugin UI')
        }
      }
    }

    loadPluginDocument()

    return () => {
      alive = false
    }
  }, [activePlugin?.id])

  useEffect(() => {
    if (!isFullscreen) return

    function exitOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', exitOnEscape)

    return () => {
      window.removeEventListener('keydown', exitOnEscape)
    }
  }, [isFullscreen])

  if (!activePlugin) {
    return (
      <section className="welcomeDashboard flex flex-col items-center justify-center gap-6">
          <img alt="" src="/logo.png" className="h-30"/>
        <h1>Welcome to DawnDesk</h1>
        <p>Your productivity, your plugins, your workspace.</p>
        <div className="welcomeCards">
          <article>
            <span aria-hidden="true">
              <Puzzle size={34} />
            </span>
            <strong>Plugin Powered</strong>
            <p>Install plugins to extend DawnDesk to your workflow.</p>
          </article>
          <article>
            <span aria-hidden="true">
              <WandSparkles size={34} />
            </span>
            <strong>AI Assisted</strong>
            <p>Use AI prompts and saved chats to get things done.</p>
          </article>
          <article>
            <span aria-hidden="true">
              <Blocks size={34} />
            </span>
            <strong>All in One</strong>
            <p>Notes, finance, media, dev tools and more in one place.</p>
          </article>
        </div>
        <button className="primaryButton welcomeCta" type="button" onClick={onOpenStore}>
          Explore Plugin Store
        </button>
      </section>
    )
  }

  return (
    <section className="pluginWorkspace">
      <article className={isFullscreen ? 'pluginFrame fullscreen' : 'pluginFrame'}>
        <header className="pluginFrameHeader">
          <div>
            <span className="pluginIcon" aria-hidden="true">
              <FileText size={16} />
            </span>
            <strong>{activePlugin.name}</strong>
          </div>
          <div className="pluginFrameControls">
            <button
              aria-label="Open plugin focus mode"
              type="button"
              onClick={() => setIsFullscreen(true)}
            >
              <ExternalLink size={15} />
            </button>
            <button
              aria-label={isFullscreen ? 'Exit plugin fullscreen' : 'Enter plugin fullscreen'}
              type="button"
              onClick={() => setIsFullscreen((current) => !current)}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button aria-label="Close plugin" type="button" onClick={onClosePlugin}>
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="frameBody">
          {pluginDocument ? (
            <iframe className="pluginWebview" srcDoc={pluginDocument} title={activePlugin.name} />
          ) : pluginError ? (
            <div>
              <h2>Plugin UI failed to load</h2>
              <p>{pluginError}</p>
            </div>
          ) : activePlugin.entryPath ? (
            <div>
              <h2>Loading plugin</h2>
              <p>Preparing {activePlugin.name}.</p>
            </div>
          ) : (
            <div>
              <h2>Plugin UI not found</h2>
              <p>This plugin is installed, but its package does not include an index.html entry.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  )
}
