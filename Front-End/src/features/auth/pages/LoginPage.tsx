import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../../shared/hooks/useAuth'
import { useToast } from '../../../shared/hooks/useToast'
import { useLoginAnimation } from '../../../shared/hooks/useLoginAnimation'
import { PanelSelector } from '../components/PanelSelector'
import { LoginForm } from '../components/LoginForm'
import GlowOrb from '../../../shared/components/ui/GlowOrb'
import logo from '../../../assets/logo.svg'
import { ApiError } from '../../../shared/types/api'
import { getGreeting } from '../../../shared/lib/dateUtils'
import type { UserRole } from '../../../shared/types'

export default function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const logoRef = useRef<HTMLImageElement>(null)

  const [role, setRole] = useState<UserRole | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { animPhase, flyStyle, capturedUser, isAnimating, startAnimation } = useLoginAnimation()

  function handleSelectRole(r: UserRole) {
    setRole(r)
    setError('')
  }

  async function handleSubmit(username: string, password: string) {
    setError('')
    if (!role) { setError('Please select a panel first.'); return }
    setLoading(true)
    try {
      await login(username, password, role)
    } catch (err) {
      setLoading(false)
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid credentials. Please check your username and password.')
      } else {
        showToast('Something went wrong, please try again.', 'error')
      }
      return
    }
    setLoading(false)

    const dest = role === 'recruitment' ? '/recruitment/dashboard' : '/interviewer/dashboard'
    if (logoRef.current) startAnimation(logoRef.current, username, () => {
      navigate({ to: dest })
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 [background:linear-gradient(135deg,#0c0c0c_0%,#0e0f12_50%,#0c0c0c_100%)]">
      {/* Native button backdrop — sits behind the card; dismisses panel selection on click or Escape */}
      {role && !isAnimating && (
        <button
          type="button"
          aria-label="Return to panel selection"
          className="fixed inset-0 z-0 cursor-default"
          onClick={() => { setRole(null); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setRole(null); setError('') } }}
        />
      )}
      <GlowOrb />

      {/* Flying logo clone — animated independently from the static header logo */}
      {isAnimating && (
        <img src={logo} alt="" aria-hidden="true" style={flyStyle} />
      )}

      {/* Greeting shown at screen center after the logo lands there */}
      {(animPhase === 'greet' || animPhase === 'fly-corner') && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 z-99 pointer-events-none"
          style={{
            top: 'calc(50vh + 18px)',
            animation: animPhase === 'fly-corner'
              ? 'greeting-out 260ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
              : 'greeting-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <p className="text-white text-[22px] font-semibold whitespace-nowrap">
            {getGreeting()}, {capturedUser} 😊
          </p>
        </div>
      )}

      {/* Card — collapses into the flying logo after login */}
      <div
        className="w-full max-w-105 mx-auto relative z-10"
        style={isAnimating
          ? { animation: 'card-collapse 285ms cubic-bezier(0.4, 0, 0.2, 1) forwards', pointerEvents: 'none' }
          : undefined}
      >
        {/* Brand header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img
                ref={logoRef}
                src={logo}
                alt="HireLens logo"
                className="w-full h-full object-contain drop-shadow-lg"
                style={{ opacity: isAnimating ? 0 : 1 }}
              />
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-none tracking-[-0.01em]">
              HireLens
            </h1>
          </div>
          <p className="text-sm text-[#9ca3af]">Applicant Tracking System</p>
        </div>

        {/* Double-bezel outer shell */}
        <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-0.75">
          <div className="rounded-[17px] bg-[#161719] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] p-[clamp(20px,5vw,32px)]">
            <h2 className="text-xl font-semibold text-white mb-1">
              {role ? 'Sign in to your panel' : 'Choose your panel'}
            </h2>

            {role ? (
              <>
                <div className="mb-6">
                  <PanelSelector selected={role} onSelect={handleSelectRole} />
                </div>
                <LoginForm
                  key={role}
                  loading={loading}
                  disabled={isAnimating}
                  error={error}
                  onSubmit={handleSubmit}
                />
              </>
            ) : (
              <>
                <p className="text-sm mb-6 text-[#9ca3af]">
                  Select the panel you want to access.
                </p>
                <PanelSelector selected={null} onSelect={handleSelectRole} />
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6 text-[#6b7280]">
          Open-source ATS · HireLens v1.0
        </p>
      </div>
    </div>
  )
}
