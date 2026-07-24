import { getAuth } from '@workos/authkit-tanstack-react-start'
import { db } from '@/db'
import { users, subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { newId } from './ids'

/**
 * Sync the authenticated WorkOS user into our local `users` table. Called on
 * every request from the root layout so billing / plan data always has a row to
 * attach to — even for users who signed up before this table existed.
 */
export async function upsertUser() {
  const { user } = await getAuth()
  if (!user) return null

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!existing) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.profilePictureUrl,
    })
  }

  return user
}

/**
 * Return the (free, active) subscription row for a user, creating it on demand.
 * Purely database-driven — does NOT depend on an active auth session, so it can
 * be called from the public callback handler.
 */
export async function getOrCreateSubscription(userId: string) {
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)
  if (existing) return existing

  const id = newId()
  await db.insert(subscriptions).values({
    id,
    userId,
    plan: 'free',
    planStatus: 'active',
  })

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1)
  return sub!
}

/** Requires an authenticated session; throws otherwise. */
export async function requireSubscription() {
  const { user } = await getAuth()
  if (!user) throw new Error('Unauthenticated')
  return getOrCreateSubscription(user.id)
}
