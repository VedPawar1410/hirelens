import { Phone, Video, MapPin } from 'lucide-react'

export function TypeIcon({ type, size, style }: Readonly<{ type: string; size?: number; style?: React.CSSProperties }>) {
  const t = type.toLowerCase()
  if (t.includes('phone')) return <Phone size={size} style={style} />
  if (t.includes('person') || t.includes('onsite')) return <MapPin size={size} style={style} />
  return <Video size={size} style={style} />
}
