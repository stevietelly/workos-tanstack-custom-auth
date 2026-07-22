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
        className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-2 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:bg-[rgba(79,184,178,0.24)]"
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
        <span className="hidden text-sm font-medium text-[var(--sea-ink)] sm:inline">
          {user.firstName} {user.lastName}
        </span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ returnTo: '/' })}
        className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
      >
        Sign out
      </button>
    </div>
  )
}
