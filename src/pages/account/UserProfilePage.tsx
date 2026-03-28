import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserProfile, useAuth } from '@clerk/clerk-react';

export function UserProfilePage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/account/login', { replace: true, state: { from: '/account/profile' } });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] pt-[168px] pb-20 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading profile...</p>
        </div>
      </section>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/account/login" replace state={{ from: '/account/profile' }} />;
  }

  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-[168px] pb-20 px-6 lg:px-12 min-h-[70vh]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia account</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Complete your profile
          </h2>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-md">
            Keep your account details polished so checkout and support feel seamless.
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl overflow-hidden border border-[#0B0B0D]/10 bg-white shadow-[0_20px_60px_rgba(11,11,13,0.06)]">
          <div className="absolute inset-x-0 top-0 h-1 accent-bg" />
          <div className="p-4 lg:p-6">
            <UserProfile
              routing="path"
              path="/account/profile"
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-full',
                  card: 'shadow-none border-0 bg-transparent w-full max-w-full',
                  navbar: 'max-w-full',
                  pageScrollBox: 'w-full max-w-full',
                  cardBox: 'w-full max-w-full',
                },
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/account/dashboard')} className="btn-pink-outline px-4 py-2 text-sm">
            Go to dashboard
          </button>
          <button onClick={() => navigate('/shop')} className="px-4 py-2 border border-[#0B0B0D]/10 text-sm hover:border-[#0B0B0D] transition-colors bg-white">
            Continue shopping
          </button>
        </div>
      </div>
    </section>
  );
}