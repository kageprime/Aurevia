import type { CartItem } from '@/types';
import { fetchJson, getErrorMessage, getFirstFormErrorMessage, readJsonResponse } from '@/lib/apiErrors';

const WHATSAPP_API_URL = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';
const ADMIN_API_KEY = (import.meta.env.VITE_ADMIN_API_KEY as string | undefined) ?? '';

type TokenProvider = () => Promise<string | null>;

export type OrderItemRecord = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderStatusHistoryEntry = {
  status: string;
  at: string;
  note?: string;
};

export type OrderRecord = {
  id: string;
  userId?: string;
  userEmail?: string;
  status: string;
  subtotal: number;
  items?: OrderItemRecord[];
  customerName?: string | null;
  customerPhone?: string | null;
  customerWhatsApp?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  paymentLast4?: string | null;
  cardholderName?: string | null;
  cardExpiry?: string | null;
  receiptUrl?: string | null;
  transferReference?: string | null;
  transferNote?: string | null;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    swiftCode?: string;
  } | null;
  statusHistory?: OrderStatusHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
};

function endpoint(path: string) {
  return `${WHATSAPP_API_URL.replace(/\/$/, '')}${path}`;
}

function adminHeaders() {
  return ADMIN_API_KEY ? ({ 'x-api-key': ADMIN_API_KEY } as HeadersInit) : undefined;
}

function authHeaders(sessionToken?: string) {
  return sessionToken ? ({ Authorization: `Bearer ${sessionToken}` } as HeadersInit) : undefined;
}

async function fetchWithSession(path: string, init: RequestInit = {}, sessionToken?: string) {
  return fetchJson(endpoint(path), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers ?? {}),
      ...authHeaders(sessionToken),
    },
  });
}

async function fetchWithAdminAuth(path: string, init: RequestInit = {}, sessionToken?: string) {
  return fetchJson(endpoint(path), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers ?? {}),
      ...authHeaders(sessionToken),
      ...adminHeaders(),
    },
  });
}

async function resolveSessionToken(getToken?: TokenProvider) {
  return getToken ? (await getToken()) ?? undefined : undefined;
}

export async function createManualTransferOrder(items: CartItem[], getToken?: TokenProvider) {
  if (items.length === 0) {
    throw new Error('Your bag is empty.');
  }

  const sessionToken = await resolveSessionToken(getToken);

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
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: unknown; orderId?: string }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(getFirstFormErrorMessage(data?.error) ?? getErrorMessage(data?.error) ?? 'Could not create manual order.');
  }

  return data;
}

type CardPaymentDetails = {
  cardholderName: string;
  cardBrand: string;
  cardLast4: string;
  cardExpiry: string;
  billingEmail?: string;
  billingPhone?: string;
};

export async function createCardPaymentOrder(items: CartItem[], paymentDetails: CardPaymentDetails, getToken?: TokenProvider) {
  if (items.length === 0) {
    throw new Error('Your bag is empty.');
  }

  const sessionToken = await resolveSessionToken(getToken);

  const response = await fetchWithSession('/api/checkout/card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      ...paymentDetails,
    }),
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: unknown; orderId?: string }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(getFirstFormErrorMessage(data?.error) ?? getErrorMessage(data?.error) ?? 'Could not create card payment order.');
  }

  return data;
}

export async function fetchOrder(orderId: string, getToken?: TokenProvider) {
  const sessionToken = await resolveSessionToken(getToken);
  const response = await fetchWithSession(`/api/orders/${orderId}`, {}, sessionToken);
  const data = await readJsonResponse<{ ok?: boolean; error?: string; order?: OrderRecord }>(response);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Order not found.');
  }

  return data.order as OrderRecord;
}

export async function uploadOrderReceipt(orderId: string, file: File, transferReference?: string, note?: string, getToken?: TokenProvider) {
  const formData = new FormData();
  formData.append('receipt', file);
  if (transferReference) formData.append('transferReference', transferReference);
  if (note) formData.append('note', note);

  const sessionToken = await resolveSessionToken(getToken);

  const response = await fetchWithSession(`/api/orders/${orderId}/receipt`, {
    method: 'POST',
    body: formData,
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string; order?: OrderRecord }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not upload receipt.');
  }

  return data.order as OrderRecord;
}

export async function listUserOrders(getToken?: TokenProvider) {
  const sessionToken = await resolveSessionToken(getToken);
  const response = await fetchWithSession('/api/users/orders', {}, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string; orders?: OrderRecord[] }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not load your orders.');
  }

  return data.orders ?? [];
}

export async function listAdminOrders(getToken?: TokenProvider) {
  const sessionToken = await resolveSessionToken(getToken);
  const response = await fetchWithAdminAuth('/api/orders', {}, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string; orders?: OrderRecord[] }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not load admin orders.');
  }

  return data.orders ?? [];
}

export async function updateAdminOrderStatus(orderId: string, status: string, notifyCustomer = true, getToken?: TokenProvider) {
  const sessionToken = await resolveSessionToken(getToken);
  const response = await fetchWithAdminAuth(`/api/orders/${orderId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notifyCustomer }),
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string; order?: OrderRecord }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not update order status.');
  }

  return data.order as OrderRecord;
}