import { useEffect, useMemo, useState } from 'react'
import { AIPanel } from './core/AIPanel/AIPanel'
import { PluginShell } from './core/PluginShell/PluginShell'
import { PluginStore } from './core/PluginStore/PluginStore'
import { Settings } from './core/Settings/Settings'
import { Sidebar } from './core/Sidebar/Sidebar'
import { getSettings, getTools, listPlugins, saveSettings, sendAIMessage } from './ipc/host'
import {
  fallbackConfig,
  fallbackPlugins,
  initialMessages,
  type AppConfig,
  type ChatMessage,
  type PluginMeta,
  type ToolDefinition,
  type View,
} from './store/appStore'
import './App.css'

function App() {
  const [view, setView] = useState<View>('workspace')
  const [plugins, setPlugins] = useState<PluginMeta[]>([])
  const [activePluginId, setActivePluginId] = useState<string | null>(null)
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [config, setConfig] = useState<AppConfig>(fallbackConfig)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('Loading host state')

  useEffect(() => {
    let alive = true

    async function load() {
      const [pluginResult, configResult, toolsResult] = await Promise.allSettled([
        listPlugins(),
        getSettings(),
        getTools(),
      ])

      if (!alive) return

      const loadedPlugins =
        pluginResult.status === 'fulfilled' && pluginResult.value.length > 0
          ? pluginResult.value
          : fallbackPlugins

      setPlugins(loadedPlugins)
      setActivePluginId(loadedPlugins[0]?.id ?? null)
      setConfig(configResult.status === 'fulfilled' ? configResult.value : fallbackConfig)
      setTools(toolsResult.status === 'fulfilled' ? toolsResult.value : [])
      setStatus(
        pluginResult.status === 'fulfilled'
          ? 'Host state loaded'
          : 'Running with frontend fallback data',
      )
    }

    load()

    return () => {
      alive = false
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
            <span className="statusPill">{config.theme}</span>
          </div>
        </header>

        {view === 'workspace' && <PluginShell activePlugin={activePlugin} tools={tools} />}
        {view === 'store' && <PluginStore plugins={plugins} />}
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

function pageTitle(view: View, activePlugin: PluginMeta | null) {
  if (view === 'workspace') return activePlugin?.name ?? 'Workspace'
  if (view === 'store') return 'Plugin Store'
  if (view === 'ai') return 'AI Panel'
  return 'Settings'
}

export default App
