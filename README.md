# geliana hooks — Managed Callback URLs as a Service

A self-hosted webhook inbox + configurable mock endpoint service. Built entirely
on TanStack (Start, Router, Query, Table, Form), CockroachDB via Drizzle,
WorkOS for auth, and Paystack for billing (KES + USD).

## How it works

Each user creates **endpoints** — unique URLs like `/cb/<slug>`. When an
external service hits that URL (GET/POST/etc), Hookr:

1. Logs the full request (headers, body, query params, IP)
2. Optionally **relays** it to a target URL and captures the response
3. Either returns a configured static response (`respond` mode), the relay's
   response verbatim (`relay_passthrough`), or a simple capture ack
   (`capture` mode)
4. Updates the endpoint's TTL based on `last_used_at` + the user's plan

Endpoints with no traffic get cleaned up automatically:
- **Free plan**: 3 days
- **Pro / Enterprise**: 60 days

## Stack

| Concern | Tool |
|---|---|
| Framework | TanStack Start |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query (polling, no websockets) |
| Tables | TanStack Table |
| Forms | TanStack Form |
| Database | CockroachDB (via `postgres` driver + Drizzle ORM) |
| Auth | WorkOS (fully custom UI, AuthKit under the hood) |
| Billing | Paystack (KES + USD subscriptions) |

## Project structure

```
app/
  routes/
    _auth/                  ← login/register (unauthenticated layout)
      auth.login.tsx
      auth.register.tsx
    _app.tsx                ← authenticated layout (sidebar, nav)
    _app/
      dashboard.tsx
      endpoints.new.tsx
      endpoints.$id.tsx
      billing.tsx
    auth.callback.tsx       ← WorkOS OAuth callback → user upsert
    auth.logout.tsx
    billing.callback.tsx    ← Paystack redirect-back handler
    api/
      cb.$slug.ts           ← THE callback handler (all HTTP methods)
      webhooks/paystack.ts  ← Paystack subscription webhooks
      cron/cleanup.ts       ← TTL sweep, hit by external scheduler
  server/
    db/
      schema.ts             ← Drizzle schema (users, endpoints, requests)
      index.ts               ← CockroachDB client
    lib/
      auth.ts               ← WorkOS session + user upsert
    functions/
      endpoints.ts          ← CRUD server functions
      callback.ts           ← core log/relay/respond logic
      billing.ts            ← Paystack checkout + webhook processing
      cleanup.ts            ← TTL cleanup logic
  styles/globals.css
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — CockroachDB connection string
- `WORKOS_*` — from your WorkOS dashboard (AuthKit enabled, custom redirect URI)
- `PAYSTACK_*` — secret/public keys + plan codes for Pro/Enterprise in both KES and USD
- `CRON_SECRET` — random string, used to protect `/api/cron/cleanup`

### 3. Database migrations

```bash
npm run db:generate   # generate SQL from schema.ts
npm run db:migrate    # apply to CockroachDB
```

### 4. WorkOS setup

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


### 5. Paystack setup

- Create two plans per tier (Pro, Enterprise) — one in KES, one in USD
- Set plan codes in `.env`
- Add webhook URL in Paystack dashboard: `https://yourdomain.com/api/webhooks/paystack`
- Events needed: `subscription.create`, `invoice.payment_success`,
  `invoice.payment_failed`, `subscription.disable`

### 6. Cleanup cron

Point an external scheduler (cron-job.org, Render Cron, GitHub Actions, etc.)
at:

```
GET https://yourdomain.com/api/cron/cleanup
Header: x-cron-secret: <CRON_SECRET>
```

Run hourly. It deletes endpoints (and cascades to requests) where
`expires_at < NOW()`.

### 7. Run

```bash
npm run dev
```

## Key design notes

- **TTL is rolling, not fixed**: every hit to `/cb/<slug>` resets
  `expires_at = now() + plan_ttl_days`. Inactive endpoints expire; active ones
  never do.
- **Relay timeout** is plan-gated (5s free / 15s pro / 30s enterprise) to
  avoid free-tier abuse holding connections open.
- **Sensitive headers** (`authorization`, `cookie`, etc.) are stripped before
  storing request logs.
- **Rolling request limit**: when a free-tier endpoint exceeds 500 stored
  requests, the oldest is deleted to make room for the newest — no manual
  cleanup needed.
- **User sync**: every authenticated request calls `upsertUser()`, so a local
  `users` row always exists for billing/plan data, even for users who signed
  up before this table existed.
