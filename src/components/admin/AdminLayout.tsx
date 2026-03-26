import { useEffect, useState } from 'react';
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { fetchJson, readJsonResponse } from '@/lib/apiErrors';

const backendUrl = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'accent-bg text-white' : 'text-[#0B0B0D] hover:bg-[#0B0B0D]/5'
  }`;

export function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [isAdminAllowed, setIsAdminAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const verifyAdminAccess = async () => {
      try {
        const response = await fetchJson(`${backendUrl.replace(/\/$/, '')}/api/admin/me`, {
          credentials: 'include',
        });
        const data = await readJsonResponse<{ ok?: boolean }>(response);
        setIsAdminAllowed(Boolean(response.ok && data?.ok));
      } catch {
        setIsAdminAllowed(false);
      }

      setIsAdminChecked(true);
    };

    void verifyAdminAccess();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F6F6F2] text-[#0B0B0D] flex items-center justify-center px-6">
        <p className="text-[#6E6E73]">Loading admin access...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdminChecked || isAdminAllowed === null) {
    return (
      <div className="min-h-screen bg-[#F6F6F2] text-[#0B0B0D] flex items-center justify-center px-6">
        <p className="text-[#6E6E73]">Loading admin access...</p>
      </div>
    );
  }

  if (!isAdminAllowed) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/admin/login' });
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F6F6F2] text-[#0B0B0D]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-white border border-[#0B0B0D]/10 h-fit">
          <div className="px-4 py-4 border-b border-[#0B0B0D]/10">
            <h1 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Admin Panel
            </h1>
          </div>
          <nav className="p-2 space-y-1">
            <NavLink to="/admin/orders" className={navItemClass}>
              Orders
            </NavLink>
            <NavLink to="/admin/products" className={navItemClass}>
              Products
            </NavLink>
            <NavLink to="/admin/settings" className={navItemClass}>
              Settings
            </NavLink>
          </nav>
          <div className="p-2 border-t border-[#0B0B0D]/10">
            <button onClick={handleLogout} className="btn-pink-outline w-full px-3 py-2 text-sm">
              Logout
            </button>
          </div>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
