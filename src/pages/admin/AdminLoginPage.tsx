import { Navigate } from 'react-router-dom';
import { SignIn, useAuth } from '@clerk/clerk-react';

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
    <section className="min-h-screen bg-[#F6F6F2] px-6 py-24">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
        <div className="bg-white border border-[#0B0B0D]/10 p-6 lg:p-8 sticky top-24">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Admin access</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Sign in with the admin Clerk account
          </h2>
          <p className="mt-4 text-sm text-[#6E6E73]">
            This route is reserved for the admin allowlist. After sign-in, the backend verifies your email before opening the panel.
          </p>
        </div>

        <div className="bg-white border border-[#0B0B0D]/10 p-4 lg:p-6 min-h-[620px]">
          <SignIn
            routing="path"
            path="/admin/login"
            forceRedirectUrl="/admin/orders"
            fallbackRedirectUrl="/admin/orders"
            withSignUp={false}
            appearance={{ elements: { rootBox: 'w-full' } }}
          />
        </div>
      </div>
    </section>
  );
}
