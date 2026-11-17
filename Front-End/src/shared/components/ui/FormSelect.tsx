// Dark-themed select styled to match FormInput exactly.
interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export function FormSelect({ error, className, children, ...props }: Readonly<Props>) {
  return (
    <div>
      <select
        {...props}
        className={[
          'bg-[#1a1d20] text-white rounded-lg py-[10px] px-[14px] w-full outline-none text-sm cursor-pointer border',
          'transition-[border-color] duration-150 ease',
          error
            ? 'border-[#ef4444] focus:border-[#ef4444]'
            : 'border-[#37373f] focus:border-[#1d2ba4]',
          className ?? '',
        ].join(' ')}
      >
        {children}
      </select>
      {error && (
        <p role="alert" aria-live="polite" className="text-[#f87171] text-[11px] mt-1">{error}</p>
      )}
    </div>
  )
}
