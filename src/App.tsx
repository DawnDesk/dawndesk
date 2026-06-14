import { useCallback, useEffect, useMemo, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrent, onOpenUrl, register } from '@tauri-apps/plugin-deep-link'
import { openUrl } from '@tauri-apps/plugin-opener'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { AIPanel } from './core/AIPanel/AIPanel'
import { Dashboard } from './core/Dashboard/Dashboard'
import { PluginShell } from './core/PluginShell/PluginShell'
import { PluginStore } from './core/PluginStore/PluginStore'
import { Settings } from './core/Settings/Settings'
import { SignIn } from './core/SignIn/SignIn'
import { Sidebar } from './core/Sidebar/Sidebar'
import { isSupabaseConfigured, supabase, type AuthState } from './auth/supabase'
import {
  getSettings,
  getTools,
  installPlugin,
  listPlugins,
  saveSettings,
  sendAIMessage,
  setActiveUser,
  uninstallPlugin,
} from './ipc/host'
import {
  fallbackConfig,
  initialMessages,
  type AppConfig,
  type ChatAttachment,
  type ChatMessage,
  type PluginMeta,
  type PluginRegistry,
  type PluginDownloadProgress,
  type RegistryPlugin,
  type RegistryRelease,
  type SavedChat,
  type ToolDefinition,
  type View,
} from './store/appStore'
import './App.css'

const savedChatsStorageKey = 'dawndesk.savedChats'
const authRedirectUrl = 'dawndesk://auth/callback'
const registryUrls = [
  'https://raw.githubusercontent.com/DawnDesk/registry/main/index.json',
  'https://cdn.jsdelivr.net/gh/DawnDesk/registry@main/index.json',
]

type ToastKind = 'error' | 'info' | 'success' | 'warning'

type ToastMessage = {
  id: string
  kind: ToastKind
  title: string
  detail?: string
}

const toastIcons: Record<ToastKind, LucideIcon> = {
  error: XCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
}

const toastStyles: Record<ToastKind, string> = {
  error: 'border-[rgba(250,204,21,0.42)] text-[var(--dd-accent)]',
  info: 'border-[rgba(250,204,21,0.42)] text-[var(--dd-accent)]',
  success: 'border-[rgba(250,204,21,0.42)] text-[var(--dd-accent)]',
  warning: 'border-[rgba(250,204,21,0.42)] text-[var(--dd-accent)]',
}

