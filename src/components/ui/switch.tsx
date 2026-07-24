import * as React from 'react'
import { cn } from '#/lib/utils'

function Switch({
  className,
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<'button'> & {
  checked?: boolean
  onCheckedChange?: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-[var(--line)] transition-colors',
        checked ? 'bg-[var(--ember)]' : 'bg-muted',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export { Switch }
