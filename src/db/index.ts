import { drizzle } from 'drizzle-orm/neon-http'
import { relations } from './relations'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local (or your platform secrets).',
  )
}

// `neon-http` is the HTTP-based Neon driver — edge- and Cloudflare-compatible
// (no WebSocket upgrade required), which is what this app deploys to.
const sql = neon(process.env.DATABASE_URL)
export const db = drizzle({ client: sql, relations })