function App() {
  const [auth, setAuth] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
  })
  const [view, setView] = useState<View>('dashboard')
  const [plugins, setPlugins] = useState<PluginMeta[]>([])
  const [registryPlugins, setRegistryPlugins] = useState<RegistryPlugin[]>([])
  const [activePluginId, setActivePluginId] = useState<string | null>(null)
  const [config, setConfig] = useState<AppConfig>(fallbackConfig)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [savedChats, setSavedChats] = useState<SavedChat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [busyPluginId, setBusyPluginId] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, PluginDownloadProgress>>(
    {},
  )
  const [pluginErrors, setPluginErrors] = useState<Record<string, string>>({})
  const [aiTools, setAiTools] = useState<ToolDefinition[]>([])
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (kind: ToastKind, title: string, detail?: string) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, kind, title, detail }].slice(-5))
      window.setTimeout(() => dismissToast(id), kind === 'error' ? 7000 : 4200)
    },
    [dismissToast],
  )

  const setStatus = useCallback((message: string, kind: ToastKind = 'info', detail?: string) => {
    showToast(kind, message, detail)
  }, [showToast])

  useEffect(() => {
    if (!supabase) {
      setAuth({ loading: false, session: null, user: null })
      return
    }

    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setAuth({
        loading: false,
        session: data.session,
        user: data.session?.user ?? null,
      })
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({
        loading: false,
        session,
        user: session?.user ?? null,
      })
    })

    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    let unlisten: (() => void) | null = null

    register('dawndesk').catch(() => undefined)

    getCurrent()
      .then((urls) => {
        if (urls) {
          void handleAuthDeepLinks(urls).catch((error) => {
            setStatus('Google sign-in callback failed', 'error', formatError(error, 'Unable to finish sign-in.'))
          })
        }
      })
      .catch(() => undefined)

    onOpenUrl((urls) => {
      void handleAuthDeepLinks(urls).catch((error) => {
        setStatus('Google sign-in callback failed', 'error', formatError(error, 'Unable to finish sign-in.'))
      })
    })
      .then((handler) => {
        unlisten = handler
      })
      .catch(() => undefined)

    return () => {
      unlisten?.()
    }
  }, [setStatus])

  useEffect(() => {
    if (!auth.user?.id) {
      setSavedChats([])
      setActiveChatId(null)
      setMessages(initialMessages)
      return
    }

    setSavedChats(loadSavedChats(savedChatsKey(auth.user.id)))
    setActiveChatId(null)
    setMessages(initialMessages)
  }, [auth.user?.id])

  useEffect(() => {
    if (auth.loading || !auth.user) return

    let alive = true

    async function load() {
      await setActiveUser(auth.user?.id ?? null).catch((error) => {
        setStatus(
          'User data scope unavailable',
          'warning',
          formatError(error, 'The desktop host did not confirm the active user.'),
        )
      })

      const [pluginResult, configResult, registryResult, toolsResult] = await Promise.allSettled([
        listPlugins(),
        getSettings(),
        fetchRegistry(),
        getTools(),
      ])

      if (!alive) return

      const loadedPlugins = pluginResult.status === 'fulfilled' ? pluginResult.value : []

      setPlugins(loadedPlugins)
      setActivePluginId(null)
      setConfig(configResult.status === 'fulfilled' ? configResult.value : fallbackConfig)
      setAiTools(toolsResult.status === 'fulfilled' ? toolsResult.value : [])
      setRegistryPlugins(registryResult.status === 'fulfilled' ? registryResult.value.plugins : [])
      if (registryResult.status === 'fulfilled') {
        setStatus('Plugin registry loaded', 'success')
      } else {
        setStatus('Registry unavailable', 'warning', 'Showing cached plugin defaults for now.')
      }

      if (pluginResult.status === 'rejected') {
        setStatus('Installed plugins unavailable', 'error', formatError(pluginResult.reason, 'Failed to list plugins'))
      }

      if (configResult.status === 'rejected') {
        setStatus('Settings unavailable', 'warning', 'Using default settings for this session.')
      }

      if (toolsResult.status === 'rejected') {
        setStatus('Plugin tools unavailable', 'warning', 'AI can still chat, but tool metadata could not be loaded.')
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [auth.loading, auth.user, setStatus])

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
      .catch((error) => {
        unlisten = null
        setStatus('Plugin progress listener failed', 'warning', formatError(error, 'Unable to listen for plugin progress.'))
      })

    return () => {
      unlisten?.()
    }
  }, [setStatus])

  useEffect(() => {
    if (!auth.user?.id) return
    localStorage.setItem(savedChatsKey(auth.user.id), JSON.stringify(savedChats))
  }, [auth.user?.id, savedChats])

  useEffect(() => {
    if (!auth.user?.id) return

    const meaningfulMessages = messages.filter((message) => message.id !== 'welcome' && message.content.trim())
    if (!meaningfulMessages.some((message) => message.role === 'user')) return

    const now = new Date().toISOString()
    const title = chatTitle(meaningfulMessages)

    if (activeChatId) {
      setSavedChats((current) =>
        current.map((chat) =>
          chat.id === activeChatId ? { ...chat, messages, title, updatedAt: now } : chat,
        ),
      )
      return
    }

    const chat: SavedChat = {
      id: crypto.randomUUID(),
      messages,
      title,
      updatedAt: now,
    }

    setActiveChatId(chat.id)
    setSavedChats((current) => [chat, ...current])
  }, [activeChatId, auth.user?.id, messages])

  const activePlugin = useMemo(
    () => plugins.find((plugin) => plugin.id === activePluginId) ?? null,
    [activePluginId, plugins],
  )

  async function sendMessage() {
    const prompt = draft.trim()
    if ((!prompt && attachments.length === 0) || isGenerating) return

    const messageContent = formatMessageWithAttachments(prompt, attachments)

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
    }
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    }
    const nextConversation = [...messages, userMessage]

    setMessages((current) => {
      const nextMessages = [...current, userMessage, assistantMessage]
      return nextMessages
    })
    setDraft('')
    setAttachments([])
    setIsGenerating(true)
    setStreamingMessageId(assistantMessage.id)
    setStatus('Generating AI response', 'info')

    try {
      const response = await sendAIMessage(
        nextConversation.map(({ role, content }) => ({ role, content })),
      )

      await streamAssistantMessage(assistantMessage.id, response)
      setStatus('AI response complete', 'success')
    } catch (error) {
      await streamAssistantMessage(
        assistantMessage.id,
        'AI provider wiring is available, but no configured provider responded yet. Add an API key in Settings when provider integration is enabled.',
      )
      setStatus('AI response used local fallback', 'warning', formatError(error, 'No configured provider responded.'))
    } finally {
      setIsGenerating(false)
      setStreamingMessageId(null)
    }
  }

  async function attachFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) return

    const nextAttachments: ChatAttachment[] = []

    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        setStatus('File skipped', 'warning', `${file.name} is larger than 8 MB.`)
        continue
      }

      const type = file.type || guessMimeType(file.name)
      const readableAsText = isTextAttachment(file.name, type)
      let content: string | undefined

      if (readableAsText) {
        try {
          content = await file.text()
        } catch (error) {
          setStatus('File could not be read', 'error', formatError(error, file.name))
          continue
        }
      }

      nextAttachments.push({
        id: crypto.randomUUID(),
        content,
        kind: readableAsText ? 'text' : 'binary',
        name: file.name,
        size: file.size,
        type,
      })
    }

    if (nextAttachments.length === 0) return

    setAttachments((current) => [...current, ...nextAttachments].slice(-8))
    setStatus(
      nextAttachments.length === 1 ? 'File attached' : `${nextAttachments.length} files attached`,
      'success',
    )
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id))
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
  }

  function openSavedChat(chat: SavedChat) {
    setMessages(chat.messages)
    setActiveChatId(chat.id)
    setStatus(`Opened ${chat.title}`, 'info')
  }

  function deleteSavedChat(id: string) {
    setSavedChats((current) => current.filter((chat) => chat.id !== id))
    if (activeChatId === id) {
      setActiveChatId(null)
      setMessages(initialMessages)
    }
    setStatus('Saved chat deleted', 'success')
  }

  function startNewChat() {
    setActiveChatId(null)
    setMessages(initialMessages)
    setDraft('')
    setStatus('New chat ready', 'info')
  }

  function openPlugin(id: string) {
    setActivePluginId(id)
    setView('workspace')
  }

  async function saveConfig(nextConfig: AppConfig) {
    setConfig(nextConfig)
    setStatus('Saving settings', 'info')

    try {
      await saveSettings(nextConfig)
      setStatus('Settings saved', 'success')
    } catch {
      setStatus('Settings changed locally', 'warning', 'The desktop host did not confirm the save.')
    }
  }

  async function refreshInstalledPlugins(nextActiveId?: string | null) {
    const loadedPlugins = await listPlugins()

    setPlugins(loadedPlugins)
    refreshAiTools()

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

  async function refreshAiTools() {
    try {
      setAiTools(await getTools())
    } catch {
      setAiTools([])
    }
  }

  async function installFromRegistry(plugin: RegistryPlugin, release: RegistryRelease) {
    setBusyPluginId(plugin.id)
    setPluginErrors((current) => {
      const next = { ...current }
      delete next[plugin.id]
      return next
    })
    setStatus(`Downloading ${plugin.name}`, 'info')

    try {
      await installPlugin(plugin.id, release.url, release.checksum)
      const loadedPlugins = await refreshInstalledPlugins(plugin.id)
      if (!loadedPlugins.some((item) => item.id === plugin.id)) {
        throw new Error(
          `${plugin.name} downloaded, but DawnDesk could not find it in the installed plugins folder.`,
        )
      }
      setView('workspace')
      setStatus(`${plugin.name} installed`, 'success')
    } catch (error) {
      const message = formatError(error, `Failed to install ${plugin.name}`)
      setPluginErrors((current) => ({ ...current, [plugin.id]: message }))
      setStatus(`Failed to install ${plugin.name}`, 'error', message)
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
    setStatus(`Deleting ${plugin?.name ?? id}`, 'info')

    try {
      await uninstallPlugin(id, false)
      await refreshInstalledPlugins(activePluginId === id ? null : undefined)
      setStatus(`${plugin?.name ?? id} deleted`, 'success')
    } catch (error) {
      const message = formatError(error, `Failed to delete ${plugin?.name ?? id}`)
      setPluginErrors((current) => ({ ...current, [id]: message }))
      setStatus(`Failed to delete ${plugin?.name ?? id}`, 'error', message)
    } finally {
      setBusyPluginId(null)
    }
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setStatus('Supabase is not configured', 'error', 'Add the Supabase URL and publishable key to the app environment.')
      return
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      setStatus('Google sign-in failed', 'error', error.message)
      return
    }

    if (!data.url) {
      setStatus('Google sign-in failed', 'error', 'Supabase did not return an OAuth URL.')
      return
    }

    try {
      await openUrl(data.url)
    } catch (error) {
      if (isTauriRuntime()) {
        setStatus(
          'Google sign-in could not open',
          'error',
          formatError(error, 'DawnDesk could not open the Google sign-in page in your browser.'),
        )
        return
      }

      window.location.href = data.url
    }
  }

  async function signOut() {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) {
      setStatus('Sign-out failed', 'error', error.message)
      return
    }

    await setActiveUser(null).catch(() => undefined)
    setPlugins([])
    setRegistryPlugins([])
    setAiTools([])
    setActivePluginId(null)
    setActiveChatId(null)
    setSavedChats([])
    setMessages(initialMessages)
    setView('dashboard')
    setStatus('Signed out', 'success')
  }

  if (auth.loading) {
    return <LoadingScreen />
  }

  if (!auth.user) {
    return (
      <SignIn
        isConfigured={isSupabaseConfigured}
        isSigningIn={Boolean(auth.session)}
        onSignIn={signInWithGoogle}
      />
    )
  }

  return (
    <main
      className={`theme-${config.theme} grid h-screen overflow-hidden grid-cols-[216px_minmax(0,1fr)] bg-[radial-gradient(circle_at_50%_0,var(--dd-bg-glow),transparent_34%),var(--dd-bg-base)] text-[var(--dd-text-primary)] max-[900px]:grid-cols-1`}
    >
      <Sidebar
        activePluginId={activePluginId}
        currentUser={auth.user}
        onSignOut={signOut}
        plugins={plugins}
        setActivePluginId={setActivePluginId}
        setView={setView}
        view={view}
      />

      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[linear-gradient(180deg,var(--dd-bg-content),transparent_280px),var(--dd-bg-base)]">
        {view === 'dashboard' && (
          <Dashboard
            aiTools={aiTools}
            config={config}
            currentUser={auth.user}
            messages={messages}
            onOpenAI={() => setView('ai')}
            onOpenPlugin={openPlugin}
            onOpenSettings={() => setView('settings')}
            onOpenStore={() => setView('store')}
            plugins={plugins}
            registryPlugins={registryPlugins}
            savedChats={savedChats}
          />
        )}
        {view === 'workspace' && (
          <PluginShell
            activePlugin={activePlugin}
            busyPluginId={busyPluginId}
            onDelete={deletePlugin}
            onOpenPlugin={openPlugin}
            onOpenStore={() => setView('store')}
            plugins={plugins}
          />
        )}
        {view === 'store' && (
          <PluginStore
            busyPluginId={busyPluginId}
            installedPlugins={plugins}
            onDelete={deletePlugin}
            onInstall={installFromRegistry}
            onOpenLocalPlugins={() => {
              setActivePluginId(null)
              setView('workspace')
            }}
            onOpen={(id) => {
              openPlugin(id)
            }}
            pluginErrors={pluginErrors}
            progressByPluginId={downloadProgress}
            registryPlugins={registryPlugins}
          />
        )}
        {view === 'ai' && (
          <AIPanel
            activeChatId={activeChatId}
            attachments={attachments}
            currentUser={auth.user}
            draft={draft}
            isGenerating={isGenerating}
            messages={messages}
            onAttachFiles={attachFiles}
            onDeleteChat={deleteSavedChat}
            onNewChat={startNewChat}
            onOpenChat={openSavedChat}
            onRemoveAttachment={removeAttachment}
            savedChats={savedChats}
            sendMessage={sendMessage}
            setDraft={setDraft}
            streamingMessageId={streamingMessageId}
            toolCount={aiTools.length}
          />
        )}
        {view === 'settings' && (
          <Settings config={config} saveConfig={saveConfig} showToast={showToast} />
        )}
      </section>
      <ToastViewport dismissToast={dismissToast} toasts={toasts} />
    </main>
  )
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--dd-bg-base)] text-[var(--dd-text-primary)]">
      <div className="grid gap-[var(--dd-space-3)] text-center">
        <img alt="" className="mx-auto h-12 w-auto" src="/logo.png" />
        <p className="m-0 text-[0.92rem] text-[var(--dd-text-secondary)]">Opening DawnDesk...</p>
      </div>
    </main>
  )
}

