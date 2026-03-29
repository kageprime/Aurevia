import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SignIn, useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { AccountAuthShell } from '@/pages/account/AccountAuthShell';
import { fetchJson, readJsonResponse } from '@/lib/apiErrors';

const backendUrl =
  (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';

type AdminAccessState = 'idle' | 'checking' | 'allowed' | 'denied';

export function AdminLoginPage() {
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [adminAccessState, setAdminAccessState] = useState<AdminAccessState>('idle');
  const [adminError, setAdminError] = useState('');

  const usingTestKey = Boolean((import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.startsWith('pk_test_'));
  const isNonLocalHost = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setAdminAccessState('idle');
      setAdminError('');
      return;
    }

    let cancelled = false;

    const verifyAdminAccess = async () => {
      setAdminAccessState('checking');

      try {
        const sessionToken = await getToken();
        const response = await fetchJson(`${backendUrl.replace(/\/$/, '')}/api/admin/me`, {
          credentials: 'include',
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined,
        });
        const data = await readJsonResponse<{ ok?: boolean; error?: string }>(response);
        if (cancelled) {
          return;
        }

        if (response.ok && data?.ok) {
          setAdminAccessState('allowed');
          setAdminError('');
          return;
        }

        setAdminAccessState('denied');
        setAdminError(data?.error || 'This account is signed in but not authorized for admin access.');
      } catch {
        if (!cancelled) {
          setAdminAccessState('denied');
          setAdminError('Could not verify admin access. Check backend auth keys and try again.');
        }
      }
    };

    void verifyAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (isLoaded && isSignedIn && adminAccessState === 'allowed') {
    return <Navigate to="/admin/orders" replace />;
  }

  if (!isLoaded || (isSignedIn && (adminAccessState === 'idle' || adminAccessState === 'checking'))) {
    return (
      <section className="min-h-screen bg-[#F6F6F2] px-6 py-24">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">
            {isSignedIn ? 'Verifying admin access...' : 'Loading admin sign-in...'}
          </p>
        </div>
      </section>
    );
  }

  if (isSignedIn && adminAccessState === 'denied') {
    return (
      <AccountAuthShell
        mode="login"
        title="Admin access blocked"
        description="You are signed in, but this account is not authorized for the admin allowlist on the backend."
        highlights={[
          adminError || 'Unauthorized',
          'Sign in with the configured ADMIN_EMAIL account.',
          'Frontend and backend must use Clerk keys from the same instance.',
        ]}
        actionText="Back to storefront"
        actionHref="/"
      >
        <div className="space-y-4">
          <div className="rounded border border-[#0B0B0D]/10 bg-white p-4 text-sm text-[#0B0B0D]">
            Signed in as: <span className="font-semibold">{user?.primaryEmailAddress?.emailAddress ?? 'Unknown account'}</span>
          </div>
          {usingTestKey && isNonLocalHost ? (
            <div className="rounded border border-[#F97316]/35 bg-[#FFF7ED] p-4 text-sm text-[#9A3412]">
              Detected a <strong>test Clerk key</strong> on a non-local domain. This can trigger cookie domain warnings
              like <strong>__clerk_test_etld</strong> and break production login/session checks.
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/admin/login' })}
            className="accent-bg hover:brightness-110 text-white px-4 py-2 text-sm"
          >
            Sign out and switch account
          </button>
        </div>
      </AccountAuthShell>
    );
  }

  return (
    <AccountAuthShell
      mode="login"
      title="Sign in with the admin Clerk account"
      description="This route is reserved for the admin allowlist. After sign-in, the backend verifies your email before opening the panel."
      highlights={[
        'Backend-verified access only',
        'Separate from customer sign-in',
        'Keeps the admin console controlled and auditable',
      ]}
      actionText="Back to storefront"
      actionHref="/"
    >
      <SignIn
        routing="path"
        path="/admin/login"
        forceRedirectUrl="/admin/orders"
        fallbackRedirectUrl="/admin/orders"
        withSignUp={false}
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none border-0 bg-transparent',
            formButtonPrimary: 'accent-bg hover:brightness-110 text-white',
            footerActionLink: 'accent-text',
            identityPreviewEditButton: 'accent-text',
          },
        }}
      />
    </AccountAuthShell>
  );
}
