import type { CartItem } from '@/types';
import { fetchJson, getErrorMessage, getFirstFormErrorMessage, readJsonResponse } from '@/lib/apiErrors';

const WHATSAPP_API_URL = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'http://localhost:8787';
const ADMIN_API_KEY = (import.meta.env.VITE_ADMIN_API_KEY as string | undefined) ?? '';

export type OrderRecord = {
  id: string;
  status: string;
  subtotal: number;
  transferReference?: string | null;
  customerWhatsApp?: string | null;
  receiptUrl?: string | null;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    swiftCode?: string;
  } | null;
};

function endpoint(path: string) {
  return `${WHATSAPP_API_URL.replace(/\/$/, '')}${path}`;
}

function adminHeaders() {
  return ADMIN_API_KEY ? ({ 'x-api-key': ADMIN_API_KEY } as HeadersInit) : undefined;
}

async function fetchWithSession(path: string, init: RequestInit = {}) {
  return fetchJson(endpoint(path), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers ?? {}),
    },
  });
}

async function fetchWithAdminAuth(path: string, init: RequestInit = {}) {
  return fetchJson(endpoint(path), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers ?? {}),
      ...adminHeaders(),
    },
  });
}

export async function createManualTransferOrder(items: CartItem[]) {
  if (items.length === 0) {
    throw new Error('Your bag is empty.');
  }

  const response = await fetchWithSession('/api/checkout/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    }),
  });

  const data = await readJsonResponse<{ ok?: boolean; error?: unknown; orderId?: string }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(getFirstFormErrorMessage(data?.error) ?? getErrorMessage(data?.error) ?? 'Could not create manual order.');
  }

  return data;
}

export async function fetchOrder(orderId: string) {
  const response = await fetchWithSession(`/api/orders/${orderId}`);
  const data = await readJsonResponse<{ ok?: boolean; error?: string; order?: OrderRecord }>(response);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Order not found.');
  }

  return data.order as OrderRecord;
}

export async function uploadOrderReceipt(orderId: string, file: File, transferReference?: string, note?: string) {
  const formData = new FormData();
  formData.append('receipt', file);
  if (transferReference) formData.append('transferReference', transferReference);
  if (note) formData.append('note', note);

  const response = await fetchWithSession(`/api/orders/${orderId}/receipt`, {
    method: 'POST',
    body: formData,
  });

  const data = await readJsonResponse<{ ok?: boolean; error?: string; order?: OrderRecord }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not upload receipt.');
  }

  return data.order as OrderRecord;
}

export async function listUserOrders() {
  const response = await fetchWithSession('/api/users/orders');

  const data = await readJsonResponse<{ ok?: boolean; error?: string; orders?: OrderRecord[] }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not load your orders.');
  }

  return data.orders ?? [];
}

export async function listAdminOrders() {
  const response = await fetchWithAdminAuth('/api/orders');

  const data = await readJsonResponse<{ ok?: boolean; error?: string; orders?: OrderRecord[] }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not load admin orders.');
  }

  return data.orders ?? [];
}

export async function updateAdminOrderStatus(orderId: string, status: string, notifyCustomer = true) {
  const response = await fetchWithAdminAuth(`/api/orders/${orderId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notifyCustomer }),
  });

  const data = await readJsonResponse<{ ok?: boolean; error?: string; order?: OrderRecord }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not update order status.');
  }

  return data.order as OrderRecord;
}