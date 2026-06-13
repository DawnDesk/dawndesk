import type { PluginMeta, View } from '../../store/appStore'

type SidebarProps = {
  activePluginId: string | null
  plugins: PluginMeta[]
  setActivePluginId: (id: string) => void
  setView: (view: View) => void
  view: View
}

const navItems: Array<{ label: string; view: View }> = [
  { label: 'Dashboard', view: 'workspace' },
  { label: 'Plugin Store', view: 'store' },
  { label: 'Prompts', view: 'ai' },
  { label: 'Settings', view: 'settings' },
]

export function Sidebar({
  activePluginId,
  plugins,
  setActivePluginId,
  setView,
  view,
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="DawnDesk navigation">
      <div className="brand">
        <span className="brandMark">D</span>
        <div>
          <strong>Workspace</strong>
          <span>DawnDesk tools</span>
        </div>
      </div>

      <nav className="navGroup" aria-label="Primary">
        {navItems.map((item) => (
          <button
            className={view === item.view ? 'navItem active' : 'navItem'}
            key={item.view}
            type="button"
            onClick={() => setView(item.view)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <section className="pluginList" aria-label="Installed plugins">
        <div className="sectionHeader">
          <span>Installed</span>
          <small>{plugins.length}</small>
        </div>
        {plugins.map((plugin) => (
          <button
            className={plugin.id === activePluginId ? 'pluginButton active' : 'pluginButton'}
            key={plugin.id}
            type="button"
            onClick={() => {
              setActivePluginId(plugin.id)
              setView('workspace')
            }}
          >
            <span className="pluginIcon">{plugin.name.slice(0, 1)}</span>
            <span>
              <strong>{plugin.name}</strong>
              <small>{plugin.enabled ? 'Enabled' : 'Disabled'}</small>
            </span>
          </button>
        ))}
      </section>
    </aside>
  )
}
