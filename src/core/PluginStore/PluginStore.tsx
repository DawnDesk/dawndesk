import { useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Image,
  Languages,
  Mic,
  Package,
  Play,
  Search,
  Star,
  Trash2,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type {
  PluginDownloadProgress,
  PluginMeta,
  RegistryPlugin,
  RegistryRelease,
} from '../../store/appStore'

type PluginStoreProps = {
  busyPluginId: string | null
  installedPlugins: PluginMeta[]
  onDelete: (id: string) => void
  onInstall: (plugin: RegistryPlugin, release: RegistryRelease) => void
  onOpenLocalPlugins: () => void
  onOpen: (id: string) => void
  pluginErrors: Record<string, string>
  progressByPluginId: Record<string, PluginDownloadProgress>
  registryPlugins: RegistryPlugin[]
}

type MarketplaceCard = {
  category: string
  color: string
  description: string
  icon: LucideIcon
  id: string
  rating: string
  reviews: number
  source?: RegistryPlugin
  title: string
}

const panel =
  'border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012)),rgba(8,14,20,0.82)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl'
const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[var(--dd-accent)] bg-[var(--dd-accent)] px-[var(--dd-space-5)] text-[0.92rem] font-extrabold text-[var(--dd-accent-contrast)] shadow-[0_14px_30px_rgba(250,204,21,0.18)] transition-[background,transform] hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] disabled:cursor-not-allowed disabled:opacity-65'
const secondaryButton =
  'inline-flex min-h-9 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-sm)] border border-[rgba(148,163,184,0.14)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-4)] text-[0.9rem] font-bold text-[var(--dd-text-primary)] transition-[border-color,background,transform] hover:-translate-y-px hover:border-[rgba(250,204,21,0.28)] hover:bg-[rgba(255,255,255,0.045)] disabled:cursor-not-allowed disabled:opacity-65'

const showcasePlugins: MarketplaceCard[] = [
  {
    category: 'Productivity',
    color: 'from-[#ffb020] to-[#ffcc18]',
    description: 'Create, edit, and manage your notes with ease.',
    icon: FileText,
    id: 'notes',
    rating: '4.8',
    reviews: 124,
    title: 'Notes',
  },
  {
    category: 'Productivity',
    color: 'from-[#2563eb] to-[#60a5fa]',
    description: 'Search the web for real-time information.',
    icon: Search,
    id: 'web-search',
    rating: '4.7',
    reviews: 98,
    title: 'Web Search',
  },
  {
    category: 'Productivity',
    color: 'from-[#db2777] to-[#f43f5e]',
    description: 'Read, analyze, and summarize PDF files.',
    icon: FileText,
    id: 'pdf-reader',
    rating: '4.6',
    reviews: 86,
    title: 'PDF Reader',
  },
  {
    category: 'Development',
    color: 'from-[#4b5563] to-[#1f2937]',
    description: 'Run code in multiple programming languages.',
    icon: Code2,
    id: 'code-runner',
    rating: '4.9',
    reviews: 156,
    title: 'Code Runner',
  },
  {
    category: 'Media',
    color: 'from-[#7c3aed] to-[#a855f7]',
    description: 'Generate images from text descriptions.',
    icon: Image,
    id: 'image-generator',
    rating: '4.8',
    reviews: 112,
    title: 'Image Generator',
  },
  {
    category: 'Media',
    color: 'from-[#dc2626] to-[#ef4444]',
    description: 'Summarize YouTube videos instantly.',
    icon: Video,
    id: 'youtube-summarizer',
    rating: '4.6',
    reviews: 77,
    title: 'YouTube Summarizer',
  },
  {
    category: 'Utilities',
    color: 'from-[#6b7280] to-[#374151]',
    description: 'Perform calculations quickly and easily.',
    icon: Calculator,
    id: 'calculator',
    rating: '4.7',
    reviews: 65,
    title: 'Calculator',
  },
  {
    category: 'Finance',
    color: 'from-[#4ade80] to-[#22c55e]',
    description: 'Track expenses and manage your finances.',
    icon: ChartNoAxesCombined,
    id: 'finance',
    rating: '4.8',
    reviews: 93,
    title: 'Finance Tracker',
  },
  {
    category: 'Utilities',
    color: 'from-[#2563eb] to-[#60a5fa]',
    description: 'Translate text between multiple languages.',
    icon: Languages,
    id: 'translator',
    rating: '4.6',
    reviews: 58,
    title: 'Translator',
  },
  {
    category: 'Productivity',
    color: 'from-[#f97316] to-[#fb923c]',
    description: 'Organize tasks and boost your productivity.',
    icon: BriefcaseBusiness,
    id: 'project-manager',
    rating: '4.7',
    reviews: 70,
    title: 'Task Manager',
  },
  {
    category: 'Utilities',
    color: 'from-[#7c3aed] to-[#a855f7]',
    description: 'Convert speech to text effortlessly.',
    icon: Mic,
    id: 'voice-to-text',
    rating: '4.5',
    reviews: 61,
    title: 'Voice to Text',
  },
  {
    category: 'Productivity',
    color: 'from-[#34d399] to-[#10b981]',
    description: 'Create beautiful charts from your data.',
    icon: ChartNoAxesCombined,
    id: 'chart-generator',
    rating: '4.8',
    reviews: 85,
    title: 'Chart Generator',
  },
]

