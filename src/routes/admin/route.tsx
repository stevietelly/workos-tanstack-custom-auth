import { createFileRoute, Outlet, Link, redirect } from '@tanstack/react-router'
import { Shield, Users, LayoutDashboard } from 'lucide-react'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    if (import.meta.env.SSR) {
      const { getRequest } = await import('@tanstack/react-start/server')
      const incoming = getRequest()
      const origin = new URL(incoming.url).origin
      const res = await fetch(`${origin}/api/admin/check`, {
        headers: { cookie: incoming.headers.get('cookie') ?? '' },
      })
      const data = await res.json()
      if (!data.isAdmin) throw redirect({ to: '/' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--ember)]" />
          <span className="text-sm font-semibold text-[var(--ink)]">Admin</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            to="/admin"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--ink)] [&.active]:bg-[var(--ember-tint)] [&.active]:text-[var(--ember-deep)]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--ink)] [&.active]:bg-[var(--ember-tint)] [&.active]:text-[var(--ember-deep)]"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
