import { useEffect, useMemo, useState } from 'react';
import { SignIn, useAuth, useClerk } from '@clerk/clerk-react';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { fetchJson, readJsonResponse } from '@/lib/apiErrors';
import { listAdminOrders, type OrderRecord, updateAdminOrderStatus } from '@/lib/ordersApi';
import {
  createAdminProduct,
  deleteAdminProduct,
  listProducts,
  updateAdminProduct,
} from '@/lib/productsApi';

const backendUrl = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';

const quickStatuses = ['paid', 'payment_failed', 'processing', 'shipped', 'delivered'];

type ProductFormState = {
  name: string;
  price: string;
  category: Product['category'];
  subcategory: string;
  image: string;
  description: string;
};

const defaultProductForm: ProductFormState = {
  name: '',
  price: '',
  category: 'lip',
  subcategory: '',
  image: '',
  description: '',
};

export function AdminPage() {
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [isAdminAllowed, setIsAdminAllowed] = useState<boolean | null>(null);
  const [form, setForm] = useState<ProductFormState>(defaultProductForm);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await listAdminOrders(getToken);
      setOrders(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load orders.';
      toast.error(message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await listProducts(undefined, true);
      setProducts(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load products.';
      toast.error(message);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const verifyAdminAccess = async () => {
      try {
        const sessionToken = await getToken();
        const response = await fetchJson(`${backendUrl.replace(/\/$/, '')}/api/admin/me`, {
          credentials: 'include',
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined,
        });
        const data = await readJsonResponse<{ ok?: boolean }>(response);
        setIsAdminAllowed(Boolean(response.ok && data?.ok));
      } catch {
        setIsAdminAllowed(false);
      }

      setIsAdminChecked(true);
    };

    void verifyAdminAccess();
    loadOrders();
    loadProducts();
  }, [getToken, isLoaded, isSignedIn]);

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/admin/login' });
    setIsAdminAllowed(false);
    setOrders([]);
    setProducts([]);
    setActiveOrder(null);
    toast.info('Signed out.');
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const updated = await updateAdminOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      if (activeOrder?.id === orderId) {
        setActiveOrder(updated);
      }
      toast.success(`Order ${orderId} updated to ${status}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update status.';
      toast.error(message);
    }
  };

  const handleCreateProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingProduct(true);

    try {
      const created = await createAdminProduct({
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category,
        subcategory: form.subcategory.trim(),
        image: form.image.trim(),
        description: form.description.trim(),
        isActive: true,
      }, getToken);

      setProducts((current) => [...current, created]);
      setForm(defaultProductForm);
      toast.success('Product created successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create product.';
      toast.error(message);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleToggleProduct = async (product: Product) => {
    try {
      const updated = await updateAdminProduct(product.id, {
        isActive: product.isActive === false,
      }, getToken);

      setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
      toast.success(`${updated.name} is now ${updated.isActive === false ? 'inactive' : 'active'}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update product.';
      toast.error(message);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteAdminProduct(product.id, getToken);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.success(`${product.name} deleted.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete product.';
      toast.error(message);
    }
  };

  if (!isLoaded) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading admin panel...</p>
        </div>
      </section>
    );
  }

  if (!isSignedIn) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-3xl mx-auto bg-white border border-[#0B0B0D]/10 p-6 lg:p-8">
          <p className="text-[#6E6E73] mb-4">Admin access required.</p>
          <SignIn
            routing="path"
            path="/admin/login"
            forceRedirectUrl="/admin"
            fallbackRedirectUrl="/admin"
            withSignUp={false}
            appearance={{ elements: { rootBox: 'w-full' } }}
          />
        </div>
      </section>
    );
  }

  if (!isAdminChecked || isAdminAllowed === null) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-md mx-auto bg-white border border-[#0B0B0D]/10 p-6">
          <p className="text-[#6E6E73]">Loading admin panel...</p>
        </div>
      </section>
    );
  }

  if (!isAdminAllowed) {
    return (
      <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
        <div className="max-w-3xl mx-auto bg-white border border-[#0B0B0D]/10 p-6 lg:p-8">
          <p className="text-[#6E6E73] mb-4">Admin access required.</p>
          <SignIn
            routing="path"
            path="/admin/login"
            forceRedirectUrl="/admin"
            fallbackRedirectUrl="/admin"
            withSignUp={false}
            appearance={{ elements: { rootBox: 'w-full' } }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[#F6F6F2] z-[70] py-24 px-6 lg:px-12 min-h-[70vh]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-8">
          <div className="bg-white border border-[#0B0B0D]/10">
            <div className="flex items-center justify-between p-4 border-b border-[#0B0B0D]/10">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Orders
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={loadOrders} className="btn-pink-outline px-4 py-2 text-sm">Refresh</button>
                <button onClick={handleLogout} className="btn-pink-outline px-4 py-2 text-sm">Logout</button>
              </div>
            </div>

            {isLoadingOrders ? (
              <p className="p-4 text-[#6E6E73]">Loading orders...</p>
            ) : (
              <div className="divide-y divide-[#0B0B0D]/10">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setActiveOrder(order)}
                    className="w-full text-left p-4 hover:bg-[#F6F6F2] transition-colors"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-xs text-[#6E6E73]">{order.status}</p>
                      </div>
                      <p className="font-bold">${Number(order.subtotal).toFixed(2)}</p>
                    </div>
                  </button>
                ))}

                {orders.length === 0 && <p className="p-4 text-[#6E6E73]">No orders yet.</p>}
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
                <p className="text-sm text-[#6E6E73] mb-2">Status: {activeOrder.status}</p>
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
                      key={status}
                      onClick={() => handleStatusUpdate(activeOrder.id, status)}
                      className="btn-pink-outline px-3 py-2 text-sm"
                    >
                      Mark {status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#0B0B0D]/10 p-6">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Product Catalog
          </h2>

          <form onSubmit={handleCreateProduct} className="grid md:grid-cols-2 gap-3 mb-6">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="border border-[#0B0B0D]/20 px-3 py-2"
              placeholder="Product name"
              required
            />
            <input
              value={form.price}
              type="number"
              min="0"
              step="0.01"
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              className="border border-[#0B0B0D]/20 px-3 py-2"
              placeholder="Price"
              required
            />
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as Product['category'] }))}
              className="border border-[#0B0B0D]/20 px-3 py-2"
            >
              <option value="lip">Lip</option>
              <option value="skincare">Skincare</option>
            </select>
            <input
              value={form.subcategory}
              onChange={(event) => setForm((current) => ({ ...current, subcategory: event.target.value }))}
              className="border border-[#0B0B0D]/20 px-3 py-2"
              placeholder="Subcategory"
              required
            />
            <input
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              className="border border-[#0B0B0D]/20 px-3 py-2 md:col-span-2"
              placeholder="Image path (/product_example.jpg)"
              required
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="border border-[#0B0B0D]/20 px-3 py-2 md:col-span-2"
              placeholder="Description"
              required
            />
            <button type="submit" className="btn-pink md:col-span-2" disabled={isCreatingProduct}>
              {isCreatingProduct ? 'Adding product...' : 'Add Product'}
            </button>
          </form>

          {isLoadingProducts ? (
            <p className="text-[#6E6E73]">Loading products...</p>
          ) : (
            <div className="divide-y divide-[#0B0B0D]/10">
              {sortedProducts.map((product) => (
                <div key={product.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-[#6E6E73]">
                      {product.category} · {product.subcategory} · ${product.price} · {product.isActive === false ? 'inactive' : 'active'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleProduct(product)}
                      className="btn-pink-outline px-3 py-2 text-sm"
                    >
                      {product.isActive === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="btn-pink-outline px-3 py-2 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {sortedProducts.length === 0 && <p className="text-[#6E6E73] py-3">No products yet.</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
