import { AuthKitProvider } from '@workos/authkit-tanstack-react-start/client'

/**
 * Client-side AuthKit provider.
 *
 * This wraps the whole app so client components can call `useAuth()` to read
 * the current user / session without a round-trip. We seed it with
 * `initialAuth` from the SSR loader (see `src/routes/__root.tsx`) so there is
 * no flash of "logged out" state on first paint.
 *
 * Note: the client provider does NOT need the WorkOS client ID / API hostname —
 * those are read from the server environment via the AuthKit middleware.
 */
export default function AppWorkOSProvider({
  children,
  initialAuth,
}: {
  children: React.ReactNode
  initialAuth?: unknown
}) {
  return (
    <AuthKitProvider initialAuth={initialAuth as never}>
      {children}
    </AuthKitProvider>
  )
}
