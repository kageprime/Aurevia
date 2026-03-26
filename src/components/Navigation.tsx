import { useState } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccentTheme } from '@/hooks/useAccentTheme';
import { useAuth } from '@clerk/clerk-react';

interface NavigationProps {
  itemCount: number;
  cartItems: CartItem[];
  total: number;
  onRemoveFromCart: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onCheckout: () => void;
}

export function Navigation({ 
  itemCount, 
  cartItems, 
  total, 
  onRemoveFromCart, 
  onUpdateQuantity,
  onCheckout 
}: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { accent, accents, setAccent } = useAccentTheme();
  const accountPath = isLoaded && isSignedIn ? '/account/dashboard' : '/account/login';

  const navigateTo = (path: string, id?: string) => {
    if (location.pathname === path && id) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setMobileMenuOpen(false);
      return;
    }

    const target = id ? `${path}#${id}` : path;
    navigate(target);
    setMobileMenuOpen(false);
  };

  const openCart = () => {
    setCartOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCheckoutClick = () => {
    setCartOpen(false);
    onCheckout();
  };
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[1101] bg-[#F6F6F2]/90 backdrop-blur-sm border-b border-[#0B0B0D]/10">
        <div className="flex items-center justify-between px-6 lg:px-12 py-4">
          <button
            onClick={() => navigateTo('/')}
            className="flex items-center gap-3"
            aria-label="Go to homepage"
          >
            {!logoFailed ? (
              <img
                src="/aurevia-logo.png"
                alt="Aurevia logo"
                className="h-24 w-auto"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                AUREVIA
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => navigateTo('/')} className="text-sm font-medium accent-hover-text">Home</button>
            <button onClick={() => navigateTo('/shop', 'shop-lip')} className="text-sm font-medium accent-hover-text">Shop</button>
            <button onClick={() => navigateTo('/story', 'beauty-section')} className="text-sm font-medium accent-hover-text">Story</button>
            <button onClick={() => navigateTo('/shop', 'shop-skincare')} className="text-sm font-medium accent-hover-text">Care</button>
            <button onClick={() => navigateTo(accountPath)} className="text-sm font-medium accent-hover-text">Account</button>

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-[#6E6E73]">Accent</span>
              <div className="flex items-center gap-1">
                {accents.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAccent(option.id)}
                    className={`w-4 h-4 border border-[#0B0B0D]/20 ${accent === option.id ? 'ring-2 ring-[#0B0B0D]' : ''}`}
                    style={{ backgroundColor: option.hex }}
                    aria-label={`Use ${option.label} accent`}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <button onClick={() => setCartOpen(true)} className="flex items-center gap-2 text-sm font-medium accent-hover-text">
                  <ShoppingBag className="w-5 h-5" />
                  <span>({itemCount})</span>
                </button>
              </SheetTrigger>
              <SheetContent className="inset-y-0 right-0 h-dvh max-h-dvh w-screen max-w-full sm:w-[420px] sm:max-w-[420px] bg-[#F6F6F2] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    YOUR BAG
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 px-4 pb-6">
                  {cartItems.length === 0 ? (
                    <p className="text-[#6E6E73] text-center py-12">Your bag is empty</p>
                  ) : (
                    <div className="space-y-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img src={item.image} alt={item.name} className="w-20 h-20 object-cover grayscale-warm" />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-[#6E6E73] text-sm">${item.price}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 border border-[#0B0B0D] flex items-center justify-center text-sm">-</button>
                              <span className="text-sm">{item.quantity}</span>
                              <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 border border-[#0B0B0D] flex items-center justify-center text-sm">+</button>
                              <button onClick={() => onRemoveFromCart(item.id)} className="ml-auto text-[#6E6E73] accent-hover-text">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-[#0B0B0D]/10 pt-4">
                        <div className="flex justify-between mb-4">
                          <span className="font-medium">Subtotal</span>
                          <span className="font-bold">${total.toFixed(2)}</span>
                        </div>
                        <Button onClick={handleCheckoutClick} className="w-full accent-bg hover:brightness-110 text-white rounded-none">
                          Proceed to Bank Transfer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F6F6F2] border-t border-[#0B0B0D]/10 px-6 py-4">
            <div className="flex flex-col gap-4">
              <button onClick={() => navigateTo('/')} className="text-left text-sm font-medium">Home</button>
              <button onClick={() => navigateTo('/shop', 'shop-lip')} className="text-left text-sm font-medium">Shop</button>
              <button onClick={() => navigateTo('/story', 'beauty-section')} className="text-left text-sm font-medium">Story</button>
              <button onClick={() => navigateTo('/shop', 'shop-skincare')} className="text-left text-sm font-medium">Care</button>
              <button onClick={() => navigateTo(accountPath)} className="text-left text-sm font-medium">Account</button>
              <button onClick={openCart} className="text-left text-sm font-medium flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Cart ({itemCount})
              </button>

              <div className="pt-2 border-t border-[#0B0B0D]/10">
                <p className="text-xs uppercase tracking-mono text-[#6E6E73] mb-2">Accent</p>
                <div className="flex items-center gap-2">
                  {accents.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setAccent(option.id)}
                      className={`w-6 h-6 border border-[#0B0B0D]/20 ${accent === option.id ? 'ring-2 ring-[#0B0B0D]' : ''}`}
                      style={{ backgroundColor: option.hex }}
                      aria-label={`Use ${option.label} accent`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <button
        onClick={() => setCartOpen(true)}
        className="md:hidden fixed right-5 bottom-5 z-[1101] w-14 h-14 rounded-full accent-bg text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
        aria-label="Open shopping bag"
      >
        <ShoppingBag className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#0B0B0D] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
    </>
  );
}
