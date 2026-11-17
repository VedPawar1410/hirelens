import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { PrimaryButton } from '../../../shared/components/ui/PrimaryButton'

interface Props {
  readonly loading: boolean
  // Blocks submission during the post-login animation so no double-submit
  readonly disabled: boolean
  readonly error: string
  readonly onSubmit: (username: string, password: string) => void
}

const INPUT_BASE = [
  'w-full px-3.5 py-2.5 rounded-lg text-white bg-[#1a1d20] border border-[#37373f] placeholder-gray-500',
  'outline-none transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
  'shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]',
  'focus:border-[#1d2ba4] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_0_3px_rgba(29,43,164,0.15)]',
].join(' ')

// Owns its own field state — parent only needs to know credentials when submitted.
export function LoginForm({ loading, disabled, error, onSubmit }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit(username, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1.5 text-[#e5e7eb]">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
          className={INPUT_BASE}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[#e5e7eb]">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className={`${INPUT_BASE} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-[#f87171] text-[13px] -mt-1">
          {error}
        </p>
      )}

      <PrimaryButton
        type="submit"
        disabled={disabled}
        loading={loading}
        loadingText="Signing in..."
        className="w-full"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </PrimaryButton>
    </form>
  )
}
