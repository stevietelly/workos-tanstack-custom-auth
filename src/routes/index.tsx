import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">WorkOS × TanStack Start</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          AuthKit, done the TanStack way.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          A working reference for integrating WorkOS AuthKit with TanStack Start
          &mdash; custom login and signup pages, email/password and Google OAuth,
          and two patterns for fetching the authenticated user (router context
          and SSR loader).
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Create an account
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
          >
            Sign in
          </Link>
          <Link
            to="/app/account"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
          >
            View account
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            'Custom UI',
            'Your own login and signup pages — no hosted AuthKit widget.',
          ],
          [
            'Password + OAuth',
            'Email/password via WorkOS and one-tap Google sign-in.',
          ],
          [
            'Router context',
            'User passed through beforeLoad into the route context tree.',
          ],
          [
            'SSR loader',
            'User fetched server-side and streamed via the route loader.',
          ],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">What&apos;s inside</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>
            <code>src/start.ts</code> &mdash; AuthKit middleware on every request.
          </li>
          <li>
            <code>src/routes/api/auth/-server-fns.ts</code> &mdash; email/password
            sign-in &amp; sign-up server functions.
          </li>
          <li>
            <code>src/routes/app.tsx</code> &mdash; protected layout using{' '}
            <code>beforeLoad</code> (router context pattern).
          </li>
          <li>
            <code>src/routes/app/account.tsx</code> &mdash; shows the user from
            both context and SSR loader, side by side.
          </li>
          <li>
            <code>src/components/workos-user.tsx</code> &mdash; client user menu
            powered by <code>useAuth()</code>.
          </li>
        </ul>
      </section>
    </main>
  )
}
