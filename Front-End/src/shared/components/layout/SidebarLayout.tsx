import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { LogOut, Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBreakpoints } from '../../hooks/useBreakpoints'
import GlowOrb from '../ui/GlowOrb'
import logo from '../../../assets/logo.svg'

const SIDEBAR_ITEM_BASE_CLS = [
  'px-3 py-2.5 gap-2.5 justify-start',
  'md:px-0 md:gap-0 md:justify-center',
  'lg:px-3 lg:gap-2.5 lg:justify-start',
  'transition-[background,color] duration-200',
].join(' ')

export interface SidebarNavItem {
  readonly to: string
  readonly icon: LucideIcon
  readonly label: string
}

export interface SidebarAvatarAccent {
  readonly bg: string
  readonly border: string
  readonly text: string
}

interface Props {
  readonly navItems: readonly SidebarNavItem[]
  readonly portalLabel: string
  readonly avatarAccent: SidebarAvatarAccent
  readonly avatarFallback: string
}

export default function SidebarLayout({ navItems, portalLabel, avatarAccent, avatarFallback }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoints()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, sidebarOpen])

  function handleLogout() {
    logout()
    navigate({ to: '/login' })
  }

  function handleNavClick() {
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0c0c0c] relative">
      <GlowOrb />

      {/* Mobile top bar — hidden on tablet+ */}
      <div className="flex md:hidden h-12 bg-[#161719] border-b border-[#37373f] items-center px-4 gap-3 sticky top-0 z-20 shrink-0">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Toggle sidebar"
          className="text-[#9ca3af] bg-transparent border-none cursor-pointer flex items-center p-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-sm">HireLens</span>
      </div>

      {/* Body row: sidebar + main */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Mobile dim overlay */}
        {isMobile && sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-49"
            style={{ border: 'none', padding: 0, cursor: 'default' }}
          />
        )}

        {/* Sidebar
            Mobile  (<768)  : fixed overlay, w-60, slides in/out via translate
            Tablet  (768–1023): relative in flow, w-16, icons only
            Desktop (≥1024) : relative in flow, w-60, icons + labels          */}
        <aside
          className={[
            'bg-[#161719] border-r border-[#37373f] flex flex-col shrink-0',
            'w-60 md:w-16 lg:w-60',
            'transition-[transform,width] duration-[250ms,200ms] ease-in-out',
            'fixed left-0 top-0 h-screen z-50',
            'md:relative md:h-auto md:z-10 md:translate-x-0',
            isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
          ].join(' ')}
        >
          {/* Logo */}
          <div className="py-5 px-5 md:px-0 lg:px-5 border-b border-[#37373f] flex justify-start md:justify-center lg:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src={logo} alt="HireLens logo" className="w-full h-full object-contain" />
              </div>
              <p className="block md:hidden lg:block text-white font-semibold text-sm m-0">
                HireLens
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                title={label}
                onClick={handleNavClick}
                className={[
                  'flex items-center rounded-lg text-sm font-medium',
                  SIDEBAR_ITEM_BASE_CLS,
                  'text-[#9ca3af]',
                  'hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e5e7eb]',
                  'aria-[aria-current=page]:bg-[rgba(29,43,164,0.18)] aria-[aria-current=page]:text-white',
                  'aria-[aria-current=page]:shadow-[inset_3px_0_0_#6ea8fe,inset_0_0_16px_rgba(29,43,164,0.12)]',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="block md:hidden lg:block">{label}</span>
              </Link>
            ))}
          </nav>

          {/* User info + logout */}
          <div className="p-3 border-t border-[#37373f]">
            <div className="py-2 px-3 md:px-0 lg:px-3 mb-1 flex items-center gap-2.5 md:gap-0 lg:gap-2.5 justify-start md:justify-center lg:justify-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{
                  background: avatarAccent.bg,
                  border: `1px solid ${avatarAccent.border}`,
                  color: avatarAccent.text,
                }}
              >
                {(user?.name?.trim().charAt(0) || user?.username?.charAt(0) || avatarFallback).toUpperCase()}
              </div>
              <div className="block md:hidden lg:block min-w-0">
                <p className="text-[11px] text-[#6b7280] m-0">{portalLabel}</p>
                <p className="text-sm text-white font-medium m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {user?.name}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className={[
                'w-full flex items-center rounded-lg text-sm font-medium',
                SIDEBAR_ITEM_BASE_CLS,
                'text-[#9ca3af] bg-transparent border-none cursor-pointer',
                'hover:text-white hover:bg-[rgba(255,255,255,0.04)]',
              ].join(' ')}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="block md:hidden lg:block">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative z-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
