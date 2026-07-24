import * as React from 'react'
import { cn } from '#/lib/utils'

function Badge({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'span'> & {
  variant?: 'default' | 'outline' | 'muted' | 'success' | 'danger'
}) {
  const variants = {
    default: 'bg-[var(--ember-tint)] text-[var(--ember-deep)] border border-[var(--ember-line)]',
    outline: 'border border-[var(--line)] text-[var(--ink-soft)]',
    muted: 'bg-[var(--surface)] text-[var(--ink-soft)] border border-[var(--line)]',
    success: 'bg-[rgba(52,160,94,0.14)] text-[#2f6a4a] border border-[rgba(52,160,94,0.3)]',
    danger: 'bg-destructive/10 text-destructive border border-destructive/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
