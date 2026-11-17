import { Spinner } from './Spinner'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
}

// Main blue CTA button used across all primary actions (Sign In, Create JD, Finalize...).
// Pass `loading` to swap content for a spinner + loadingText automatically.
export function PrimaryButton({ loading, loadingText, children, disabled, className, ...props }: Readonly<Props>) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        'flex items-center justify-center gap-2 py-[10px] px-[22px] rounded-full text-sm font-semibold text-white bg-[#1d2ba4] border-none',
        'transition-[background,transform,box-shadow] duration-[180ms] ease',
        isDisabled
          ? 'cursor-not-allowed opacity-50 shadow-none'
          : 'cursor-pointer shadow-[0_4px_16px_rgba(29,43,164,0.35)] hover:bg-[#12219e] active:scale-[0.97]',
        className ?? '',
      ].join(' ')}
    >
      {loading ? <Spinner /> : null}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
