import { fetchJson, getErrorMessage, getFirstFormErrorMessage, readJsonResponse } from '@/lib/apiErrors';

const WHATSAPP_API_URL = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';
const ADMIN_API_KEY = (import.meta.env.VITE_ADMIN_API_KEY as string | undefined) ?? '';

type TokenProvider = () => Promise<string | null>;

export type AdminIdentity = {
  email: string;
  role: string;
  permissions: string[];
  source?: string;
};

export type AdminEventRecord = {
  type: string;
  createdAt?: string;
  orderId?: string;
  productId?: string;
  sectionKey?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
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

async function resolveSessionToken(getToken?: TokenProvider) {
  return getToken ? (await getToken()) ?? undefined : undefined;
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

export async function getAdminIdentity(getToken?: TokenProvider) {
  const sessionToken = await resolveSessionToken(getToken);
  const response = await fetchWithAdminAuth('/api/admin/me', {}, sessionToken);
  const data = await readJsonResponse<{ ok?: boolean; error?: unknown; admin?: AdminIdentity }>(response);

  if (!response.ok || !data?.ok || !data.admin) {
    throw new Error(getFirstFormErrorMessage(data?.error) ?? getErrorMessage(data?.error) ?? 'Could not verify admin access.');
  }

  return data.admin;
}

export async function listAdminEvents(getToken?: TokenProvider) {
  const sessionToken = await resolveSessionToken(getToken);
  const response = await fetchWithAdminAuth('/api/events', {}, sessionToken);
  const data = await readJsonResponse<{ ok?: boolean; error?: unknown; events?: AdminEventRecord[] }>(response);

  if (!response.ok || !data?.ok) {
    throw new Error(getFirstFormErrorMessage(data?.error) ?? getErrorMessage(data?.error) ?? 'Could not load admin events.');
  }

  return data.events ?? [];
}
