import { useState } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onPayWithCard: () => void;
}

export function Navigation({ 
  itemCount, 
  cartItems, 
  total, 
  onRemoveFromCart, 
  onUpdateQuantity,
  onCheckout,
  onPayWithCard 
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

  const handleCardCheckoutClick = () => {
    setCartOpen(false);
    onPayWithCard();
  };

  const currentAccent = accents.find((option) => option.id === accent) ?? accents[0];

  function AccentPicker({ compact = false }: { compact?: boolean }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`flex items-center gap-2 rounded-none border border-[#0B0B0D]/10 bg-[#F6F6F2] hover:bg-[#ECECE6] transition-colors ${compact ? 'px-4 py-2.5 text-base' : 'px-3 py-2 text-xs'}`}
            aria-label={`Accent color ${currentAccent.label}`}
          >
            <span
              className="h-3 w-3 rounded-full border border-[#0B0B0D]/10"
              style={{ backgroundColor: currentAccent.hex }}
            />
            <span className="font-medium text-[#0B0B0D]">{currentAccent.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-none border-[#0B0B0D]/10 bg-[#F6F6F2]">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.28em] text-[#6E6E73]">
            Accent
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={accent} onValueChange={setAccent}>
            {accents.map((option) => (
              <DropdownMenuRadioItem key={option.id} value={option.id} className="flex items-center gap-3">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-[#0B0B0D]/10"
                  style={{ backgroundColor: option.hex }}
                />
                <span>{option.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[1101] bg-[#F6F6F2]/90 backdrop-blur-sm border-b border-[#0B0B0D]/10">
        <div className="flex items-center justify-between px-6 lg:px-12 py-[14px]">
          <button
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2"
            aria-label="Go to homepage"
          >
            {!logoFailed ? (
              <img
                src="/aurevia-logo.png"
                alt="Aurevia logo"
                className="h-[66px] w-auto sm:h-[72px]"
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
            <button onClick={() => navigateTo('/story')} className="text-sm font-medium accent-hover-text">Story</button>
            <button onClick={() => navigateTo('/shop', 'shop-skincare')} className="text-sm font-medium accent-hover-text">Care</button>
            <button onClick={() => navigateTo(accountPath)} className="text-sm font-medium accent-hover-text">Account</button>

            <AccentPicker />
            <button onClick={() => setCartOpen(true)} className="flex items-center gap-2 text-sm font-medium accent-hover-text">
              <ShoppingBag className="w-5 h-5" />
              <span>({itemCount})</span>
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
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
                    <div className="grid gap-3">
                      <Button onClick={handleCardCheckoutClick} className="w-full bg-[#0B0B0D] hover:bg-[#1B1B20] text-white rounded-none">
                        Pay with Card
                      </Button>
                      <Button onClick={handleCheckoutClick} className="w-full accent-bg hover:brightness-110 text-white rounded-none">
                        Proceed to Bank Transfer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#0B0B0D]/10 bg-[#F6F6F2]/95 px-4 pb-6 pt-5 backdrop-blur-sm">
            <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#0B0B0D]/10 bg-[linear-gradient(180deg,#F6F6F2_0%,#F2F2ED_100%)] px-6 py-7 shadow-[0_20px_44px_-30px_rgba(11,11,13,0.85)]">
              <div className="flex flex-col items-center text-center">
                <div className="flex w-full flex-col items-center gap-4">
                  <button onClick={() => navigateTo('/')} className="text-[2rem] leading-none font-medium tracking-[-0.02em] accent-hover-text">Home</button>
                  <button onClick={() => navigateTo('/shop', 'shop-lip')} className="text-[2rem] leading-none font-medium tracking-[-0.02em] accent-hover-text">Shop</button>
                  <button onClick={() => navigateTo('/story')} className="text-[2rem] leading-none font-medium tracking-[-0.02em] accent-hover-text">Story</button>
                  <button onClick={() => navigateTo('/shop', 'shop-skincare')} className="text-[2rem] leading-none font-medium tracking-[-0.02em] accent-hover-text">Care</button>
                  <button onClick={() => navigateTo(accountPath)} className="text-[2rem] leading-none font-medium tracking-[-0.02em] accent-hover-text">Account</button>
                  <button onClick={openCart} className="mt-1 flex items-center justify-center gap-2 text-xl font-medium accent-hover-text">
                    <ShoppingBag className="h-5 w-5" />
                    Cart ({itemCount})
                  </button>
                </div>

                <div className="mt-7 w-full border-t border-[#0B0B0D]/10 pt-5">
                  <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#6E6E73]">Accent</p>
                  <div className="flex justify-center">
                    <AccentPicker compact />
                  </div>
                </div>

                <div className="mt-6 grid w-full gap-3 border-t border-[#0B0B0D]/10 pt-5">
                  <button onClick={handleCardCheckoutClick} className="text-center text-base font-medium accent-hover-text">
                    Pay with Card
                  </button>
                  <button onClick={handleCheckoutClick} className="text-center text-base font-medium accent-hover-text">
                    Proceed to Bank Transfer
                  </button>
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
