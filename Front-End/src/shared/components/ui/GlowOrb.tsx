import { useEffect, useRef } from 'react'

export default function GlowOrb() {
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const orb = orbRef.current
    if (!orb) return
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    function handleMouseMove(e: MouseEvent) {
      if (!orb) return
      orb.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`
    }

    globalThis.addEventListener('mousemove', handleMouseMove)
    return () => globalThis.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={orbRef}
      aria-hidden="true"
      className="fixed w-[520px] h-[520px] rounded-full pointer-events-none z-0 top-0 left-0 will-change-transform [background:radial-gradient(circle,rgba(29,43,164,0.42)_0%,rgba(29,43,164,0.10)_50%,transparent_70%)] [filter:blur(56px)] [transform:translate(calc(50vw-260px),calc(50vh-260px))]"
    />
  )
}
