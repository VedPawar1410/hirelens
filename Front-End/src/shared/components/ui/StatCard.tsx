import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type React from 'react'

type StatCardValue = number | string | null

export interface StatCardProps {
  readonly icon: React.ReactNode
  readonly iconBg: string
  readonly value: StatCardValue
  readonly label: string
  readonly accent?: string
  readonly onClick?: () => void
  readonly animDelay?: number
  readonly compact?: boolean
}

function getContainerStyle(hovered: boolean, onClick: (() => void) | undefined, accent: string) {
  if (hovered && onClick) {
    return {
      boxShadow: `0 0 0 1px ${accent}, 0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3)`,
      transform: 'translateY(-2px)',
    }
  }
  return { boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transform: 'translateY(0)' }
}

interface ContentProps {
  readonly icon: React.ReactNode
  readonly iconBg: string
  readonly value: StatCardValue
  readonly label: string
  readonly isMobile: boolean
  readonly hovered: boolean
  readonly onClick: (() => void) | undefined
}

function renderValue(value: StatCardValue, isMobile: boolean): React.ReactNode {
  if (value === null) {
    return (
      <div
        className="skeleton-shimmer rounded-md mb-1.5"
        style={{ width: isMobile ? 36 : 52, height: isMobile ? 20 : 30 }}
      />
    )
  }
  return (
    <p
      className={[
        'font-bold text-white leading-none mb-1 [font-variant-numeric:tabular-nums]',
        isMobile ? 'text-[20px]' : 'text-[24px]',
      ].join(' ')}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
  )
}

function StatCardContent({ icon, iconBg, value, label, isMobile, hovered, onClick }: ContentProps) {
  return (
    <div
      className={[
        'rounded-2xl flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]',
        'transition-[background] duration-200 ease-in-out',
        isMobile ? 'py-2.5 px-3 gap-1.5' : 'py-4 px-5 gap-2.5',
        hovered && onClick ? 'bg-[#1a1b1f]' : 'bg-[#161719]',
      ].join(' ')}
    >
      <div className="flex justify-between items-start">
        <div
          className={[
            'flex items-center justify-center',
            isMobile ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-[10px]',
          ].join(' ')}
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        {onClick && !isMobile && (
          <ArrowUpRight
            size={16}
            style={{
              color: hovered ? '#9ca3af' : '#4b5563',
              transform: hovered ? 'translate(2px, -2px)' : 'translate(0, 0)',
              transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        )}
      </div>

      <div>
        {renderValue(value, isMobile)}
        <p className={`text-[#9ca3af] ${isMobile ? 'text-[10px]' : 'text-[13px]'}`}>{label}</p>
      </div>
    </div>
  )
}

export function StatCard({
  icon,
  iconBg,
  value,
  label,
  accent = 'rgba(29,43,164,0.4)',
  onClick,
  animDelay = 0,
  compact = false,
}: StatCardProps) {
  const [hovered, setHovered] = useState(false)
  const isMobile = compact

  const sharedStyle = {
    animation: `fade-up 0.5s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}ms both`,
    ...getContainerStyle(hovered, onClick, accent),
  }
  const sharedClass = [
    'bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-[3px]',
    'transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
  ].join(' ')
  const content = <StatCardContent icon={icon} iconBg={iconBg} value={value} label={label} isMobile={isMobile} hovered={hovered} onClick={onClick} />

  if (onClick) {
    return (
      <button
        type="button"
        style={sharedStyle}
        className={`${sharedClass} cursor-pointer w-full text-left`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <div style={sharedStyle} className={`${sharedClass} cursor-default`}>
      {content}
    </div>
  )
}
