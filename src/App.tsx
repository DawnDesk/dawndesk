import { useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { AIPanel } from './core/AIPanel/AIPanel'
import { PluginShell } from './core/PluginShell/PluginShell'
import { PluginStore } from './core/PluginStore/PluginStore'
import { Settings } from './core/Settings/Settings'
import { Sidebar } from './core/Sidebar/Sidebar'
import {
  getSettings,
  getTools,
  installPlugin,
  listPlugins,
  saveSettings,
  sendAIMessage,
  uninstallPlugin,
} from './ipc/host'
import {
  fallbackConfig,
  fallbackPlugins,
  initialMessages,
  type AppConfig,
  type ChatMessage,
  type PluginMeta,
  type PluginRegistry,
  type PluginDownloadProgress,
  type RegistryPlugin,
  type RegistryRelease,
  type ToolDefinition,
  type View,
} from './store/appStore'
import './App.css'

const registryUrls = [
  'https://raw.githubusercontent.com/DawnDesk/registry/main/index.json',
  'https://cdn.jsdelivr.net/gh/DawnDesk/registry@main/index.json',
]

function App() {
  const [view, setView] = useState<View>('workspace')
  const [plugins, setPlugins] = useState<PluginMeta[]>([])
  const [registryPlugins, setRegistryPlugins] = useState<RegistryPlugin[]>([])
  const [activePluginId, setActivePluginId] = useState<string | null>(null)
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [config, setConfig] = useState<AppConfig>(fallbackConfig)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('Loading host state')
  const [busyPluginId, setBusyPluginId] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, PluginDownloadProgress>>(
    {},
  )

  useEffect(() => {
    let alive = true

    async function load() {
      const [pluginResult, configResult, toolsResult, registryResult] = await Promise.allSettled([
        listPlugins(),
        getSettings(),
        getTools(),
        fetchRegistry(),
      ])

      if (!alive) return

      const loadedPlugins = pluginResult.status === 'fulfilled' ? pluginResult.value : []

      setPlugins(loadedPlugins)
      setActivePluginId(loadedPlugins[0]?.id ?? null)
      setConfig(configResult.status === 'fulfilled' ? configResult.value : fallbackConfig)
      setTools(toolsResult.status === 'fulfilled' ? toolsResult.value : [])
      setRegistryPlugins(
        registryResult.status === 'fulfilled' ? registryResult.value.plugins : fallbackRegistry(),
      )
      setStatus(
        registryResult.status === 'fulfilled'
          ? 'Plugin registry loaded'
          : 'Registry unavailable, showing cached defaults',
      )
    }

    load()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let unlisten: (() => void) | null = null

    listen<PluginDownloadProgress>('plugin_download_progress', (event) => {
      setDownloadProgress((current) => ({
        ...current,
        [event.payload.pluginId]: event.payload,
      }))
    })
      .then((handler) => {
        unlisten = handler
      })
      .catch(() => {
        unlisten = null
      })

    return () => {
      unlisten?.()
    }
  }, [])

  const activePlugin = useMemo(
    () => plugins.find((plugin) => plugin.id === activePluginId) ?? null,
    [activePluginId, plugins],
  )

  async function sendMessage() {
    const prompt = draft.trim()
    if (!prompt) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    }

    setMessages((current) => [...current, userMessage])
    setDraft('')
    setStatus('Generating AI response')

    try {
      const response = await sendAIMessage(
        [...messages, userMessage].map(({ role, content }) => ({ role, content })),
      )

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
        },
      ])
      setStatus('AI response complete')
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'AI provider wiring is available, but no configured provider responded yet. Add an API key in Settings when provider integration is enabled.',
        },
      ])
      setStatus('AI response used local fallback')
    }
  }

  async function saveConfig(nextConfig: AppConfig) {
    setConfig(nextConfig)
    setStatus('Saving settings')

    try {
      await saveSettings(nextConfig)
      setStatus('Settings saved')
    } catch {
      setStatus('Settings changed locally')
    }
  }

  async function refreshInstalledPlugins(nextActiveId?: string | null) {
    const [pluginResult, toolsResult] = await Promise.allSettled([listPlugins(), getTools()])
    const loadedPlugins = pluginResult.status === 'fulfilled' ? pluginResult.value : []

    setPlugins(loadedPlugins)
    setTools(toolsResult.status === 'fulfilled' ? toolsResult.value : [])

    if (nextActiveId !== undefined) {
      setActivePluginId(nextActiveId)
      return
    }

    setActivePluginId((current) => {
      if (current && loadedPlugins.some((plugin) => plugin.id === current)) return current
      return loadedPlugins[0]?.id ?? null
    })
  }

  async function installFromRegistry(plugin: RegistryPlugin, release: RegistryRelease) {
    setBusyPluginId(plugin.id)
    setStatus(`Downloading ${plugin.name}`)

    try {
      await installPlugin(plugin.id, release.url, release.checksum)
      await refreshInstalledPlugins(plugin.id)
      setView('workspace')
      setStatus(`${plugin.name} installed`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Failed to install ${plugin.name}`)
    } finally {
      setBusyPluginId(null)
      setTimeout(() => {
        setDownloadProgress((current) => {
          const next = { ...current }
          delete next[plugin.id]
          return next
        })
      }, 1200)
    }
  }

  async function deletePlugin(id: string) {
    const plugin = plugins.find((item) => item.id === id)
    setBusyPluginId(id)
    setStatus(`Deleting ${plugin?.name ?? id}`)

    try {
      await uninstallPlugin(id, false)
      await refreshInstalledPlugins(activePluginId === id ? null : undefined)
      setStatus(`${plugin?.name ?? id} deleted`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Failed to delete ${plugin?.name ?? id}`)
    } finally {
      setBusyPluginId(null)
    }
  }

  return (
    <main className="appShell">
      <Sidebar
        activePluginId={activePluginId}
        plugins={plugins}
        setActivePluginId={setActivePluginId}
        setView={setView}
        view={view}
      />

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{status}</p>
            <h1>{pageTitle(view, activePlugin)}</h1>
          </div>
          <div className="topbarActions">
            <span className="statusPill">{config.aiProvider}</span>
            <span className="statusPill">{config.aiModel}</span>
            <span className="statusPill">{config.theme}</span>
          </div>
        </header>

        {view === 'workspace' && <PluginShell activePlugin={activePlugin} tools={tools} />}
        {view === 'store' && (
          <PluginStore
            busyPluginId={busyPluginId}
            installedPlugins={plugins}
            onDelete={deletePlugin}
            onInstall={installFromRegistry}
            onOpen={(id) => {
              setActivePluginId(id)
              setView('workspace')
            }}
            progressByPluginId={downloadProgress}
            registryPlugins={registryPlugins}
          />
        )}
        {view === 'ai' && (
          <AIPanel
            draft={draft}
            messages={messages}
            sendMessage={sendMessage}
            setDraft={setDraft}
            tools={tools}
          />
        )}
        {view === 'settings' && <Settings config={config} saveConfig={saveConfig} />}
      </section>
    </main>
  )
}

async function fetchRegistry(): Promise<PluginRegistry> {
  let lastError: unknown

  for (const url of registryUrls) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Registry returned ${response.status}`)
      return (await response.json()) as PluginRegistry
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

function fallbackRegistry(): RegistryPlugin[] {
  return fallbackPlugins.map((plugin) => ({
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    category: plugin.category,
    latestVersion: plugin.version,
    releases: {},
  }))
}

function pageTitle(view: View, activePlugin: PluginMeta | null) {
  if (view === 'workspace') return activePlugin?.name ?? 'Workspace'
  if (view === 'store') return 'Plugin Store'
  if (view === 'ai') return 'AI Panel'
  return 'Settings'
}

export default App
