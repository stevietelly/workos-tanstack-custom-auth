import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsers,
})

type UserRow = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  bannedAt: string | null
  createdAt: string
  plan: string | null
  planStatus: string | null
}

function planBadge(plan: string | null, status: string | null) {
  if (!plan) return <Badge variant="muted">no sub</Badge>
  if (plan === 'free') return <Badge variant="outline">free</Badge>
  const variant = status === 'active' ? 'success' : 'danger'
  return <Badge variant={variant}>{plan}</Badge>
}

function AdminUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to load')
      return res.json() as Promise<UserRow[]>
    },
  })

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-[var(--ink)]">Users</h1>

      {isLoading ? (
        <p className="text-sm text-[var(--ink-soft)]">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface)]">
                <th className="px-4 py-3 font-medium text-[var(--ink-soft)]">Email</th>
                <th className="px-4 py-3 font-medium text-[var(--ink-soft)]">Name</th>
                <th className="px-4 py-3 font-medium text-[var(--ink-soft)]">Plan</th>
                <th className="px-4 py-3 font-medium text-[var(--ink-soft)]">Status</th>
                <th className="px-4 py-3 font-medium text-[var(--ink-soft)]">Joined</th>
                <th className="px-4 py-3 font-medium text-[var(--ink-soft)]" />
              </tr>
            </thead>
            <tbody>
              {data?.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--line)] transition hover:bg-[var(--link-bg-hover)]"
                >
                  <td className="px-4 py-3 text-[var(--ink)]">{row.email}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">
                    {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3">{planBadge(row.plan, row.planStatus)}</td>
                  <td className="px-4 py-3">
                    {row.bannedAt ? (
                      <Badge variant="danger">banned</Badge>
                    ) : (
                      <Badge variant="success">active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">
                    {row.createdAt?.slice(0, 10) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/users/$id"
                      params={{ id: row.id }}
                      className="text-sm text-[var(--ember)] hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
