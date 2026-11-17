import { Avatar } from '../../../../../shared/components/ui/Avatar'
import type { TopCandidate } from '../../../../../shared/types/index'

export function AvatarStack({ candidates }: { readonly candidates: TopCandidate[] }) {
  const visible = candidates.slice(0, 4)
  if (visible.length === 0) return <span style={{ color: '#4b5563', fontSize: 13 }}>—</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((c, i) => (
        <div
          key={c.name + i}
          style={{
            borderRadius: '50%',
            border: '2px solid #161719',
            marginLeft: i === 0 ? 0 : -8,
            zIndex: 4 - i,
            position: 'relative',
            lineHeight: 0,
          }}
        >
          <Avatar name={c.name} avatarUrl={c.avatarUrl} size={28} />
        </div>
      ))}
    </div>
  )
}
