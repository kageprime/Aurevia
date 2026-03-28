import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { listUserOrders, type OrderRecord } from '@/lib/ordersApi';
import { fetchJson, readJsonResponse } from '@/lib/apiErrors';
import { formatTrackingStatus } from '@/lib/orderTracking';
import { useAuth, useClerk } from '@clerk/clerk-react';

type DashboardUser = {
  name?: string;
  email?: string;
};

export function UserDashboardPage() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const sessionToken = await getToken();
        const [profileResponse, userOrders] = await Promise.all([
          fetchJson(`${(import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng'}/api/users/me`, {
            credentials: 'include',
            headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined,
          }),
          listUserOrders(getToken),
        ]);

        const profileData = await readJsonResponse<{ ok?: boolean; error?: string; user?: unknown }>(profileResponse);
        if (!profileResponse.ok || !profileData?.ok) {
          throw new Error(profileData?.error ?? 'Could not load dashboard.');
        }

        const profile = profileData.user as DashboardUser;
        setUser(profile);
        setOrders(userOrders);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load dashboard.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [getToken]);

  if (isLoaded && !isSignedIn) {
    return <Navigate to="/account/login" replace state={{ from: '/account/dashboard' }} />;
  }

  if (!isLoaded) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <p className="text-[#6E6E73]">Loading your dashboard...</p>
      </section>
    );
  }

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/account/login' });
    navigate('/account/login', { replace: true });
  };

  return (
    <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white border border-[#0B0B0D]/10 p-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Your Dashboard
            </h2>
            {user && (
              <p className="text-sm text-[#6E6E73]">
                {user.name} · {user.email}
              </p>
            )}
          </div>
          <button onClick={handleLogout} className="btn-pink-outline px-4 py-2 text-sm">Logout</button>
        </div>

        <div className="bg-white border border-[#0B0B0D]/10 p-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Profile
            </h3>
            <p className="text-sm text-[#6E6E73]">
              Keep your profile details current and return to the storefront when you’re done.
            </p>
          </div>
          <button onClick={() => navigate('/account/profile')} className="btn-pink-outline px-4 py-2 text-sm">
            Open Profile
          </button>
        </div>

        <div className="bg-white border border-[#0B0B0D]/10 p-6">
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Order History
          </h3>

          {isLoading ? (
            <p className="text-[#6E6E73]">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-[#6E6E73]">No orders yet. Start shopping to place your first order.</p>
          ) : (
            <div className="divide-y divide-[#0B0B0D]/10">
              {orders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-xs text-[#6E6E73]">Status: {formatTrackingStatus(order.status)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${Number(order.subtotal).toFixed(2)}</p>
                    <button
                      onClick={() => navigate(`/manual-order/${order.id}`)}
                      className="text-xs accent-text underline"
                    >
                      Track order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
