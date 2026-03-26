import type { CartItem } from '@/types';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
const WHATSAPP_API_URL = (import.meta.env.VITE_WHATSAPP_API_URL as string | undefined) ?? 'https://api.aureviacare.com.ng';

export function isCheckoutConfigured() {
  return Boolean(WHATSAPP_NUMBER && WHATSAPP_NUMBER.trim().length > 0);
}

async function syncOrderToBackend(items: CartItem[]) {
  const endpoint = `${WHATSAPP_API_URL.replace(/\/$/, '')}/api/checkout/whatsapp`;

  const payload = {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  };

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Could not sync order to backend', error);
  }
}

export async function startWhatsAppCheckout(items: CartItem[]) {
  if (items.length === 0) {
    throw new Error('Your bag is empty.');
  }

  if (!isCheckoutConfigured()) {
    throw new Error('Checkout is not configured yet. Add VITE_WHATSAPP_NUMBER to your .env file.');
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemLines = items
    .map((item) => `• ${item.name} x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const message = [
    'Hi Aurevia! I want to place this order:',
    '',
    itemLines,
    '',
    `Subtotal: $${subtotal.toFixed(2)}`,
    '',
    'Please confirm payment and shipping details.'
  ].join('\n');

  const targetNumber = (WHATSAPP_NUMBER as string).replace(/[^\d]/g, '');
  const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;

  await syncOrderToBackend(items);
  window.open(url, '_blank', 'noopener,noreferrer');
}