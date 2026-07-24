import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/app/account')({
  component: RouteComponent,
})

function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const user = auth.user

  const { data } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const res = await fetch('/api/billing/info')
      if (!res.ok) throw new Error('Failed to load billing info')
      return res.json()
    },
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="island-kicker mb-1">Account</p>
        <h1 className="display-title text-3xl font-bold text-[var(--ink)]">
          {user?.firstName || user?.lastName
            ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
            : 'Welcome'}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{user?.email}</p>
      </div>

      {data ? (
        <section className="island-shell rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-[var(--ink-soft)]">Plan</span>
            <Badge variant={data.plan !== 'free' ? 'default' : 'muted'}>
              {data.plan}
            </Badge>
            <Badge variant="outline">{data.planStatus}</Badge>
            <Badge variant="muted">{data.currency}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Stat label="Endpoints" value={String(data.limits.maxEndpoints)} />
            <Stat
              label="Req / endpoint"
              value={data.limits.maxRequestsPerEndpoint.toLocaleString()}
            />
            <Stat label="Idle TTL" value={`${data.limits.ttlDays} days`} />
            <Stat
              label="Relay timeout"
              value={`${data.limits.relayTimeoutMs / 1000}s`}
            />
          </dl>
        </section>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--cream)] p-3">
      <dt className="text-xs text-[var(--ink-soft)]">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-[var(--ink)]">
        {value}
      </dd>
    </div>
  )
}
