import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, ChevronDown } from 'lucide-react'
import { SectionLabel } from '../../../../shared/components/ui/SectionLabel'
import { getInterviewers, INTERVIEWERS_QUERY_KEY } from '../../../../shared/api/authApi'

interface Props {
  readonly assignedTo: string[]
  readonly onChange: (assigned: string[]) => void
}

export function AssignInterviewerPanel({ assignedTo, onChange }: Props) {
  const [open, setOpen] = useState(false)
  // Pending selection lives here until "Confirm" — so closing without confirming discards changes
  const [pending, setPending] = useState<string[]>([])

  const { data: interviewers = [] } = useQuery({
    queryKey: INTERVIEWERS_QUERY_KEY,
    queryFn: getInterviewers,
    staleTime: 5 * 60_000,
  })

  function openDropdown() {
    setPending(assignedTo)
    setOpen(true)
  }

  function confirm() {
    onChange(pending)
    setOpen(false)
  }

  function toggle(username: string) {
    setPending((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    )
  }

  const hasAssignment = assignedTo.length > 0

  return (
    <>
      <div className="h-px bg-[#37373f] my-6" />
      <SectionLabel icon={Users} text="Assignment" />

      <div className="bg-[#1a1d20] border border-[#37373f] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[#e5e7eb] text-[13px] font-semibold mb-1">
              Assign to Interviewer
            </p>
            <p className="text-[#9ca3af] text-xs m-0">
              Optionally delegate role description to an interviewer.
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={openDropdown}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-[13px] font-semibold border cursor-pointer transition-colors duration-150 ${
                hasAssignment
                  ? 'text-[#6ea8fe] border-[rgba(29,43,164,0.5)] bg-[rgba(29,43,164,0.12)] hover:bg-[rgba(29,43,164,0.2)]'
                  : 'text-[#9ca3af] border-[#37373f] bg-transparent hover:bg-[#161719]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {hasAssignment ? `${assignedTo.length} Assigned` : 'Select Interviewers'}
              <ChevronDown className="w-3.25 h-3.25 opacity-60" />
            </button>

            {open && (
              <div className="absolute top-[calc(100%+8px)] right-0 z-50 bg-[#161719] border border-[#37373f] rounded-xl p-2 min-w-55 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9ca3af] px-2 pt-1 pb-2 m-0">
                  Select interviewers
                </p>

                <div className="mb-2">
                  {interviewers.map((iv) => (
                    <label
                      key={iv.id}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[#e5e7eb] text-[13px] hover:bg-[#1a1d20] transition-colors duration-150"
                    >
                      <input
                        type="checkbox"
                        checked={pending.includes(iv.username)}
                        onChange={() => toggle(iv.username)}
                        className="w-3.5 h-3.5"
                        style={{ accentColor: '#1d2ba4' }}
                      />
                      <span>{iv.fullName}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2 px-1 pt-2 pb-1 border-t border-[#37373f]">
                  <button
                    onClick={confirm}
                    className="flex-1 py-1.75 px-3 rounded-[7px] text-[13px] font-semibold text-white bg-[#1d2ba4] border-none cursor-pointer hover:bg-[#12219e] transition-colors duration-150"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="py-1.75 px-3 rounded-[7px] text-[13px] text-[#9ca3af] border border-[#37373f] bg-transparent cursor-pointer hover:bg-[#1a1d20] transition-colors duration-150"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasAssignment && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {assignedTo.map((u) => (
              <span
                key={u}
                className="bg-[rgba(29,43,164,0.2)] text-[#93c5fd] border border-[rgba(29,43,164,0.4)] rounded-full py-0.75 px-3 text-xs font-medium"
              >
                {u}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