export function PluginStore({
  busyPluginId,
  installedPlugins,
  onDelete,
  onInstall,
  onOpenLocalPlugins,
  onOpen,
  pluginErrors,
  progressByPluginId,
  registryPlugins,
}: PluginStoreProps) {
  const [category, setCategory] = useState('All Categories')
  const [query, setQuery] = useState('')

  const marketplacePlugins = useMemo(
    () => mergeMarketplacePlugins(registryPlugins),
    [registryPlugins],
  )
  const filteredCards = marketplacePlugins.filter((card) => {
    const matchesQuery = card.title.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCategory = category === 'All Categories' || card.category === category
    return matchesQuery && matchesCategory
  })
  const categoryOptions = ['All Categories', ...Array.from(new Set(marketplacePlugins.map((card) => card.category)))]

  return (
    <section className="relative min-h-0 flex-1 overflow-y-auto bg-[#03080c] px-[var(--dd-space-7)] pb-[var(--dd-space-6)] pt-[var(--dd-space-6)] max-[900px]:px-[var(--dd-space-4)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_26%_0%,rgba(250,204,21,0.08),transparent_22%),radial-gradient(circle_at_90%_12%,rgba(59,130,246,0.08),transparent_22%)]" />

      <div className="relative mx-auto grid w-full max-w-[1320px] gap-[var(--dd-space-5)]">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[var(--dd-space-5)] max-[1060px]:grid-cols-1">
          <div>
            <h1 className="m-0 text-[clamp(2rem,3vw,2.65rem)] font-extrabold leading-tight tracking-normal text-[var(--dd-text-primary)]">
              Plugins
            </h1>
            <p className="m-0 mt-[var(--dd-space-2)] text-[0.98rem] text-[var(--dd-text-secondary)]">
              Extend DawnDesk with powerful plugins.
            </p>
          </div>

          <div className="grid grid-cols-[220px_220px_auto] gap-[var(--dd-space-3)] max-[760px]:grid-cols-1">
            <label className="grid h-10 grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-3)] text-[var(--dd-text-muted)]">
              <Search size={17} aria-hidden="true" />
              <input
                className="min-w-0 border-0 bg-transparent text-[0.9rem] text-[var(--dd-text-primary)] outline-none placeholder:text-[var(--dd-text-muted)]"
                aria-label="Search plugins"
                placeholder="Search plugins..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select
              className="h-10 rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.18)] bg-[#071018] px-[var(--dd-space-3)] text-[0.9rem] text-[var(--dd-text-primary)] outline-none"
              aria-label="Plugin category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button className={primaryButton} type="button">
              <ExternalLink size={16} aria-hidden="true" />
              Explore Marketplace
            </button>
          </div>
        </header>

        <nav className="flex items-end gap-[var(--dd-space-6)] border-b border-[rgba(148,163,184,0.14)]" aria-label="Plugin views">
          <TabButton active={false} onClick={onOpenLocalPlugins}>
            Installed
          </TabButton>
          <TabButton active onClick={() => undefined}>
            Marketplace
          </TabButton>
        </nav>

        <section className="relative isolate min-h-[190px] overflow-hidden rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.14)] bg-[var(--dd-bg-surface)] p-[var(--dd-space-7)] shadow-[0_24px_70px_rgba(0,0,0,0.32)] max-[720px]:p-[var(--dd-space-5)]">
          <img
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src="/marketplace-plugin.png"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,13,22,0.94)_0%,rgba(12,17,28,0.62)_38%,rgba(12,17,28,0.08)_75%,rgba(12,17,28,0.18)_100%)]" />
          <div className="max-w-[560px]">
            <h2 className="m-0 text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-tight text-[var(--dd-text-primary)]">
              Supercharge your workflow
            </h2>
            <p className="m-0 mt-[var(--dd-space-2)] text-[1rem] text-[var(--dd-text-secondary)]">
              Discover, install, and manage plugins to boost your productivity.
            </p>
            <button className={`${primaryButton} mt-[var(--dd-space-5)]`} type="button">
              Browse All Plugins
            </button>
          </div>
        </section>

        <div className="flex items-center justify-between gap-[var(--dd-space-4)]">
          <h2 className="m-0 text-[1.1rem] font-extrabold text-[var(--dd-text-primary)]">
            All Plugins
          </h2>
        </div>

        {filteredCards.length === 0 ? (
          <div className={`${panel} grid min-h-[260px] place-items-center rounded-[var(--dd-radius-md)] p-[var(--dd-space-8)] text-center`}>
            <div>
              <Package className="mx-auto text-[var(--dd-accent)]" size={34} aria-hidden="true" />
              <h3 className="mb-0 mt-[var(--dd-space-3)] text-[1.1rem] text-[var(--dd-text-primary)]">
                No plugins found
              </h3>
              <p className="m-0 mt-[var(--dd-space-2)] text-[var(--dd-text-secondary)]">
                Try a different search or category.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-[var(--dd-space-4)] sm:grid-cols-2 xl:grid-cols-4">
            {filteredCards.slice(0, 12).map((card) => {
              const installedPlugin = installedPlugins.find((plugin) => plugin.id === card.id)
              const release = card.source ? pickRelease(card.source.releases) : null
              const progress = progressByPluginId[card.id]
              const error = pluginErrors[card.id]
              const isBusy = busyPluginId === card.id

              return (
                <PluginCard
                  busy={isBusy}
                  card={card}
                  error={error}
                  installed={Boolean(installedPlugin)}
                  key={card.id}
                  onDelete={() => onDelete(card.id)}
                  onInstall={() => {
                    if (card.source && release) onInstall(card.source, release)
                  }}
                  onOpen={() => onOpen(card.id)}
                  progress={progress}
                  release={release}
                />
              )
            })}
          </div>
        )}

        <footer className="flex items-center justify-between gap-[var(--dd-space-4)] px-[var(--dd-space-3)] text-[0.9rem] text-[var(--dd-text-muted)] max-[700px]:flex-col max-[700px]:items-start">
          <span>
            Showing {Math.min(filteredCards.length, 12)} of {Math.max(marketplacePlugins.length * 4, 48)} plugins
          </span>
          <div className="flex items-center gap-[var(--dd-space-2)]">
            <button className="grid size-9 place-items-center rounded-[var(--dd-radius-sm)] text-[var(--dd-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--dd-text-primary)]" type="button" aria-label="Previous page">
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            {[1, 2, 3].map((page) => (
              <button
                className={`grid size-9 place-items-center rounded-[var(--dd-radius-sm)] font-bold ${
                  page === 1
                    ? 'border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.06)] text-[var(--dd-text-primary)]'
                    : 'text-[var(--dd-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--dd-text-primary)]'
                }`}
                key={page}
                type="button"
              >
                {page}
              </button>
            ))}
            <button className="grid size-9 place-items-center rounded-[var(--dd-radius-sm)] text-[var(--dd-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--dd-text-primary)]" type="button" aria-label="Next page">
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </section>
  )
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      className={`relative min-h-12 px-[var(--dd-space-5)] text-[0.95rem] font-semibold transition-colors ${
        active ? 'text-[var(--dd-accent)]' : 'text-[var(--dd-text-secondary)] hover:text-[var(--dd-text-primary)]'
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-[var(--dd-accent)]" />
      ) : null}
    </button>
  )
}

function PluginCard({
  busy,
  card,
  error,
  installed,
  onDelete,
  onInstall,
  onOpen,
  progress,
  release,
}: {
  busy: boolean
  card: MarketplaceCard
  error?: string
  installed: boolean
  onDelete: () => void
  onInstall: () => void
  onOpen: () => void
  progress?: PluginDownloadProgress
  release: (RegistryRelease & { platform: string }) | null
}) {
  const Icon = card.icon

  return (
    <article className={`${panel} grid min-h-[176px] grid-rows-[auto_1fr_auto_auto] gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)]`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-3)]">
        <span className={`grid size-11 place-items-center rounded-[var(--dd-radius-sm)] bg-gradient-to-br ${card.color} text-white shadow-[0_12px_26px_rgba(0,0,0,0.26)]`}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="m-0 truncate text-[1rem] font-extrabold text-[var(--dd-text-primary)]">
            {card.title}
          </h3>
          <span className="text-[0.86rem] text-[var(--dd-text-muted)]">{card.category}</span>
        </div>
      </div>

      <p className="m-0 max-w-[260px] text-[0.92rem] leading-6 text-[var(--dd-text-secondary)]">
        {card.description}
      </p>

      <div className="flex items-center justify-between gap-[var(--dd-space-3)]">
        <span className="inline-flex items-center gap-[var(--dd-space-2)] text-[0.88rem] text-[var(--dd-text-secondary)]">
          <Star className="fill-[var(--dd-accent)] text-[var(--dd-accent)]" size={15} aria-hidden="true" />
          {card.rating} ({card.reviews})
        </span>
        {installed ? (
          <div className="flex gap-[var(--dd-space-2)]">
            <button className={secondaryButton} disabled={busy} type="button" onClick={onOpen}>
              <FolderOpen size={15} aria-hidden="true" />
              Open
            </button>
            <button className={`${secondaryButton} !px-[var(--dd-space-3)] text-[var(--dd-danger)]`} disabled={busy} type="button" aria-label={`Delete ${card.title}`} onClick={onDelete}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            className={secondaryButton}
            disabled={busy || (card.source ? !release : false)}
            type="button"
            onClick={onInstall}
          >
            <Download size={15} aria-hidden="true" />
            {busy ? 'Installing' : 'Install'}
          </button>
        )}
      </div>

      {progress ? (
        <div className="grid gap-[var(--dd-space-2)]" aria-label={`${card.title} download progress`}>
          <div className="flex justify-between gap-[var(--dd-space-2)] text-[0.78rem] text-[var(--dd-text-muted)]">
            <span>{formatStatus(progress.status)}</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(148,163,184,0.16)]">
            <span
              className="block h-full rounded-[inherit] bg-[var(--dd-accent)] transition-[width] duration-150"
              style={{ width: `${Math.round(progress.progress)}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="m-0 text-[0.82rem] text-[var(--dd-danger)]">{error}</p> : null}
    </article>
  )
}

