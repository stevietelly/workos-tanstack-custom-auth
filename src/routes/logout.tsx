import { createFileRoute, redirect } from '@tanstack/react-router'
import { signOut } from '@workos/authkit-tanstack-react-start'

/**
 * Sign-out route. `signOut` terminates the server session and (in this SDK)
 * throws a redirect to the AuthKit logout URL, so it must be called from a
 * loader where redirect handling works correctly.
 */
export const Route = createFileRoute('/logout')({
  loader: async () => {
    await signOut()
    throw redirect({ to: '/' })
  },
})
