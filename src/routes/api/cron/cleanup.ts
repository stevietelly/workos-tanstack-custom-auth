import { createFileRoute } from '@tanstack/react-router'
import { runCleanup } from '@/server/callback'

export const Route = createFileRoute('/api/cron/cleanup')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = request.headers.get('x-cron-secret')
        if (!secret || secret !== process.env.CRON_SECRET) {
          return new Response('forbidden', { status: 403 })
        }

        const deleted = await runCleanup()
        return new Response(JSON.stringify({ deleted }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      },
    },
  },
})
