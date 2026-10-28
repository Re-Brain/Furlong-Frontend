import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { gatedSections, navItems, type Section } from './dashboardNav'

type Props = {
  activeSection: Section
  onNavClick: (key: Section) => void
  farmActive: boolean
}

// Mobile replacement for the drawer: a sticky, horizontally scrollable row of
// section pills so every section is one tap away. Hidden at lg, where the
// sidebar takes over.
function MobileSectionTabs({ activeSection, onNavClick, farmActive }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null)

  // Keep the current pill visible when the row is scrolled or the section changes.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeSection])

  return (
    <nav
      aria-label="Dashboard sections"
      className="lg:hidden sticky top-16.25 z-30 -mx-4 xs:-mx-6 sm:-mx-8 -mt-4 xs:-mt-6 sm:-mt-8 mb-5 bg-brand-bg/95 backdrop-blur border-b border-brand-border"
    >
      <div className="flex gap-2 overflow-x-auto px-4 xs:px-6 sm:px-8 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map(item => {
          const locked = gatedSections.includes(item.key) && !farmActive
          const active = activeSection === item.key
          return (
            <button
              key={item.key}
              ref={active ? activeRef : undefined}
              onClick={() => onNavClick(item.key)}
              disabled={locked}
              aria-current={active ? 'page' : undefined}
              title={locked ? 'Your farm must be approved to unlock this' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                active
                  ? 'bg-brand-gold text-brand-bg border-brand-gold'
                  : locked
                  ? 'border-brand-border text-brand-muted opacity-50 cursor-not-allowed'
                  : 'border-brand-border bg-brand-surface text-brand-muted hover:text-brand-gold hover:border-brand-gold'
              }`}
            >
              {locked ? <Lock size={16} /> : item.icon}
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileSectionTabs
