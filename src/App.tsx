import { Suspense, lazy, useCallback, useEffect, useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/sections/Footer';
import { useCart } from '@/hooks/useCart';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createManualTransferOrder } from '@/lib/ordersApi';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const StoryPage = lazy(() => import('./pages/StoryPage').then((module) => ({ default: module.StoryPage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then((module) => ({ default: module.ShopPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then((module) => ({ default: module.ProductPage })));
const ManualOrderPage = lazy(() => import('./pages/ManualOrderPage').then((module) => ({ default: module.ManualOrderPage })));
const CardCheckoutPage = lazy(() => import('./pages/CardCheckoutPage').then((module) => ({ default: module.CardCheckoutPage })));
const HelpTopicPage = lazy(() => import('./pages/HelpTopicPage').then((module) => ({ default: module.HelpTopicPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then((module) => ({ default: module.TermsOfServicePage })));
const UserAuthPage = lazy(() => import('./pages/account/UserAuthPage').then((module) => ({ default: module.UserAuthPage })));
const UserSignUpPage = lazy(() => import('./pages/account/UserSignUpPage').then((module) => ({ default: module.UserSignUpPage })));
const UserProfilePage = lazy(() => import('./pages/account/UserProfilePage').then((module) => ({ default: module.UserProfilePage })));
const UserDashboardPage = lazy(() => import('./pages/account/UserDashboardPage').then((module) => ({ default: module.UserDashboardPage })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then((module) => ({ default: module.AdminOrdersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then((module) => ({ default: module.AdminProductsPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })));

function RouteFallback() {
  return <div className="min-h-[35vh]" aria-hidden="true" />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAccountRoute = location.pathname.startsWith('/account');
  const isCheckoutRoute = location.pathname.startsWith('/checkout');
  const { items, total, itemCount, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const reducedMotion = useReducedMotion();

  // Keep route transitions deterministic by preventing browser back/forward scroll restoration.
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) {
      return;
    }

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

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
      const result = await createManualTransferOrder(items, getToken);
      clearCart();
      toast.success('Order created. Upload your transfer receipt to continue.');
      navigate(`/manual-order/${result.orderId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout could not be started.';
      toast.error(message);
    }
  }, [clearCart, getToken, isLoaded, isSignedIn, items, location.hash, location.pathname, navigate]);

  const handleCardCheckout = useCallback(() => {
    if (!isLoaded) {
      toast.info('Loading your session. Try again in a moment.');
      return;
    }

    if (!isSignedIn) {
      toast.error('Please sign in before continuing to checkout.');
      navigate('/account/login', { state: { from: '/checkout/card' } });
      return;
    }

    if (items.length === 0) {
      toast.error('Your bag is empty.');
      return;
    }

    navigate('/checkout/card');
  }, [isLoaded, isSignedIn, items.length, navigate]);

  // Ensure all non-hash route transitions open from the top.
  useLayoutEffect(() => {
    if (isAdminRoute || !location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [isAdminRoute, location.hash, location.pathname, location.search]);

  // Hash routes intentionally jump to sections.
  useEffect(() => {
    if (isAdminRoute || !location.hash) {
      return;
    }

    const sectionId = decodeURIComponent(location.hash.replace('#', ''));
    if (!sectionId) {
      return;
    }

    const scrollToSection = () => {
      const element = document.getElementById(sectionId);
      if (!element) {
        return false;
      }

      element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      return true;
    };

    if (scrollToSection()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      scrollToSection();
    }, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isAdminRoute, location.hash, location.pathname, reducedMotion]);

  if (isAdminRoute) {
    return (
      <>
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>

        <Footer />
        <Toaster position="bottom-right" richColors closeButton />
      </>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="grain-overlay" />

      <Navigation 
        itemCount={itemCount}
        cartItems={items}
        total={total}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={handleCheckout}
        onPayWithCard={handleCardCheckout}
      />

      <main className="relative flex-1 pt-[96px] sm:pt-[108px]">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/story" element={<StoryPage onAddToCart={handleAddToCart} />} />
            <Route path="/shop" element={<ShopPage onAddToCart={handleAddToCart} />} />
            <Route path="/product/:productId" element={<ProductPage onAddToCart={handleAddToCart} />} />
            <Route path="/help/:topic" element={<HelpTopicPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/account/login/*" element={<UserAuthPage />} />
            <Route path="/account/register/*" element={<UserSignUpPage />} />
            <Route path="/account/profile/*" element={<UserProfilePage />} />
            <Route path="/account/dashboard" element={<UserDashboardPage />} />
            <Route path="/manual-order/:orderId" element={<ManualOrderPage />} />
            <Route path="/checkout/card" element={<CardCheckoutPage cartItems={items} clearCart={clearCart} />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
        <Footer disableReveal={isAdminRoute || isAccountRoute || isCheckoutRoute} />
      </main>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

export default App;
