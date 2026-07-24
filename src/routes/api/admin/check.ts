import { createFileRoute } from '@tanstack/react-router'
import { checkAdmin } from '@/server/admin'

export const Route = createFileRoute('/api/admin/check')({
  server: {
    handlers: {
      GET: async () => {
        const result = await checkAdmin()
        return Response.json(result)
      },
    },
  },
})
