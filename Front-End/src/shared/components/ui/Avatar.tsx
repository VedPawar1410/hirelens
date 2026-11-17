import { useState } from 'react'

const PALETTE = ['#1d2ba4', '#7c3aed', '#0f766e', '#b45309', '#9f1239']

interface AvatarProps {
  readonly name: string | null | undefined
  readonly avatarUrl: string | null
  readonly size?: number
}

export function Avatar({ name, avatarUrl, size = 36 }: AvatarProps) {
  const [imgReady, setImgReady] = useState(false)

  const safeName = name ?? ''
  const initials = safeName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
  const color = PALETTE[(safeName.codePointAt(0) ?? 0) % PALETTE.length]

  return (
    <div className="relative shrink-0 rounded-full" style={{ width: size, height: size }}>
      <div
        role="img"
        aria-label={safeName}
        className="absolute inset-0 rounded-full flex items-center justify-center text-white font-bold"
        style={{ background: color, fontSize: Math.round(size * 0.33) }}
      >
        {initials}
      </div>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={safeName}
          className="absolute inset-0 rounded-full object-cover w-full h-full"
          style={{ opacity: imgReady ? 1 : 0 }}
          onLoad={() => setImgReady(true)}
          onError={() => {}}
        />
      )}
    </div>
  )
}
