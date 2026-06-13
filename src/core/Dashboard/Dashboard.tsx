import {
  ChevronRight,
  Cloud,
  Edit3,
  FileText,
  Home,
  Image,
  MessageSquare,
  Plug,
  Sparkles,
  Store,
  Video,
  WalletCards,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { userAvatarUrl, userFirstName, type AuthUser } from '../../auth/supabase'
import type {
  AppConfig,
  ChatMessage,
  PluginMeta,
  RegistryPlugin,
  SavedChat,
  ToolDefinition,
} from '../../store/appStore'

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

type QuickCard = {
  color: string
  description: string
  icon: LucideIcon
  id: string
  title: string
}

const quickCards: QuickCard[] = [
  {
    color: 'from-[#ffb020] to-[#ffcc18]',
    description: 'Create and manage your notes',
    icon: FileText,
    id: 'notes',
    title: 'Notes',
  },
  {
    color: 'from-[#7c3aed] to-[#a855f7]',
    description: 'Chat with AI assistant',
    icon: Sparkles,
    id: 'ai',
    title: 'AI Chat',
  },
  {
    color: 'from-[#4ade80] to-[#22c55e]',
    description: 'Track expenses and budgets',
    icon: WalletCards,
    id: 'finance',
    title: 'Finance',
  },
  {
    color: 'from-[#db2777] to-[#f43f5e]',
    description: 'Edit and enhance images',
    icon: Image,
    id: 'photo-editor',
    title: 'Photo Editor',
  },
  {
    color: 'from-[#f97316] to-[#ef4444]',
    description: 'Edit and create videos',
    icon: Video,
    id: 'video-editor',
    title: 'Video Editor',
  },
]

const sampleWork = [
  { color: 'bg-[linear-gradient(135deg,#fafafa,#a8b1c5)]', meta: 'Notes  •  Edited 2h ago', title: 'Meeting Notes.md' },
  { color: 'bg-[linear-gradient(135deg,#60a5fa,#2563eb)]', meta: 'Projects  •  Edited 5h ago', title: 'Q2 Marketing Plan' },
  { color: 'bg-[linear-gradient(135deg,#a855f7,#7c3aed)]', meta: 'Notes  •  Edited 1d ago', title: 'Product Ideas Brainstorm' },
]

const sampleActivity = [
  { color: 'bg-[var(--dd-accent)]', icon: Home, label: 'Notes plugin updated', time: 'Just now' },
  { color: 'bg-[#3b82f6]', icon: MessageSquare, label: 'New chat created', time: '3m ago' },
  { color: 'bg-[var(--dd-success)]', icon: Store, label: 'Q2 Marketing Plan updated', time: '1h ago' },
  { color: 'bg-[#ec4899]', icon: Store, label: 'Photo Editor plugin updated', time: '5h ago' },
]

const panel =
  'border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)),rgba(12,18,24,0.82)] shadow-[0_18px_46px_rgba(0,0,0,0.32)] backdrop-blur-xl'
const ghostButton =
  'inline-flex min-h-12 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(255,255,255,0.24)] bg-[rgba(8,12,16,0.58)] px-[var(--dd-space-5)] py-[var(--dd-space-3)] text-[0.94rem] font-semibold text-[var(--dd-text-primary)] transition-[background,border-color,transform] duration-150 hover:-translate-y-px hover:border-[rgba(250,204,21,0.44)] hover:bg-[rgba(16,22,28,0.72)]'

export function Dashboard({
  aiTools,
  config,
  currentUser,
  messages,
  onOpenAI,
  onOpenPlugin,
  onOpenSettings,
  onOpenStore,
  plugins,
  registryPlugins,
  savedChats,
}: DashboardProps) {
  const recentChats = buildRecentChats(savedChats, messages)
  const installedCount = Math.max(plugins.length, aiTools.length > 0 ? plugins.length : 0)
  const availableCount = Math.max(registryPlugins.length, quickCards.length)
  const avatarUrl = userAvatarUrl(currentUser)
  const firstName = userFirstName(currentUser)

  function openQuickCard(card: QuickCard) {
    if (card.id === 'ai') {
      onOpenAI()
      return
    }

    if (plugins.some((plugin) => plugin.id === card.id)) {
      onOpenPlugin(card.id)
      return
    }

    onOpenStore()
  }

  return (
    <section className="relative min-h-0 flex-1 overflow-y-auto bg-[#03080c] px-[var(--dd-space-7)] pb-[var(--dd-space-6)] pt-[var(--dd-space-6)] max-[900px]:px-[var(--dd-space-4)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at 32% 15%, rgba(250, 204, 21, 0.1), transparent 24%), radial-gradient(circle at 86% 0%, rgba(239, 68, 68, 0.1), transparent 24%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1360px] gap-[var(--dd-space-5)]">
        <section className="relative isolate min-h-[300px] overflow-hidden rounded-[var(--dd-radius-lg)] border border-[rgba(148,163,184,0.11)] bg-[var(--dd-bg-surface)] p-[var(--dd-space-8)] shadow-[0_24px_80px_rgba(0,0,0,0.36)] max-[760px]:p-[var(--dd-space-5)]">
          <img
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src="/dashboard.png"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,8,12,0.98)_0%,rgba(3,8,12,0.72)_34%,rgba(3,8,12,0.18)_64%,rgba(3,8,12,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-[linear-gradient(180deg,transparent,rgba(3,8,12,0.94))]" />

          <div className="grid min-h-[236px] grid-cols-[minmax(0,1fr)_330px] items-center gap-[var(--dd-space-8)] max-[1050px]:grid-cols-1">
            <div className="max-w-[460px]">
              <div className="flex items-center gap-[var(--dd-space-3)]">
                <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#f9fafb,#64748b)] text-[var(--dd-accent-contrast)] shadow-[0_0_0_5px_rgba(250,204,21,0.1)]">
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
            type="button"
            onClick={onOpenStore}
          >
            <Edit3 size={16} aria-hidden="true" />
            Customize
          </button>
        </div>

        <div className="grid gap-[var(--dd-space-3)] md:grid-cols-2 xl:grid-cols-5">
          {quickCards.map((card) => (
            <QuickAccessCard key={card.id} card={card} onClick={() => openQuickCard(card)} />
          ))}
        </div>

        <div className="grid gap-[var(--dd-space-4)] xl:grid-cols-[1.05fr_1fr_1.05fr]">
          <DashboardPanel title="Continue Working" action="View all" onAction={onOpenStore}>
            <div className="grid gap-[var(--dd-space-3)]">
              {sampleWork.map((item) => (
                <button
                  className="grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.1)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-3)] text-left transition-[border-color,background,transform] hover:-translate-y-px hover:border-[rgba(250,204,21,0.32)] hover:bg-[rgba(255,255,255,0.045)]"
                  key={item.title}
                  type="button"
                  onClick={onOpenStore}
                >
                  <span className={`grid size-9 place-items-center rounded-[var(--dd-radius-sm)] ${item.color} text-[#0b1117]`}>
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-[0.94rem] text-[var(--dd-text-primary)]">
                      {item.title}
                    </strong>
                    <small className="block truncate text-[0.82rem] text-[var(--dd-text-muted)]">
                      {item.meta}
                    </small>
                  </span>
                  <span className="rounded-full border border-[rgba(250,204,21,0.15)] bg-[rgba(250,204,21,0.08)] px-[var(--dd-space-3)] py-[var(--dd-space-1)] text-[0.82rem] font-bold text-[var(--dd-accent)]">
                    Open
                  </span>
                </button>
              ))}
            </div>
          </DashboardPanel>

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

          <DashboardPanel title="Activity">
            <div className="grid">
              {sampleActivity.map((item) => {
                const Icon = item.icon

                return (
                  <div
                    className="grid min-h-[58px] grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-3)] border-b border-[rgba(148,163,184,0.08)] last:border-b-0"
                    key={`${item.label}-${item.time}`}
                  >
                    <span className={`size-2 rounded-full ${item.color}`} />
                    <span className="grid size-8 place-items-center rounded-full border border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.035)] text-[var(--dd-text-secondary)]">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="truncate text-[0.9rem] text-[var(--dd-text-primary)]">
                      {item.label}
                    </span>
                    <time className="whitespace-nowrap text-[0.82rem] text-[var(--dd-text-muted)]">
                      {item.time}
                    </time>
                  </div>
                )
              })}
            </div>
          </DashboardPanel>
        </div>

        <footer className={`${panel} flex min-h-16 items-center justify-between gap-[var(--dd-space-4)] rounded-[var(--dd-radius-md)] px-[var(--dd-space-5)] py-[var(--dd-space-3)] max-[700px]:flex-col max-[700px]:items-start`}>
          <div className="flex min-w-0 items-center gap-[var(--dd-space-3)] text-[0.95rem] text-[var(--dd-text-secondary)]">
            <Sparkles className="shrink-0 text-[var(--dd-accent)]" size={18} aria-hidden="true" />
            <span className="min-w-0">
              Tip: Use AI Commands to automate repetitive tasks and save time.
            </span>
          </div>
          <button
            className="inline-flex items-center gap-[var(--dd-space-2)] text-[0.92rem] font-bold text-[var(--dd-accent)]"
            type="button"
            onClick={onOpenAI}
          >
            Learn More
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </footer>

        <span className="sr-only">
          {availableCount} marketplace plugins are available for this DawnDesk workspace.
        </span>
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

function QuickAccessCard({ card, onClick }: { card: QuickCard; onClick: () => void }) {
  const Icon = card.icon

  return (
    <button
      className={`${panel} grid min-h-[120px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-4)] rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)] text-left transition-[border-color,background,transform] hover:-translate-y-1 hover:border-[rgba(250,204,21,0.32)] hover:bg-[rgba(16,22,28,0.9)]`}
      type="button"
      onClick={onClick}
    >
      <span className={`grid size-11 place-items-center rounded-[var(--dd-radius-sm)] bg-gradient-to-br ${card.color} text-white shadow-[0_14px_26px_rgba(0,0,0,0.28)]`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[1rem] text-[var(--dd-text-primary)]">
          {card.title}
        </strong>
        <span className="mt-[var(--dd-space-2)] block max-w-32 text-[0.84rem] leading-5 text-[var(--dd-text-secondary)]">
          {card.description}
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
