import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import type { CartItem } from '@/types';
import { createCardPaymentOrder } from '@/lib/ordersApi';

type CardCheckoutPageProps = {
  cartItems: CartItem[];
  clearCart: () => void;
};

export function CardCheckoutPage({ cartItems, clearCart }: CardCheckoutPageProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [cardholderName, setCardholderName] = useState('Aurevia Tester');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvc, setCardCvc] = useState('123');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cardDigits = cardNumber.replace(/\D/g, '');
  const cardLast4 = cardDigits.slice(-4).padStart(4, '0');

  useEffect(() => {
    if (!user) {
      return;
    }

    setCardholderName((current) => current === 'Aurevia Tester' ? (user.fullName ?? current) : current);
    setBillingEmail((current) => current || user.primaryEmailAddress?.emailAddress || '');
  }, [user]);

  if (!isLoaded) {
    return (
      <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading checkout...</p>
        </div>
      </section>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/account/login" replace state={{ from: '/checkout/card' }} />;
  }

  if (cartItems.length === 0) {
    return (
      <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-[70vh]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
          <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia checkout</p>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your bag is empty
          </h2>
          <p className="text-sm text-[#6E6E73] max-w-lg mx-auto">
            Add a product to your bag before starting card checkout.
          </p>
          <div className="mt-8 flex justify-center">
            <button onClick={() => navigate('/shop')} className="btn-pink-outline px-5 py-3 text-sm">
              Return to shop
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (cardholderName.trim().length < 2) {
      toast.error('Please enter the cardholder name.');
      return;
    }

    if (cardDigits.length < 12) {
      toast.error('Please enter a valid card number.');
      return;
    }

    if (cardExpiry.trim().length < 4) {
      toast.error('Please enter a valid expiry date.');
      return;
    }

    if (cardCvc.trim().length < 3) {
      toast.error('Please enter a valid CVC.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCardPaymentOrder(
        cartItems,
        {
          cardholderName: cardholderName.trim(),
          cardBrand: cardBrand.trim(),
          cardLast4,
          cardExpiry: cardExpiry.trim(),
          billingEmail: billingEmail.trim() || undefined,
          billingPhone: billingPhone.trim() || undefined,
        },
        getToken
      );

      clearCart();
      toast.success('Card payment captured. Opening order tracking.');
      navigate(`/manual-order/${result.orderId}`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit card payment.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-[70vh]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-8">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia checkout</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Pay with card
          </h2>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-xl">
            This is a demo card flow. It captures the payment details, creates the order, and takes you straight to tracking.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
          <div className="space-y-6">
            <div className="bg-[#0B0B0D] text-white border border-white/10 shadow-[0_20px_60px_rgba(11,11,13,0.18)] p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/60 mb-3">Demo card</p>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {cardBrand} ending {cardLast4}
                  </h3>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/80">
                  Demo mode
                </span>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-[0.24em] mb-2">Cardholder</p>
                  <p className="text-lg font-medium">{cardholderName || 'Aurevia Tester'}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-white/50 text-xs uppercase tracking-[0.24em] mb-2">Order total</p>
                  <p className="text-2xl font-bold">${subtotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{cardBrand}</span>
                  <span>Secure checkout</span>
                </div>
                <div className="mt-10 font-mono text-lg sm:text-2xl tracking-[0.22em] sm:tracking-[0.34em]">
                  {cardNumber}
                </div>
                <div className="mt-8 flex items-end justify-between text-sm text-white/70">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] mb-1">Expiry</p>
                    <p className="font-medium">{cardExpiry}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] mb-1">CVC</p>
                    <p className="font-medium">{cardCvc.replace(/./g, '•')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8">
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Order summary
              </h3>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 border-b border-[#0B0B0D]/10 pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-[#6E6E73]">Qty {item.quantity} · ${item.price.toFixed(2)} each</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-[#0B0B0D]/10 pt-4 flex items-center justify-between">
                <span className="font-medium">Subtotal</span>
                <span className="text-xl font-bold">${subtotal.toFixed(2)}</span>
              </div>

              <p className="mt-4 text-sm text-[#6E6E73]">
                Once you submit, the order becomes visible in tracking and can be advanced by the admin timeline.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-2">Payment details</p>
                <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Enter card info
                </h3>
              </div>
              <span className="rounded-full bg-[#0B0B0D] text-white px-3 py-1 text-[10px] uppercase tracking-[0.28em]">
                Demo
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-[#6E6E73]">Card brand</span>
                  <select
                    value={cardBrand}
                    onChange={(event) => setCardBrand(event.target.value)}
                    className="w-full border border-[#0B0B0D]/20 px-4 py-3 bg-white"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-[#6E6E73]">Cardholder name</span>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(event) => setCardholderName(event.target.value)}
                    className="w-full border border-[#0B0B0D]/20 px-4 py-3 bg-white"
                    placeholder="Aurevia Tester"
                    required
                  />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-xs uppercase tracking-[0.24em] text-[#6E6E73]">Card number</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  className="w-full border border-[#0B0B0D]/20 px-4 py-3 bg-white font-mono tracking-[0.12em]"
                  placeholder="4242 4242 4242 4242"
                  required
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-[#6E6E73]">Expiry</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(event.target.value)}
                    className="w-full border border-[#0B0B0D]/20 px-4 py-3 bg-white"
                    placeholder="12/29"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-[#6E6E73]">CVC</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardCvc}
                    onChange={(event) => setCardCvc(event.target.value)}
                    className="w-full border border-[#0B0B0D]/20 px-4 py-3 bg-white"
                    placeholder="123"
                    required
                  />
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-[#6E6E73]">Billing email</span>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(event) => setBillingEmail(event.target.value)}
                    className="w-full border border-[#0B0B0D]/20 px-4 py-3 bg-white"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-[#6E6E73]">Billing phone</span>
                  <input
                    type="tel"
                    value={billingPhone}
                    onChange={(event) => setBillingPhone(event.target.value)}
                    className="w-full border border-[#0B0B0D]/20 px-4 py-3 bg-white"
                    placeholder="08000000000"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-pink w-full disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting payment...' : 'Submit card payment'}
              </button>
            </form>

            <div className="mt-6 rounded-none border border-[#0B0B0D]/10 bg-[#F6F6F2] p-4 text-sm text-[#6E6E73]">
              <p className="font-medium text-[#0B0B0D] mb-1">What happens next</p>
              <p>We create the order, save the payment snapshot, and move you to the tracking page with shipping milestones.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}