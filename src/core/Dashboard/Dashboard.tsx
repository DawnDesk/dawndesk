import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Cloud,
  Edit3,
  FileText,
  Home,
  MessageSquare,
  Plug,
  Store,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { userAvatarUrl, userFirstName, type AuthUser } from '../../auth/supabase'
import type {
  AppConfig,
  ChatMessage,
  PluginMeta,
  RegistryPlugin,
  SavedChat,
  ToolDefinition,
} from '../../store/appStore'
import { PluginIcon } from '../PluginIcon'

type DashboardProps = {
  aiTools: ToolDefinition[]
  config: AppConfig
  currentUser: AuthUser | null
  messages: ChatMessage[]
  onOpenAI: () => void
  onOpenPlugin: (id: string) => void
  onOpenSettings: () => void
  onOpenStore: () => void
  plugins: PluginMeta[]
  registryPlugins: RegistryPlugin[]
  savedChats: SavedChat[]
}

const maxQuickAccessPlugins = 5
const quickAccessStorageKey = 'dawndesk.dashboard.quickAccessPlugins'

const panel =
  'border border-[rgba(148,163,184,0.12)] bg-black shadow-[0_18px_46px_rgba(0,0,0,0.32)]'
const ghostButton =
  'inline-flex min-h-12 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(255,255,255,0.24)] bg-[rgba(8,12,16,0.58)] px-[var(--dd-space-5)] py-[var(--dd-space-3)] text-[0.94rem] font-semibold text-[var(--dd-text-primary)] transition-[background,border-color,transform] duration-150 hover:-translate-y-px hover:border-[rgba(250,204,21,0.44)] hover:bg-[rgba(16,22,28,0.72)]'

