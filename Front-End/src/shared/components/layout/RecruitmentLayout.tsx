import { LayoutDashboard, FilePlus, Briefcase, Users } from 'lucide-react'
import SidebarLayout from './SidebarLayout'
import type { SidebarNavItem, SidebarAvatarAccent } from './SidebarLayout'

const NAV_ITEMS: readonly SidebarNavItem[] = [
  { to: '/recruitment/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recruitment/jobs', icon: Briefcase, label: 'Job Folders' },
  { to: '/recruitment/candidates', icon: Users, label: 'Candidates' },
  { to: '/recruitment/jd-creation', icon: FilePlus, label: 'JD Creation' },
]

const AVATAR_ACCENT: SidebarAvatarAccent = {
  bg: 'rgba(29,43,164,0.25)',
  border: 'rgba(29,43,164,0.4)',
  text: '#6ea8fe',
}

export default function RecruitmentLayout() {
  return (
    <SidebarLayout
      navItems={NAV_ITEMS}
      portalLabel="Recruitment"
      avatarAccent={AVATAR_ACCENT}
      avatarFallback="R"
    />
  )
}
