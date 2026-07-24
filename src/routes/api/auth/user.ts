import { createFileRoute } from '@tanstack/react-router'
import { upsertUser } from '@/server/auth'

export const Route = createFileRoute('/api/auth/user')({
  server: {
    handlers: {
      GET: async () => {
        const user = await upsertUser()
        return Response.json({ user })
      },
    },
  },
})
