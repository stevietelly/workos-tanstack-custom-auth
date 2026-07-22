import { WorkOS } from '@workos-inc/node'

/**
 * Server-only WorkOS client.
 *
 * `WORKOS_API_KEY` and `WORKOS_CLIENT_ID` are read from the server environment
 * (`.env.local` / Cloudflare secrets). Never expose these to the client.
 */
export const workos = new WorkOS(process.env.WORKOS_API_KEY!, {
  clientId: process.env.WORKOS_CLIENT_ID!,
})

/**
 * Build the OAuth callback URI for the current request host.
 *
 * In production, set `WORKOS_REDIRECT_URI` explicitly. Locally we derive it
 * from the incoming `host` header so the callback matches whatever port you
 * run the dev server on.
 */
export function getRedirectUri(host?: string | null): string {
  if (process.env.WORKOS_REDIRECT_URI) {
    return process.env.WORKOS_REDIRECT_URI
  }

  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https'
    return `${protocol}://${host}/api/auth/callback`
  }

  return 'http://localhost:3000/api/auth/callback'
}