export function Dashboard({
  config,
  currentUser,
  messages,
  onOpenAI,
  onOpenPlugin,
  onOpenSettings,
  onOpenStore,
  plugins,
  savedChats,
}: DashboardProps) {
  const [customizingQuickAccess, setCustomizingQuickAccess] = useState(false)
  const [quickAccessIds, setQuickAccessIds] = useState(loadQuickAccessIds)
  const recentChats = buildRecentChats(savedChats, messages)
  const installedCount = plugins.length
  const avatarUrl = userAvatarUrl(currentUser)
  const firstName = userFirstName(currentUser)
  const pluginIds = useMemo(() => plugins.map((plugin) => plugin.id), [plugins])
  const selectedQuickAccessIds = useMemo(
    () => normalizeQuickAccessIds(quickAccessIds, pluginIds),
    [pluginIds, quickAccessIds],
  )
  const quickAccessPlugins = useMemo(
    () =>
      selectedQuickAccessIds
        .map((id) => plugins.find((plugin) => plugin.id === id))
        .filter((plugin): plugin is PluginMeta => Boolean(plugin)),
    [plugins, selectedQuickAccessIds],
  )

  useEffect(() => {
    setQuickAccessIds((current) => {
      const next = normalizeQuickAccessIds(current, pluginIds)
      return areStringArraysEqual(current, next) ? current : next
    })
  }, [pluginIds])

  useEffect(() => {
    try {
      localStorage.setItem(quickAccessStorageKey, JSON.stringify(selectedQuickAccessIds))
    } catch {
      // Quick Access still works if browser storage is unavailable.
    }
  }, [selectedQuickAccessIds])

  function toggleQuickAccessPlugin(pluginId: string) {
    setQuickAccessIds((current) => {
      const normalized = normalizeQuickAccessIds(current, pluginIds)

      if (normalized.includes(pluginId)) {
        return normalized.filter((id) => id !== pluginId)
      }

      if (normalized.length >= maxQuickAccessPlugins || !pluginIds.includes(pluginId)) {
        return normalized
      }

      return [...normalized, pluginId]
    })
  }

  function moveQuickAccessPlugin(pluginId: string, direction: -1 | 1) {
    setQuickAccessIds((current) => {
      const normalized = normalizeQuickAccessIds(current, pluginIds)
      const index = normalized.indexOf(pluginId)
      const nextIndex = index + direction

      if (index < 0 || nextIndex < 0 || nextIndex >= normalized.length) {
        return normalized
      }

      const next = [...normalized]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  return (
    <section className="relative min-h-0 flex-1 overflow-y-auto bg-black px-[var(--dd-space-7)] pb-[var(--dd-space-6)] pt-[var(--dd-space-6)] max-[900px]:px-[var(--dd-space-4)]">
      <div className="relative mx-auto grid w-full max-w-[1360px] gap-[var(--dd-space-5)]">
        <section className="relative isolate min-h-[300px] overflow-hidden rounded-[var(--dd-radius-lg)] border border-[rgba(148,163,184,0.11)] bg-[var(--dd-bg-surface)] p-[var(--dd-space-8)] shadow-[0_24px_80px_rgba(0,0,0,0.36)] max-[760px]:p-[var(--dd-space-5)]">
          <img
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src="/dashboard.png"
          />
          <div className="" />

          <div className="grid min-h-[236px] grid-cols-[minmax(0,1fr)_330px] items-center gap-[var(--dd-space-8)] max-[1050px]:grid-cols-1">
            <div className="max-w-[460px]">
              <div className="flex items-center gap-[var(--dd-space-3)]">
                <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-[#111111] text-[var(--dd-text-primary)] shadow-[0_0_0_5px_rgba(250,204,21,0.1)]">
                  {avatarUrl ? (
                    <img alt="" className="size-full object-cover" src={avatarUrl} />
                  ) : (
                    <Home size={20} aria-hidden="true" />
                  )}
                </span>
                <p className="m-0 text-[1.12rem] font-bold text-[var(--dd-accent)]">
                  Good Afternoon, {firstName}
                </p>
              </div>
              <h1 className="m-0 mt-[var(--dd-space-4)] text-[clamp(2.1rem,4vw,3.45rem)] font-extrabold leading-[1.02] tracking-normal text-[var(--dd-text-primary)]">
                DawnDesk is ready
              </h1>
              <p className="m-0 mt-[var(--dd-space-4)] max-w-[390px] text-[1rem] leading-7 text-[var(--dd-text-secondary)]">
                Your AI workspace. All your tools, chats, and context — in one place.
              </p>
              <div className="mt-[var(--dd-space-8)] flex flex-wrap gap-[var(--dd-space-4)]">
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[var(--dd-accent)] bg-[var(--dd-accent)] px-[var(--dd-space-6)] py-[var(--dd-space-3)] text-[0.95rem] font-extrabold text-[var(--dd-accent-contrast)] shadow-[0_16px_36px_rgba(250,204,21,0.24)] transition-[background,transform] duration-150 hover:-translate-y-px hover:bg-[var(--dd-accent-hover)]"
                  type="button"
                  onClick={onOpenAI}
                >
                  <WandSparkles size={18} aria-hidden="true" />
                  Ask AI
                </button>
                <button className={ghostButton} type="button" onClick={onOpenStore}>
                  <Store size={18} aria-hidden="true" />
                  Open Marketplace
                </button>
              </div>
            </div>

            <aside className={`${panel} ml-auto grid w-full max-w-[340px] rounded-[var(--dd-radius-lg)] p-[var(--dd-space-5)] max-[1050px]:ml-0`}>
              <MetricRow
                action="View all"
                icon={Plug}
                label="Plugins Installed"
                value={formatNumber(installedCount)}
                onClick={onOpenStore}
              />
              <div className="my-[var(--dd-space-4)] h-px bg-[rgba(148,163,184,0.14)]" />
              <MetricRow
                icon={Cloud}
                label="AI Provider"
                status={config.apiKeyConfigured ? 'Connected' : 'Needs setup'}
                value={formatProvider(config.aiProvider)}
                onClick={onOpenSettings}
              />
            </aside>
          </div>
        </section>

        <div className="flex items-center justify-between gap-[var(--dd-space-4)]">
          <h2 className="m-0 text-[1.22rem] font-extrabold text-[var(--dd-text-primary)]">
            Quick Access
          </h2>
          <button
            className="inline-flex h-10 items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.11)] bg-[rgba(255,255,255,0.045)] px-[var(--dd-space-4)] text-[0.92rem] text-[var(--dd-text-secondary)] transition-colors hover:text-[var(--dd-text-primary)]"
            aria-expanded={customizingQuickAccess}
            type="button"
            onClick={() => setCustomizingQuickAccess((current) => !current)}
          >
            {customizingQuickAccess ? (
              <X size={16} aria-hidden="true" />
            ) : (
              <Edit3 size={16} aria-hidden="true" />
            )}
            {customizingQuickAccess ? 'Done' : 'Customize'}
          </button>
        </div>

        {customizingQuickAccess ? (
          <QuickAccessCustomizer
            onMove={moveQuickAccessPlugin}
            onOpenStore={onOpenStore}
            onToggle={toggleQuickAccessPlugin}
            plugins={plugins}
            selectedIds={selectedQuickAccessIds}
          />
        ) : null}

        <div className="grid gap-[var(--dd-space-3)] md:grid-cols-2 xl:grid-cols-5">
          {quickAccessPlugins.length > 0 ? (
            quickAccessPlugins.map((plugin) => (
              <QuickAccessCard
                key={plugin.id}
                plugin={plugin}
                onClick={() => onOpenPlugin(plugin.id)}
              />
            ))
          ) : (
            <article className={`${panel} grid min-h-[120px] place-items-center rounded-[var(--dd-radius-md)] p-[var(--dd-space-5)] text-center md:col-span-2 xl:col-span-5`}>
              <div>
                <Plug className="mx-auto text-[var(--dd-accent)]" size={30} aria-hidden="true" />
                <p className="m-0 mt-[var(--dd-space-2)] text-[0.95rem] font-bold text-[var(--dd-text-primary)]">
                  No installed plugins yet
                </p>
                <button
                  className="mt-[var(--dd-space-3)] text-[0.88rem] font-bold text-[var(--dd-accent)]"
                  type="button"
                  onClick={onOpenStore}
                >
                  Browse Marketplace
                </button>
              </div>
            </article>
          )}
        </div>
        <div className="grid gap-[var(--dd-space-4)] xl:grid-cols-1">
          <DashboardPanel title="Recent Chats" action="View all" onAction={onOpenAI}>
            <div className="grid gap-[var(--dd-space-3)]">
              {recentChats.map((chat) => (
                <button
                  className="grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.1)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-3)] text-left transition-[border-color,background,transform] hover:-translate-y-px hover:border-[rgba(250,204,21,0.32)] hover:bg-[rgba(255,255,255,0.045)]"
                  key={`${chat.title}-${chat.time}`}
                  type="button"
                  onClick={onOpenAI}
                >
                  <span className="grid size-9 place-items-center rounded-full border border-[rgba(148,163,184,0.15)] bg-[rgba(255,255,255,0.04)] text-[var(--dd-text-secondary)]">
                    <MessageSquare size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-[0.92rem] text-[var(--dd-text-primary)]">
                      {chat.title}
                    </strong>
                    <small className="block truncate text-[0.82rem] text-[var(--dd-text-muted)]">
                      {chat.time}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </section>
  )
}

function MetricRow({
  action,
  icon: Icon,
  label,
  onClick,
  status,
  value,
}: {
  action?: string
  icon: LucideIcon
  label: string
  onClick: () => void
  status?: string
  value: string
}) {
  return (
    <button
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-4)] text-left"
      type="button"
      onClick={onClick}
    >
      <span className="grid size-12 place-items-center rounded-full bg-[rgba(250,204,21,0.13)] text-[var(--dd-accent)] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18)]">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.86rem] text-[var(--dd-text-muted)]">{label}</span>
        <strong className="mt-1 block truncate text-[1.2rem] text-[var(--dd-text-primary)]">
          {value}
        </strong>
        {status ? (
          <small className={status === 'Connected' ? 'text-[var(--dd-success)]' : 'text-[var(--dd-warning)]'}>
            {status}
          </small>
        ) : null}
      </span>
      <span className="inline-flex items-center gap-[var(--dd-space-1)] text-[0.78rem] font-bold text-[var(--dd-accent)]">
        {action}
        <ChevronRight size={15} aria-hidden="true" />
      </span>
    </button>
  )
}

function QuickAccessCustomizer({
  onMove,
  onOpenStore,
  onToggle,
  plugins,
  selectedIds,
}: {
  onMove: (pluginId: string, direction: -1 | 1) => void
  onOpenStore: () => void
  onToggle: (pluginId: string) => void
  plugins: PluginMeta[]
  selectedIds: string[]
}) {
  return (
    <section className={`${panel} rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)]`}>
      <div className="mb-[var(--dd-space-4)] flex items-center justify-between gap-[var(--dd-space-4)] max-[640px]:items-start">
        <div>
          <h3 className="m-0 text-[1rem] font-extrabold text-[var(--dd-text-primary)]">
            Choose Quick Access plugins
          </h3>
          <p className="m-0 mt-1 text-[0.86rem] text-[var(--dd-text-muted)]">
            Showing {selectedIds.length} of {maxQuickAccessPlugins}. Only installed plugins can appear here.
          </p>
        </div>
        <button
          className="shrink-0 text-[0.86rem] font-bold text-[var(--dd-accent)]"
          type="button"
          onClick={onOpenStore}
        >
          Install more
        </button>
      </div>

      {plugins.length === 0 ? (
        <div className="rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.025)] p-[var(--dd-space-4)] text-[0.9rem] text-[var(--dd-text-secondary)]">
          Install a plugin from the marketplace, then come back here to pin it to Quick Access.
        </div>
      ) : (
        <div className="grid gap-[var(--dd-space-2)] md:grid-cols-2 xl:grid-cols-3">
          {plugins.map((plugin) => {
            const selectedIndex = selectedIds.indexOf(plugin.id)
            const isSelected = selectedIndex >= 0
            const isBlocked = !isSelected && selectedIds.length >= maxQuickAccessPlugins

            return (
              <div
                className={`grid min-h-[64px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border px-[var(--dd-space-3)] py-[var(--dd-space-2)] ${
                  isSelected
                    ? 'border-[rgba(250,204,21,0.34)] bg-[rgba(250,204,21,0.07)]'
                    : 'border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.025)]'
                }`}
                key={plugin.id}
              >
                <button
                  className={`grid size-8 place-items-center rounded-[var(--dd-radius-sm)] border transition-colors ${
                    isSelected
                      ? 'border-[var(--dd-accent)] bg-[var(--dd-accent)] text-[var(--dd-accent-contrast)]'
                      : 'border-[rgba(148,163,184,0.22)] bg-black text-transparent'
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                  aria-pressed={isSelected}
                  disabled={isBlocked}
                  title={isBlocked ? `Quick Access is limited to ${maxQuickAccessPlugins} plugins` : undefined}
                  type="button"
                  onClick={() => onToggle(plugin.id)}
                >
                  <Check size={16} aria-hidden="true" />
                </button>
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-2)]">
                  <PluginIcon
                    fallback={getQuickAccessPluginIcon(plugin)}
                    icon={plugin.icon}
                    label={plugin.name}
                    size="sm"
                  />
                  <span className="min-w-0">
                    <strong className="block truncate text-[0.92rem] text-[var(--dd-text-primary)]">
                      {plugin.name}
                    </strong>
                    <small className="block truncate text-[0.78rem] text-[var(--dd-text-muted)]">
                      {formatPluginStatus(plugin)}
                    </small>
                  </span>
                </div>
                {isSelected ? (
                  <div className="inline-flex gap-1">
                    <button
                      className="grid size-8 place-items-center rounded-[var(--dd-radius-sm)] border border-[rgba(148,163,184,0.14)] bg-black text-[var(--dd-text-secondary)] transition-colors hover:text-[var(--dd-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move ${plugin.name} earlier`}
                      disabled={selectedIndex === 0}
                      type="button"
                      onClick={() => onMove(plugin.id, -1)}
                    >
                      <ArrowUp size={15} aria-hidden="true" />
                    </button>
                    <button
                      className="grid size-8 place-items-center rounded-[var(--dd-radius-sm)] border border-[rgba(148,163,184,0.14)] bg-black text-[var(--dd-text-secondary)] transition-colors hover:text-[var(--dd-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move ${plugin.name} later`}
                      disabled={selectedIndex === selectedIds.length - 1}
                      type="button"
                      onClick={() => onMove(plugin.id, 1)}
                    >
                      <ArrowDown size={15} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function QuickAccessCard({ plugin, onClick }: { plugin: PluginMeta; onClick: () => void }) {
  return (
    <button
      className={`${panel} grid min-h-[120px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-4)] rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)] text-left transition-[border-color,background,transform] hover:-translate-y-1 hover:border-[rgba(250,204,21,0.32)] hover:bg-[rgba(16,22,28,0.9)]`}
      type="button"
      onClick={onClick}
    >
      <PluginIcon
        fallback={getQuickAccessPluginIcon(plugin)}
        icon={plugin.icon}
        label={plugin.name}
        size="md"
      />
      <span className="min-w-0">
        <strong className="block truncate text-[1rem] text-[var(--dd-text-primary)]">
          {plugin.name}
        </strong>
        <span className="mt-[var(--dd-space-2)] block max-w-32 text-[0.84rem] leading-5 text-[var(--dd-text-secondary)]">
          {plugin.description}
        </span>
      </span>
      <ChevronRight className="text-[var(--dd-text-muted)]" size={18} aria-hidden="true" />
    </button>
  )
}

function DashboardPanel({
  action,
  children,
  onAction,
  title,
}: {
  action?: string
  children: ReactNode
  onAction?: () => void
  title: string
}) {
  return (
    <article className={`${panel} rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)]`}>
      <div className="mb-[var(--dd-space-4)] flex items-center justify-between gap-[var(--dd-space-4)]">
        <h2 className="m-0 text-[1.04rem] font-extrabold text-[var(--dd-text-primary)]">{title}</h2>
        {action && onAction ? (
          <button
            className="text-[0.82rem] font-bold text-[var(--dd-accent)]"
            type="button"
            onClick={onAction}
          >
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </article>
  )
}

function buildRecentChats(savedChats: SavedChat[], messages: ChatMessage[]) {
  const saved = savedChats.slice(0, 3).map((chat) => ({
    time: formatRelativeTime(chat.updatedAt),
    title: chat.title,
  }))

  if (saved.length >= 3) return saved

  const currentUserMessage = messages.find((message) => message.role === 'user' && message.content.trim())
  const fallback = [
    { title: currentUserMessage?.content.slice(0, 42) || 'Help me optimize this code', time: '2h ago' },
    { title: 'Summarize this document', time: 'Yesterday' },
    { title: 'Create a content calendar', time: '2 days ago' },
  ]

  return [...saved, ...fallback].slice(0, 3)
}

function loadQuickAccessIds() {
  try {
    const stored = localStorage.getItem(quickAccessStorageKey)
    const parsed: unknown = stored ? JSON.parse(stored) : []

    if (!Array.isArray(parsed)) return []

    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function normalizeQuickAccessIds(selectedIds: string[], installedIds: string[]) {
  const installedSet = new Set(installedIds)
  const selected = selectedIds.filter(
    (id, index) => installedSet.has(id) && selectedIds.indexOf(id) === index,
  )
  const fill = installedIds.filter((id) => !selected.includes(id))

  return [...selected, ...fill].slice(0, maxQuickAccessPlugins)
}

function areStringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function getQuickAccessPluginIcon(plugin: PluginMeta): LucideIcon {
  if (plugin.id === 'notes') return FileText
  return Plug
}

function formatPluginStatus(plugin: PluginMeta) {
  if (!plugin.enabled) return 'Installed, disabled'
  if (plugin.category) return formatCategory(plugin.category)
  return 'Installed'
}

function formatCategory(category: string) {
  const normalized = category.replace(/[-_]/g, ' ')
  return normalized.slice(0, 1).toUpperCase() + normalized.slice(1)
}

function formatProvider(provider: AppConfig['aiProvider']) {
  const labels: Record<AppConfig['aiProvider'], string> = {
    anthropic: 'Anthropic',
    ollamaCloud: 'Ollama Cloud',
    openai: 'OpenAI',
  }

  return labels[provider]
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const elapsed = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (elapsed < hour) return `${Math.max(1, Math.round(elapsed / minute))}m ago`
  if (elapsed < day) return `${Math.round(elapsed / hour)}h ago`
  if (elapsed < 2 * day) return 'Yesterday'
  return `${Math.round(elapsed / day)} days ago`
}
