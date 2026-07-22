import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getAuth } from '@workos/authkit-tanstack-react-start'

/**
 * PATTERN 1 — Router context (beforeLoad)
 *
 * `beforeLoad` runs on the server for the initial request AND on the client for
 * every subsequent navigation. By returning the auth result here, it becomes
 * available to this route and ALL child routes via `Route.useRouteContext()`
 * (or `useRouteContext({ from: '/app' })`) — no extra fetch, no extra loader.
 *
 * This is the ideal place for an auth guard: if there is no user we redirect to
 * /login before any component renders.
 */
export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    const auth = await getAuth()
    if (!auth.user) {
      throw redirect({ to: '/login' })
    }
    // Whatever we return here is injected into the router context tree.
    return { auth }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
