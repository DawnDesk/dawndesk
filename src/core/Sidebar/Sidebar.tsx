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
import { PluginIcon } from '../PluginIcon'
import type { PluginMeta, View } from '../../store/appStore'

type SidebarProps = {
  activePluginId: string | null
  plugins: PluginMeta[]
  setActivePluginId: (id: string | null) => void
  setView: (view: View) => void
  view: View
}

const navItems: Array<{ icon: LucideIcon; label: string; view: View }> = [
  { icon: Home, label: 'Dashboard', view: 'dashboard' },
  { icon: Store, label: 'Plugin Store', view: 'store' },
  { icon: MessageSquare, label: 'AI Chat', view: 'ai' },
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

const sidebarButton =
  'relative flex min-h-10 w-full items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-left text-[var(--dd-text-secondary)] transition-[background,color,transform] duration-150 hover:-translate-y-px hover:bg-[var(--dd-bg-hover)] hover:text-[var(--dd-text-primary)]'
const activeSidebarButton =
  'bg-[var(--dd-bg-elevated)] text-[var(--dd-text-primary)] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[var(--dd-accent)]'
const sidebarIcon =
  'grid w-[18px] place-items-center text-[var(--dd-text-muted)] transition-colors duration-150'
const activeSidebarIcon = 'text-[var(--dd-accent)]'

export function Sidebar({
  activePluginId,
  plugins,
  setActivePluginId,
  setView,
  view,
}: SidebarProps) {
  const activePlugin = plugins.find((plugin) => plugin.id === activePluginId)

  return (
    <aside
      className="flex min-h-0 flex-col gap-[var(--dd-space-4)] overflow-y-auto border-r border-[var(--dd-border)] bg-[linear-gradient(180deg,var(--dd-sidebar-sheen),transparent_55%),var(--dd-bg-surface)] p-[var(--dd-space-4)] max-[900px]:max-h-72 max-[900px]:border-b max-[900px]:border-r-0"
      aria-label="DawnDesk navigation"
    >
      <div className="flex min-h-[52px] items-center gap-[var(--dd-space-3)] border-b border-[var(--dd-border)] pb-[var(--dd-space-4)]">
        <img alt="" src="/logo.png" className="h-8" />
        <div>
          <strong className="font-[var(--dd-font-display)] text-[1.2rem] leading-none text-[var(--dd-text-primary)]">
            DawnDesk
          </strong>
        </div>
      </div>

      <nav className="flex flex-col gap-[var(--dd-space-1)]" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = view === item.view

          return (
            <button
              className={`${sidebarButton} ${isActive ? activeSidebarButton : ''}`}
              key={item.view}
              type="button"
              onClick={() => {
                if (item.view === 'dashboard') {
                  setActivePluginId(null)
                }
                setView(item.view)
              }}
            >
              <span
                className={`${sidebarIcon} ${isActive ? activeSidebarIcon : ''}`}
                aria-hidden="true"
              >
                <Icon size={17} />
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <section className="flex flex-col gap-[var(--dd-space-1)]" aria-label="Installed plugins">
        <div className="mt-[var(--dd-space-4)] flex items-center justify-between gap-[var(--dd-space-4)] px-[var(--dd-space-3)] text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--dd-text-secondary)]">
          <span>Installed</span>
          <small>{plugins.length}</small>
        </div>
        {plugins.map((plugin) => {
          const Icon = pluginIcons[plugin.id] ?? Package
          const isActive = plugin.id === activePluginId

          return (
            <button
              className={`${sidebarButton} ${isActive ? activeSidebarButton : ''}`}
              key={plugin.id}
              type="button"
              onClick={() => {
                setActivePluginId(plugin.id)
                setView('workspace')
              }}
            >
              <PluginIcon fallback={Icon} icon={plugin.icon} label={plugin.name} />
              <span>
                <strong className="block font-bold text-[var(--dd-text-primary)]">
                  {plugin.name}
                </strong>
              </span>
            </button>
          )
        })}
      </section>

      <section
        className="relative mt-auto grid gap-[var(--dd-space-1)] border-t border-[var(--dd-border)] px-[var(--dd-space-3)] pb-[var(--dd-space-2)] pt-[var(--dd-space-4)]"
        aria-label="Active plugin"
      >
        <span className="text-[0.8rem] text-[var(--dd-text-muted)]">Active Plugin</span>
        <strong className="text-[0.92rem] font-medium text-[var(--dd-text-primary)]">
          {activePlugin?.name ?? 'None'}
        </strong>
        <small
          className="absolute bottom-[var(--dd-space-3)] right-[var(--dd-space-3)] grid place-items-center text-[var(--dd-text-secondary)]"
          aria-hidden="true"
        >
          <ChevronRight size={16} />
        </small>
      </section>
    </aside>
  )
}
