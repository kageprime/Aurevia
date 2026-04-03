import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isSessionExpiredError } from '@/lib/apiErrors';
import { listAdminOrders, type OrderRecord, updateAdminOrderStatus } from '@/lib/ordersApi';
import { formatTrackingStatus, trackingStatusOptions } from '@/lib/orderTracking';
import { useAuth, useClerk } from '@clerk/clerk-react';

const quickStatuses = trackingStatusOptions.filter((option) =>
  ['awaiting_payment', 'awaiting_verification', 'paid', 'processing', 'packed', 'left_origin', 'shipped', 'in_transit', 'arrived_hub', 'out_for_delivery', 'delivered', 'failed', 'refunded'].includes(option.value)
);

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [hasOrderLoadError, setHasOrderLoadError] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const normalizedSearch = orderSearchQuery.trim().toLowerCase();

    const matchesSearch = normalizedSearch.length === 0
      || order.id.toLowerCase().includes(normalizedSearch)
      || String(order.customerName ?? '').toLowerCase().includes(normalizedSearch)
      || String(order.customerPhone ?? '').toLowerCase().includes(normalizedSearch)
      || String(order.customerWhatsApp ?? '').toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setHasOrderLoadError(false);
    try {
      const data = await listAdminOrders(getToken);
      setOrders(data);
      setActiveOrder((current) => {
        if (!current) {
          return null;
        }

        return data.find((order) => order.id === current.id) ?? null;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load orders.';
      if (isSessionExpiredError(error)) {
        await signOut({ redirectUrl: '/admin/login' });
        navigate('/admin/login', { replace: true });
        return;
      }
      setHasOrderLoadError(true);
      toast.error(message);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [getToken, navigate, signOut]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    if (isUpdatingOrderStatus) {
      return;
    }

    setIsUpdatingOrderStatus(true);
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateAdminOrderStatus(orderId, status, true, getToken);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      if (activeOrder?.id === orderId) {
        setActiveOrder(updated);
      }
      toast.success(`Order ${orderId} updated to ${status}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update status.';
      if (isSessionExpiredError(error)) {
        await signOut({ redirectUrl: '/admin/login' });
        navigate('/admin/login', { replace: true });
        return;
      }
      toast.error(message);
    } finally {
      setIsUpdatingOrderStatus(false);
      setUpdatingOrderId(null);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Orders
      </h2>

      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-6">
        <div className="bg-white border border-[#0B0B0D]/10">
          <div className="flex items-center justify-between p-4 border-b border-[#0B0B0D]/10">
            <p className="font-semibold">All Orders</p>
            <button onClick={loadOrders} className="btn-pink-outline px-4 py-2 text-sm">Refresh</button>
          </div>

          <div className="p-4 border-b border-[#0B0B0D]/10 grid md:grid-cols-2 gap-2">
            <input
              value={orderSearchQuery}
              onChange={(event) => setOrderSearchQuery(event.target.value)}
              className="border border-[#0B0B0D]/20 px-3 py-2"
              placeholder="Search by order ID, customer name, or phone"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-[#0B0B0D]/20 px-3 py-2"
            >
              <option value="all">All statuses</option>
              {quickStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {isLoadingOrders ? (
            <p className="p-4 text-[#6E6E73]">Loading orders...</p>
          ) : hasOrderLoadError ? (
            <div className="p-4 space-y-2">
              <p className="text-[#6E6E73]">Could not load orders. Please try again.</p>
              <button onClick={loadOrders} className="btn-pink-outline px-4 py-2 text-sm">Retry</button>
            </div>
          ) : (
            <div className="divide-y divide-[#0B0B0D]/10">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setActiveOrder(order)}
                  className="w-full text-left p-4 hover:bg-[#F6F6F2] transition-colors"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">{order.id}</p>
                      <p className="text-xs text-[#6E6E73]">{formatTrackingStatus(order.status)}</p>
                    </div>
                    <p className="font-bold">${Number(order.subtotal).toFixed(2)}</p>
                  </div>
                </button>
              ))}

              {orders.length === 0 && <p className="p-4 text-[#6E6E73]">No orders yet.</p>}
              {orders.length > 0 && filteredOrders.length === 0 && (
                <p className="p-4 text-[#6E6E73]">No orders match this filter.</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#0B0B0D]/10 p-6">
          {!activeOrder ? (
            <p className="text-[#6E6E73]">Select an order to review payment proof.</p>
          ) : (
            <>
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeOrder.id}
              </h3>
              <p className="text-sm text-[#6E6E73] mb-2">Status: {formatTrackingStatus(activeOrder.status)}</p>
              <p className="text-sm mb-1">Subtotal: ${Number(activeOrder.subtotal).toFixed(2)}</p>
              <p className="text-sm mb-1">Transfer Ref: {activeOrder.transferReference || '—'}</p>
              <p className="text-sm mb-4">Customer WhatsApp: {activeOrder.customerWhatsApp || '—'}</p>

              {activeOrder.receiptUrl ? (
                <a
                  href={activeOrder.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="accent-text underline"
                >
                  Open Receipt
                </a>
              ) : (
                <p className="text-[#6E6E73] mb-4">No receipt uploaded yet.</p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                {quickStatuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusUpdate(activeOrder.id, status.value)}
                    className="btn-pink-outline px-3 py-2 text-sm"
                    disabled={isUpdatingOrderStatus && updatingOrderId === activeOrder.id}
                  >
                    {isUpdatingOrderStatus && updatingOrderId === activeOrder.id ? 'Updating...' : `Mark ${status.label}`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
