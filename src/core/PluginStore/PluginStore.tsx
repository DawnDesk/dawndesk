import type { PluginMeta } from '../../store/appStore'

type PluginStoreProps = {
  plugins: PluginMeta[]
}

export function PluginStore({ plugins }: PluginStoreProps) {
  return (
    <section className="storeGrid">
      {plugins.map((plugin) => (
        <article className="storeCard" key={plugin.id}>
          <div className="storeCardTop">
            <span className="pluginIcon large">{plugin.name.slice(0, 1)}</span>
            <span className="statusPill">{plugin.category ?? 'plugin'}</span>
          </div>
          <h2>{plugin.name}</h2>
          <p>{plugin.description}</p>
          <button className="primaryButton" type="button">
            {plugin.enabled ? 'Manage' : 'Install'}
          </button>
        </article>
      ))}
    </section>
  )
}
