import { Navigate, useLocation } from 'react-router-dom';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { AccountAuthShell } from '@/pages/account/AccountAuthShell';

export function UserSignUpPage() {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  const redirectPath = (location.state as { from?: string } | undefined)?.from ?? '/account/profile';

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!isLoaded) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading sign-up flow...</p>
        </div>
      </section>
    );
  }

  return (
    <AccountAuthShell
      mode="signup"
      title="Create your shopping profile"
      description="Create an account to place orders, track receipts, and keep your checkout details in one place."
      highlights={[
        'Save your checkout details for faster ordering',
        'Track transfer receipts and order updates',
        'Keep every Aurevia purchase in one profile',
      ]}
      actionText="Already have an account? Sign in"
      actionHref="/account/login"
      actionState={location.state}
    >
      <SignUp
        routing="path"
        path="/account/register"
        signInUrl="/account/login"
        forceRedirectUrl={redirectPath}
        fallbackRedirectUrl={redirectPath}
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