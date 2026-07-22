import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '@workos/authkit-tanstack-react-start'

/**
 * PATTERN 2 — SSR loader
 *
 * `loader` also runs on the server for the initial request and on the client
 * for navigations. The returned value is read with `Route.useLoaderData()`.
 *
 * To demonstrate BOTH patterns on one page:
 *  - `userFromContext` comes from the parent `/app` route's `beforeLoad`
 *    (Pattern 1 — router context, zero extra work).
 *  - `userFromLoader` comes from THIS route's own `loader` (Pattern 2 — SSR
 *    loader, fetched in parallel with the route's other data).
 *
 * In a real app you would pick ONE pattern per route. We show both here so you
 * can see they return the same user object.
 */
export const Route = createFileRoute('/app/account')({
  loader: async () => {
    const auth = await getAuth()
    return { user: auth.user }
  },
  component: RouteComponent,
})

function RouteComponent() {
  // Pattern 1: read the user from the parent route's router context.
  const { auth } = Route.useRouteContext()
  const userFromContext = auth.user

  // Pattern 2: read the user from this route's own SSR loader.
  const { user: userFromLoader } = Route.useLoaderData()

  return (
    <div className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-2xl p-6">
        <p className="island-kicker mb-2">Account</p>
        <h1 className="mb-4 text-2xl font-bold text-[var(--sea-ink)]">
          {userFromContext?.firstName ?? userFromLoader?.firstName
            ? `${userFromContext?.firstName ?? userFromLoader?.firstName} ${
                userFromContext?.lastName ?? userFromLoader?.lastName ?? ''
              }`
            : 'Welcome'}
        </h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] p-4">
            <p className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">
              From router context
            </p>
            <pre className="overflow-auto text-xs text-[var(--sea-ink-soft)]">
              {JSON.stringify(userFromContext, null, 2)}
            </pre>
          </div>
          <div className="rounded-xl border border-[var(--line)] p-4">
            <p className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">
              From SSR loader
            </p>
            <pre className="overflow-auto text-xs text-[var(--sea-ink-soft)]">
              {JSON.stringify(userFromLoader, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}
