// Dark-themed input matching the app's design tokens. Highlights blue on focus
// and stays red when there's a validation error (even while focused).
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function FormInput({ error, className, ...props }: Readonly<Props>) {
  return (
    <div>
      <input
        {...props}
        className={[
          'bg-[#1a1d20] text-white rounded-lg py-[10px] px-[14px] w-full outline-none text-sm border',
          'transition-[border-color] duration-150 ease',
          error
            ? 'border-[#ef4444] focus:border-[#ef4444]'
            : 'border-[#37373f] focus:border-[#1d2ba4]',
          className ?? '',
        ].join(' ')}
      />
      {error && (
        <p role="alert" aria-live="polite" className="text-[#f87171] text-[11px] mt-1">{error}</p>
      )}
    </div>
  )
}
