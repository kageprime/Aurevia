import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

const cwd = process.cwd();
const envPath = path.join(cwd, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasLivePrefix(value, prefix) {
  return isNonEmpty(value) && value.trim().startsWith(prefix);
}

function isHttpsUrl(value) {
  if (!isNonEmpty(value)) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseOrigins(value) {
  if (!isNonEmpty(value)) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const checks = [
  {
    key: 'VITE_CLERK_PUBLISHABLE_KEY',
    valid: hasLivePrefix(process.env.VITE_CLERK_PUBLISHABLE_KEY, 'pk_live_'),
    message: 'must be a live Clerk publishable key starting with pk_live_.',
  },
  {
    key: 'CLERK_SECRET_KEY',
    valid: hasLivePrefix(process.env.CLERK_SECRET_KEY, 'sk_live_'),
    message: 'must be a live Clerk secret key starting with sk_live_.',
  },
  {
    key: 'VITE_WHATSAPP_API_URL',
    valid: isHttpsUrl(process.env.VITE_WHATSAPP_API_URL),
    message: 'must be a valid https URL.',
  },
  {
    key: 'VITE_SITE_URL',
    valid: isHttpsUrl(process.env.VITE_SITE_URL),
    message: 'must be a valid https URL.',
  },
];

const origins = parseOrigins(process.env.FRONTEND_ORIGIN);
const hasOrigin = origins.length > 0;
const hasLocalhostOrigin = origins.some((origin) => /localhost|127\.0\.0\.1/i.test(origin));

const failures = checks.filter((check) => !check.valid);

if (!hasOrigin) {
  failures.push({
    key: 'FRONTEND_ORIGIN',
    message: 'must include at least one deployed frontend origin.',
  });
}

if (hasLocalhostOrigin && process.env.NODE_ENV === 'production') {
  failures.push({
    key: 'FRONTEND_ORIGIN',
    message: 'contains localhost values while NODE_ENV=production.',
  });
}

if (failures.length > 0) {
  console.error('Production env verification failed.');
  for (const failure of failures) {
    console.error(`- ${failure.key}: ${failure.message}`);
  }
  process.exit(1);
}

console.log('Production env verification passed.');
