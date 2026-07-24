import { createFileRoute } from '@tanstack/react-router'
import { getBillingInfo } from '@/server/billing'

export const Route = createFileRoute('/api/billing/info')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const info = await getBillingInfo()
          return Response.json(info)
        } catch {
          return new Response('Unauthorized', { status: 401 })
        }
      },
    },
  },
})
