import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Users, CreditCard, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="mb-2 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-bold text-[var(--ink)]">{value}</div>
    </div>
  )
}

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to load')
      return res.json() as Promise<
        Array<{
          id: string
          email: string
          firstName: string | null
          lastName: string | null
          bannedAt: string | null
          createdAt: string
          plan: string | null
          planStatus: string | null
        }>
      >
    },
  })

  const total = data?.length ?? 0
  const banned = data?.filter((u) => u.bannedAt).length ?? 0
  const paid = data?.filter((u) => u.plan === 'pro' || u.plan === 'enterprise').length ?? 0

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-[var(--ink)]">Admin Dashboard</h1>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={total} />
        <StatCard icon={CreditCard} label="Paid Users" value={paid} />
        <StatCard icon={AlertTriangle} label="Banned" value={banned} />
      </div>
    </div>
  )
}
