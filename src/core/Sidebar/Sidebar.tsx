import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronRight,
  FileText,
  Home,
  Image,
  MessageSquare,
  Package,
  Settings,
  Store,
  Terminal,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { PluginMeta, View } from '../../store/appStore'

type SidebarProps = {
  activePluginId: string | null
  plugins: PluginMeta[]
  setActivePluginId: (id: string | null) => void
  setView: (view: View) => void
  view: View
}

const navItems: Array<{ icon: LucideIcon; label: string; view: View }> = [
  { icon: Home, label: 'Dashboard', view: 'workspace' },
  { icon: Store, label: 'Plugin Store', view: 'store' },
  { icon: MessageSquare, label: 'Prompts', view: 'ai' },
  { icon: Settings, label: 'Settings', view: 'settings' },
]

const pluginIcons: Record<string, LucideIcon> = {
  finance: ChartNoAxesCombined,
  notes: FileText,
  'photo-editor': Image,
  'project-manager': BriefcaseBusiness,
  'video-editor': Video,
  'dev-tools': Terminal,
}

export function Sidebar({
  activePluginId,
  plugins,
  setActivePluginId,
  setView,
  view,
}: SidebarProps) {
  const activePlugin = plugins.find((plugin) => plugin.id === activePluginId)

  return (
    <aside className="sidebar" aria-label="DawnDesk navigation">
      <div className="brand">
          <img alt="" src="/logo.png"  className="h-8"/>
        <div>
          <strong>DawnDesk</strong>
        </div>
      </div>

      <nav className="navGroup" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.view === 'workspace'
              ? view === item.view && activePluginId === null
              : view === item.view

          return (
            <button
              className={isActive ? 'navItem active' : 'navItem'}
              key={item.view}
              type="button"
              onClick={() => {
                if (item.view === 'workspace') {
                  setActivePluginId(null)
                }
                setView(item.view)
              }}
            >
              <span className="navIcon" aria-hidden="true">
                <Icon size={17} />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <section className="pluginList" aria-label="Installed plugins">
        <div className="sectionHeader">
          <span>Installed</span>
          <small>{plugins.length}</small>
        </div>
        {plugins.map((plugin) => {
          const Icon = pluginIcons[plugin.id] ?? Package

          return (
            <button
              className={plugin.id === activePluginId ? 'pluginButton active' : 'pluginButton'}
              key={plugin.id}
              type="button"
              onClick={() => {
                setActivePluginId(plugin.id)
                setView('workspace')
              }}
            >
              <span className="pluginIcon" aria-hidden="true">
                <Icon size={16} />
              </span>
              <span>
                <strong>{plugin.name}</strong>
              </span>
            </button>
          )
        })}
      </section>

      <section className="activePluginCard" aria-label="Active plugin">
        <span>Active Plugin</span>
        <strong>{activePlugin?.name ?? 'None'}</strong>
        <small aria-hidden="true">
          <ChevronRight size={16} />
        </small>
      </section>
    </aside>
  )
}
