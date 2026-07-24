import { createFileRoute } from '@tanstack/react-router'
import { getAllUsers } from '@/server/admin'

export const Route = createFileRoute('/api/admin/users')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const rows = await getAllUsers()
          return Response.json(rows)
        } catch (err) {
          const status = (err as Error).message === 'Forbidden' ? 403 : 401
          return new Response((err as Error).message, { status })
        }
      },
    },
  },
})