function ToastViewport({
  dismissToast,
  toasts,
}: {
  dismissToast: (id: string) => void
  toasts: ToastMessage[]
}) {
  if (toasts.length === 0) return null

  return (
    <section
      className="pointer-events-none fixed bottom-[var(--dd-space-5)] right-[var(--dd-space-5)] z-50 grid w-[min(380px,calc(100vw-var(--dd-space-8)))] gap-[var(--dd-space-3)]"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.kind]

        return (
          <article
            className={`pointer-events-auto grid grid-cols-[auto_minmax(0,1fr)_auto] gap-[var(--dd-space-3)] rounded-[18px] border bg-[rgba(5,6,7,0.96)] p-[var(--dd-space-4)] text-[var(--dd-text-primary)] shadow-[0_18px_48px_rgba(0,0,0,0.48)] backdrop-blur ${toastStyles[toast.kind]}`}
            key={toast.id}
          >
            <span className="mt-0.5 grid size-8 place-items-center rounded-full border border-[rgba(250,204,21,0.28)] bg-[rgba(250,204,21,0.1)]">
              <Icon size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <strong className="block text-[0.92rem] font-semibold text-[var(--dd-text-primary)]">
                {toast.title}
              </strong>
              {toast.detail ? (
                <p className="m-0 mt-[var(--dd-space-1)] text-[0.84rem] leading-snug text-[var(--dd-text-secondary)]">
                  {toast.detail}
                </p>
              ) : null}
            </div>
            <button
              className="grid size-7 place-items-center rounded-full text-[var(--dd-text-muted)] transition-colors hover:bg-[var(--dd-bg-hover)] hover:text-[var(--dd-text-primary)]"
              type="button"
              aria-label={`Dismiss ${toast.title}`}
              onClick={() => dismissToast(toast.id)}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </article>
        )
      })}
    </section>
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

