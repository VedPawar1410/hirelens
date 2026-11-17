import { roundDisplayName } from '../../../dashboard/utils/interviewUtils'
import { AVATAR_COLORS } from '../../types'
import { formatRelativeDate, getRoundDotColor } from '../../utils'
import type { GroupKey } from '../../types'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'

export function RoundDots({ interviewRound, groupKey }: Readonly<{ interviewRound: number; groupKey: GroupKey }>) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 2,
            background: getRoundDotColor(i + 1, interviewRound, groupKey),
          }}
        />
      ))}
    </div>
  )
}

export function MatchScore({ score }: Readonly<{ score: number | null }>) {
  if (score === null) return <span style={{ color: '#4b5563', fontSize: 13 }}>—</span>
  let color = '#f87171'
  if (score >= 80) color = '#4ade80'
  else if (score >= 65) color = '#F6AD55'

  let filled = 1
  if (score >= 80) filled = 4
  else if (score >= 65) filled = 3
  else if (score >= 50) filled = 2
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.75">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 5, height: 5, borderRadius: 1.5,
              background: i < filled ? color : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
        {score}%
      </span>
    </div>
  )
}

export function CandidateAvatar({ name, groupKey, size = 36 }: Readonly<{ name: string; groupKey: GroupKey; size?: number }>) {
  const { color, bg, border } = AVATAR_COLORS[groupKey]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, border: `1.5px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color,
    }}>
      {(name || 'C').charAt(0).toUpperCase()}
    </div>
  )
}

export function ActionButton({ groupKey, onClick }: Readonly<{ groupKey: GroupKey; onClick: () => void }>) {
  if (groupKey === 'feedback') {
    return (
      <button
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(246,173,85,0.22)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(246,173,85,0.1)' }}
        onClick={e => { e.stopPropagation(); onClick() }}
        className="shrink-0 text-xs font-semibold px-3 py-1.25 rounded-[7px] cursor-pointer"
        style={{
          background: 'rgba(246,173,85,0.1)',
          border: '1px solid rgba(246,173,85,0.35)',
          color: '#F6AD55',
          transition: 'background 150ms',
        }}
      >
        Give feedback
      </button>
    )
  }
  if (groupKey === 'upcoming') {
    return (
      <button
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        onClick={e => { e.stopPropagation(); onClick() }}
        className="shrink-0 text-xs font-semibold px-3 py-1.25 rounded-[7px] cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#e5e7eb',
          transition: 'background 150ms',
        }}
      >
        Prep
      </button>
    )
  }
  return (
    <button
      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.color = '#9ca3af' }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.color = '#6b7280' }}
      onClick={e => { e.stopPropagation(); onClick() }}
      className="shrink-0 text-xs font-medium px-3 py-1.25 rounded-[7px] cursor-pointer"
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#6b7280',
        transition: 'color 150ms, border-color 150ms',
      }}
    >
      View
    </button>
  )
}

// ── Mobile card ───────────────────────────────────────────────────────────────
export function MobileCandidateCard({
  interview, groupKey, isLast, onSelect,
}: Readonly<{
  interview: InterviewWithDetails
  groupKey: GroupKey
  isLast: boolean
  onSelect: (iv: InterviewWithDetails) => void
}>) {
  let nextLabel: string | null = null
  if (groupKey === 'feedback') nextLabel = 'Feedback owed'
  else if (groupKey === 'upcoming') nextLabel = formatRelativeDate(interview.scheduledAt)
  const nextColor = groupKey === 'feedback' ? '#F6AD55' : '#a78bfa'

  const ms = interview.candidateMatchScore
  let scoreColor = '#f87171'
  if (ms !== null && ms >= 80) scoreColor = '#4ade80'
  else if (ms !== null && ms >= 65) scoreColor = '#F6AD55'

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.25 relative"
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        background: 'transparent',
        transition: 'background 150ms',
      }}
    >
      <button
        type="button"
        aria-label={`View details for ${interview.candidateName ?? 'candidate'}`}
        className="absolute inset-0 cursor-pointer"
        style={{ background: 'transparent', border: 'none' }}
        onClick={() => onSelect(interview)}
        onMouseEnter={e => { (e.currentTarget.parentElement as HTMLElement).style.background = 'rgba(255,255,255,0.022)' }}
        onMouseLeave={e => { (e.currentTarget.parentElement as HTMLElement).style.background = 'transparent' }}
      />
      <CandidateAvatar name={interview.candidateName ?? 'C'} groupKey={groupKey} size={38} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-white m-0 truncate">
            {interview.candidateName ?? 'Candidate'}
          </p>
          {ms !== null && (
            <span className="text-[11px] font-semibold shrink-0" style={{ color: scoreColor }}>
              {interview.candidateMatchScore}%
            </span>
          )}
        </div>
        <p className="text-[11px] m-0 truncate" style={{ color: '#6b7280' }}>
          {interview.jobTitle ?? '—'}
          {interview.candidateRole ? ` · ${interview.candidateRole}` : ''}
        </p>
        {nextLabel !== null && (
          <p className="text-[11px] m-0 mt-0.5 font-medium" style={{ color: nextColor }}>
            {nextLabel} · {roundDisplayName(interview)}
          </p>
        )}
      </div>
      <div className="relative z-1">
        <ActionButton groupKey={groupKey} onClick={() => onSelect(interview)} />
      </div>
    </div>
  )
}

// ── Desktop table row ─────────────────────────────────────────────────────────
export function CandidateRow({
  interview, groupKey, isLast, onSelect, isTablet,
}: Readonly<{
  interview: InterviewWithDetails
  groupKey: GroupKey
  isLast: boolean
  onSelect: (iv: InterviewWithDetails) => void
  isTablet: boolean
}>) {
  let nextLabel: string | null = null
  if (groupKey === 'feedback') nextLabel = 'Feedback owed'
  else if (groupKey === 'upcoming') nextLabel = formatRelativeDate(interview.scheduledAt)

  const cols = isTablet
    ? '2fr 110px 1.3fr'           // Candidate | Match | Next/action
    : '2fr 1.4fr 100px 90px 1.3fr' // full 5-col

  return (
    <div
      className="grid items-center px-5 py-3.25 relative"
      style={{
        gridTemplateColumns: cols,
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        background: 'transparent',
        transition: 'background 150ms',
      }}
    >
      <button
        type="button"
        aria-label={`View details for ${interview.candidateName ?? 'candidate'}`}
        className="absolute inset-0 cursor-pointer"
        style={{ background: 'transparent', border: 'none' }}
        onClick={() => onSelect(interview)}
        onMouseEnter={e => { (e.currentTarget.parentElement as HTMLElement).style.background = 'rgba(255,255,255,0.022)' }}
        onMouseLeave={e => { (e.currentTarget.parentElement as HTMLElement).style.background = 'transparent' }}
      />

      {/* Candidate */}
      <div className="flex items-center gap-3 min-w-0 pr-3">
        <CandidateAvatar name={interview.candidateName ?? 'C'} groupKey={groupKey} />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-white m-0 truncate leading-snug">
            {interview.candidateName ?? 'Candidate'}
          </p>
          <p className="text-[11px] m-0 mt-px truncate" style={{ color: '#6b7280' }}>
            {interview.candidateRole ?? ''}
          </p>
        </div>
      </div>

      {/* Applied for — desktop only */}
      {!isTablet && (
        <div className="min-w-0 pr-3">
          <p className="text-[13px] text-white m-0 truncate">{interview.jobTitle ?? '—'}</p>
        </div>
      )}

      {/* Match */}
      <MatchScore score={interview.candidateMatchScore} />

      {/* Rounds — desktop only */}
      {!isTablet && (
        <RoundDots interviewRound={interview.interviewRound} groupKey={groupKey} />
      )}

      {/* Next / Action — z-[1] keeps ActionButton above the stretched button */}
      <div className="flex items-center justify-between gap-3 min-w-0 relative z-1">
        <div className="min-w-0">
          {nextLabel ? (
            <>
              <p
                className="text-[12px] font-medium m-0 truncate"
                style={{ color: groupKey === 'feedback' ? '#F6AD55' : '#a78bfa' }}
              >
                {nextLabel}
              </p>
              <p className="text-[11px] m-0 mt-px" style={{ color: '#6b7280' }}>
                {roundDisplayName(interview)}
              </p>
            </>
          ) : (
            <span style={{ color: '#374151', fontSize: 13 }}>—</span>
          )}
        </div>
        <ActionButton groupKey={groupKey} onClick={() => onSelect(interview)} />
      </div>
    </div>
  )
}

// ── Group container ───────────────────────────────────────────────────────────
export function CandidateGroup({
  label, color, items, groupKey, onSelect, isMobile, isTablet,
}: Readonly<{
  label: string
  color: string
  items: InterviewWithDetails[]
  groupKey: GroupKey
  onSelect: (iv: InterviewWithDetails) => void
  isMobile: boolean
  isTablet: boolean
}>) {
  return (
    <div>
      <div
        className="flex items-center gap-2 px-5 py-2.25"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.012)' }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color }}>
          {label}
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-[1.5px] rounded-full"
          style={{ background: color + '22', color }}
        >
          {items.length}
        </span>
      </div>
      {items.map((iv, idx) =>
        isMobile ? (
          <MobileCandidateCard
            key={iv.interviewId}
            interview={iv}
            groupKey={groupKey}
            isLast={idx === items.length - 1}
            onSelect={onSelect}
          />
        ) : (
          <CandidateRow
            key={iv.interviewId}
            interview={iv}
            groupKey={groupKey}
            isLast={idx === items.length - 1}
            onSelect={onSelect}
            isTablet={isTablet}
          />
        )
      )}
    </div>
  )
}
