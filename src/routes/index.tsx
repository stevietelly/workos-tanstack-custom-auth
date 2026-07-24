import { createFileRoute, Link } from '@tanstack/react-router'
import { Copy, Webhook, Send, ShieldCheck, Clock, Zap } from 'lucide-react'
import { useAuth } from '@workos/authkit-tanstack-react-start/client'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user } = useAuth()
  const primaryCta = user ? '/app' : '/signup'

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.34),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(180,83,9,0.2),transparent_66%)]" />
        <p className="island-kicker mb-3">Managed callback URLs as a service</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--ink)] sm:text-6xl">
          Catch any webhook.
          <br />
          <span className="bg-[linear-gradient(90deg,#c2410c,#f97316)] bg-clip-text text-transparent">
            Inspect it instantly.
          </span>
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--ink-soft)] sm:text-lg">
          geliana hooks gives you unique <code>/api/cb/&lt;slug&gt;</code> URLs to
          capture, log, and relay inbound HTTP traffic. Debug integrations, mock
          third-party callbacks, and keep a rolling history of every request.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={primaryCta}
            className="rounded-full border border-[var(--ember-line)] bg-[var(--ember-tint)] px-5 py-2.5 text-sm font-semibold text-[var(--ember-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(249,115,22,0.22)]"
          >
            {user ? 'Go to dashboard' : 'Create an endpoint'}
          </Link>
          <a
            href="/about"
            className="rounded-full border border-[var(--ink-line)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--ink)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--ember-line)]"
          >
            How it works
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Webhook,
            title: 'Capture everything',
            desc: 'Full headers, body, query params and source IP for every hit.',
          },
          {
            icon: Send,
            title: 'Relay & passthrough',
            desc: 'Forward to a real target and return its response verbatim.',
          },
          {
            icon: Clock,
            title: 'Rolling TTL',
            desc: 'Endpoints stay alive while active, expire when idle.',
          },
          {
            icon: ShieldCheck,
            title: 'Safe by default',
            desc: 'Sensitive headers are stripped before anything is stored.',
          },
        ].map(({ icon: Icon, title, desc }, index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-[var(--ember-tint)] text-[var(--ember-deep)]">
              <Icon className="size-5" />
            </div>
            <h2 className="mb-2 text-base font-semibold text-[var(--ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm text-[var(--ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">How it works</p>
        <h2 className="display-title mb-4 text-2xl font-bold text-[var(--ink)] sm:text-3xl">
          One URL, three modes.
        </h2>
        <ol className="m-0 grid gap-4 pl-0 sm:grid-cols-3">
          {[
            [
              'capture',
              'Log the request and return a 200 OK ack. Perfect for inspecting payloads.',
            ],
            [
              'respond',
              'Return a static, configurable status, body and headers — a full mock endpoint.',
            ],
            [
              'relay',
              'Forward the request to your real service and capture the response too.',
            ],
          ].map(([mode, desc]) => (
            <li
              key={mode}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <code className="mb-2 inline-block text-[var(--ember-deep)]">
                {mode}
              </code>
              <p className="m-0 text-sm text-[var(--ink-soft)]">{desc}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--cream)] px-4 py-3">
          <code className="font-mono text-sm text-[var(--ink)]">
            https://yourdomain.com/api/cb/3fk2a9q1
          </code>
          <Copy className="ml-auto size-4 text-[var(--ink-soft)]" />
        </div>
      </section>

      <section className="island-shell mt-8 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="display-title mb-1 text-xl font-bold text-[var(--ink)] sm:text-2xl">
            Start debugging in seconds.
          </h2>
          <p className="m-0 text-sm text-[var(--ink-soft)]">
            Free plan includes 3 endpoints and 3-day TTL. No card required.
          </p>
        </div>
        <Link
          to={primaryCta}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ember)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[var(--ember-deep)]"
        >
          <Zap className="size-4" />
          {user ? 'Open dashboard' : 'Get started free'}
        </Link>
      </section>
    </main>
  )
}
