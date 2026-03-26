import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';

export function UserAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  const redirectPath = (location.state as { from?: string } | undefined)?.from ?? '/account/dashboard';
  const isRegisterRoute = location.pathname.endsWith('/register');

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!isLoaded) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading sign-in flow...</p>
        </div>
      </section>
    );
  };

  return (
    <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
        <div className="bg-white border border-[#0B0B0D]/10 p-6 lg:p-8 sticky top-24">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia account</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isRegisterRoute ? 'Create your shopping profile' : 'Sign in to continue your order'}
          </h2>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-md">
            {isRegisterRoute
              ? 'Create an account to place orders, track receipts, and keep your checkout details in one place.'
              : 'Use your existing account to checkout, view receipts, and revisit your order history.'}
          </p>

          <div className="mt-6 flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => navigate('/account/login', { replace: true })}
              className={`px-4 py-2 border ${!isRegisterRoute ? 'accent-bg text-white border-transparent' : 'border-[#0B0B0D]/10'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/account/register', { replace: true })}
              className={`px-4 py-2 border ${isRegisterRoute ? 'accent-bg text-white border-transparent' : 'border-[#0B0B0D]/10'}`}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#0B0B0D]/10 p-4 lg:p-6 min-h-[680px]">
          {isRegisterRoute ? (
            <SignUp
              routing="path"
              path="/account/register"
              signInUrl="/account/login"
              forceRedirectUrl={redirectPath}
              fallbackRedirectUrl={redirectPath}
              appearance={{ elements: { rootBox: 'w-full' } }}
            />
          ) : (
            <SignIn
              routing="path"
              path="/account/login"
              signUpUrl="/account/register"
              forceRedirectUrl={redirectPath}
              fallbackRedirectUrl={redirectPath}
              appearance={{ elements: { rootBox: 'w-full' } }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
