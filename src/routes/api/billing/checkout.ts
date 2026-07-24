import { createFileRoute } from '@tanstack/react-router'
import { startCheckout } from '@/server/billing'

export const Route = createFileRoute('/api/billing/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const res = await startCheckout({ data: body })
          return Response.json(res)
        } catch (err) {
          return new Response(
            JSON.stringify({ error: (err as Error).message ?? 'Checkout failed' }),
            {
              status: 400,
              headers: { 'content-type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
