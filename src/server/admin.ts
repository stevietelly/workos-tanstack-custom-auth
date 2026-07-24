import { createServerFn } from '@tanstack/react-start'
import { getAuth } from '@workos/authkit-tanstack-react-start'
import { z } from 'zod'
import { db } from '@/db'
import { users, subscriptions, admins, endpoints } from '@/db/schema'
import { eq, desc, count } from 'drizzle-orm'

async function requireAdmin() {
  const { user } = await getAuth()
  if (!user) throw new Error('Unauthenticated')

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, user.id))
    .limit(1)

  if (!admin) throw new Error('Forbidden')
  return admin
}

export const checkAdmin = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    await requireAdmin()
    return { isAdmin: true }
  } catch {
    return { isAdmin: false }
  }
})

export const getAllUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()

  return await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      bannedAt: users.bannedAt,
      createdAt: users.createdAt,
      plan: subscriptions.plan,
      planStatus: subscriptions.planStatus,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .orderBy(desc(users.createdAt))
})

export const getUserDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1)
    if (!targetUser) throw new Error('User not found')

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, data.userId))
      .limit(1)

    const [{ total }] = await db
      .select({ total: count() })
      .from(endpoints)
      .where(eq(endpoints.userId, data.userId))

    return { user: targetUser, subscription: sub ?? null, endpointCount: total }
  })

export const setUserPlan = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      userId: z.string(),
      plan: z.enum(['free', 'pro', 'enterprise']),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    await db
      .update(subscriptions)
      .set({ plan: data.plan, updatedAt: new Date() })
      .where(eq(subscriptions.userId, data.userId))

    return { ok: true }
  })

export const toggleBanUser = createServerFn({ method: 'POST' })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()

    const [targetUser] = await db
      .select({ bannedAt: users.bannedAt })
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1)
    if (!targetUser) throw new Error('User not found')

    const now = targetUser.bannedAt ? null : new Date()
    await db
      .update(users)
      .set({ bannedAt: now, updatedAt: new Date() })
      .where(eq(users.id, data.userId))

    return { banned: !!now }
  })
