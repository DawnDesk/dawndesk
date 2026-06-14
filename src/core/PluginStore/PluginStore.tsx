import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Code2,
  Download,
  FileText,
  FolderOpen,
  Globe2,
  Image,
  MoreVertical,
  Package,
  Play,
  Search,
  ShieldCheck,
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
  source: RegistryPlugin
  title: string
}

const panel =
  'border border-[rgba(148,163,184,0.16)] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.28)]'
const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[var(--dd-accent)] bg-[var(--dd-accent)] px-[var(--dd-space-5)] text-[0.92rem] font-extrabold text-[var(--dd-accent-contrast)] shadow-[0_14px_30px_rgba(250,204,21,0.18)] transition-[background,transform] hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] disabled:cursor-not-allowed disabled:opacity-65'
const secondaryButton =
  'inline-flex min-h-9 items-center justify-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-sm)] border border-[rgba(148,163,184,0.14)] bg-[rgba(255,255,255,0.025)] px-[var(--dd-space-4)] text-[0.9rem] font-bold text-[var(--dd-text-primary)] transition-[border-color,background,transform] hover:-translate-y-px hover:border-[rgba(250,204,21,0.28)] hover:bg-[rgba(255,255,255,0.045)] disabled:cursor-not-allowed disabled:opacity-65'

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
  const [selectedCard, setSelectedCard] = useState<MarketplaceCard | null>(null)

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
  const selectedInstalledPlugin = selectedCard
    ? installedPlugins.find((plugin) => plugin.id === selectedCard.id)
    : null
  const selectedRelease = selectedCard ? pickRelease(selectedCard.source.releases) : null

  if (selectedCard) {
    return (
      <MarketplacePluginDetail
        busy={busyPluginId === selectedCard.id}
        card={selectedCard}
        error={pluginErrors[selectedCard.id]}
        installedPlugin={selectedInstalledPlugin ?? null}
        onBack={() => setSelectedCard(null)}
        onDelete={() => onDelete(selectedCard.id)}
        onInstall={() => {
          if (selectedRelease) onInstall(selectedCard.source, selectedRelease)
        }}
        onOpen={() => onOpen(selectedCard.id)}
        progress={progressByPluginId[selectedCard.id]}
        release={selectedRelease}
      />
    )
  }

  return (
    <section className="relative min-h-0 flex-1 overflow-y-auto bg-black px-[var(--dd-space-7)] pb-[var(--dd-space-6)] pt-[var(--dd-space-6)] max-[900px]:px-[var(--dd-space-4)]">

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
          <div className="" />
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
            {filteredCards.map((card) => {
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
                    if (release) onInstall(card.source, release)
                  }}
                  onOpen={() => onOpen(card.id)}
                  onSelect={() => setSelectedCard(card)}
                  progress={progress}
                  release={release}
                />
              )
            })}
          </div>
        )}

        <footer className="flex items-center justify-between gap-[var(--dd-space-4)] px-[var(--dd-space-3)] text-[0.9rem] text-[var(--dd-text-muted)] max-[700px]:flex-col max-[700px]:items-start">
          <span>
            Showing {filteredCards.length} of {marketplacePlugins.length} registry plugins
          </span>
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
  onSelect,
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
  onSelect: () => void
  progress?: PluginDownloadProgress
  release: (RegistryRelease & { platform: string }) | null
}) {
  const Icon = card.icon

  return (
    <article
      className={`${panel} grid min-h-[176px] cursor-pointer grid-rows-[auto_1fr_auto_auto] gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)] transition-[border-color,transform] hover:-translate-y-px hover:border-[rgba(250,204,21,0.28)]`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-3)]">
        <span className={`grid size-11 place-items-center rounded-[var(--dd-radius-sm)] ${card.color} text-white shadow-[0_12px_26px_rgba(0,0,0,0.26)]`}>
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
          <Star className="text-[var(--dd-accent)]" size={15} aria-hidden="true" />
          {card.source.verified ? 'Verified' : card.source.latestVersion}
        </span>
        {installed ? (
          <div className="flex gap-[var(--dd-space-2)]">
            <button
              className={secondaryButton}
              disabled={busy}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onOpen()
              }}
            >
              <FolderOpen size={15} aria-hidden="true" />
              Open
            </button>
            <button
              className={`${secondaryButton} !px-[var(--dd-space-3)] text-[var(--dd-danger)]`}
              disabled={busy}
              type="button"
              aria-label={`Delete ${card.title}`}
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            className={secondaryButton}
            disabled={busy || !release}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onInstall()
            }}
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

