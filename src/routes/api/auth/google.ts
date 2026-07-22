import { createFileRoute } from '@tanstack/react-router';
import { getAuthkit } from '@workos/authkit-tanstack-react-start';
import { getRedirectUri } from '@/lib/workos';

export const Route = createFileRoute('/api/auth/google')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url)
        const isSignUp = url.searchParams.get('screen_hint') === 'sign-up'
        const authkit = await getAuthkit();
        const { url: authorizationUrl } = await authkit.createAuthorization(undefined, {
          screenHint: isSignUp ? 'sign-up' : 'sign-in',
          redirectUri: getRedirectUri(request.headers.get('host') || undefined),
        });
        const parsedUrl = new URL(authorizationUrl);
        parsedUrl.searchParams.set('provider', 'GoogleOAuth');
        parsedUrl.searchParams.delete('screenHint');
        parsedUrl.searchParams.delete('screen_hint');

        return new Response(null, {
          status: 307,
          headers: { Location: parsedUrl.toString() },
        });
      },
    },
  },
});