function mergeMarketplacePlugins(registryPlugins: RegistryPlugin[]): MarketplaceCard[] {
  const registryCards = registryPlugins.map((plugin, index) => {
    const Icon = getPluginIcon(plugin)
    const fallback = showcasePlugins.find((item) => item.id === plugin.id)

    return {
      category: normalizeCategory(plugin.category),
      color: fallback?.color ?? iconColors[index % iconColors.length],
      description: plugin.description,
      icon: Icon,
      id: plugin.id,
      rating: fallback?.rating ?? '4.8',
      reviews: fallback?.reviews ?? 80 + index * 7,
      source: plugin,
      title: plugin.name,
    }
  })

  const registryIds = new Set(registryCards.map((plugin) => plugin.id))
  const showcase = showcasePlugins.filter((plugin) => !registryIds.has(plugin.id))

  return [...registryCards, ...showcase].slice(0, 12)
}

const iconColors = [
  'from-[#ffb020] to-[#ffcc18]',
  'from-[#2563eb] to-[#60a5fa]',
  'from-[#db2777] to-[#f43f5e]',
  'from-[#4b5563] to-[#1f2937]',
  'from-[#7c3aed] to-[#a855f7]',
  'from-[#4ade80] to-[#22c55e]',
]

function getPluginIcon(plugin: RegistryPlugin | MarketplaceCard): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    finance: ChartNoAxesCombined,
    notes: FileText,
    'photo-editor': Image,
    'project-manager': BriefcaseBusiness,
    'video-editor': Video,
    'dev-tools': Code2,
    'workflow-builder': Play,
  }

  if (iconMap[plugin.id]) return iconMap[plugin.id]
  if (plugin.category?.toLowerCase().includes('media')) return Image
  if (plugin.category?.toLowerCase().includes('developer')) return Code2
  if (plugin.category?.toLowerCase().includes('finance')) return ChartNoAxesCombined
  if (plugin.category?.toLowerCase().includes('video')) return Video

  return Package
}

function normalizeCategory(category?: string) {
  if (!category) return 'Productivity'

  const normalized = category.replace(/[-_]/g, ' ')
  return normalized.slice(0, 1).toUpperCase() + normalized.slice(1)
}

function formatStatus(status: string) {
  return status.slice(0, 1).toUpperCase() + status.slice(1)
}

function pickRelease(releases: Record<string, RegistryRelease>) {
  const candidates = platformCandidates()

  for (const platform of candidates) {
    const release = releases[platform]
    if (release) return { ...release, platform }
  }

  const first = Object.entries(releases)[0]
  return first ? { ...first[1], platform: first[0] } : null
}

function platformCandidates() {
  const platform = navigator.platform.toLowerCase()
  const userAgent = navigator.userAgent.toLowerCase()

  if (platform.includes('win')) return ['windows-x86_64']
  if (platform.includes('mac')) {
    return userAgent.includes('arm') ? ['macos-aarch64', 'macos-x86_64'] : ['macos-x86_64']
  }
  if (platform.includes('linux')) return ['linux-x86_64']

  return ['windows-x86_64', 'macos-aarch64', 'macos-x86_64', 'linux-x86_64']
}
