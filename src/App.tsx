import { useEffect, useCallback } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@clerk/clerk-react';
import { Navigation } from '@/components/Navigation';
import { HomePage } from '@/pages/HomePage';
import { StoryPage } from '@/pages/StoryPage';
import { ShopPage } from '@/pages/ShopPage';
import { ManualOrderPage } from '@/pages/ManualOrderPage';
import { UserAuthPage } from '@/pages/account/UserAuthPage';
import { UserDashboardPage } from '@/pages/account/UserDashboardPage';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { Footer } from '@/sections/Footer';
import { useCart } from '@/hooks/useCart';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createManualTransferOrder } from '@/lib/ordersApi';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { items, total, itemCount, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const reducedMotion = useReducedMotion();

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product);
    toast.success(`${product.name} added to bag`);
  }, [addToCart]);

  const handleCheckout = useCallback(async () => {
    if (!isLoaded) {
      toast.info('Loading your session. Try again in a moment.');
      return;
    }

    if (!isSignedIn) {
      toast.error('Please sign in before placing an order.');
      navigate('/account/login', { state: { from: `${location.pathname}${location.hash}` } });
      return;
    }

    try {
      const result = await createManualTransferOrder(items);
      clearCart();
      toast.success('Order created. Upload your transfer receipt to continue.');
      navigate(`/manual-order/${result.orderId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout could not be started.';
      toast.error(message);
    }
  }, [clearCart, isLoaded, isSignedIn, items, location.hash, location.pathname, navigate]);

  // Global scroll snap for pinned sections
  useEffect(() => {
    if (reducedMotion || isAdminRoute) {
      return;
    }

    let globalSnapTrigger: ScrollTrigger | undefined;

    // Wait for all ScrollTriggers to be created
    const timeout = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      
      if (!maxScroll || pinned.length === 0) return;

      // Build ranges and snap targets from pinned sections
      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      // Create global snap
      globalSnapTrigger = ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            // Check if within any pinned range (with buffer)
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.08 && value <= r.end + 0.08
            );
            
            if (!inPinned) return value; // Flowing section: free scroll

            // Find nearest pinned center
            const target = pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
            
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out'
        }
      });

    }, 500);

    return () => {
      clearTimeout(timeout);
      globalSnapTrigger?.kill();
    };
  }, [isAdminRoute, location.pathname, reducedMotion]);

  // Route hash navigation support
  useEffect(() => {
    if (isAdminRoute) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const sectionId = location.hash.replace('#', '');
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const timeout = setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
    };
  }, [isAdminRoute, location.hash, location.pathname, reducedMotion]);

  // Cleanup all ScrollTriggers on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  if (isAdminRoute) {
    return (
      <>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/orders" replace />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/orders" replace />} />
        </Routes>

        <Toaster position="bottom-right" richColors closeButton />
      </>
    );
  }

  return (
    <div className="relative">
      <div className="grain-overlay" />

      <Navigation 
        itemCount={itemCount}
        cartItems={items}
        total={total}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={handleCheckout}
      />

      <main className="relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story" element={<StoryPage onAddToCart={handleAddToCart} />} />
          <Route path="/shop" element={<ShopPage onAddToCart={handleAddToCart} />} />
          <Route path="/account/login" element={<UserAuthPage />} />
          <Route path="/account/register" element={<UserAuthPage />} />
          <Route path="/account/dashboard" element={<UserDashboardPage />} />
          <Route path="/manual-order/:orderId" element={<ManualOrderPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Footer />
      </main>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

export default App;
