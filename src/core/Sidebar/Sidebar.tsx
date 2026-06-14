import {
  Home,
  LogOut,
  MessageSquare,
  Package,
  Puzzle,
  Settings,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { userAvatarUrl, userDisplayName, type AuthUser } from '../../auth/supabase'
import type { PluginMeta, View } from '../../store/appStore'

type SidebarProps = {
  activePluginId: string | null
  currentUser: AuthUser | null
  onSignOut: () => void
  plugins: PluginMeta[]
  setActivePluginId: (id: string | null) => void
  setView: (view: View) => void
  view: View
}

const navItems: Array<{ icon: LucideIcon; label: string; view: View; clearsPlugin?: boolean }> = [
  { icon: Home, label: 'Dashboard', view: 'dashboard' },
  { icon: MessageSquare, label: 'AI Chat', view: 'ai' },
  { icon: Settings, label: 'Settings', view: 'settings' },
  { icon: Puzzle, label: 'Plugins', view: 'workspace', clearsPlugin: true },
  { icon: Store, label: 'Marketplace', view: 'store', clearsPlugin: true },
]

const sidebarButton =
  'relative flex min-h-9 w-full items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-left text-[var(--dd-text-primary)] transition-[background,color] duration-150 hover:bg-[rgba(255,255,255,0.035)]'
const activeSidebarButton =
  'bg-[#0b0b0b] shadow-[inset_2px_0_0_var(--dd-accent)]'
const sidebarIcon =
  'grid w-[17px] place-items-center text-[var(--dd-text-primary)] transition-colors duration-150'
const activeSidebarIcon = 'text-[var(--dd-accent)]'

export function Sidebar({
  currentUser,
  onSignOut,
  setActivePluginId,
  setView,
  view,
}: SidebarProps) {
  const avatarUrl = userAvatarUrl(currentUser)
  const displayName = userDisplayName(currentUser)

  return (
    <aside
      className="flex min-h-0 flex-col overflow-y-auto border-r border-[rgba(148,163,184,0.12)] bg-black px-[var(--dd-space-3)] pb-[var(--dd-space-4)] pt-[var(--dd-space-4)] max-[900px]:max-h-72 max-[900px]:border-b max-[900px]:border-r-0"
      aria-label="DawnDesk navigation"
    >
      <div className="flex min-h-10 items-center gap-[var(--dd-space-2)] border-b border-[rgba(148,163,184,0.08)] pb-[var(--dd-space-3)]">
        <img alt="" src="/logo.png" className="h-7 w-auto" />
        <div className="min-w-0">
          <strong className="block truncate font-[var(--dd-font-display)] text-[1rem] leading-none text-[var(--dd-text-primary)]">
            DawnDesk
          </strong>
        </div>
      </div>

      <nav className="mt-[var(--dd-space-4)] flex flex-col gap-[var(--dd-space-2)]" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.view === 'workspace' ? view === 'workspace' : view === item.view

          return (
            <button
              className={`${sidebarButton} ${isActive ? activeSidebarButton : ''}`}
              key={item.view}
              type="button"
              onClick={() => {
                if (item.view === 'dashboard' || item.clearsPlugin) {
                  setActivePluginId(null)
                }
                setView(item.view)
              }}
            >
              <span
                className={`${sidebarIcon} ${isActive ? activeSidebarIcon : ''}`}
                aria-hidden="true"
              >
                <Icon size={15} />
              </span>
              <span className="text-[0.82rem] font-semibold">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <footer className="mt-auto grid gap-[var(--dd-space-2)]">
        <section
          className="relative grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)] items-center gap-[var(--dd-space-2)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.02)] px-[var(--dd-space-3)] py-[var(--dd-space-2)]"
          aria-label="Account"
        >
          <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-[#111111] text-[var(--dd-text-primary)]">
            {avatarUrl ? (
              <img alt="" className="size-full object-cover" src={avatarUrl} />
            ) : (
              <Package size={16} aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-[0.86rem] font-bold text-[var(--dd-text-primary)]">
              {displayName}
            </strong>
          </span>
        </section>

        <button
          className="flex min-h-10 w-full items-center gap-[var(--dd-space-3)] rounded-[var(--dd-radius-md)] border border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.02)] px-[var(--dd-space-3)] py-[var(--dd-space-2)] text-left text-[0.84rem] font-semibold text-[var(--dd-text-secondary)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--dd-danger)]"
          type="button"
          onClick={onSignOut}
        >
          <LogOut size={16} aria-hidden="true" />
          Logout
        </button>
      </footer>
    </aside>
  )
}
