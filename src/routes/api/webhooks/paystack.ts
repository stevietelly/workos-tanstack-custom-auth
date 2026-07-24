import { createFileRoute } from '@tanstack/react-router'
import { verifyWebhookSignature } from '@/server/paystack'
import { processPaystackEvent } from '@/server/billing'

export const Route = createFileRoute('/api/webhooks/paystack')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text()
        const signature = request.headers.get('x-paystack-signature')

        if (!verifyWebhookSignature(raw, signature)) {
          return new Response('invalid signature', { status: 401 })
        }

        try {
          const event = JSON.parse(raw)
          await processPaystackEvent(event)
        } catch (err) {
          return new Response('event processing failed', { status: 500 })
        }

        return new Response('ok', { status: 200 })
      },
    },
  },
})
