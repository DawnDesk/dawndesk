import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Download,
  FileText,
  FolderOpen,
  Image,
  Package,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { PluginIcon } from '../PluginIcon'
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
  onOpen: (id: string) => void
  pluginErrors: Record<string, string>
  progressByPluginId: Record<string, PluginDownloadProgress>
  registryPlugins: RegistryPlugin[]
}

const primaryButton =
  'inline-flex min-h-[38px] items-center justify-center gap-[var(--dd-space-2)] justify-self-start rounded-[var(--dd-radius-md)] border border-transparent bg-[var(--dd-accent)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] font-extrabold text-[var(--dd-accent-contrast)] shadow-[var(--dd-shadow-sm)] transition-[background,color,transform,border-color] duration-150 hover:-translate-y-px hover:bg-[var(--dd-accent-hover)] active:scale-[0.98] active:bg-[var(--dd-accent-active)] disabled:cursor-not-allowed disabled:opacity-70'
const secondaryButton =
  'inline-flex min-h-[38px] items-center justify-center gap-[var(--dd-space-2)] justify-self-start rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[var(--dd-control-bg)] px-[var(--dd-space-4)] py-[var(--dd-space-2)] text-[var(--dd-text-secondary)] transition-[background,color,transform,border-color] duration-150 hover:-translate-y-px hover:border-[var(--dd-border-strong)] hover:text-[var(--dd-text-primary)] disabled:cursor-not-allowed disabled:opacity-70'
export function PluginStore({
  busyPluginId,
  installedPlugins,
  onDelete,
  onInstall,
  onOpen,
  pluginErrors,
  progressByPluginId,
  registryPlugins,
}: PluginStoreProps) {
  return (
    <section className="grid gap-[var(--dd-space-5)] p-[var(--dd-space-5)]">
      <div className="grid grid-cols-[minmax(280px,1fr)_220px_auto] gap-[var(--dd-space-3)] max-[900px]:grid-cols-1">
        <label className="relative block">
          <Search
            className="absolute left-[var(--dd-space-3)] top-1/2 -translate-y-1/2 text-[var(--dd-text-muted)]"
            size={16}
            aria-hidden="true"
          />
          <input
            className="min-h-[42px] w-full rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[var(--dd-bg-base)] py-0 pl-[var(--dd-space-8)] pr-[var(--dd-space-3)] text-[var(--dd-text-primary)]"
            aria-label="Search plugins"
            placeholder="Search plugins..."
          />
        </label>
        <select
          className="min-h-[42px] rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[var(--dd-bg-base)] px-[var(--dd-space-3)] py-0 text-[var(--dd-text-primary)]"
          aria-label="Plugin category"
          defaultValue="all"
        >
          <option value="all">All Categories</option>
          <option value="productivity">Productivity</option>
          <option value="media">Media</option>
          <option value="developer">Developer</option>
        </select>
        <button className={secondaryButton} type="button">
          <RefreshCw size={15} aria-hidden="true" />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[var(--dd-space-4)]">
        {registryPlugins.map((plugin) => {
          const installedPlugin = installedPlugins.find((item) => item.id === plugin.id)
          const release = pickRelease(plugin.releases)
          const isBusy = busyPluginId === plugin.id
          const progress = progressByPluginId[plugin.id]
          const error = pluginErrors[plugin.id]
          const Icon = getPluginIcon(plugin)
          const icon = installedPlugin?.icon ?? plugin.icon

          return (
            <article
              className="grid min-h-[206px] grid-rows-[auto_1fr_auto_auto] gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-panel-sheen),transparent),var(--dd-bg-surface)] p-[var(--dd-space-5)] shadow-[var(--dd-shadow-md)] animate-[panelIn_260ms_ease_both]"
              key={plugin.id}
            >
              <div className="flex items-center justify-start gap-[var(--dd-space-4)]">
                <PluginIcon fallback={Icon} icon={icon} label={plugin.name} size="md" />
                <div>
                  <h2 className="m-0 text-base">{plugin.name}</h2>
                  <span className="text-[0.78rem] text-[var(--dd-text-muted)]">
                    {plugin.category ?? 'plugin'}
                  </span>
                </div>
              </div>
              <p className="m-0 max-w-xl text-[var(--dd-text-secondary)]">
                {plugin.description}
              </p>
              <div className="flex flex-wrap gap-[var(--dd-space-2)] text-[0.8rem] text-[var(--dd-text-muted)]">
                <span>v{plugin.latestVersion}</span>
                {plugin.verified && <span>Verified</span>}
                {release && <span>{release.platform}</span>}
              </div>
              {plugin.tags && plugin.tags.length > 0 && (
                <div
                  className="flex flex-wrap gap-[var(--dd-space-2)] text-[0.8rem] text-[var(--dd-text-muted)]"
                  aria-label={`${plugin.name} tags`}
                >
                  {plugin.tags.slice(0, 4).map((tag) => (
                    <span
                      className="rounded-[var(--dd-radius-sm)] border border-[var(--dd-border)] bg-[var(--dd-chip-bg)] px-[var(--dd-space-2)] py-[var(--dd-space-1)]"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-[var(--dd-space-2)]">
                {installedPlugin ? (
                  <>
                    <button
                      className={primaryButton}
                      disabled={isBusy}
                      type="button"
                      onClick={() => onOpen(plugin.id)}
                    >
                      <FolderOpen size={15} aria-hidden="true" />
                      Open
                    </button>
                    <button
                      className={`${secondaryButton} text-[var(--dd-danger)]`}
                      disabled={isBusy}
                      type="button"
                      onClick={() => onDelete(plugin.id)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      {isBusy ? 'Deleting' : 'Delete'}
                    </button>
                  </>
                ) : (
                  <button
                    className={primaryButton}
                    disabled={!release || isBusy}
                    type="button"
                    onClick={() => release && onInstall(plugin, release)}
                  >
                    <Download size={15} aria-hidden="true" />
                    {isBusy ? 'Downloading' : release ? 'Install' : 'Unavailable'}
                  </button>
                )}
              </div>
              {progress && (
                <div
                  className="grid gap-[var(--dd-space-2)]"
                  aria-label={`${plugin.name} download progress`}
                >
                  <div className="flex flex-wrap justify-between gap-[var(--dd-space-2)] text-[0.8rem] text-[var(--dd-text-muted)]">
                    <span>{formatStatus(progress.status)}</span>
                    <span>{Math.round(progress.progress)}%</span>
                  </div>
                  <div className="h-[var(--dd-space-2)] overflow-hidden rounded-[var(--dd-radius-sm)] bg-[var(--dd-bg-elevated)]">
                    <span
                      className="block h-full rounded-[inherit] bg-[var(--dd-accent)] transition-[width] duration-150"
                      style={{ width: `${Math.round(progress.progress)}%` }}
                    />
                  </div>
                </div>
              )}
              {error && <p className="m-0 text-[0.86rem] text-[var(--dd-danger)]">{error}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function getPluginIcon(plugin: RegistryPlugin): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    finance: ChartNoAxesCombined,
    notes: FileText,
    'photo-editor': Image,
    'project-manager': BriefcaseBusiness,
    'video-editor': Video,
    'dev-tools': Terminal,
  }

  if (iconMap[plugin.id]) return iconMap[plugin.id]
  if (plugin.category?.toLowerCase().includes('media')) return Image
  if (plugin.category?.toLowerCase().includes('developer')) return Terminal
  if (plugin.category?.toLowerCase().includes('finance')) return ChartNoAxesCombined

  return Package
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
