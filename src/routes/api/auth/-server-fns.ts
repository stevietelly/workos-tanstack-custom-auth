import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { workos } from '#/lib/workos'
import { getAuthkit } from '@workos/authkit-tanstack-react-start'

/**
 * Server functions for custom email/password auth.
 *
 * These run on the server only. They talk to WorkOS directly, then persist the
 * resulting session via AuthKit's `saveSession` so the middleware picks it up on
 * the next request. The client calls them from the custom login / signup forms.
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const signUpSchema = credentialsSchema.extend({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
})

export const signInWithPassword = createServerFn({ method: 'POST' })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    const authkit = await getAuthkit()

    const authResponse = await workos.userManagement.authenticateWithPassword({
      email: data.email,
      password: data.password,
      clientId: process.env.WORKOS_CLIENT_ID!,
      session: {
        sealSession: true,
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD!,
      },
    })

    if (!authResponse.sealedSession) {
      throw new Error('Unable to establish session')
    }

    await authkit.saveSession(undefined, authResponse.sealedSession)

    return { user: authResponse.user }
  })

export const signUpWithPassword = createServerFn({ method: 'POST' })
  .validator(signUpSchema)
  .handler(async ({ data }) => {
    const authkit = await getAuthkit()

    // 1. Create the user in WorkOS.
    await workos.userManagement.createUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    })

    // 2. Authenticate so we get a sealed session to persist.
    const authResponse = await workos.userManagement.authenticateWithPassword({
      email: data.email,
      password: data.password,
      clientId: process.env.WORKOS_CLIENT_ID!,
      session: {
        sealSession: true,
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD!,
      },
    })

    if (!authResponse.sealedSession) {
      throw new Error('Unable to establish session')
    }

    await authkit.saveSession(undefined, authResponse.sealedSession)

    return { user: authResponse.user }
  })
