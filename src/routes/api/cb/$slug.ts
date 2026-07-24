import { createFileRoute } from '@tanstack/react-router'
import { handleCallbackRequest } from '@/server/callback'

export const Route = createFileRoute('/api/cb/$slug')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleCallbackRequest({ request, slug: params.slug }),
      POST: ({ request, params }) =>
        handleCallbackRequest({ request, slug: params.slug }),
      PUT: ({ request, params }) =>
        handleCallbackRequest({ request, slug: params.slug }),
      PATCH: ({ request, params }) =>
        handleCallbackRequest({ request, slug: params.slug }),
      DELETE: ({ request, params }) =>
        handleCallbackRequest({ request, slug: params.slug }),
      HEAD: ({ request, params }) =>
        handleCallbackRequest({ request, slug: params.slug }),
      OPTIONS: ({ request, params }) =>
        handleCallbackRequest({ request, slug: params.slug }),
    },
  },
})
