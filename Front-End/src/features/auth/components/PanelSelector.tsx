import { Briefcase, UserCheck } from 'lucide-react'
import type { UserRole } from '../../../shared/types'

interface Props {
  // null = initial screen (show divider between options, no active state)
  readonly selected: UserRole | null
  readonly onSelect: (role: UserRole) => void
}

const PANELS = [
  { role: 'recruitment' as UserRole, Icon: Briefcase, label: 'Recruitment Panel' },
  { role: 'interviewer' as UserRole, Icon: UserCheck, label: 'Interviewer Panel' },
]

export function PanelSelector({ selected, onSelect }: Props) {
  const isInitialScreen = selected === null

  return (
    <div className={`flex p-1 rounded-xl bg-[#1a1d20] ${isInitialScreen ? 'gap-0' : 'gap-2'} min-w-0`}>
      {PANELS.map(({ role, Icon, label }, idx) => {
        const isActive = selected === role
        return (
          <div key={role} className="contents">
            {/* Vertical divider only shown before a button has been selected */}
            {idx > 0 && isInitialScreen && (
              <div className="w-px my-1.5 bg-[#37373f]" />
            )}
            <button
              type="button"
              onClick={() => onSelect(role)}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium',
                'transition-[background,color] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                isActive
                  ? '[background:linear-gradient(135deg,#1d2ba4_0%,#2538b8_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_16px_rgba(29,43,164,0.35)]'
                  : 'text-[#9ca3af] hover:bg-[rgba(29,43,164,0.2)] hover:text-[#e5e7eb]',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          </div>
        )
      })}
    </div>
  )
}
