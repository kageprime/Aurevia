import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchOrder, uploadOrderReceipt, type OrderRecord } from '@/lib/ordersApi';
import { useAuth } from '@clerk/clerk-react';
import { buildTrackingTimeline, describeTrackingStatus, formatTrackingStatus } from '@/lib/orderTracking';

export function ManualOrderPage() {
  const { orderId } = useParams();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [note, setNote] = useState('');

  const trackingTimeline = buildTrackingTimeline(order);
  const orderItems = order?.items ?? [];
  const paymentMethodLabel = order?.paymentMethod === 'card'
    ? 'Card payment'
    : order?.paymentMethod === 'bank_transfer'
      ? 'Bank transfer'
      : 'Payment';
  const canUploadReceipt = Boolean(order && order.paymentMethod !== 'card');

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOrder(orderId, getToken);
        setOrder(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load order.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [getToken, orderId]);

  if (isLoaded && !isSignedIn) {
    return <Navigate to="/account/login" replace state={{ from: orderId ? `/manual-order/${orderId}` : '/shop' }} />;
  }

  if (!isLoaded) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <p className="text-[#6E6E73]">Loading order details...</p>
      </section>
    );
  }

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderId || !file) {
      toast.error('Please select your transfer receipt file.');
      return;
    }

    setIsUploading(true);
    try {
      const updatedOrder = await uploadOrderReceipt(orderId, file, transferReference, note, getToken);
      setOrder(updatedOrder);
      setFile(null);
      toast.success('Receipt uploaded. We will verify your transfer shortly.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not upload receipt.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <p className="text-[#6E6E73]">Loading order...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-[168px] pb-20 px-6 lg:px-12 min-h-[70vh]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
          <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia tracking</p>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Order not found
          </h2>
          <p className="text-[#6E6E73]">Please recreate the order from the cart or return to the shop.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-[168px] pb-20 px-6 lg:px-12 min-h-[70vh]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia tracking</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Track your order
          </h2>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-xl">
            The order timeline below follows the same milestone system the admin team updates, so you can watch it move from payment to delivery.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-2">Order {order.id}</p>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatTrackingStatus(order.status)}
                  </h3>
                  <p className="mt-2 text-sm text-[#6E6E73] max-w-xl">{describeTrackingStatus(order.status)}</p>
                </div>
                <div className="rounded-none border border-[#0B0B0D]/10 px-4 py-3 text-right min-w-[160px]">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#6E6E73] mb-1">Subtotal</p>
                  <p className="text-2xl font-bold">${Number(order.subtotal).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
                <div className="border border-[#0B0B0D]/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#6E6E73] mb-2">Payment</p>
                  <p className="font-medium">{paymentMethodLabel}</p>
                  <p className="text-[#6E6E73] mt-1">{order.paymentStatus ?? '—'}</p>
                </div>
                <div className="border border-[#0B0B0D]/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#6E6E73] mb-2">Customer</p>
                  <p className="font-medium">{order.customerName || 'Aurevia customer'}</p>
                  <p className="text-[#6E6E73] mt-1">{order.customerWhatsApp || order.customerPhone || 'No phone saved'}</p>
                </div>
                <div className="border border-[#0B0B0D]/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#6E6E73] mb-2">Payment ref</p>
                  <p className="font-medium break-all">{order.paymentReference || order.transferReference || order.id}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8">
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Items in this order
              </h3>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 border-b border-[#0B0B0D]/10 pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-[#6E6E73]">Qty {item.quantity} · ${item.price.toFixed(2)} each</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {order.paymentMethod !== 'card' && (
              <div className="bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Transfer details
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Bank:</strong> {order.bankDetails?.bankName || '—'}</p>
                  <p><strong>Account name:</strong> {order.bankDetails?.accountName || '—'}</p>
                  <p><strong>Account number:</strong> {order.bankDetails?.accountNumber || '—'}</p>
                  <p><strong>SWIFT:</strong> {order.bankDetails?.swiftCode || '—'}</p>
                </div>
                <p className="mt-4 text-sm text-[#6E6E73]">
                  Upload the transfer receipt once the payment has been sent.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#0B0B0D] text-white border border-white/10 shadow-[0_20px_60px_rgba(11,11,13,0.18)] p-6 lg:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-white/60 mb-3">Timeline</p>
              <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Shipping progress
              </h3>

              <div className="mt-6 space-y-4">
                {trackingTimeline.map((step, index) => (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <span
                        className={`w-4 h-4 rounded-full border ${step.state === 'complete' ? 'bg-white border-white' : step.state === 'current' ? 'bg-[#FF2D8F] border-[#FF2D8F]' : 'bg-transparent border-white/35'}`}
                      />
                      {index < trackingTimeline.length - 1 && (
                        <span className={`w-px flex-1 min-h-12 ${step.state === 'upcoming' ? 'bg-white/15' : 'bg-white/40'}`} />
                      )}
                    </div>
                    <div className="pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{step.title}</h4>
                        <span className="text-[10px] uppercase tracking-[0.24em] text-white/55">{step.state}</span>
                      </div>
                      <p className="mt-2 text-sm text-white/70 max-w-sm">{step.description}</p>
                      {step.reachedAt && (
                        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/50">
                          {new Date(step.reachedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {canUploadReceipt ? (
              <div className="bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8">
                <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Upload transfer receipt
                </h3>
                <form onSubmit={handleUpload} className="space-y-4">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="w-full border border-[#0B0B0D]/20 p-3"
                    required
                  />

                  <input
                    type="text"
                    value={transferReference}
                    onChange={(event) => setTransferReference(event.target.value)}
                    placeholder="Transfer reference (optional)"
                    className="w-full border border-[#0B0B0D]/20 p-3"
                  />

                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Note to admin (optional)"
                    className="w-full border border-[#0B0B0D]/20 p-3 min-h-28"
                  />

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="btn-pink w-full disabled:opacity-60"
                  >
                    {isUploading ? 'Uploading...' : 'Upload receipt'}
                  </button>
                </form>

                {order.receiptUrl && (
                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 accent-text underline"
                  >
                    View uploaded receipt
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8">
                <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Card payment captured
                </h3>
                <p className="text-sm text-[#6E6E73]">
                  The payment has already been captured. The tracking timeline above will update as the order moves through packing and shipping.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}