function savedChatsKey(userId: string) {
  return `${savedChatsStorageKey}.${userId}`
}

function getAuthRedirectUrl() {
  return authRedirectUrl
}

function isTauriRuntime() {
  return Boolean(
    '__TAURI_INTERNALS__' in window ||
      '__TAURI__' in window ||
      navigator.userAgent.includes('Tauri'),
  )
}

async function handleAuthDeepLinks(urls: string[]) {
  if (!supabase) return

  for (const url of urls) {
    if (!url.startsWith(authRedirectUrl)) continue

    const callback = new URL(url)
    const code = callback.searchParams.get('code')

    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
      return
    }

    const fragment = new URLSearchParams(callback.hash.replace(/^#/, ''))
    const accessToken = fragment.get('access_token')
    const refreshToken = fragment.get('refresh_token')

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }
}

function loadSavedChats(storageKey: string): SavedChat[] {
  try {
    const value = localStorage.getItem(storageKey)
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

function formatMessageWithAttachments(prompt: string, attachments: ChatAttachment[]) {
  if (attachments.length === 0) return prompt

  const fileBlocks = attachments.map((attachment) => {
    const header = `File: ${attachment.name} (${attachment.type || 'unknown type'}, ${formatBytes(attachment.size)})`

    if (attachment.content === undefined) {
      return `${header}\nContent: This file is attached, but DawnDesk can only include readable text file contents in AI chat right now.`
    }

    return `${header}\nContent:\n\`\`\`\n${attachment.content.slice(0, 18000)}${
      attachment.content.length > 18000 ? '\n...[truncated]' : ''
    }\n\`\`\``
  })

  return `${prompt || 'Please review the attached file(s).'}\n\nAttached files:\n\n${fileBlocks.join('\n\n')}`
}

function isTextAttachment(name: string, type: string) {
  const extension = name.split('.').pop()?.toLowerCase()
  const textExtensions = new Set([
    'c',
    'cpp',
    'cs',
    'css',
    'csv',
    'go',
    'html',
    'java',
    'js',
    'json',
    'jsx',
    'log',
    'md',
    'py',
    'rs',
    'sql',
    'svg',
    'toml',
    'ts',
    'tsx',
    'txt',
    'xml',
    'yaml',
    'yml',
  ])

  return type.startsWith('text/') || type.includes('json') || Boolean(extension && textExtensions.has(extension))
}

function guessMimeType(name: string) {
  const extension = name.split('.').pop()?.toLowerCase()

  if (extension === 'json') return 'application/json'
  if (extension === 'md') return 'text/markdown'
  if (extension === 'svg') return 'image/svg+xml'
  if (extension === 'csv') return 'text/csv'

  return 'application/octet-stream'
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
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
