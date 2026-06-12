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
  progressByPluginId: Record<string, PluginDownloadProgress>
  registryPlugins: RegistryPlugin[]
}

export function PluginStore({
  busyPluginId,
  installedPlugins,
  onDelete,
  onInstall,
  onOpen,
  progressByPluginId,
  registryPlugins,
}: PluginStoreProps) {
  return (
    <section className="storeGrid">
      {registryPlugins.map((plugin) => {
        const installedPlugin = installedPlugins.find((item) => item.id === plugin.id)
        const release = pickRelease(plugin.releases)
        const isBusy = busyPluginId === plugin.id
        const progress = progressByPluginId[plugin.id]

        return (
          <article className="storeCard" key={plugin.id}>
            <div className="storeCardTop">
              <span className="pluginIcon large">{plugin.name.slice(0, 1)}</span>
              <span className="statusPill">{plugin.category ?? 'plugin'}</span>
            </div>
            <h2>{plugin.name}</h2>
            <p>{plugin.description}</p>
            <div className="pluginMetaRow">
              <span>v{plugin.latestVersion}</span>
              {plugin.verified && <span>Verified</span>}
              {release && <span>{release.platform}</span>}
            </div>
            {plugin.tags && plugin.tags.length > 0 && (
              <div className="tagList" aria-label={`${plugin.name} tags`}>
                {plugin.tags.slice(0, 4).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
            <div className="storeActions">
              {installedPlugin ? (
                <>
                  <button
                    className="primaryButton"
                    disabled={isBusy}
                    type="button"
                    onClick={() => onOpen(plugin.id)}
                  >
                    Open
                  </button>
                  <button
                    className="secondaryButton dangerButton"
                    disabled={isBusy}
                    type="button"
                    onClick={() => onDelete(plugin.id)}
                  >
                    {isBusy ? 'Deleting' : 'Delete'}
                  </button>
                </>
              ) : (
                <button
                  className="primaryButton"
                  disabled={!release || isBusy}
                  type="button"
                  onClick={() => release && onInstall(plugin, release)}
                >
                  {isBusy ? 'Downloading' : release ? 'Download' : 'Unavailable'}
                </button>
              )}
            </div>
            {progress && (
              <div className="downloadProgress" aria-label={`${plugin.name} download progress`}>
                <div className="progressMeta">
                  <span>{formatStatus(progress.status)}</span>
                  <span>{Math.round(progress.progress)}%</span>
                </div>
                <div className="progressTrack">
                  <span style={{ width: `${Math.round(progress.progress)}%` }} />
                </div>
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
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
