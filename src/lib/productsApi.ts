import type { FeaturedProductsBySection, FeaturedSectionKey, Product } from '@/types';
import { fetchJson, readJsonResponse } from '@/lib/apiErrors';

const WHATSAPP_API_URL = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';
const ADMIN_API_KEY = (import.meta.env.VITE_ADMIN_API_KEY as string | undefined) ?? '';

type TokenProvider = () => Promise<string | null>;

function endpoint(path: string) {
  return `${WHATSAPP_API_URL.replace(/\/$/, '')}${path}`;
}

function adminHeaders() {
  return ADMIN_API_KEY ? ({ 'x-api-key': ADMIN_API_KEY } as HeadersInit) : undefined;
}

function authHeaders(sessionToken?: string) {
  return sessionToken ? ({ Authorization: `Bearer ${sessionToken}` } as HeadersInit) : undefined;
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

export async function listProducts(category?: Product['category'], includeInactive = false) {
  const params = new URLSearchParams();
  if (category) {
    params.set('category', category);
  }
  if (includeInactive) {
    params.set('includeInactive', 'true');
  }

  const query = params.toString();
  const response = await fetchJson(endpoint(`/api/products${query ? `?${query}` : ''}`), {
    credentials: 'include',
  });
  const data = await readJsonResponse<{ ok?: boolean; error?: string; products?: Product[] }>(response);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not load products.');
  }

  return data.products as Product[];
}

export type CreateProductInput = {
  name: string;
  price: number;
  category: Product['category'];
  subcategory: string;
  image: string;
  description: string;
  isActive?: boolean;
};

export async function createAdminProduct(input: CreateProductInput, getToken?: TokenProvider) {
  const sessionToken = getToken ? (await getToken()) ?? undefined : undefined;
  const response = await fetchWithAdminAuth('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string; product?: Product }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not create product.');
  }

  return data.product as Product;
}

export async function updateAdminProduct(productId: string, patch: Partial<CreateProductInput>, getToken?: TokenProvider) {
  const sessionToken = getToken ? (await getToken()) ?? undefined : undefined;
  const response = await fetchWithAdminAuth(`/api/admin/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string; product?: Product }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not update product.');
  }

  return data.product as Product;
}

export async function deleteAdminProduct(productId: string, getToken?: TokenProvider) {
  const sessionToken = getToken ? (await getToken()) ?? undefined : undefined;
  const response = await fetchWithAdminAuth(`/api/admin/products/${productId}`, {
    method: 'DELETE',
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not delete product.');
  }

  return true;
}

export async function listFeaturedProductsBySection(section: FeaturedSectionKey) {
  const params = new URLSearchParams();
  params.set('section', section);

  const query = params.toString();
  const response = await fetchJson(endpoint(`/api/featured-products${query ? `?${query}` : ''}`), {
    credentials: 'include',
  });
  const data = await readJsonResponse<{ ok?: boolean; error?: string; products?: Product[] }>(response);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not load featured products.');
  }

  return data.products as Product[];
}

export async function listFeaturedProducts() {
  const response = await fetchJson(endpoint('/api/featured-products'), {
    credentials: 'include',
  });
  const data = await readJsonResponse<{ ok?: boolean; error?: string; featured?: FeaturedProductsBySection }>(response);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not load featured products.');
  }

  return data.featured as FeaturedProductsBySection;
}

export async function updateAdminFeaturedProducts(section: FeaturedSectionKey, productIds: string[], getToken?: TokenProvider) {
  const sessionToken = getToken ? (await getToken()) ?? undefined : undefined;
  const response = await fetchWithAdminAuth(`/api/admin/featured-products/${section}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productIds }),
  }, sessionToken);

  const data = await readJsonResponse<{ ok?: boolean; error?: string; products?: Product[] }>(response);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Could not update featured products.');
  }

  return data.products as Product[];
}