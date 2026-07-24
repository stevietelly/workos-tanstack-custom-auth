import { createServerFn } from '@tanstack/react-start'
import { getAuth } from '@workos/authkit-tanstack-react-start'
import { z } from 'zod'
import { db } from '@/db'
import { endpoints, requests, PLAN_LIMITS } from '@/db/schema'
import { eq, and, desc, sql, count } from 'drizzle-orm'
import { getOrCreateSubscription } from './auth'
import { newSlug } from './ids'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

const endpointBase = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  mode: z.enum(['capture', 'respond']).default('capture'),
  allowedMethods: z
    .array(z.enum(HTTP_METHODS))
    .min(1)
    .default(['GET', 'POST']),
  responseStatus: z.number().int().min(100).max(599).default(200),
  responseBody: z.string().max(64_000).default(''),
  responseContentType: z.string().max(80).default('application/json'),
  responseHeaders: z.record(z.string(), z.string()).default({}),
  relayEnabled: z.boolean().default(false),
  relayUrl: z.string().optional(),
  relayMethod: z.enum(HTTP_METHODS).optional(),
  relayHeaders: z.record(z.string(), z.string()).default({}),
  relayPassthrough: z.boolean().default(false),
  relayTimeoutMs: z.number().int().min(1000).max(30_000).default(10_000),
})

export const createEndpoint = createServerFn({ method: 'POST' })
  .validator(endpointBase)
  .handler(async ({ data }) => {
    const { user } = await getAuth()
    if (!user) throw new Error('Unauthenticated')

    const sub = await getOrCreateSubscription(user.id)
    const limits = PLAN_LIMITS[sub.plan]

    const [{ total }] = await db
      .select({ total: count() })
      .from(endpoints)
      .where(eq(endpoints.userId, user.id))
    if (total >= limits.maxEndpoints) {
      throw new Error(
        `Your ${sub.plan} plan allows ${limits.maxEndpoints} endpoints. Upgrade to create more.`,
      )
    }

    const id = newSlug()
    const expiresAt = new Date(
      Date.now() + limits.ttlDays * 86_400_000,
    )

    await db.insert(endpoints).values({
      id,
      userId: user.id,
      name: data.name,
      description: data.description,
      mode: data.mode,
      allowedMethods: data.allowedMethods,
      responseStatus: data.responseStatus,
      responseBody: data.responseBody,
      responseContentType: data.responseContentType,
      responseHeaders: data.responseHeaders,
      relayEnabled: data.relayEnabled,
      relayUrl: data.relayUrl || null,
      relayMethod: data.relayMethod,
      relayHeaders: data.relayHeaders,
      relayPassthrough: data.relayPassthrough && limits.relayPassthrough,
      relayTimeoutMs: data.relayTimeoutMs,
      expiresAt,
    })

    return { id }
  })

export const getEndpoints = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { user } = await getAuth()
    if (!user) throw new Error('Unauthenticated')

    const sub = await getOrCreateSubscription(user.id)
    const limits = PLAN_LIMITS[sub.plan]

    const rows = await db
      .select({
        endpoint: endpoints,
        requestCount: sql<number>`count(${requests.id})::int`,
      })
      .from(endpoints)
      .leftJoin(requests, eq(requests.endpointId, endpoints.id))
      .where(eq(endpoints.userId, user.id))
      .groupBy(endpoints.id)
      .orderBy(desc(endpoints.updatedAt))

    return {
      plan: sub.plan,
      limits,
      endpoints: rows.map((r) => ({
        ...r.endpoint,
        requestCount: r.requestCount ?? 0,
      })),
    }
  },
)

export const getEndpoint = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { user } = await getAuth()
    if (!user) throw new Error('Unauthenticated')

    const [endpoint] = await db
      .select()
      .from(endpoints)
      .where(and(eq(endpoints.id, data.id), eq(endpoints.userId, user.id)))
      .limit(1)
    if (!endpoint) throw new Error('Endpoint not found')
    return endpoint
  })

export const getRequests = createServerFn({ method: 'GET' })
  .validator(z.object({ endpointId: z.string(), limit: z.number().int().max(500).default(100) }))
  .handler(async ({ data }) => {
    const { user } = await getAuth()
    if (!user) throw new Error('Unauthenticated')

    const [owned] = await db
      .select()
      .from(endpoints)
      .where(
        and(eq(endpoints.id, data.endpointId), eq(endpoints.userId, user.id)),
      )
      .limit(1)
    if (!owned) throw new Error('Endpoint not found')

    const rows = await db
      .select()
      .from(requests)
      .where(eq(requests.endpointId, data.endpointId))
      .orderBy(desc(requests.receivedAt))
      .limit(data.limit)
    return rows
  })

export const updateEndpoint = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string(),
      patch: endpointBase.partial(),
    }),
  )
  .handler(async ({ data }) => {
    const { user } = await getAuth()
    if (!user) throw new Error('Unauthenticated')

    const [existing] = await db
      .select()
      .from(endpoints)
      .where(and(eq(endpoints.id, data.id), eq(endpoints.userId, user.id)))
      .limit(1)
    if (!existing) throw new Error('Endpoint not found')

    const sub = await getOrCreateSubscription(user.id)
    const limits = PLAN_LIMITS[sub.plan]
    const patch = { ...data.patch }

    if (patch.relayPassthrough && !limits.relayPassthrough) {
      patch.relayPassthrough = false
    }
    if (patch.relayUrl === '') patch.relayUrl = undefined

    await db
      .update(endpoints)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(endpoints.id, data.id))
    return { ok: true }
  })

export const deleteEndpoint = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { user } = await getAuth()
    if (!user) throw new Error('Unauthenticated')

    await db
      .delete(endpoints)
      .where(and(eq(endpoints.id, data.id), eq(endpoints.userId, user.id)))
    return { ok: true }
  })
