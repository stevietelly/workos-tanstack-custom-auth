import { createFileRoute } from '@tanstack/react-router';
import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start';
import { getAuthkit } from '@workos/authkit-tanstack-react-start';
import { workos } from '@/lib/workos';

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
            const rawData = errorData.rawData;

            if (rawData?.code === 'organization_selection_required') {
              const pendingAuthenticationToken =
                rawData.pending_authentication_token;
              const firstOrg = rawData.organizations?.[0];

              if (firstOrg && pendingAuthenticationToken) {
                try {
                  const authResponse =
                    await workos.userManagement.authenticateWithOrganizationSelection(
                      {
                        pendingAuthenticationToken,
                        organizationId: firstOrg.id,
                        clientId: process.env.WORKOS_CLIENT_ID!,
                        session: {
                          sealSession: true,
                          cookiePassword: process.env
                            .WORKOS_COOKIE_PASSWORD,
                        },
                      },
                    );

                  const sealedSession = (authResponse as any).sealedSession;
                  if (!sealedSession) {
                    return new Response(null, {
                      status: 302,
                      headers: { Location: '/auth/login' },
                    });
                  }

                  const authkit = await getAuthkit();
                  await authkit.saveSession(undefined, sealedSession);

                  return new Response(null, {
                    status: 307,
                    headers: { Location: '/app/account' },
                  });
                } catch {
                  return new Response(null, {
                    status: 302,
                    headers: {
                      Location: '/auth/login',
                    },
                  });
                }
              }
            }

            return new Response(null, {
              status: 302,
              headers: {
                Location: `/auth/login?error=${encodeURIComponent('Authentication failed')}`,
              },
            });
          },
        })({ request });
      },
    },
  },
});
