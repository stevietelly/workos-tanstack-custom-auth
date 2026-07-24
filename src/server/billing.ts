import { createServerFn } from '@tanstack/react-start'
import { getAuth } from '@workos/authkit-tanstack-react-start'
import { z } from 'zod'
import { db } from '@/db'
import { users, subscriptions, PLAN_LIMITS } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  initializeTransaction,
  verifyTransaction,
} from './paystack'
import { getOrCreateSubscription, requireSubscription } from './auth'
import { newId } from './ids'

type Tier = 'pro' | 'enterprise'
type Currency = 'KES' | 'USD'

function planCodeFor(tier: Tier, currency: Currency): string | undefined {
  if (tier === 'pro') {
    return currency === 'KES'
      ? process.env.PAYSTACK_PRO_KES_PLAN
      : process.env.PAYSTACK_PRO_USD_PLAN
  }
  return currency === 'KES'
    ? process.env.PAYSTACK_ENT_KES_PLAN
    : process.env.PAYSTACK_ENT_USD_PLAN
}

function tierFromPlanCode(code?: string): Tier | null {
  if (!code) return null
  const codes = [
    process.env.PAYSTACK_PRO_KES_PLAN,
    process.env.PAYSTACK_PRO_USD_PLAN,
  ]
  if (codes.includes(code)) return 'pro'
  const entCodes = [
    process.env.PAYSTACK_ENT_KES_PLAN,
    process.env.PAYSTACK_ENT_USD_PLAN,
  ]
  if (entCodes.includes(code)) return 'enterprise'
  return null
}

export const getBillingInfo = createServerFn({ method: 'GET' }).handler(
  async () => {
    const sub = await requireSubscription()
    return {
      plan: sub.plan,
      planStatus: sub.planStatus,
      currency: sub.currency,
      limits: PLAN_LIMITS[sub.plan],
      paystackCustomerId: sub.paystackCustomerId ?? null,
      subscriptionCode: sub.paystackSubscriptionCode ?? null,
    }
  },
)

export const startCheckout = createServerFn({ method: 'POST' })
  .validator(z.object({ tier: z.enum(['pro', 'enterprise']), currency: z.enum(['KES', 'USD']) }))
  .handler(async ({ data, request }) => {
    const { user } = await getAuth()
    if (!user) throw new Error('Unauthenticated')

    const planCode = planCodeFor(data.tier, data.currency)
    if (!planCode) {
      throw new Error('That plan is not configured. Check your Paystack plan codes.')
    }

    const reference = `gh_${newId()}`
    const origin = new URL(request.url).origin
    const res = await initializeTransaction({
      email: user.email,
      planCode,
      currency: data.currency,
      reference,
      callbackUrl: `${origin}/billing/callback`,
      userId: user.id,
    })
    return { url: res.authorization_url }
  })

export const verifyCheckout = createServerFn({ method: 'GET' })
  .validator(z.object({ reference: z.string() }))
  .handler(async ({ data }) => {
    const txn = await verifyTransaction(data.reference)
    if (txn.status === 'success') {
      await processPaystackEvent({ event: 'invoice.payment_success', data: txn as any })
    }
    return { status: txn.status }
  })

/**
 * Apply a Paystack webhook / verification event to the user's subscription.
 * Lookups are email-based (carried on every Paystack event) so we never depend
 * on metadata round-tripping through the subscription.
 */
export async function processPaystackEvent(event: {
  event: string
  data: Record<string, any>
}) {
  const ev = event.event
  const d = event.data ?? {}
  const email: string | undefined =
    d.customer?.email ?? d.metadata?.email ?? d.email
  if (!email) return

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (!user) return

  await getOrCreateSubscription(user.id)
  const currency: Currency = d.currency ?? 'KES'

  if (ev === 'subscription.create' || ev === 'invoice.payment_success') {
    const plan = tierFromPlanCode(d.plan?.plan_code) ?? 'pro'
    await db
      .update(subscriptions)
      .set({
        plan,
        planStatus: 'active',
        currency,
        paystackCustomerId: d.customer?.customer_code ?? null,
        paystackSubscriptionId: String(
          d.subscription?.id ?? d.subscription?.subscription ?? '',
        ),
        paystackSubscriptionCode:
          d.subscription?.subscription_code ?? null,
        planExpiresAt: d.subscription?.next_charge_at
          ? new Date(d.subscription.next_charge_at)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, user.id))
  } else if (
    ev === 'subscription.disable' ||
    ev === 'invoice.payment_failed'
  ) {
    await db
      .update(subscriptions)
      .set({
        planStatus: ev === 'subscription.disable' ? 'cancelled' : 'expired',
        plan: 'free',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, user.id))
  }
}
