import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/admin/users/$id')({
  component: AdminUserDetail,
})

function AdminUserDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`)
      if (!res.ok) throw new Error('Failed to load')
      return res.json() as Promise<{
        user: {
          id: string
          email: string
          firstName: string | null
          lastName: string | null
          bannedAt: string | null
          createdAt: string
        }
        subscription: {
          plan: string
          planStatus: string
          currency: string
          createdAt: string
        } | null
        endpointCount: number
      }>
    },
  })

  const banMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${id}/ban`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', id] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const planMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await fetch(`/api/admin/users/${id}/plan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', id] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  if (isLoading) {
    return <p className="text-sm text-[var(--ink-soft)]">Loading...</p>
  }

  if (!data) {
    return <p className="text-sm text-[var(--ink-soft)]">User not found.</p>
  }

  const { user, subscription } = data
  const isBanned = !!user.bannedAt

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/users' })}
        className="mb-4 text-sm text-[var(--ember)] hover:underline"
      >
        &larr; Back to users
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--ink)]">
          {user.firstName || user.email}
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">{user.email}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Account</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">Name</dt>
              <dd className="text-[var(--ink)]">
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">Joined</dt>
              <dd className="text-[var(--ink)]">{user.createdAt?.slice(0, 10) || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">Status</dt>
              <dd>
                {isBanned ? (
                  <Badge variant="danger">banned</Badge>
                ) : (
                  <Badge variant="success">active</Badge>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => banMutation.mutate()}
              disabled={banMutation.isPending}
              className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)] transition hover:bg-[var(--link-bg-hover)] disabled:opacity-50"
            >
              {isBanned ? 'Unban' : 'Ban'} user
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Subscription</h2>

          {subscription ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--ink-soft)]">Plan</dt>
                <dd className="text-[var(--ink)]">{subscription.plan}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--ink-soft)]">Status</dt>
                <dd>
                  <Badge
                    variant={
                      subscription.planStatus === 'active' ? 'success' : 'outline'
                    }
                  >
                    {subscription.planStatus}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--ink-soft)]">Currency</dt>
                <dd className="text-[var(--ink)]">{subscription.currency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--ink-soft)]">Endpoints</dt>
                <dd className="text-[var(--ink)]">{data.endpointCount}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">No subscription row yet.</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {(['free', 'pro', 'enterprise'] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => planMutation.mutate(plan)}
                disabled={planMutation.isPending || subscription?.plan === plan}
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)] transition hover:bg-[var(--link-bg-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Set {plan}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
