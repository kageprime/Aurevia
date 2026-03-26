import { config, isTwilioConfigured } from './config.js';

function toWhatsappAddress(value) {
  if (!value) return '';
  if (value.startsWith('whatsapp:')) return value;

  const digits = value.replace(/[^\d+]/g, '');
  return digits ? `whatsapp:${digits}` : '';
}

export async function sendWhatsappMessage({ to, body }) {
  if (!isTwilioConfigured()) {
    return {
      ok: false,
      skipped: true,
      reason: 'Twilio credentials are not configured.',
    };
  }

  const target = toWhatsappAddress(to);
  if (!target) {
    return {
      ok: false,
      skipped: true,
      reason: 'Recipient WhatsApp number is missing.',
    };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set('From', config.twilioWhatsappFrom);
  form.set('To', target);
  form.set('Body', body);

  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });

  const payload = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      status: response.status,
      error: payload,
    };
  }

  return {
    ok: true,
    sid: payload.sid,
    status: payload.status,
    to: payload.to,
  };
}

export function buildOrderMessage(order) {
  const lines = order.items
    .map((item) => {
      const lineTotal = Number(item.price) * Number(item.quantity);
      return `• ${item.name} x${item.quantity} — $${lineTotal.toFixed(2)}`;
    })
    .join('\n');

  return [
    `New Aurevia Order: ${order.id}`,
    '',
    lines,
    '',
    `Subtotal: $${order.subtotal.toFixed(2)}`,
    `Customer Phone: ${order.customerPhone || 'not provided'}`,
    `Status: ${order.status}`,
  ].join('\n');
}

export function buildStatusMessage({ orderId, status }) {
  return [
    'Aurevia Order Update',
    '',
    `Order: ${orderId}`,
    `Status: ${status}`,
    '',
    'Reply to this message if you need help.',
  ].join('\n');
}

export function resolveBusinessRecipient() {
  return config.businessWhatsappTo;
}
