import { createFileRoute } from '@tanstack/react-router'
import { verifyCheckout } from '@/server/billing'

export const Route = createFileRoute('/api/billing/verify')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reference = new URL(request.url).searchParams.get('reference')
        if (!reference) {
          return new Response('Missing reference', { status: 400 })
        }
        try {
          const res = await verifyCheckout({ data: { reference } })
          return Response.json(res)
        } catch (err) {
          return new Response(
            JSON.stringify({ error: (err as Error).message ?? 'Verification failed' }),
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
