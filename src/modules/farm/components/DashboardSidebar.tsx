import { Menu, Lock } from 'lucide-react'
import { gatedSections, navItems, type Section } from './dashboardNav'

type DashboardSidebarProps = {
  activeSection: Section
  onNavClick: (key: Section) => void
  open: boolean
  onToggle: () => void
  farmActive: boolean
}

// Collapsible left nav. Gated sections show a lock icon and are disabled until
// the farm is approved (active).
function DashboardSidebar({ activeSection, onNavClick, open, onToggle, farmActive }: DashboardSidebarProps) {
  return (
    <>
      {/* Backdrop — mobile only, dismisses the drawer on click. Never shown
          at lg, where the sidebar is a normal static column instead of an
          overlay. */}
      {open && (
        <div
          onClick={onToggle}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Below lg: a fixed, full-height drawer that slides in/out with
          `open` and overlays the page. At lg and up: back to the original
          plain flex column that pushes <main> over, with the icon-rail
          collapse behaviour unchanged.
          The outer <aside> being a plain (non-sticky) flex item at lg means
          the default align-items: stretch fills it to the full row height
          (matching <main>'s content) and its white background runs the
          whole column. Sticky lives on the inner wrapper instead — sticky
          positioning on a stretched flex item doesn't reliably stick in all
          browsers, so the nav itself needs a non-stretched box to pin
          correctly within the tall outer one. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 lg:z-auto lg:transition-[width] ${
          open ? 'lg:w-56' : 'lg:w-14'
        } bg-brand-surface border-r border-brand-border`}
      >
        <div className="h-full overflow-y-auto flex flex-col lg:sticky lg:top-16.25 lg:h-auto">
          <div className={`flex items-center ${open ? 'justify-between px-4' : 'justify-center'} py-4 border-b border-brand-border`}>
            {open && <p className="text-brand-muted text-xs font-bold uppercase">Dashboard</p>}
            <button
              onClick={onToggle}
              className="text-brand-muted hover:text-brand-gold transition"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-2 mt-2">
            {navItems.map(item => {
              const locked = gatedSections.includes(item.key) && !farmActive
              return (
                <button
                  key={item.key}
                  onClick={() => onNavClick(item.key)}
                  disabled={locked}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm transition ${
                    locked
                      ? 'text-brand-muted opacity-40 cursor-not-allowed'
                      : activeSection === item.key
                      ? 'bg-brand-gold text-brand-bg'
                      : 'text-brand-muted hover:text-brand-gold hover:bg-brand-bg'
                  } ${!open ? 'justify-center' : ''}`}
                  title={locked ? 'Your farm must be approved to unlock this' : (!open ? item.label : undefined)}
                >
                  {locked ? <Lock size={18} /> : item.icon}
                  {open && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default DashboardSidebar
