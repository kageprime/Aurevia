import { fetchJson, readJsonResponse } from '@/lib/apiErrors';

const WHATSAPP_API_URL = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';

function endpoint(path: string) {
  return `${WHATSAPP_API_URL.replace(/\/$/, '')}${path}`;
}

export type PlatformHealth = {
  ok: boolean;
  service: string;
  storage?: 'memory' | 'postgres' | string;
};

export async function getPlatformHealth() {
  const response = await fetchJson(endpoint('/health'));
  const data = await readJsonResponse<PlatformHealth>(response);

  if (!response.ok || !data?.ok) {
    throw new Error('Could not reach platform health endpoint.');
  }

  return data;
}