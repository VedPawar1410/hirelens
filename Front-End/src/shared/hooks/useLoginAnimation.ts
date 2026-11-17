import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react'

// Drives the post-login logo animation: collapse card → fly logo to center →
// show greeting → fly logo to sidebar corner → navigate.
type AnimPhase = 'idle' | 'collapse' | 'fly-center' | 'greet' | 'fly-corner'

interface UseLoginAnimationReturn {
  animPhase: AnimPhase
  flyStyle: CSSProperties
  capturedUser: string
  isAnimating: boolean
  startAnimation: (logoEl: HTMLImageElement, username: string, onDone: () => void) => void
}

export function useLoginAnimation(): UseLoginAnimationReturn {
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties>({})
  const [capturedUser, setCapturedUser] = useState('')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [])

  const startAnimation = useCallback((logoEl: HTMLImageElement, username: string, onDone: () => void) => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    const rect = logoEl.getBoundingClientRect()
    setCapturedUser(username.toUpperCase())

    // Stamp clone exactly over the original logo — no transition yet so it snaps in place
    setFlyStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transition: 'none',
      zIndex: 100,
      objectFit: 'contain',
    })
    setAnimPhase('collapse')

    // 60ms = one paint cycle so the clone renders before the CSS transition starts
    timersRef.current.push(
      setTimeout(() => {
        setAnimPhase('fly-center')
        setFlyStyle({
          position: 'fixed',
          left: 'calc(50vw - 40px)',
          top: 'calc(50vh - 72px)',
          width: '80px',
          height: '80px',
          transition: [
            'left 525ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            'top 525ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            'width 450ms ease-out',
            'height 450ms ease-out',
          ].join(', '),
          zIndex: 100,
          objectFit: 'contain',
        })
      }, 60),
      // Show greeting once the fly-center transition is done (~525ms)
      setTimeout(() => setAnimPhase('greet'), 680),
      // Fly to the sidebar logo position (top-left corner)
      setTimeout(() => {
        setAnimPhase('fly-corner')
        setFlyStyle({
          position: 'fixed',
          left: '16px',
          top: '14px',
          width: '32px',
          height: '32px',
          transition: [
            'left 490ms cubic-bezier(0.4, 0, 0.2, 1)',
            'top 490ms cubic-bezier(0.4, 0, 0.2, 1)',
            'width 375ms ease-in',
            'height 375ms ease-in',
          ].join(', '),
          zIndex: 100,
          objectFit: 'contain',
        })
      }, 1720),
      // Navigate after logo lands in the corner (1720ms start + 490ms transition = ~2240ms)
      setTimeout(onDone, 2240),
    )
  }, [])

  return {
    animPhase,
    flyStyle,
    capturedUser,
    isAnimating: animPhase !== 'idle',
    startAnimation,
  }
}
