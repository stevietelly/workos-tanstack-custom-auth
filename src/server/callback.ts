import { db } from '@/db'
import { endpoints, requests } from '@/db/schema'
import { eq, count, inArray, lt } from 'drizzle-orm'
import { PLAN_LIMITS } from '@/db/schema'
import { getOrCreateSubscription } from './auth'
import { newId } from './ids'

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
  'x-auth-token',
])

const MAX_BODY = 512 * 1024

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function pickHeaders(
  source: Headers | Record<string, string>,
  includeSensitive = false,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (source instanceof Headers) {
    source.forEach((value, key) => {
      if (includeSensitive || !SENSITIVE_HEADERS.has(key.toLowerCase())) {
        out[key] = value
      }
    })
  } else {
    for (const [key, value] of Object.entries(source)) {
      if (includeSensitive || !SENSITIVE_HEADERS.has(key.toLowerCase())) {
        out[key] = value
      }
    }
  }
  return out
}

function mergeRelayHeaders(
  configured: Record<string, string>,
  incoming: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(incoming)) {
    if (SENSITIVE_HEADERS.has(k.toLowerCase())) continue
    out[k.toLowerCase()] = v
  }
  for (const [k, v] of Object.entries(configured)) {
    out[k.toLowerCase()] = v
  }
  return out
}

/**
 * Core webhook handling logic, shared by every HTTP method on /api/cb/$slug.
 *
 *  1. Resolve + validate the endpoint (exists, active, not expired, method ok)
 *  2. Capture the request (sanitized headers, body, query, IP)
 *  3. Optionally relay to a target URL (plan-gated timeout, passthrough mode)
 *  4. Persist the request row (+ trim to the plan's rolling request limit)
 *  5. Roll the TTL forward to now() + plan_ttl_days
 *  6. Respond according to the endpoint mode
 */
export async function handleCallbackRequest({
  request,
  slug,
}: {
  request: Request
  slug: string
}): Promise<Response> {
  const [endpoint] = await db
    .select()
    .from(endpoints)
    .where(eq(endpoints.id, slug))
    .limit(1)

  if (!endpoint) return json({ error: 'Endpoint not found' }, 404)
  if (!endpoint.isActive) return json({ error: 'Endpoint is disabled' }, 410)
  if (endpoint.expiresAt && endpoint.expiresAt.getTime() < Date.now()) {
    return json({ error: 'Endpoint expired' }, 410)
  }

  const method = request.method.toUpperCase()
  const allowed = endpoint.allowedMethods as string[]
  const methodOk =
    allowed.includes('ANY') || allowed.includes(method) || allowed.length === 0
  if (!methodOk) return json({ error: 'Method not allowed' }, 405)

  const receivedAt = new Date()
  const url = new URL(request.url)
  const queryParams: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value
  })

  const headers = pickHeaders(request.headers)
  let body: string | null = null
  if (method !== 'GET' && method !== 'HEAD') {
    const buf = await request.arrayBuffer().catch(() => null)
    if (buf && buf.byteLength > 0) {
      body = new TextDecoder().decode(buf.slice(0, MAX_BODY))
    }
  }
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  const userAgent = request.headers.get('user-agent') ?? null
  const contentType = request.headers.get('content-type') ?? null

  // ── Relay (optional) ─────────────────────────────────────────────────────
  const sub = await getOrCreateSubscription(endpoint.userId)
  const limits = PLAN_LIMITS[sub.plan]

  let relayEnabled = false
  let relayUrl: string | null = null
  let relayStatus: number | null = null
  let relayResponseBody: string | null = null
  let relayResponseHeaders: Record<string, string> = {}
  let relayDurationMs: number | null = null
  let relayTimedOut = false
  let relayPassthrough = false
  let relayError: string | null = null

  if (endpoint.relayEnabled && endpoint.relayUrl) {
    relayEnabled = true
    relayUrl = endpoint.relayUrl
    relayPassthrough = endpoint.relayPassthrough
    const relayMethod = (endpoint.relayMethod ?? method) as string
    const timeout = Math.min(endpoint.relayTimeoutMs, limits.relayTimeoutMs)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const start = Date.now()
    try {
      const relayRes = await fetch(endpoint.relayUrl, {
        method: relayMethod,
        headers: mergeRelayHeaders(endpoint.relayHeaders as Record<string, string>, headers),
        body:
          relayMethod !== 'GET' && relayMethod !== 'HEAD' ? body : undefined,
        signal: controller.signal,
      })
      relayDurationMs = Date.now() - start
      relayStatus = relayRes.status
      relayResponseHeaders = pickHeaders(relayRes.headers, true)
      relayResponseBody =
        (await relayRes.text().catch(() => null))?.slice(0, MAX_BODY) ?? null
    } catch (err) {
      const e = err as { name?: string; message?: string }
      if (e?.name === 'AbortError') relayTimedOut = true
      else relayError = e?.message ?? String(err)
    } finally {
      clearTimeout(timer)
    }
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const reqId = newId()
  await db.insert(requests).values({
    id: reqId,
    endpointId: endpoint.id,
    method,
    headers,
    queryParams,
    body,
    ip,
    userAgent,
    contentType,
    responseStatus: null,
    responseBody: null,
    relayEnabled,
    relayUrl,
    relayStatus,
    relayResponseBody,
    relayResponseHeaders,
    relayDurationMs,
    relayTimedOut,
    relayPassthrough,
    relayError,
  })

  // Rolling request cap: trim oldest rows beyond the plan limit.
  const [{ total }] = await db
    .select({ total: count() })
    .from(requests)
    .where(eq(requests.endpointId, endpoint.id))
  if (total > limits.maxRequestsPerEndpoint) {
    const excess = total - limits.maxRequestsPerEndpoint
    const stale = await db
      .select({ id: requests.id })
      .from(requests)
      .where(eq(requests.endpointId, endpoint.id))
      .orderBy(requests.receivedAt)
      .limit(excess)
    if (stale.length) {
      await db
        .delete(requests)
        .where(inArray(requests.id, stale.map((r) => r.id)))
    }
  }

  // Roll the TTL forward.
  const expiresAt = new Date(Date.now() + limits.ttlDays * 86_400_000)
  await db
    .update(endpoints)
    .set({ lastUsedAt: receivedAt, expiresAt, updatedAt: new Date() })
    .where(eq(endpoints.id, endpoint.id))

  // ── Respond ─────────────────────────────────────────────────────────────
  if (relayEnabled && relayPassthrough && limits.relayPassthrough) {
    const outHeaders = pickHeaders(relayResponseHeaders, true)
    return new Response(relayResponseBody ?? '', {
      status: relayStatus ?? 502,
      headers: outHeaders,
    })
  }

  if (endpoint.mode === 'respond') {
    const outHeaders: Record<string, string> = {
      'content-type': endpoint.responseContentType,
    }
    if (limits.customResponseHeaders) {
      Object.assign(outHeaders, endpoint.responseHeaders as Record<string, string>)
    }
    return new Response(endpoint.responseBody ?? '', {
      status: endpoint.responseStatus,
      headers: outHeaders,
    })
  }

  return json({ ok: true, id: reqId, receivedAt: receivedAt.toISOString() }, 200)
}

/** Delete every endpoint whose TTL has elapsed. Returns the count removed. */
export async function runCleanup() {
  const expired = await db
    .select({ id: endpoints.id })
    .from(endpoints)
    .where(lt(endpoints.expiresAt, new Date()))

  if (expired.length > 0) {
    await db.delete(endpoints).where(
      inArray(
        endpoints.id,
        expired.map((e) => e.id),
      ),
    )
  }
  return expired.length
}
