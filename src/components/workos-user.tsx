import { useAuth } from '@workos/authkit-tanstack-react-start/client'

/**
 * User menu driven by the client-side AuthKit context (`useAuth`).
 *
 * Because the provider is seeded with `initialAuth` from the SSR loader, this
 * shows the correct state immediately on first paint — no logged-out flash.
 */
export default function WorkOSUserMenu() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-full border border-[var(--ember-line)] bg-[var(--ember-tint)] px-4 py-2 text-sm font-semibold text-[var(--ember-deep)] no-underline transition hover:bg-[rgba(249,115,22,0.22)]"
      >
        Sign in
      </a>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {user.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="size-8 rounded-full"
          />
        ) : null}
        <span className="hidden text-sm font-medium text-[var(--ink)] sm:inline">
          {user.firstName} {user.lastName}
        </span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ returnTo: '/' })}
        className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--ink)]"
      >
        Sign out
      </button>
    </div>
  )
}
