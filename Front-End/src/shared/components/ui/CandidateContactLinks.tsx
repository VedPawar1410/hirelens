import { Mail, Phone, ExternalLink, GitBranch } from 'lucide-react'
import { toSafeHttpUrl } from '../../lib/urlUtils'

const LINK_STYLE = { textDecoration: 'none', color: '#9ca3af', transition: 'color 100ms' }
const stripProtocol = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')

interface Props {
  readonly email?: string | null
  readonly phone?: string | null
  readonly linkedIn?: string | null
  readonly gitHub?: string | null
}

export function CandidateContactLinks({ email, phone, linkedIn, gitHub }: Props) {
  const safeLinkedIn = toSafeHttpUrl(linkedIn)
  const safeGitHub = toSafeHttpUrl(gitHub)
  if (!email && !phone && !safeLinkedIn && !safeGitHub) return null
  return (
    <div className="mt-3 pt-3 border-t border-[#2a2b2e] flex flex-wrap gap-x-5 gap-y-1">
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 py-0.75"
          style={LINK_STYLE}
          onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af' }}
        >
          <Mail size={13} className="text-[#6b7280] shrink-0" />
          <span className="text-[13px]">{email}</span>
        </a>
      )}
      {phone && (
        <div className="flex items-center gap-2 py-0.75">
          <Phone size={13} className="text-[#6b7280] shrink-0" />
          <span className="text-[13px] text-[#9ca3af]">{phone}</span>
        </div>
      )}
      {safeLinkedIn && (
        <a
          href={safeLinkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-0.75"
          style={LINK_STYLE}
          onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af' }}
        >
          <ExternalLink size={13} className="text-[#6b7280] shrink-0" />
          <span className="text-[13px]">{stripProtocol(safeLinkedIn)}</span>
        </a>
      )}
      {safeGitHub && (
        <a
          href={safeGitHub}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-0.75"
          style={LINK_STYLE}
          onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af' }}
        >
          <GitBranch size={13} className="text-[#6b7280] shrink-0" />
          <span className="text-[13px]">{stripProtocol(safeGitHub)}</span>
        </a>
      )}
    </div>
  )
}
