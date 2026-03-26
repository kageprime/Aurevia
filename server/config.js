import dotenv from 'dotenv';

dotenv.config();

function parsePort(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

export const config = {
  port: parsePort(process.env.WHATSAPP_BACKEND_PORT, 8787),
  apiKey: process.env.WHATSAPP_BACKEND_API_KEY ?? '',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  adminSessionTtlMs: parsePort(process.env.ADMIN_SESSION_TTL_MS, 900000),
  adminRefreshTtlMs: parsePort(process.env.ADMIN_REFRESH_TTL_MS, 2592000000),
  userSessionTtlMs: parsePort(process.env.USER_SESSION_TTL_MS, 900000),
  userRefreshTtlMs: parsePort(process.env.USER_REFRESH_TTL_MS, 2592000000),
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  authLockoutWindowMs: parsePort(process.env.AUTH_LOCKOUT_WINDOW_MS, 10 * 60 * 1000),
  authLockoutThreshold: parsePort(process.env.AUTH_LOCKOUT_THRESHOLD, 5),
  authLockoutDurationMs: parsePort(process.env.AUTH_LOCKOUT_DURATION_MS, 15 * 60 * 1000),
  adminMfaSecret: process.env.ADMIN_MFA_SECRET ?? '',
  adminMfaRecoveryCodes: (process.env.ADMIN_MFA_RECOVERY_CODES ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean),
  usePostgres: parseBoolean(process.env.USE_POSTGRES, false),
  autoMigrate: parseBoolean(process.env.DB_AUTO_MIGRATE, true),
  databaseUrl: process.env.DATABASE_URL ?? '',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? '',
  businessWhatsappTo: process.env.WHATSAPP_NOTIFY_TO ?? '',
  bankName: process.env.BANK_NAME ?? 'Aurevia Holdings',
  bankAccountName: process.env.BANK_ACCOUNT_NAME ?? 'Aurevia Beauty Ltd',
  bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '0000000000',
  bankSwiftCode: process.env.BANK_SWIFT_CODE ?? 'AURV0000',
};

export function isTwilioConfigured() {
  return Boolean(
    config.twilioAccountSid &&
      config.twilioAuthToken &&
      config.twilioWhatsappFrom
  );
}
