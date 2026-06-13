import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  MessageSquare,
  Package,
  PlugZap,
  Settings,
  Store,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import { PluginIcon } from '../PluginIcon'
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
  messages: ChatMessage[]
  onOpenAI: () => void
  onOpenPlugin: (id: string) => void
  onOpenSettings: () => void
  onOpenStore: () => void
  plugins: PluginMeta[]
  registryPlugins: RegistryPlugin[]
  savedChats: SavedChat[]
}

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-[var(--dd-space-2)] rounded-full border border-transparent bg-[var(--dd-accent)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] font-semibold text-[var(--dd-accent-contrast)] shadow-[var(--dd-shadow-sm)] transition-[background,transform] duration-150 hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] active:scale-[0.98]'
const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-[var(--dd-space-2)] rounded-full border border-[var(--dd-border)] bg-[var(--dd-bg-elevated)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] font-medium text-[var(--dd-text-primary)] transition-[background,border-color,transform] duration-150 hover:-translate-y-px hover:border-[var(--dd-border-strong)] hover:bg-[var(--dd-bg-hover)]'
const panel =
  'rounded-[22px] border border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-card-sheen),transparent),var(--dd-bg-surface)] shadow-[var(--dd-shadow-sm)]'

export function Dashboard({
  aiTools,
  config,
  messages,
  onOpenAI,
  onOpenPlugin,
  onOpenSettings,
  onOpenStore,
  plugins,
  registryPlugins,
  savedChats,
}: DashboardProps) {
  const currentChatTokens = estimateTokens(messages.map((message) => message.content).join('\n'))
  const savedChatTokens = estimateTokens(
    savedChats
      .flatMap((chat) => chat.messages)
      .map((message) => message.content)
      .join('\n'),
  )
  const currentChatMessages = messages.filter((message) => message.id !== 'welcome').length
  const assistantMessages = messages.filter((message) => message.role === 'assistant').length
  const usagePercent = Math.min(100, Math.round((currentChatTokens / 128_000) * 100))
  const lastSavedChat = savedChats[0]
  const availablePlugins = Math.max(registryPlugins.length, plugins.length)

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-[var(--dd-space-8)] py-[var(--dd-space-7)] max-[900px]:px-[var(--dd-space-4)]">
      <div className="mx-auto grid w-full max-w-[1180px] gap-[var(--dd-space-6)]">
        <header className="grid gap-[var(--dd-space-5)] border-b border-[var(--dd-border)] pb-[var(--dd-space-6)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-[var(--dd-space-3)]">
            <span className="inline-flex w-fit items-center gap-[var(--dd-space-2)] rounded-full border border-[rgba(250,204,21,0.26)] bg-[rgba(250,204,21,0.08)] px-[var(--dd-space-3)] py-[var(--dd-space-1)] text-[0.82rem] font-semibold text-[var(--dd-accent)]">
              <CheckCircle2 size={15} aria-hidden="true" />
              Host entry screen
            </span>
            <div className="flex items-center gap-[var(--dd-space-4)]">
              <img
                alt=""
                className="h-auto w-[clamp(70px,8vw,98px)] rounded-[var(--dd-radius-xl)] bg-[radial-gradient(circle_at_50%_42%,var(--dd-logo-glow),transparent_58%),linear-gradient(180deg,var(--dd-logo-wash),var(--dd-logo-wash-soft)),var(--dd-bg-elevated)] drop-shadow-[var(--dd-shadow-yellow)]"
                src="/logo.png"
              />
              <div>
                <h1 className="m-0 text-[clamp(2rem,4vw,4rem)] font-bold leading-[0.95] tracking-normal text-[var(--dd-text-primary)]">
                  DawnDesk
                </h1>
                <p className="m-0 mt-[var(--dd-space-2)] max-w-2xl text-[1rem] leading-7 text-[var(--dd-text-secondary)]">
                  A plugin-first workspace with AI context, installed tools, saved chats, and host
                  status in one place.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-[var(--dd-space-2)]">
            <button className={primaryButton} type="button" onClick={onOpenAI}>
              <WandSparkles size={16} aria-hidden="true" />
              Open AI Chat
            </button>
            <button className={secondaryButton} type="button" onClick={onOpenStore}>
              <Store size={16} aria-hidden="true" />
              Plugin Store
            </button>
          </div>
        </header>

        <div className="grid gap-[var(--dd-space-4)] md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={BrainCircuit}
            label="Current chat tokens"
            value={formatNumber(currentChatTokens)}
            detail="Estimated from local conversation text"
          />
          <MetricCard
            icon={PlugZap}
            label="AI plugin tools"
            value={formatNumber(aiTools.length)}
            detail={`${plugins.length} installed plugin${plugins.length === 1 ? '' : 's'} loaded`}
          />
          <MetricCard
            icon={Package}
            label="Marketplace plugins"
            value={formatNumber(availablePlugins)}
            detail={`${registryPlugins.length} visible in the registry`}
          />
          <MetricCard
            icon={Database}
            label="Saved chat tokens"
            value={formatNumber(savedChatTokens)}
            detail={`${savedChats.length} saved conversation${savedChats.length === 1 ? '' : 's'}`}
          />
        </div>

        <div className="grid min-h-[360px] gap-[var(--dd-space-5)] xl:grid-cols-[1.1fr_0.9fr]">
          <article className={`${panel} grid gap-[var(--dd-space-5)] p-[var(--dd-space-5)]`}>
            <div className="flex flex-wrap items-start justify-between gap-[var(--dd-space-4)]">
              <div>
                <h2 className="m-0 text-[1.1rem]">AI Usage</h2>
                <p className="m-0 mt-[var(--dd-space-1)] text-[0.9rem] text-[var(--dd-text-muted)]">
                  Local estimates, provider state, and recent chat activity.
                </p>
              </div>
              <button className={secondaryButton} type="button" onClick={onOpenSettings}>
                <Settings size={16} aria-hidden="true" />
                AI Settings
              </button>
            </div>

            <div className="grid gap-[var(--dd-space-4)] md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="grid content-start gap-[var(--dd-space-4)]">
                <div>
                  <div className="mb-[var(--dd-space-2)] flex items-center justify-between gap-[var(--dd-space-3)] text-[0.86rem] text-[var(--dd-text-secondary)]">
                    <span>Estimated context use</span>
                    <strong className="text-[var(--dd-text-primary)]">{usagePercent}%</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--dd-bg-elevated)]">
                    <span
                      className="block h-full rounded-full bg-[var(--dd-accent)]"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-[var(--dd-space-3)] sm:grid-cols-3">
                  <CompactStat label="Messages" value={formatNumber(currentChatMessages)} />
                  <CompactStat label="Assistant replies" value={formatNumber(assistantMessages)} />
                  <CompactStat label="Saved chats" value={formatNumber(savedChats.length)} />
                </div>

                <div className="rounded-[var(--dd-radius-lg)] border border-[var(--dd-border)] bg-[var(--dd-bg-elevated)] p-[var(--dd-space-4)]">
                  <span className="block text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[var(--dd-text-muted)]">
                    Last saved chat
                  </span>
                  <strong className="mt-[var(--dd-space-2)] block text-[var(--dd-text-primary)]">
                    {lastSavedChat?.title ?? 'No saved chat yet'}
                  </strong>
                  <p className="m-0 mt-[var(--dd-space-1)] text-[0.88rem] text-[var(--dd-text-secondary)]">
                    {lastSavedChat ? formatDate(lastSavedChat.updatedAt) : 'Save a chat to track it here.'}
                  </p>
                </div>
              </div>

              <div className="grid content-start gap-[var(--dd-space-3)] rounded-[var(--dd-radius-lg)] border border-[rgba(250,204,21,0.22)] bg-[rgba(250,204,21,0.06)] p-[var(--dd-space-4)]">
                <span className="grid size-10 place-items-center rounded-full bg-[rgba(250,204,21,0.14)] text-[var(--dd-accent)]">
                  <Bot size={19} aria-hidden="true" />
                </span>
                <div>
                  <span className="text-[0.8rem] text-[var(--dd-text-muted)]">Provider</span>
                  <strong className="block text-[var(--dd-text-primary)]">
                    {formatProvider(config.aiProvider)}
                  </strong>
                </div>
                <div>
                  <span className="text-[0.8rem] text-[var(--dd-text-muted)]">Model</span>
                  <strong className="block break-words text-[var(--dd-text-primary)]">
                    {config.aiModel || 'Not selected'}
                  </strong>
                </div>
                <div>
                  <span className="text-[0.8rem] text-[var(--dd-text-muted)]">API key</span>
                  <strong className={config.apiKeyConfigured ? 'block text-[var(--dd-accent)]' : 'block text-[var(--dd-warning)]'}>
                    {config.apiKeyConfigured ? 'Configured' : 'Needs setup'}
                  </strong>
                </div>
              </div>
            </div>
          </article>

          <article className={`${panel} grid content-start gap-[var(--dd-space-4)] p-[var(--dd-space-5)]`}>
            <div className="flex items-start justify-between gap-[var(--dd-space-4)]">
              <div>
                <h2 className="m-0 text-[1.1rem]">Installed Plugins</h2>
                <p className="m-0 mt-[var(--dd-space-1)] text-[0.9rem] text-[var(--dd-text-muted)]">
                  Open a plugin or install more tools.
                </p>
              </div>
              <button className={secondaryButton} type="button" onClick={onOpenStore}>
                <Store size={16} aria-hidden="true" />
                Store
              </button>
            </div>

            {plugins.length === 0 ? (
              <div className="grid min-h-[220px] place-content-center justify-items-center rounded-[var(--dd-radius-lg)] border border-dashed border-[var(--dd-border)] bg-[var(--dd-bg-elevated)] p-[var(--dd-space-6)] text-center">
                <Package className="mb-[var(--dd-space-3)] text-[var(--dd-accent)]" size={32} />
                <strong>No plugins installed</strong>
                <p className="m-0 mt-[var(--dd-space-2)] max-w-sm text-[0.9rem] text-[var(--dd-text-secondary)]">
                  Install Notes or another plugin to add real workspace features.
                </p>
              </div>
            ) : (
              <ul className="m-0 grid list-none gap-[var(--dd-space-3)] p-0">
                {plugins.slice(0, 6).map((plugin) => (
                  <li key={plugin.id}>
                    <button
                      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-lg)] border border-[var(--dd-border)] bg-[var(--dd-bg-elevated)] p-[var(--dd-space-3)] text-left transition-[background,border-color,transform] duration-150 hover:-translate-y-px hover:border-[var(--dd-border-strong)] hover:bg-[var(--dd-bg-hover)]"
                      type="button"
                      onClick={() => onOpenPlugin(plugin.id)}
                    >
                      <PluginIcon fallback={FileText} icon={plugin.icon} label={plugin.name} />
                      <span className="min-w-0">
                        <strong className="block truncate text-[var(--dd-text-primary)]">
                          {plugin.name}
                        </strong>
                        <small className="block truncate text-[var(--dd-text-muted)]">
                          {plugin.category ?? plugin.version}
                        </small>
                      </span>
                      <span className="text-[0.8rem] font-semibold text-[var(--dd-accent)]">Open</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <div className="grid gap-[var(--dd-space-4)] md:grid-cols-3">
          <InsightCard
            icon={Cpu}
            title="Host State"
            body={`${plugins.length} plugin${plugins.length === 1 ? '' : 's'}, ${aiTools.length} AI tool${aiTools.length === 1 ? '' : 's'}, ${registryPlugins.length} registry item${registryPlugins.length === 1 ? '' : 's'}.`}
          />
          <InsightCard
            icon={MessageSquare}
            title="Conversation Memory"
            body={`${formatNumber(currentChatTokens + savedChatTokens)} estimated tokens across current and saved chat text.`}
          />
          <InsightCard
            icon={WandSparkles}
            title="Next Action"
            body={config.apiKeyConfigured ? 'AI is ready for configured provider calls.' : 'Add an API key in Settings to enable real provider responses.'}
          />
        </div>
      </div>
    </section>
  )
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className={`${panel} grid gap-[var(--dd-space-4)] p-[var(--dd-space-4)]`}>
      <span className="grid size-10 place-items-center rounded-[var(--dd-radius-md)] border border-[rgba(250,204,21,0.22)] bg-[rgba(250,204,21,0.08)] text-[var(--dd-accent)]">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <span className="text-[0.82rem] text-[var(--dd-text-muted)]">{label}</span>
        <strong className="block text-[1.9rem] leading-tight text-[var(--dd-text-primary)]">
          {value}
        </strong>
        <p className="m-0 mt-[var(--dd-space-1)] text-[0.84rem] text-[var(--dd-text-secondary)]">
          {detail}
        </p>
      </div>
    </article>
  )
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[var(--dd-bg-elevated)] p-[var(--dd-space-3)]">
      <span className="block text-[0.78rem] text-[var(--dd-text-muted)]">{label}</span>
      <strong className="mt-[var(--dd-space-1)] block text-[1.2rem] text-[var(--dd-text-primary)]">
        {value}
      </strong>
    </div>
  )
}

function InsightCard({
  body,
  icon: Icon,
  title,
}: {
  body: string
  icon: LucideIcon
  title: string
}) {
  return (
    <article className={`${panel} grid grid-cols-[auto_minmax(0,1fr)] gap-[var(--dd-space-3)] p-[var(--dd-space-4)]`}>
      <span className="grid size-9 place-items-center rounded-[var(--dd-radius-md)] bg-[var(--dd-bg-elevated)] text-[var(--dd-accent)]">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div>
        <strong className="block text-[var(--dd-text-primary)]">{title}</strong>
        <p className="m-0 mt-[var(--dd-space-1)] text-[0.88rem] leading-6 text-[var(--dd-text-secondary)]">
          {body}
        </p>
      </div>
    </article>
  )
}

function estimateTokens(text: string) {
  const normalized = text.trim()
  if (!normalized) return 0

  return Math.ceil(normalized.length / 4)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
}

function formatProvider(provider: AppConfig['aiProvider']) {
  const labels: Record<AppConfig['aiProvider'], string> = {
    anthropic: 'Anthropic',
    ollamaCloud: 'Ollama Cloud',
    openai: 'OpenAI',
  }

  return labels[provider]
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently saved'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
