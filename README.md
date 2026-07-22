Welcome to your new TanStack Start app! 

# Getting Started

To run this application:

```bash
bun install
bun --bun run dev
```

# Building For Production

To build this application for production:

```bash
bun --bun run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
bun --bun run test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Uninstall the packages: `bun install @tailwindcss/vite tailwindcss -D`

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
bun --bun run lint
bun --bun run format
bun --bun run check
```


## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`:

1. Install Wrangler: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. Deploy: `npx wrangler deploy`

For production env vars, run `wrangler secret put MY_VAR` for each secret listed in `.env.example`. Public (non-secret) vars go in `wrangler.jsonc` under `vars`.

KV, D1, R2, and Durable Object bindings are configured in `wrangler.jsonc` — see https://developers.cloudflare.com/workers/wrangler/configuration/.


## Setting up WorkOS

1. Copy `.env.example` to `.env.local` and fill in your WorkOS credentials from the [WorkOS dashboard](https://dashboard.workos.com):

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where it's used | Notes |
   |---|---|---|
   | `WORKOS_API_KEY` | server | Secret API key (`sk_test_...`). Never exposed to the client. |
   | `WORKOS_CLIENT_ID` | server + client | Used by AuthKit middleware and the client provider. |
   | `WORKOS_COOKIE_PASSWORD` | server | **Must be ≥ 32 chars.** Used to seal the session cookie. |
   | `WORKOS_REDIRECT_URI` | server | Optional. Defaults to `http://<host>/api/auth/callback`. |
   | `VITE_WORKOS_CLIENT_ID` | client | Same client ID, exposed to the browser (required `VITE_` prefix). |
   | `VITE_WORKOS_API_HOSTNAME` | client | Usually `api.workos.com`. |

2. In the WorkOS dashboard, set the **Redirect** URI to `http://localhost:3000/api/auth/callback` (or your deployed equivalent).

### How the integration is wired

- **`src/start.ts`** — registers `authkitMiddleware()` on every request. The middleware reads/refreshes the session cookie and makes `getAuth()` available in loaders and server functions.
- **`src/routes/api/auth/callback.ts`** — OAuth callback handler (`handleCallbackRoute`). Also handles `organization_selection_required`.
- **`src/routes/api/auth/google.ts`** — starts a Google OAuth flow (`?screen_hint=sign-up` for sign-up).
- **`src/routes/api/auth/-server-fns.ts`** — server functions for **custom email/password** sign-in (`authenticateWithPassword`) and sign-up (`createUser` + `authenticateWithPassword`). After WorkOS returns a `sealedSession`, it is persisted via `authkit.saveSession()` so the middleware picks it up on the next request.
- **`src/integrations/workos/provider.tsx`** — client-side `AuthKitProvider`, seeded with `initialAuth` from the root loader so there is no logged-out flash.

### Custom login & signup pages

- **`src/routes/login.tsx`** + **`src/components/login-form.tsx`** — email/password form plus a "Continue with Google" button.
- **`src/routes/signup.tsx`** + **`src/components/signup-form.tsx`** — name/email/password form plus Google.

Both call the server functions directly, then `navigate({ to: '/app' })`. The session is already stored server-side, so the protected route renders immediately.

### Fetching the user — two patterns

This example deliberately shows **both** ways to get the authenticated user, side by side on `/app/account`.

#### Pattern 1 — Router context (`beforeLoad`)

In `src/routes/app.tsx`:

```tsx
export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    const auth = await getAuth()
    if (!auth.user) throw redirect({ to: '/login' })
    return { auth }            // ← injected into the router context tree
  },
})
```

Child routes read it with **zero extra work**:

```tsx
const { auth } = Route.useRouteContext()
const user = auth.user
```

`beforeLoad` runs on the server for the first request and on the client for every navigation, so it doubles as your auth guard. Use this when many nested routes need the user.

#### Pattern 2 — SSR loader

In `src/routes/app/account.tsx`:

```tsx
export const Route = createFileRoute('/app/account')({
  loader: async () => {
    const auth = await getAuth()
    return { user: auth.user }   // ← fetched on the server, streamed to the client
  },
})

// In the component:
const { user } = Route.useLoaderData()
```

Use this when a single route needs its own data fetched in parallel with the route's other loaders, or when you want the data to be part of that route's cacheable loader payload.

> **Pick one pattern per route in real apps.** We show both on the account page only to demonstrate they return the same `user` object.

### Signing out

- **Client button** (`src/components/workos-user.tsx`): `useAuth().signOut({ returnTo: '/' })`.
- **Route** (`src/routes/logout.tsx`): `await signOut()` inside a loader (redirects to the AuthKit logout URL).


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```


## T3Env

- You can use T3Env to add type safety to your environment variables.
- Add Environment variables to the `src/env.mjs` file.
- Use the environment variables in your code.

### Usage

```ts
import { env } from "#/env";

console.log(env.VITE_APP_TITLE);
```






## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
