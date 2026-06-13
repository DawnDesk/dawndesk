import { useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { AIPanel } from './core/AIPanel/AIPanel'
import { PluginShell } from './core/PluginShell/PluginShell'
import { PluginStore } from './core/PluginStore/PluginStore'
import { Settings } from './core/Settings/Settings'
import { Sidebar } from './core/Sidebar/Sidebar'
import {
  getSettings,
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
  type SavedChat,
  type View,
} from './store/appStore'
import './App.css'

const savedChatsStorageKey = 'dawndesk.savedChats'
const registryUrls = [
  'https://raw.githubusercontent.com/DawnDesk/registry/main/index.json',
  'https://cdn.jsdelivr.net/gh/DawnDesk/registry@main/index.json',
]

function App() {
  const [view, setView] = useState<View>('workspace')
  const [plugins, setPlugins] = useState<PluginMeta[]>([])
  const [registryPlugins, setRegistryPlugins] = useState<RegistryPlugin[]>([])
  const [activePluginId, setActivePluginId] = useState<string | null>(null)
  const [config, setConfig] = useState<AppConfig>(fallbackConfig)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [savedChats, setSavedChats] = useState<SavedChat[]>(loadSavedChats)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [busyPluginId, setBusyPluginId] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, PluginDownloadProgress>>(
    {},
  )
  const [pluginErrors, setPluginErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true

    async function load() {
      const [pluginResult, configResult, registryResult] = await Promise.allSettled([
        listPlugins(),
        getSettings(),
        fetchRegistry(),
      ])

      if (!alive) return

      const loadedPlugins = pluginResult.status === 'fulfilled' ? pluginResult.value : []

      setPlugins(loadedPlugins)
      setActivePluginId(null)
      setConfig(configResult.status === 'fulfilled' ? configResult.value : fallbackConfig)
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

  useEffect(() => {
    localStorage.setItem(savedChatsStorageKey, JSON.stringify(savedChats))
  }, [savedChats])

  const activePlugin = useMemo(
    () => plugins.find((plugin) => plugin.id === activePluginId) ?? null,
    [activePluginId, plugins],
  )

  async function sendMessage() {
    const prompt = draft.trim()
    if (!prompt || isGenerating) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    }
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    }
    const nextConversation = [...messages, userMessage]

    setMessages((current) => {
      const nextMessages = [...current, userMessage, assistantMessage]
      updateActiveSavedChat(nextMessages)
      return nextMessages
    })
    setDraft('')
    setIsGenerating(true)
    setStreamingMessageId(assistantMessage.id)
    setStatus('Generating AI response')

    try {
      const response = await sendAIMessage(
        nextConversation.map(({ role, content }) => ({ role, content })),
      )

      await streamAssistantMessage(assistantMessage.id, response)
      setStatus('AI response complete')
    } catch {
      await streamAssistantMessage(
        assistantMessage.id,
        'AI provider wiring is available, but no configured provider responded yet. Add an API key in Settings when provider integration is enabled.',
      )
      setStatus('AI response used local fallback')
    } finally {
      setIsGenerating(false)
      setStreamingMessageId(null)
    }
  }

  async function streamAssistantMessage(messageId: string, content: string) {
    const chunkSize = content.length > 180 ? 4 : 2
    let streamed = ''
    let finalMessages: ChatMessage[] = []

    for (let index = 0; index < content.length; index += chunkSize) {
      streamed += content.slice(index, index + chunkSize)
      await delay(10)

      setMessages((current) => {
        finalMessages = current.map((message) =>
          message.id === messageId ? { ...message, content: streamed } : message,
        )
        return finalMessages
      })
    }

    updateActiveSavedChat(finalMessages)
  }

  function saveCurrentChat() {
    const now = new Date().toISOString()
    const title = chatTitle(messages)

    if (activeChatId) {
      setSavedChats((current) =>
        current.map((chat) =>
          chat.id === activeChatId ? { ...chat, title, updatedAt: now, messages } : chat,
        ),
      )
      setStatus(`Saved ${title}`)
      return
    }

    const chat: SavedChat = {
      id: crypto.randomUUID(),
      title,
      updatedAt: now,
      messages,
    }

    setSavedChats((current) => [chat, ...current])
    setActiveChatId(chat.id)
    setStatus(`Saved ${title}`)
  }

  function openSavedChat(chat: SavedChat) {
    setMessages(chat.messages)
    setActiveChatId(chat.id)
    setStatus(`Opened ${chat.title}`)
  }

  function deleteSavedChat(id: string) {
    setSavedChats((current) => current.filter((chat) => chat.id !== id))
    if (activeChatId === id) {
      setActiveChatId(null)
      setMessages(initialMessages)
    }
    setStatus('Saved chat deleted')
  }

  function startNewChat() {
    setActiveChatId(null)
    setMessages(initialMessages)
    setDraft('')
    setStatus('New chat ready')
  }

  function updateActiveSavedChat(nextMessages: ChatMessage[]) {
    if (!activeChatId) return

    const now = new Date().toISOString()
    setSavedChats((current) =>
      current.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title: chatTitle(nextMessages),
              updatedAt: now,
              messages: nextMessages,
            }
          : chat,
      ),
    )
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
    const loadedPlugins = await listPlugins()

    setPlugins(loadedPlugins)

    if (nextActiveId !== undefined) {
      setActivePluginId(nextActiveId)
      return loadedPlugins
    }

    setActivePluginId((current) => {
      if (current && loadedPlugins.some((plugin) => plugin.id === current)) return current
      return null
    })

    return loadedPlugins
  }

  async function installFromRegistry(plugin: RegistryPlugin, release: RegistryRelease) {
    setBusyPluginId(plugin.id)
    setPluginErrors((current) => {
      const next = { ...current }
      delete next[plugin.id]
      return next
    })
    setStatus(`Downloading ${plugin.name}`)

    try {
      await installPlugin(plugin.id, release.url, release.checksum)
      const loadedPlugins = await refreshInstalledPlugins(plugin.id)
      if (!loadedPlugins.some((item) => item.id === plugin.id)) {
        throw new Error(
          `${plugin.name} downloaded, but DawnDesk could not find it in the installed plugins folder.`,
        )
      }
      setView('workspace')
      setStatus(`${plugin.name} installed`)
    } catch (error) {
      const message = formatError(error, `Failed to install ${plugin.name}`)
      setPluginErrors((current) => ({ ...current, [plugin.id]: message }))
      setStatus(message)
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
    setPluginErrors((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setStatus(`Deleting ${plugin?.name ?? id}`)

    try {
      await uninstallPlugin(id, false)
      await refreshInstalledPlugins(activePluginId === id ? null : undefined)
      setStatus(`${plugin?.name ?? id} deleted`)
    } catch (error) {
      const message = formatError(error, `Failed to delete ${plugin?.name ?? id}`)
      setPluginErrors((current) => ({ ...current, [id]: message }))
      setStatus(message)
    } finally {
      setBusyPluginId(null)
    }
  }

  return (
    <main className={`appShell theme-${config.theme}`}>
      <Sidebar
        activePluginId={activePluginId}
        plugins={plugins}
        setActivePluginId={setActivePluginId}
        setView={setView}
        view={view}
      />

      <section className="content">
        

        {view === 'workspace' && (
          <PluginShell
            activePlugin={activePlugin}
            onClosePlugin={() => setActivePluginId(null)}
            onOpenStore={() => setView('store')}
          />
        )}
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
            pluginErrors={pluginErrors}
            progressByPluginId={downloadProgress}
            registryPlugins={registryPlugins}
          />
        )}
        {view === 'ai' && (
          <AIPanel
            activeChatId={activeChatId}
            draft={draft}
            isGenerating={isGenerating}
            messages={messages}
            onDeleteChat={deleteSavedChat}
            onNewChat={startNewChat}
            onOpenChat={openSavedChat}
            onSaveChat={saveCurrentChat}
            savedChats={savedChats}
            sendMessage={sendMessage}
            setDraft={setDraft}
            streamingMessageId={streamingMessageId}
          />
        )}
        {view === 'settings' && <Settings config={config} saveConfig={saveConfig} />}
      </section>
    </main>
  )
}

function setStatus(_message: string) {
  // Runtime status is intentionally kept out of the visual shell.
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

function loadSavedChats(): SavedChat[] {
  try {
    const value = localStorage.getItem(savedChatsStorageKey)
    if (!value) return []

    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isSavedChat)
  } catch {
    return []
  }
}

function isSavedChat(value: unknown): value is SavedChat {
  if (!value || typeof value !== 'object') return false

  const chat = value as SavedChat
  return (
    typeof chat.id === 'string' &&
    typeof chat.title === 'string' &&
    typeof chat.updatedAt === 'string' &&
    Array.isArray(chat.messages)
  )
}

function chatTitle(messages: ChatMessage[]) {
  const message =
    messages.find((item) => item.role === 'user' && item.content.trim()) ??
    messages.find((item) => item.content.trim())
  const title = message?.content.trim().replace(/\s+/g, ' ') ?? 'New chat'

  return title.length > 42 ? `${title.slice(0, 39)}...` : title
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function formatError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  try {
    return JSON.stringify(error)
  } catch {
    return fallback
  }
}

export default App