function MarketplacePluginDetail({
  busy,
  card,
  error,
  installedPlugin,
  onBack,
  onDelete,
  onInstall,
  onOpen,
  progress,
  release,
}: {
  busy: boolean
  card: MarketplaceCard
  error?: string
  installedPlugin: PluginMeta | null
  onBack: () => void
  onDelete: () => void
  onInstall: () => void
  onOpen: () => void
  progress?: PluginDownloadProgress
  release: (RegistryRelease & { platform: string }) | null
}) {
  const Icon = card.icon
  const installed = Boolean(installedPlugin)
  const version = installedPlugin?.version ?? card.source?.latestVersion ?? '0.1.0'
  const installedDate = installedPlugin ? formatDetailDate(installedPlugin.installedAt) : 'Not installed'

  return (
    <section className="relative min-h-0 flex-1 overflow-y-auto bg-black px-[var(--dd-space-7)] pb-[var(--dd-space-6)] pt-[var(--dd-space-5)] max-[900px]:px-[var(--dd-space-4)]">

      <div className="relative mx-auto grid w-full max-w-[1320px] gap-[var(--dd-space-5)]">
        <div className="flex items-center justify-between gap-[var(--dd-space-4)]">
          <button
            className="inline-flex min-h-9 items-center gap-[var(--dd-space-3)] text-[0.92rem] font-bold text-[var(--dd-accent)] transition-colors hover:text-[var(--dd-accent-hover)]"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Marketplace
          </button>
          <span className="inline-flex min-h-9 items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(250,204,21,0.34)] bg-[rgba(250,204,21,0.05)] px-[var(--dd-space-4)] text-[0.82rem] font-bold text-[var(--dd-accent)]">
            <ShieldCheck size={15} aria-hidden="true" />
            Marketplace details
          </span>
        </div>

        <section className="relative isolate overflow-hidden rounded-[var(--dd-radius-lg)] border border-[rgba(148,163,184,0.14)] bg-[var(--dd-bg-surface)] p-[var(--dd-space-7)] shadow-[0_24px_70px_rgba(0,0,0,0.32)] max-[720px]:p-[var(--dd-space-5)]">
          <div className="absolute inset-0 -z-20 bg-black/85" />

          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-[var(--dd-space-6)] max-[860px]:grid-cols-1">
            <span className={`grid size-[84px] place-items-center rounded-[var(--dd-radius-lg)] ${card.color} text-white shadow-[0_22px_42px_rgba(250,204,21,0.18)]`}>
              <Icon size={38} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-[var(--dd-space-3)]">
                <h1 className="m-0 text-[clamp(2rem,3vw,2.75rem)] font-extrabold leading-tight tracking-normal text-[var(--dd-text-primary)]">
                  {card.title}
                </h1>
                {installed ? (
                  <span className="rounded-[var(--dd-radius-sm)] bg-[rgba(34,197,94,0.15)] px-[var(--dd-space-2)] py-[var(--dd-space-1)] text-[0.8rem] font-bold text-[var(--dd-success)]">
                    Installed
                  </span>
                ) : null}
              </div>
              <div className="mt-[var(--dd-space-3)] flex flex-wrap items-center gap-[var(--dd-space-3)] text-[0.95rem] text-[var(--dd-text-secondary)]">
                <span>{card.category}</span>
                <span className="rounded-full border border-[rgba(250,204,21,0.24)] bg-[rgba(250,204,21,0.07)] px-[var(--dd-space-3)] py-[var(--dd-space-1)] text-[var(--dd-accent)]">
                  Version {version}
                </span>
                <span>{release?.platform ?? 'Desktop'}</span>
              </div>
              <p className="m-0 mt-[var(--dd-space-4)] max-w-[560px] text-[1rem] leading-7 text-[var(--dd-text-secondary)]">
                {card.description}
              </p>
            </div>
            <div className="flex items-start gap-[var(--dd-space-3)] justify-self-end max-[860px]:justify-self-start">
              <button
                className="grid size-10 place-items-center rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.035)] text-[var(--dd-text-primary)]"
                type="button"
                aria-label="More plugin actions"
              >
                <MoreVertical size={18} aria-hidden="true" />
              </button>
              {installed ? (
                <button className={`${primaryButton} min-h-10`} type="button" onClick={onOpen}>
                  Open Plugin
                </button>
              ) : (
                <button
                  className={`${primaryButton} min-h-10`}
                  disabled={busy || !release}
                  type="button"
                  onClick={onInstall}
                >
                  <Download size={16} aria-hidden="true" />
                  {busy ? 'Installing' : 'Install Plugin'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-[var(--dd-space-8)] grid gap-[var(--dd-space-5)] md:grid-cols-2 xl:grid-cols-4">
            <DetailMetaItem icon={Download} label={installed ? 'Installed on' : 'Install status'} value={installedDate} />
            <DetailMetaItem icon={Package} label="Developer" value={card.source?.author ?? 'DawnDesk Team'} />
            <DetailMetaItem icon={Globe2} label="Website" value={card.source?.repository ?? 'dawndesk.app'} />
            <DetailMetaItem icon={ShieldCheck} label="Permissions" value="Host mediated access" />
          </div>
        </section>

        {progress ? (
          <div className={`${panel} grid gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] p-[var(--dd-space-4)]`}>
            <div className="flex justify-between gap-[var(--dd-space-2)] text-[0.84rem] text-[var(--dd-text-secondary)]">
              <span>{formatStatus(progress.status)}</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(148,163,184,0.16)]">
              <span
                className="block h-full rounded-[inherit] bg-[var(--dd-accent)] transition-[width] duration-150"
                style={{ width: `${Math.round(progress.progress)}%` }}
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="m-0 text-[0.9rem] text-[var(--dd-danger)]">{error}</p> : null}

        <nav className="flex items-end gap-[var(--dd-space-6)] border-b border-[rgba(148,163,184,0.14)]" aria-label="Plugin details">
          {['Overview', 'Features', 'Permissions', 'Changelog'].map((item, index) => (
            <span
              className={`relative min-h-11 px-[var(--dd-space-5)] pt-[var(--dd-space-3)] text-[0.95rem] font-semibold ${
                index === 0 ? 'text-[var(--dd-accent)]' : 'text-[var(--dd-text-secondary)]'
              }`}
              key={item}
            >
              {item}
              {index === 0 ? (
                <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-[var(--dd-accent)]" />
              ) : null}
            </span>
          ))}
        </nav>

        <div className="grid gap-[var(--dd-space-4)] xl:grid-cols-[1.15fr_0.95fr_0.95fr]">
          <article className={`${panel} rounded-[var(--dd-radius-md)] p-[var(--dd-space-5)]`}>
            <h2 className="m-0 text-[1.1rem] font-extrabold text-[var(--dd-text-primary)]">
              About {card.title}
            </h2>
            <p className="m-0 mt-[var(--dd-space-3)] text-[0.96rem] leading-7 text-[var(--dd-text-secondary)]">
              A focused DawnDesk plugin designed to extend your workspace without adding bulk to the host app.
            </p>
            <div className="mt-[var(--dd-space-5)] grid min-h-[220px] grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.14)] bg-[rgba(255,255,255,0.025)] max-[720px]:grid-cols-1">
              <div className="border-r border-[rgba(148,163,184,0.12)] p-[var(--dd-space-4)] max-[720px]:border-b max-[720px]:border-r-0">
                <strong className="inline-flex items-center gap-[var(--dd-space-2)] text-[0.88rem] text-[var(--dd-text-primary)]">
                  <Icon size={16} className="text-[var(--dd-accent)]" aria-hidden="true" />
                  {card.title}
                </strong>
                {['All Items', 'Favorites', 'Recent', 'Settings'].map((item, index) => (
                  <span
                    className={`mt-[var(--dd-space-3)] block rounded-[var(--dd-radius-sm)] px-[var(--dd-space-2)] py-[var(--dd-space-1)] text-[0.78rem] ${
                      index === 0
                        ? 'bg-[rgba(250,204,21,0.14)] text-[var(--dd-accent)]'
                        : 'text-[var(--dd-text-muted)]'
                    }`}
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="p-[var(--dd-space-4)]">
                <div className="flex items-center justify-between gap-[var(--dd-space-3)]">
                  <strong>Plugin Preview</strong>
                  <span className="rounded-[var(--dd-radius-sm)] bg-[var(--dd-accent)] px-[var(--dd-space-3)] py-[var(--dd-space-1)] text-[0.78rem] font-bold text-[var(--dd-accent-contrast)]">
                    New
                  </span>
                </div>
                <div className="mt-[var(--dd-space-4)] grid gap-[var(--dd-space-3)] sm:grid-cols-2">
                  {['Workspace item', 'AI command', 'Recent file', 'Plugin setting'].map((item) => (
                    <div className="min-h-16 rounded-[var(--dd-radius-sm)] bg-[rgba(255,255,255,0.04)] p-[var(--dd-space-3)]" key={item}>
                      <strong className="block text-[0.82rem] text-[var(--dd-text-primary)]">{item}</strong>
                      <span className="mt-[var(--dd-space-1)] block text-[0.72rem] text-[var(--dd-text-muted)]">
                        Marketplace preview
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className={`${panel} rounded-[var(--dd-radius-md)] p-[var(--dd-space-5)]`}>
            <h2 className="m-0 text-[1.1rem] font-extrabold text-[var(--dd-text-primary)]">
              Key Features
            </h2>
            <div className="mt-[var(--dd-space-4)] grid">
              {[
                ['Fast plugin launch', 'Runs inside the DawnDesk plugin shell.'],
                ['Local-first data', 'Uses host-mediated local storage scoped by user.'],
                ['AI-ready tools', 'Can expose tool definitions to the host AI.'],
                ['Minimal host impact', 'Keeps plugin logic out of the desktop shell.'],
              ].map(([title, body]) => (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-[var(--dd-space-3)] border-b border-[rgba(148,163,184,0.1)] py-[var(--dd-space-3)] last:border-b-0" key={title}>
                  <span className="grid size-10 place-items-center rounded-[var(--dd-radius-sm)] border border-[rgba(250,204,21,0.2)] bg-[rgba(250,204,21,0.06)] text-[var(--dd-accent)]">
                    <Star size={17} aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="block text-[0.94rem] text-[var(--dd-text-primary)]">{title}</strong>
                    <small className="mt-1 block text-[0.82rem] leading-5 text-[var(--dd-text-secondary)]">{body}</small>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-[var(--dd-space-4)]">
            <article className={`${panel} rounded-[var(--dd-radius-md)] p-[var(--dd-space-5)]`}>
              <h2 className="m-0 text-[1.1rem] font-extrabold text-[var(--dd-text-primary)]">Details</h2>
              <dl className="m-0 mt-[var(--dd-space-4)] grid gap-[var(--dd-space-3)] text-[0.92rem]">
                {[
                  ['Version', version],
                  ['Status', installed ? 'Installed' : 'Available'],
                  ['Category', card.category],
                  ['Developer', card.source?.author ?? 'DawnDesk Team'],
                  ['Platform', release?.platform ?? 'Desktop'],
                ].map(([label, value]) => (
                  <div className="grid grid-cols-[1fr_auto] gap-[var(--dd-space-4)]" key={label}>
                    <dt className="text-[var(--dd-text-secondary)]">{label}</dt>
                    <dd className="m-0 text-right text-[var(--dd-text-primary)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
            <article className={`${panel} rounded-[var(--dd-radius-md)] p-[var(--dd-space-5)]`}>
              <h2 className="m-0 text-[1.1rem] font-extrabold text-[var(--dd-text-primary)]">Actions</h2>
              <div className="mt-[var(--dd-space-4)] flex flex-wrap gap-[var(--dd-space-3)]">
                {installed ? (
                  <>
                    <button className={primaryButton} type="button" onClick={onOpen}>
                      Open Plugin
                    </button>
                    <button className={`${secondaryButton} text-[var(--dd-danger)]`} disabled={busy} type="button" onClick={onDelete}>
                      <Trash2 size={15} aria-hidden="true" />
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    className={primaryButton}
                  disabled={busy || !release}
                    type="button"
                    onClick={onInstall}
                  >
                    <Download size={16} aria-hidden="true" />
                    {busy ? 'Installing' : 'Install Plugin'}
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

function DetailMetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-3)]">
      <span className="grid size-9 place-items-center rounded-[var(--dd-radius-sm)] border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.035)] text-[var(--dd-text-secondary)]">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <small className="block text-[0.78rem] text-[var(--dd-text-muted)]">{label}</small>
        <strong className="block truncate text-[0.88rem] text-[var(--dd-text-primary)]">{value}</strong>
      </span>
    </div>
  )
}

function mergeMarketplacePlugins(registryPlugins: RegistryPlugin[]): MarketplaceCard[] {
  return registryPlugins.map((plugin, index) => {
    const Icon = getPluginIcon(plugin)

    return {
      category: normalizeCategory(plugin.category),
      color: iconColors[index % iconColors.length],
      description: plugin.description,
      icon: Icon,
      id: plugin.id,
      source: plugin,
      title: plugin.name,
    }
  })
}

const iconColors = [
  'bg-[#111111]',
  'bg-[#111111]',
  'bg-[#111111]',
  'bg-[#111111]',
  'bg-[#111111]',
  'bg-[#111111]',
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

function formatDetailDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'Recently'

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
