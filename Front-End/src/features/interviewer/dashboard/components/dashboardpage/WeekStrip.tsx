import type { getWeekDays } from '../../utils/dateUtils'

const DAY_ABBRS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type WeekDay = ReturnType<typeof getWeekDays>[number]

interface WeekStripProps {
  readonly weekDays: ReturnType<typeof getWeekDays>
  readonly activeDayStr: string
  readonly setSelectedDay: (d: Date | null) => void
  readonly isMobile: boolean
}

interface DayCellProps {
  readonly day: WeekDay
  readonly isSelected: boolean
  readonly isMobile: boolean
  readonly onSelect: () => void
}

function getDayBackground(isSelected: boolean, isToday: boolean): string {
  if (!isSelected) return 'transparent'
  return isToday ? 'rgba(124,109,250,0.12)' : 'rgba(110,168,254,0.1)'
}

function getDayBorder(isSelected: boolean, isToday: boolean): string {
  if (!isSelected) return '1px solid transparent'
  return isToday ? '1px solid rgba(124,109,250,0.28)' : '1px solid rgba(110,168,254,0.28)'
}

function getDayAbbreviationColor(isSelected: boolean, isToday: boolean, isPast: boolean): string {
  if (isSelected) return isToday ? '#a78bfa' : '#6ea8fe'
  return isPast ? '#374151' : '#6b7280'
}

function getDayNumberColor(isSelected: boolean, isPast: boolean): string {
  if (isSelected) return '#ffffff'
  return isPast ? '#374151' : '#9ca3af'
}

function getCountBadgeBackground(hasLive: boolean, isToday: boolean): string {
  if (hasLive) return 'rgba(72,187,120,0.2)'
  return isToday ? 'rgba(124,109,250,0.3)' : 'rgba(255,255,255,0.08)'
}

function getCountBadgeColor(hasLive: boolean, isToday: boolean): string {
  if (hasLive) return '#48BB78'
  return isToday ? '#c4b5fd' : '#6b7280'
}

function DayCell({ day, isSelected, isMobile, onSelect }: DayCellProps) {
  const isToday = day.isToday
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-1 ${isMobile ? 'py-1.75' : 'py-2.5 gap-1.25'} rounded-[10px] cursor-pointer transition-all duration-150 w-full`}
      style={{
        background: getDayBackground(isSelected, isToday),
        border: getDayBorder(isSelected, isToday),
      }}
    >
      <span
        className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-medium`}
        style={{ color: getDayAbbreviationColor(isSelected, isToday, day.isPast) }}
      >
        {DAY_ABBRS[day.date.getDay()]}
      </span>
      <span
        className={`${isMobile ? 'text-[12px]' : 'text-[14px]'} font-bold leading-none`}
        style={{ color: getDayNumberColor(isSelected, day.isPast) }}
      >
        {day.date.getDate()}
      </span>
      {day.count > 0 ? (
        <span
          className="text-[10px] font-bold px-1.25 py-px rounded-full min-w-4.5 text-center leading-none"
          style={{
            background: getCountBadgeBackground(day.hasLive, isToday),
            color: getCountBadgeColor(day.hasLive, isToday),
          }}
        >
          {day.count}
        </span>
      ) : (
        <span
          className="w-1.25 h-1.25 rounded-full"
          style={{ background: day.isPast ? 'transparent' : 'rgba(255,255,255,0.06)' }}
        />
      )}
    </button>
  )
}

export function WeekStrip({ weekDays, activeDayStr, setSelectedDay, isMobile }: WeekStripProps) {
  return (
    <div
      className="shrink-0 mb-5"
      style={{ animation: 'fade-up 0.45s cubic-bezier(0.34,1.56,0.64,1) 120ms both' }}
    >
      <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75">
        <div className={`bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ${isMobile ? 'px-3 py-3' : 'px-5 py-4'}`}>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6b7280] m-0 mb-3">
            This Week
          </p>
          <div className={`grid grid-cols-7 ${isMobile ? 'gap-0.75' : 'gap-1.5'}`}>
            {weekDays.map(day => (
              <DayCell
                key={day.date.toDateString()}
                day={day}
                isSelected={day.date.toDateString() === activeDayStr}
                isMobile={isMobile}
                onSelect={() => setSelectedDay(day.isToday ? null : new Date(day.date))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
