import { useCallback, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Navigation } from '@/components/Navigation';
import { HomePage } from '@/pages/HomePage';
import { StoryPage } from '@/pages/StoryPage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductPage } from '@/pages/ProductPage';
import { ManualOrderPage } from '@/pages/ManualOrderPage';
import { CardCheckoutPage } from './pages/CardCheckoutPage';
import { UserAuthPage } from '@/pages/account/UserAuthPage';
import { UserSignUpPage } from '@/pages/account/UserSignUpPage';
import { UserProfilePage } from '@/pages/account/UserProfilePage';
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

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAccountRoute = location.pathname.startsWith('/account');
  const isCheckoutRoute = location.pathname.startsWith('/checkout');
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
        element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
    };
  }, [isAdminRoute, location.hash, location.pathname, reducedMotion]);

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

      <main className="relative flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story" element={<StoryPage onAddToCart={handleAddToCart} />} />
          <Route path="/shop" element={<ShopPage onAddToCart={handleAddToCart} />} />
          <Route path="/product/:productId" element={<ProductPage onAddToCart={handleAddToCart} />} />
          <Route path="/account/login/*" element={<UserAuthPage />} />
          <Route path="/account/register/*" element={<UserSignUpPage />} />
          <Route path="/account/profile/*" element={<UserProfilePage />} />
          <Route path="/account/dashboard" element={<UserDashboardPage />} />
          <Route path="/manual-order/:orderId" element={<ManualOrderPage />} />
          <Route path="/checkout/card" element={<CardCheckoutPage cartItems={items} clearCart={clearCart} />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Footer disableReveal={isAdminRoute || isAccountRoute || isCheckoutRoute} />
      </main>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

export default App;
