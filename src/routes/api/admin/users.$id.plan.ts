import { createFileRoute } from '@tanstack/react-router'
import { setUserPlan } from '@/server/admin'

export const Route = createFileRoute('/api/admin/users/$id/plan')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const body = await request.json()
          const data = await setUserPlan({
            data: { userId: params.id, plan: body.plan },
          })
          return Response.json(data)
        } catch (err) {
          const msg = (err as Error).message
          const status = msg === 'Forbidden' ? 403 : msg === 'User not found' ? 404 : 401
          return new Response(msg, { status })
        }
      },
    },
  },
})
