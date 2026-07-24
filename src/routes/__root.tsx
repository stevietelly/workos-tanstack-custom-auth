import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'
import AppWorkOSProvider from '../integrations/workos/provider'
import { getAuth } from '@workos/authkit-tanstack-react-start'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Runs on the server during SSR only. `getWebRequest` is a server-only
    // import, so we dynamically import it behind an SSR guard — Vite strips
    // this branch (and the import) from the client bundle.
    if (import.meta.env.SSR) {
      const { getRequest } = await import('@tanstack/react-start/server')
      const incoming = getRequest()
      const origin = new URL(incoming.url).origin
      const res = await fetch(`${origin}/api/auth/user`, {
        headers: { cookie: incoming.headers.get('cookie') ?? '' },
      })
      const { user } = await res.json()
      return { user }
    }
    return { user: null }
  },
  // Load the current auth state on the server so we can seed the client
  // AuthKitProvider (no logged-out flash) and make it available app-wide.
  loader: async () => {
    try {
      const auth = await getAuth()
      return { initialAuth: auth.user ? auth : { user: null } }
    } catch {
      // getAuth() can throw mid-OAuth-callback (e.g. pending org selection);
      // fall back to a logged-out seed rather than crashing the document.
      return { initialAuth: { user: null } }
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'geliana hooks — instant webhook inboxes',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootError,
})

function RootError({ error, reset }: { error: Error & { data?: unknown }; reset: () => void }) {
  return (
    <main className="page-wrap px-4 py-24">
      <section className="island-shell mx-auto max-w-lg rounded-2xl p-8 text-center">
        <p className="island-kicker mb-2">Something went wrong</p>
        <h1 className="display-title mb-3 text-3xl font-bold text-[var(--ink)]">
          We hit a snag.
        </h1>
        <p className="mb-6 text-sm text-[var(--ink-soft)]">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--ember)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[var(--ember-deep)]"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            Go home
          </a>
        </div>
      </section>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { initialAuth } = Route.useLoaderData() ?? {}
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(249,115,22,0.26)]">

        <AppWorkOSProvider initialAuth={initialAuth}>
          <Header />
          {children}
          <Footer />
        </AppWorkOSProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
              />

        <Scripts />
      </body>
    </html>
  )
}
