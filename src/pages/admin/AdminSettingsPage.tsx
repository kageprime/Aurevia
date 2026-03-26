import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { listFeaturedProducts } from '@/lib/productsApi';
import { getPlatformHealth, type PlatformHealth } from '@/lib/platformApi';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [featuredCounts, setFeaturedCounts] = useState<Record<string, number>>({});
  const [isLoadingPlatform, setIsLoadingPlatform] = useState(true);

  useEffect(() => {
    const loadPlatformState = async () => {
      setIsLoadingPlatform(true);
      try {
        const [platformHealth, featuredBySection] = await Promise.all([
          getPlatformHealth(),
          listFeaturedProducts(),
        ]);

        setHealth(platformHealth);
        const counts = Object.entries(featuredBySection).reduce<Record<string, number>>((acc, [key, products]) => {
          acc[key] = products.length;
          return acc;
        }, {});
        setFeaturedCounts(counts);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load platform status.';
        toast.error(message);
      } finally {
        setIsLoadingPlatform(false);
      }
    };

    loadPlatformState();
  }, []);

  const totalFeaturedProducts = useMemo(
    () => Object.values(featuredCounts).reduce((sum, count) => sum + count, 0),
    [featuredCounts]
  );

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/admin/login' });
    navigate('/admin/login', { replace: true });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Settings
      </h2>

      <div className="bg-white border border-[#0B0B0D]/10 p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Admin Session</h3>
          <p className="text-sm text-[#6E6E73]">
            Your admin session now uses browser cookies with backend validation and refresh.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Platform Integration Status</h3>

          {isLoadingPlatform ? (
            <p className="text-sm text-[#6E6E73]">Loading platform status...</p>
          ) : (
            <div className="text-sm text-[#6E6E73] space-y-1">
              <p>
                Backend service: <span className="text-[#0B0B0D] font-medium">{health?.service ?? 'unknown'}</span>
              </p>
              <p>
                Active storage mode: <span className="text-[#0B0B0D] font-medium">{health?.storage ?? 'unknown'}</span>
              </p>
              <p>
                Featured carousel sections connected: <span className="text-[#0B0B0D] font-medium">{Object.keys(featuredCounts).length}</span>
              </p>
              <p>
                Featured products assigned across sections: <span className="text-[#0B0B0D] font-medium">{totalFeaturedProducts}</span>
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-1">Security Checklist</h3>
          <ul className="text-sm text-[#6E6E73] space-y-1 list-disc pl-5">
            <li>Use a strong `ADMIN_PASSWORD` in backend environment.</li>
            <li>Set `WHATSAPP_BACKEND_API_KEY` for API key fallback security.</li>
            <li>Restrict `FRONTEND_ORIGIN` to your production domain.</li>
          </ul>
        </div>

        <button onClick={handleLogout} className="btn-pink-outline px-4 py-2 text-sm">
          Logout
        </button>
      </div>
    </section>
  );
}
