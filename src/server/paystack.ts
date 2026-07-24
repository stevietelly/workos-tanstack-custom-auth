import { createHmac, timingSafeEqual } from 'node:crypto'

const BASE = 'https://api.paystack.co'

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'content-type': 'application/json',
  }
}

export type InitializeArgs = {
  email: string
  planCode: string
  currency: 'KES' | 'USD'
  reference: string
  callbackUrl: string
  userId: string
}

export async function initializeTransaction(args: InitializeArgs) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      email: args.email,
      plan: args.planCode,
      currency: args.currency,
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: { userId: args.userId },
    }),
  })
  const data = await res.json()
  if (!data.status) {
    throw new Error(data.message ?? 'Paystack initialize failed')
  }
  return data.data as { authorization_url: string; reference: string }
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(
    `${BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: authHeaders() },
  )
  const data = await res.json()
  if (!data.status) {
    throw new Error(data.message ?? 'Paystack verify failed')
  }
  return data.data as {
    status: string
    reference: string
    metadata?: { userId?: string }
    customer?: { email?: string; customer_code?: string }
    plan?: string
  }
}

export function verifyWebhookSignature(rawBody: string, signature?: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signature) return false
  const hash = createHmac('sha512', secret).update(rawBody).digest()
  const sig = Buffer.from(signature, 'hex')
  if (sig.length !== hash.length) return false
  return timingSafeEqual(hash, sig)
}
