import { createFileRoute } from '@tanstack/react-router'
import { getUserDetail } from '@/server/admin'

export const Route = createFileRoute('/api/admin/users/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const data = await getUserDetail({ data: { userId: params.id } })
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
