import { Navigate } from 'react-router-dom';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { AccountAuthShell } from '@/pages/account/AccountAuthShell';

export function AdminLoginPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/admin/orders" replace />;
  }

  if (!isLoaded) {
    return (
      <section className="min-h-screen bg-[#F6F6F2] px-6 py-24">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading admin sign-in...</p>
        </div>
      </section>
    );
  };

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
