import { createFileRoute, redirect, Outlet, Link } from '@tanstack/react-router'
import { getAuth } from '@workos/authkit-tanstack-react-start'

export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    const auth = await getAuth()
    if (!auth.user) {
      throw redirect({ to: '/login' })
    }
    return { auth }
  },
  component: RouteComponent,
})

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="nav-link"
      activeProps={{ className: 'nav-link is-active' }}
      activeOptions={{ exact: true }}
    >
      {label}
    </Link>
  )
}

function RouteComponent() {
  return (
    <div>
      <nav className="sticky top-[57px] z-40 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
        <div className="page-wrap flex flex-wrap items-center gap-x-5 gap-y-1 py-2 text-sm font-semibold">
          <NavLink to="/app" label="Dashboard" />
          <NavLink to="/app/endpoints/new" label="New endpoint" />
          <NavLink to="/app/billing" label="Billing" />
          <NavLink to="/app/account" label="Account" />
        </div>
      </nav>
      <div className="page-wrap px-4 pb-8 pt-8">
        <Outlet />
      </div>
    </div>
  )
}
