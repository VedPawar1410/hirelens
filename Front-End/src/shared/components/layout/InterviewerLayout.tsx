import { LayoutDashboard, FilePlus, Users } from 'lucide-react'
import SidebarLayout from './SidebarLayout'
import type { SidebarNavItem, SidebarAvatarAccent } from './SidebarLayout'

const NAV_ITEMS: readonly SidebarNavItem[] = [
  { to: '/interviewer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/interviewer/candidates', icon: Users, label: 'Candidates' },
  { to: '/interviewer/jd-creation', icon: FilePlus, label: 'JD Creation' },
]

const AVATAR_ACCENT: SidebarAvatarAccent = {
  bg: 'rgba(139,92,246,0.2)',
  border: 'rgba(139,92,246,0.35)',
  text: '#a78bfa',
}

export default function InterviewerLayout() {
  return (
    <SidebarLayout
      navItems={NAV_ITEMS}
      portalLabel="Interviewer"
      avatarAccent={AVATAR_ACCENT}
      avatarFallback="I"
    />
  )
}
