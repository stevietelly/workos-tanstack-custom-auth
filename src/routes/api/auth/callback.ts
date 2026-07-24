import { createFileRoute } from '@tanstack/react-router';
import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (error) {
          const loginUrl = new URL('/auth/login', url.origin);
          loginUrl.searchParams.set('error', error);
          if (errorDescription) {
            loginUrl.searchParams.set('error_description', errorDescription);
          }
          const errorUri = url.searchParams.get('error_uri');
          if (errorUri) {
            loginUrl.searchParams.set('error_uri', errorUri);
          }
          return new Response(null, {
            status: 302,
            headers: { Location: loginUrl.toString() },
          });
        }

        return handleCallbackRoute({
          onError: async ({ error }) => {
            const errorData = error as any;

            // When the user belongs to multiple organizations, AuthKit can't
            // finish the code exchange until they pick one. Send them to the
            // hosted organization-selection screen (AuthKit provides the URL),
            // which redirects back here once they've chosen — at which point the
            // callback succeeds. This avoids the brittle "auto-select first org"
            // flow that throws for multi-org accounts.
            const authUrl: string | undefined = errorData?.authorizationUrl
            if (authUrl) {
              return new Response(null, {
                status: 307,
                headers: { Location: authUrl },
              })
            }

            const loginUrl = new URL('/auth/login', url.origin)
            loginUrl.searchParams.set(
              'error',
              errorData?.message ?? 'Authentication failed',
            )
            return new Response(null, {
              status: 307,
              headers: { Location: loginUrl.toString() },
            })
          },
        })({ request });
      },
    },
  },
});
