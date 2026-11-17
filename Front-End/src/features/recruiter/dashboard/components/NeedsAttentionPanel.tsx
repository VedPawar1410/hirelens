import { useState } from 'react'
import type React from 'react'
import { Zap, ArrowRight, Clock, Sparkles, CalendarClock, UserCheck } from 'lucide-react'
import type { AttentionItem } from '../api/dashboardApi'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode
  accent: string
  bg: string
}> = {
  pending_review: {
    icon: <Clock size={14} />,
    accent: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
  },
  ai_matches: {
    icon: <Sparkles size={14} />,
    accent: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
  },
  upcoming_interviews: {
    icon: <CalendarClock size={14} />,
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
  },
  shortlisted_pending: {
    icon: <UserCheck size={14} />,
    accent: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
  },
}

const FALLBACK_CONFIG = {
  icon: <Zap size={14} />,
  accent: '#9ca3af',
  bg: 'rgba(156,163,175,0.1)',
}

interface Props {
  readonly items: AttentionItem[]
  readonly isLoading: boolean
  readonly onReview?: (item: AttentionItem) => void
}

function buildSubtitle(item: AttentionItem): string | undefined {
  if (!item.nextInterviewAt) return item.subtitle
  const time = new Date(item.nextInterviewAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return item.nextCandidateName ? `Next: ${time} · ${item.nextCandidateName}` : `Next: ${time}`
}

function AttentionRow({ item, onReview }: { readonly item: AttentionItem; readonly onReview?: (item: AttentionItem) => void }) {
  const [hovered, setHovered] = useState(false)
  const cfg = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG
  const subtitle = buildSubtitle(item)

  return (
    <div
      className={[
        'flex items-start gap-3 px-5 py-2.75 border-b border-[#37373f] last:border-b-0',
        'transition-colors duration-150',
        hovered ? 'bg-[rgba(255,255,255,0.02)]' : '',
      ].join(' ')}
    >
      {/* Icon badge */}
      <div
        className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 mt-px"
        style={{ background: cfg.bg, color: cfg.accent }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white leading-[1.3]">{item.title}</p>
        {subtitle && (
          <p className="text-[11px] text-[#6b7280] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {subtitle}
          </p>
        )}
      </div>

      {/* Review button */}
      <button
        className="shrink-0 flex items-center gap-0.75 bg-transparent border-none cursor-pointer font-semibold transition-all duration-150"
        style={{
          fontSize: 11,
          color: hovered ? cfg.accent : '#4b5563',
          marginTop: 2,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onReview?.(item)}
      >
        Review
        <ArrowRight size={11} />
      </button>
    </div>
  )
}

const SKELETON_KEYS = ['sk-0', 'sk-1', 'sk-2'] as const

export default function NeedsAttentionPanel({ items, isLoading, onReview }: Props) {
  const { isCompact: isMobile } = useBreakpoints()

  let panelContent: React.ReactNode
  if (isLoading) {
    panelContent = (
      <div className="flex flex-col gap-0">
        {SKELETON_KEYS.map(key => (
          <div key={key} className="flex items-start gap-3 px-5 py-2.75 border-b border-[#37373f] last:border-b-0">
            <div className="skeleton-shimmer w-8 h-8 rounded-[9px] shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="skeleton-shimmer rounded h-3 w-3/4" />
              <div className="skeleton-shimmer rounded h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  } else if (items.length === 0) {
    panelContent = (
      <div className="py-10 px-5 text-center">
        <p className="text-[#6b7280] text-[13px]">All clear — no actions needed</p>
      </div>
    )
  } else {
    panelContent = items.map(item => (
      <AttentionRow key={item.type} item={item} onReview={onReview} />
    ))
  }

  return (
    <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75 flex flex-col">
      <div className="bg-[#161719] rounded-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
        <div className={`flex items-center gap-2 border-b border-[#37373f] ${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'}`}>
          <Zap size={12} className="text-[#f59e0b] shrink-0" />
          <h3
            className="font-semibold text-[#6b7280] tracking-[0.07em] uppercase m-0"
            style={{ fontSize: 11 }}
          >
            Needs Your Attention
          </h3>
        </div>
        {panelContent}
      </div>
    </div>
  )
}
