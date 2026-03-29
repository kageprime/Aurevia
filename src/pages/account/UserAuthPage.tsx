import { Navigate, useLocation } from 'react-router-dom';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { AccountAuthShell } from '@/pages/account/AccountAuthShell';

export function UserAuthPage() {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  const redirectPath = (location.state as { from?: string } | undefined)?.from ?? '/account/profile';

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!isLoaded) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading sign-in flow...</p>
        </div>
      </section>
    );
  };

  return (
    <AccountAuthShell
      mode="login"
      title="Sign in to continue your order"
      description="Use your existing account to checkout, view receipts, and revisit your order history."
      highlights={[
        'Resume checkout without starting over',
        'See receipts and transfer updates in one place',
        'Keep delivery details ready for the next order',
      ]}
      actionText="Need an account? Create one"
      actionHref="/account/register"
      actionState={location.state}
    >
      <SignIn
        routing="path"
        path="/account/login"
        signUpUrl="/account/register"
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
