import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelative(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date)
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const future = diff > 0
  const rel = (n: number, unit: string) =>
    `${future ? 'in ' : ''}${n} ${unit}${n === 1 ? '' : 's'}${future ? '' : ' ago'}`
  if (mins < 1) return 'just now'
  if (mins < 60) return rel(mins, 'min')
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return rel(hrs, 'hour')
  const days = Math.round(hrs / 24)
  if (days < 30) return rel(days, 'day')
  const months = Math.round(days / 30)
  if (months < 12) return rel(months, 'month')
  return rel(Math.round(months / 12), 'year')
}

export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

