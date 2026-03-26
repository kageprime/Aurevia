import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchOrder, uploadOrderReceipt, type OrderRecord } from '@/lib/ordersApi';
import { useAuth } from '@clerk/clerk-react';

export function ManualOrderPage() {
  const { orderId } = useParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOrder(orderId);
        setOrder(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load order.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

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
      const updatedOrder = await uploadOrderReceipt(orderId, file, transferReference, note);
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
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <h2 className="text-heading font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          ORDER NOT FOUND
        </h2>
        <p className="text-[#6E6E73]">Please re-create your order from the cart.</p>
      </section>
    );
  }

  return (
    <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
      <div className="max-w-5xl grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 border border-[#0B0B0D]/10">
          <h2 className="text-heading font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            MANUAL PAYMENT
          </h2>
          <p className="text-sm text-[#6E6E73] mb-4">Order ID: {order.id}</p>
          <p className="text-sm mb-1"><strong>Bank:</strong> {order.bankDetails?.bankName}</p>
          <p className="text-sm mb-1"><strong>Account Name:</strong> {order.bankDetails?.accountName}</p>
          <p className="text-sm mb-1"><strong>Account Number:</strong> {order.bankDetails?.accountNumber}</p>
          <p className="text-sm mb-4"><strong>SWIFT:</strong> {order.bankDetails?.swiftCode}</p>
          <p className="text-sm text-[#6E6E73]">Transfer total and upload receipt for verification.</p>
          <p className="text-xl font-bold mt-4">Subtotal: ${Number(order.subtotal).toFixed(2)}</p>
          <div className="mt-4 text-xs font-mono uppercase tracking-mono text-[#6E6E73]">
            Current Status: {order.status}
          </div>
        </div>

        <div className="bg-white p-6 border border-[#0B0B0D]/10">
          <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Upload Transfer Receipt
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
              {isUploading ? 'Uploading...' : 'Upload Receipt'}
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
      </div>
    </section>
  );
}