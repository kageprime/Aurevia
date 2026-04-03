import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express';

import { config } from './config.js';
import { getDataStore, initializeDataStore } from './dataStore.js';
import {
  buildOrderMessage,
  buildStatusMessage,
  resolveBusinessRecipient,
  sendWhatsappMessage,
} from './whatsapp.js';

const app = express();
let store;
const adminSessions = new Map();
const adminRefreshSessions = new Map();
const userSessions = new Map();
const userRefreshSessions = new Map();
const authAttempts = new Map();
const usedAdminRecoveryCodes = new Set();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const distDir = path.join(__dirname, '..', 'dist');
const authCookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/',
};
const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const ADMIN_ROLE_PERMISSIONS = {
  owner: ['*'],
  manager: ['orders.read', 'orders.write', 'products.read', 'products.write', 'featured.write', 'events.read', 'events.write', 'settings.read'],
  support: ['orders.read', 'orders.write', 'events.read'],
  merchandiser: ['products.read', 'products.write', 'featured.write', 'events.read'],
  analyst: ['orders.read', 'products.read', 'events.read', 'settings.read'],
  viewer: ['orders.read', 'products.read', 'events.read'],
};

const VALID_ADMIN_ROLES = new Set(Object.keys(ADMIN_ROLE_PERMISSIONS));

function normalizeOrigin(origin) {
  try {
    return new URL(origin).origin;
  } catch {
    return origin;
  }
}

function expandEquivalentOrigins(origin) {
  const normalized = normalizeOrigin(origin);

  try {
    const url = new URL(normalized);
    const port = url.port ? `:${url.port}` : '';
    const bareHost = url.hostname.startsWith('www.') ? url.hostname.slice(4) : url.hostname;
    const wwwHost = url.hostname.startsWith('www.') ? url.hostname : `www.${url.hostname}`;

    return [
      normalized,
      `${url.protocol}//${bareHost}${port}`,
      `${url.protocol}//${wwwHost}${port}`,
    ];
  } catch {
    return [normalized];
  }
}

const allowedOrigins = new Set(config.frontendOrigins.flatMap((origin) => expandEquivalentOrigins(origin)));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadFileSizeLimit = 10 * 1024 * 1024;

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || '.jpg';
    const safeExt = extension.toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${req.params.orderId}-${Date.now()}${safeExt}`);
  },
});

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || '.jpg';
    const safeExt = extension.toLowerCase().replace(/[^.a-z0-9]/g, '');
    const productRef = String(req.params.productId ?? '').trim() || `product-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const safeRef = productRef.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    cb(null, `${safeRef}-${Date.now()}${safeExt}`);
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: {
    fileSize: uploadFileSizeLimit,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported receipt file type. Use JPG, PNG, WEBP, or PDF.'));
  },
});

const productImageUpload = multer({
  storage: productImageStorage,
  limits: {
    fileSize: uploadFileSizeLimit,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported product image type. Use JPG, PNG, or WEBP.'));
  },
});

function hashToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, item) => {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (!rawName) return acc;
    const name = rawName.trim();
    if (!name) return acc;
    const value = rawValue.join('=').trim();
    if (!value) return acc;
    try {
      acc[name] = decodeURIComponent(value);
    } catch {
      acc[name] = value;
    }
    return acc;
  }, {});
}

function getCookie(req, name) {
  return parseCookies(req.headers.cookie ?? '')[name] ?? '';
}

function getRequestToken(req, accessCookieName) {
  return getBearerToken(req) || getCookie(req, accessCookieName) || '';
}

function getRequestRefreshToken(req, refreshCookieName, parsedBodyRefreshToken = '') {
  return parsedBodyRefreshToken || getCookie(req, refreshCookieName) || '';
}

function parseBooleanInput(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return undefined;
}

function parsePositiveInt(value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const rounded = Math.floor(parsed);
  if (rounded < min) {
    return min;
  }

  if (rounded > max) {
    return max;
  }

  return rounded;
}

function normalizeAdminRole(role) {
  const normalized = String(role ?? '').trim().toLowerCase();
  return VALID_ADMIN_ROLES.has(normalized) ? normalized : 'viewer';
}

function getAdminRoleByEmail(email = '') {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const bindingRole = config.adminRoleBindings[normalizedEmail];
  if (bindingRole) {
    return normalizeAdminRole(bindingRole);
  }

  if (config.adminEmail && normalizedEmail === config.adminEmail.trim().toLowerCase()) {
    return 'owner';
  }

  return null;
}

function buildAdminContext({ email = '', source = 'session' } = {}) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const role = source === 'api_key' ? 'owner' : (getAdminRoleByEmail(normalizedEmail) ?? 'viewer');
  const permissions = ADMIN_ROLE_PERMISSIONS[role] ?? ADMIN_ROLE_PERMISSIONS.viewer;

  return {
    email: normalizedEmail || 'api-key-admin',
    role,
    permissions,
    source,
  };
}

function hasPermission(admin, permission) {
  if (!admin || !Array.isArray(admin.permissions)) {
    return false;
  }

  return admin.permissions.includes('*') || admin.permissions.includes(permission);
}

function requireAdminPermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.admin, permission)) {
      return res.status(403).json({
        ok: false,
        error: `Forbidden. Missing permission: ${permission}`,
        code: 'ADMIN_PERMISSION_FORBIDDEN',
      });
    }

    return next();
  };
}

function extractUploadFilename(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  try {
    const parsed = new URL(value);
    const marker = '/api/uploads/';
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) {
      return '';
    }
    const filename = parsed.pathname.slice(index + marker.length).trim();
    const safe = path.basename(filename);
    return safe === filename ? safe : '';
  } catch {
    const marker = '/api/uploads/';
    const index = value.indexOf(marker);
    if (index === -1) {
      return '';
    }
    const filename = value.slice(index + marker.length).split(/[?#]/)[0].trim();
    const safe = path.basename(filename);
    return safe === filename ? safe : '';
  }
}

async function removeOrphanedUploadFile(filename) {
  const safeName = path.basename(String(filename ?? '').trim());
  if (!safeName) {
    return false;
  }

  const suffix = `/api/uploads/${safeName}`;
  const [products, orders] = await Promise.all([
    store.listProducts({ includeInactive: true }),
    store.listOrders(),
  ]);

  const stillUsedByProduct = products.some((product) => String(product.image ?? '').endsWith(suffix));
  const stillUsedByReceipt = orders.some((order) => String(order.receiptUrl ?? '').endsWith(suffix));
  if (stillUsedByProduct || stillUsedByReceipt) {
    return false;
  }

  const filePath = path.join(uploadsDir, safeName);
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function setSessionCookies(res, kind, accessToken, refreshToken) {
  const accessCookieName = `${kind}_access_token`;
  const refreshCookieName = `${kind}_refresh_token`;

  res.cookie(accessCookieName, accessToken, {
    ...authCookieOptions,
    maxAge: kind === 'admin' ? config.adminSessionTtlMs : config.userSessionTtlMs,
  });
  res.cookie(refreshCookieName, refreshToken, {
    ...authCookieOptions,
    maxAge: kind === 'admin' ? config.adminRefreshTtlMs : config.userRefreshTtlMs,
  });
}

function clearSessionCookies(res, kind) {
  const accessCookieName = `${kind}_access_token`;
  const refreshCookieName = `${kind}_refresh_token`;

  res.clearCookie(accessCookieName, authCookieOptions);
  res.clearCookie(refreshCookieName, authCookieOptions);
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getAttemptState(key) {
  const state = authAttempts.get(key);
  if (!state) {
    return { failures: 0, firstFailureAt: 0, lockedUntil: 0 };
  }

  if (state.firstFailureAt && Date.now() - state.firstFailureAt > config.authLockoutWindowMs) {
    authAttempts.delete(key);
    return { failures: 0, firstFailureAt: 0, lockedUntil: 0 };
  }

  return state;
}

function isRateLimited(keys) {
  const now = Date.now();
  for (const key of keys) {
    const state = getAttemptState(key);
    if (state.lockedUntil && state.lockedUntil > now) {
      return state.lockedUntil - now;
    }
  }

  return 0;
}

function recordFailure(keys) {
  const now = Date.now();
  for (const key of keys) {
    const state = getAttemptState(key);
    const failures = state.firstFailureAt ? state.failures + 1 : 1;
    const firstFailureAt = state.firstFailureAt || now;
    const lockedUntil = failures >= config.authLockoutThreshold ? now + config.authLockoutDurationMs : 0;
    authAttempts.set(key, { failures, firstFailureAt, lockedUntil });
  }
}

function clearFailures(keys) {
  for (const key of keys) {
    authAttempts.delete(key);
  }
}

function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev",
      "frame-src 'self' https://*.clerk.accounts.dev",
    ].join('; ')
  );
  next();
}

function csrfProtection(req, res, next) {
  if (CSRF_SAFE_METHODS.has(req.method)) {
    return next();
  }

  const hasCookieAuth = Boolean(
    getCookie(req, 'aurevia_user_access_token') ||
      getCookie(req, 'aurevia_user_refresh_token') ||
      getCookie(req, 'aurevia_admin_access_token') ||
      getCookie(req, 'aurevia_admin_refresh_token')
  );

  if (!hasCookieAuth || req.headers.authorization || req.headers['x-api-key']) {
    return next();
  }

  const origin = req.headers.origin ?? '';
  const referer = req.headers.referer ?? '';
  const expectedHosts = new Set([allowedOrigin, `http://${req.get('host')}`, `https://${req.get('host')}`].filter(Boolean));

  if (origin && !expectedHosts.has(origin)) {
    return res.status(403).json({ ok: false, error: 'Blocked by origin policy.' });
  }

  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!expectedHosts.has(refererOrigin)) {
        return res.status(403).json({ ok: false, error: 'Blocked by origin policy.' });
      }
    } catch {
      return res.status(403).json({ ok: false, error: 'Blocked by origin policy.' });
    }
  }

  if (!origin && !referer) {
    return res.status(403).json({ ok: false, error: 'Blocked by origin policy.' });
  }

  return next();
}

function generateTotp(secret, timeStep = Math.floor(Date.now() / 30000)) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(timeStep));
  const hmac = crypto.createHmac('sha1', secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

function timingSafeStringMatch(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function verifyAdminMfa(input = {}) {
  if (!config.adminMfaSecret) {
    return true;
  }

  if (typeof input.recoveryCode === 'string' && input.recoveryCode.trim()) {
    const recoveryHash = hashToken(input.recoveryCode.trim());
    if (usedAdminRecoveryCodes.has(recoveryHash)) {
      return false;
    }

    const configuredHashes = new Set(config.adminMfaRecoveryCodes.map((code) => hashToken(code)));
    if (configuredHashes.has(recoveryHash)) {
      usedAdminRecoveryCodes.add(recoveryHash);
      return true;
    }
  }

  if (typeof input.mfaCode === 'string' && input.mfaCode.trim()) {
    const code = input.mfaCode.trim();
    const expectedCodes = [
      generateTotp(config.adminMfaSecret, Math.floor(Date.now() / 30000) - 1),
      generateTotp(config.adminMfaSecret, Math.floor(Date.now() / 30000)),
      generateTotp(config.adminMfaSecret, Math.floor(Date.now() / 30000) + 1),
    ];

    return expectedCodes.some((expected) => timingSafeStringMatch(code, expected));
  }

  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin ? normalizeOrigin(origin) : '';

      if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders);
app.use(csrfProtection);
app.use(clerkMiddleware());

function getBearerToken(req) {
  const bearerHeader = req.headers.authorization;
  if (!bearerHeader?.startsWith('Bearer ')) {
    return '';
  }

  return bearerHeader.slice(7);
}

function hashPassword(value) {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.scryptSync(value, salt, 64).toString('hex');
  return `${salt}:${digest}`;
}

function verifyPassword(value, storedValue) {
  if (typeof storedValue !== 'string' || !storedValue) {
    return false;
  }

  if (!storedValue.includes(':')) {
    const legacyHash = crypto.createHash('sha256').update(value).digest('hex');
    return legacyHash === storedValue;
  }

  const [salt, storedDigest] = storedValue.split(':');
  if (!salt || !storedDigest) {
    return false;
  }

  const digestBuffer = Buffer.from(crypto.scryptSync(value, salt, 64).toString('hex'), 'hex');
  const storedBuffer = Buffer.from(storedDigest, 'hex');
  if (digestBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, storedBuffer);
}

function issueAdminSession({ email }) {
  const accessToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const accessTokenHash = hashToken(accessToken);
  const refreshTokenHash = hashToken(refreshToken);

  const accessSession = {
    email,
    role: getAdminRoleByEmail(email) ?? 'owner',
    createdAt: now,
    expiresAt: now + config.adminSessionTtlMs,
  };
  const refreshSession = {
    email,
    role: getAdminRoleByEmail(email) ?? 'owner',
    createdAt: now,
    expiresAt: now + config.adminRefreshTtlMs,
  };

  adminSessions.set(accessTokenHash, accessSession);
  adminRefreshSessions.set(refreshTokenHash, refreshSession);

  return {
    accessToken,
    refreshToken,
    expiresInMs: config.adminSessionTtlMs,
    refreshExpiresInMs: config.adminRefreshTtlMs,
  };
}

function issueUserSession({ userId, email, name }) {
  const accessToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const accessTokenHash = hashToken(accessToken);
  const refreshTokenHash = hashToken(refreshToken);

  const accessSession = {
    userId,
    email,
    name,
    createdAt: now,
    expiresAt: now + config.userSessionTtlMs,
  };
  const refreshSession = {
    userId,
    email,
    name,
    createdAt: now,
    expiresAt: now + config.userRefreshTtlMs,
  };

  userSessions.set(accessTokenHash, accessSession);
  userRefreshSessions.set(refreshTokenHash, refreshSession);

  return {
    accessToken,
    refreshToken,
    expiresInMs: config.userSessionTtlMs,
    refreshExpiresInMs: config.userRefreshTtlMs,
  };
}

function getAdminSession(req) {
  const token = getRequestToken(req, 'aurevia_admin_access_token');
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = adminSessions.get(tokenHash);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(tokenHash);
    return null;
  }

  return session;
}

function getUserSession(req) {
  const token = getRequestToken(req, 'aurevia_user_access_token');
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = userSessions.get(tokenHash);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    userSessions.delete(tokenHash);
    return null;
  }

  return session;
}

function getAdminRefreshSession(token) {
  if (!token) return null;
  const session = adminRefreshSessions.get(hashToken(token));
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    adminRefreshSessions.delete(token);
    return null;
  }

  return session;
}

function getUserRefreshSession(token) {
  if (!token) return null;
  const session = userRefreshSessions.get(hashToken(token));
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    userRefreshSessions.delete(token);
    return null;
  }

  return session;
}

async function getClerkUserContext(req) {
  const auth = getAuth(req);
  if (!auth.userId) {
    return null;
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? '';
    const name = user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(' ') ?? user.username ?? email;

    return {
      id: auth.userId,
      email,
      name,
    };
  } catch {
    return null;
  }
}

async function userAuthMiddleware(req, res, next) {
  const user = await getClerkUserContext(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Please sign in first.' });
  }

  req.user = user;

  return next();
}

async function authMiddleware(req, res, next) {
  const hasApiKey = Boolean(config.apiKey);
  const adminEmail = config.adminEmail.trim().toLowerCase();
  const hasRoleBindings = Object.keys(config.adminRoleBindings).length > 0;
  const providedApiKey = req.headers['x-api-key'];
  const hasValidApiKey = hasApiKey && providedApiKey === config.apiKey;
  const adminSession = getAdminSession(req);

  if (!hasApiKey && !adminEmail && !hasRoleBindings) {
    req.admin = buildAdminContext({ email: 'open-admin@local', source: 'open' });
    return next();
  }

  if (adminSession?.email) {
    req.admin = buildAdminContext({ email: adminSession.email, source: 'session' });
    return next();
  }

  const user = await getClerkUserContext(req);
  if (user) {
    const role = getAdminRoleByEmail(user.email);
    if (role) {
      req.admin = buildAdminContext({ email: user.email, source: 'clerk' });
      return next();
    }

    if (hasValidApiKey) {
      req.admin = buildAdminContext({ email: user.email, source: 'api_key' });
      return next();
    }

    return res.status(403).json({
      ok: false,
      error: 'Signed in but not authorized for admin access. Use the ADMIN_EMAIL account.',
      code: 'ADMIN_ALLOWLIST_FORBIDDEN',
      signedInEmail: user.email,
    });
  }

  if (hasValidApiKey) {
    req.admin = buildAdminContext({ source: 'api_key' });
    return next();
  }

  return res.status(401).json({
    ok: false,
    error: 'Please sign in with the admin Clerk account or provide a valid API key.',
    code: 'ADMIN_AUTH_REQUIRED',
  });
}

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().trim().optional(),
  recoveryCode: z.string().trim().optional(),
});

const userRegisterSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  phone: z.string().trim().optional(),
});

const userLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().trim().optional(),
});

const checkoutSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  customerWhatsApp: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        price: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  transferPhone: z.string().trim().optional(),
});

const cardCheckoutSchema = checkoutSchema.extend({
  cardholderName: z.string().trim().min(2),
  cardBrand: z.string().trim().min(2),
  cardLast4: z.string().trim().length(4),
  cardExpiry: z.string().trim().min(4),
  billingEmail: z.string().trim().email().optional(),
  billingPhone: z.string().trim().optional(),
  paymentReference: z.string().trim().optional(),
});

const submitReceiptSchema = z.object({
  transferReference: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

const eventSchema = z.object({
  type: z.string().min(1),
  userPhone: z.string().optional(),
  message: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
  customerPhone: z.string().optional(),
  notifyCustomer: z.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().nonnegative(),
  category: z.enum(['lip', 'skincare']),
  subcategory: z.string().trim().min(1),
  image: z.string().trim().min(1),
  description: z.string().trim().min(1),
  stockQuantity: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const FEATURED_SECTION_KEYS = ['story-aurevia', 'story-deconstructed', 'shop-lip', 'shop-skincare'];
const sectionCategoryRules = {
  'story-aurevia': 'lip',
  'story-deconstructed': 'lip',
  'shop-lip': 'lip',
  'shop-skincare': 'skincare',
};

const featuredSectionSchema = z.enum(FEATURED_SECTION_KEYS);
const featuredProductsSchema = z.object({
  productIds: z.array(z.string().min(1)).max(12),
});

function buildRateLimitKeys(prefix, values) {
  return values.map((value) => `${prefix}:${String(value).trim().toLowerCase() || 'unknown'}`);
}

async function ensureStoredClerkUser(clerkUser) {
  const existing = await store.getUserById(clerkUser.id);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  try {
    return await store.createUser({
      id: clerkUser.id,
      name: clerkUser.name || clerkUser.email || 'Aurevia shopper',
      email: clerkUser.email || `${clerkUser.id}@clerk.local`,
      passwordHash: `clerk:${clerkUser.id}`,
      phone: '',
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    const emailUser = clerkUser.email ? await store.getUserByEmail(clerkUser.email) : null;
    if (emailUser) {
      return emailUser;
    }

    throw new Error('Could not create user profile.');
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'aurevia-whatsapp-backend', storage: store?.mode ?? 'unknown' });
});

app.post('/api/users/register', async (req, res) => {
  const parsed = userRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const existing = await store.getUserByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
  }

  const user = await store.createUser({
    id: `usr-${Date.now()}`,
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: hashPassword(parsed.data.password),
    phone: parsed.data.phone ?? '',
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  });
});

app.post('/api/users/login', async (req, res) => {
  const parsed = userLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const rateLimitKeys = buildRateLimitKeys('user-login', [parsed.data.email, getClientIp(req), `${parsed.data.email}:${getClientIp(req)}`]);
  const retryAfterMs = isRateLimited(rateLimitKeys);
  if (retryAfterMs > 0) {
    res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please try again later.' });
  }

  const user = await store.getUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    recordFailure(rateLimitKeys);
    return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
  }

  if (!String(user.passwordHash).includes(':')) {
    await store.updateUser(user.id, { passwordHash: hashPassword(parsed.data.password) });
  }

  clearFailures(rateLimitKeys);

  const session = issueUserSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  setSessionCookies(res, 'user', session.accessToken, session.refreshToken);

  return res.json({
    ok: true,
    token: session.accessToken,
    refreshToken: session.refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    expiresInMs: session.expiresInMs,
    refreshExpiresInMs: session.refreshExpiresInMs,
  });
});

app.post('/api/users/refresh', (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const rateLimitKeys = buildRateLimitKeys('user-refresh', [getClientIp(req)]);
  const retryAfterMs = isRateLimited(rateLimitKeys);
  if (retryAfterMs > 0) {
    res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please try again later.' });
  }

  const refreshToken = getRequestRefreshToken(req, 'aurevia_user_refresh_token', parsed.data.refreshToken ?? '');
  const refreshSession = getUserRefreshSession(refreshToken);
  if (!refreshSession) {
    recordFailure(rateLimitKeys);
    return res.status(401).json({ ok: false, error: 'Invalid or expired refresh token.' });
  }

  clearFailures(rateLimitKeys);
  userRefreshSessions.delete(hashToken(refreshToken));
  const session = issueUserSession({
    userId: refreshSession.userId,
    email: refreshSession.email,
    name: refreshSession.name,
  });

  setSessionCookies(res, 'user', session.accessToken, session.refreshToken);

  return res.json({
    ok: true,
    token: session.accessToken,
    refreshToken: session.refreshToken,
    expiresInMs: session.expiresInMs,
    refreshExpiresInMs: session.refreshExpiresInMs,
  });
});

app.get('/api/users/me', userAuthMiddleware, async (req, res) => {
  const user = await ensureStoredClerkUser(req.user);

  return res.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  });
});

app.post('/api/users/logout', (req, res) => {
  const accessToken = getRequestToken(req, 'aurevia_user_access_token');
  const refreshToken = getRequestRefreshToken(req, 'aurevia_user_refresh_token');

  if (accessToken) {
    userSessions.delete(hashToken(accessToken));
  }
  if (refreshToken) {
    userRefreshSessions.delete(hashToken(refreshToken));
  }

  clearSessionCookies(res, 'user');
  return res.status(204).end();
});

app.get('/api/users/orders', userAuthMiddleware, async (req, res) => {
  await ensureStoredClerkUser(req.user);
  const orders = await store.listOrdersByUser(req.user.id);
  return res.json({ ok: true, orders });
});

app.post('/api/admin/login', (req, res) => {
  if (!config.adminEmail || !config.adminPassword) {
    return res.status(503).json({
      ok: false,
      error: 'Admin account is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.',
    });
  }

  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const rateLimitKeys = buildRateLimitKeys('admin-login', [parsed.data.email, getClientIp(req), `${parsed.data.email}:${getClientIp(req)}`]);
  const retryAfterMs = isRateLimited(rateLimitKeys);
  if (retryAfterMs > 0) {
    res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please try again later.' });
  }

  const { email, password } = parsed.data;
  const adminRole = getAdminRoleByEmail(email);
  if (!adminRole || password !== config.adminPassword) {
    recordFailure(rateLimitKeys);
    return res.status(401).json({ ok: false, error: 'Invalid admin credentials.' });
  }

  if (!verifyAdminMfa(parsed.data)) {
    recordFailure(rateLimitKeys);
    return res.status(401).json({ ok: false, error: 'Invalid admin credentials or MFA code.' });
  }

  clearFailures(rateLimitKeys);

  const session = issueAdminSession({ email });

  setSessionCookies(res, 'admin', session.accessToken, session.refreshToken);

  return res.json({
    ok: true,
    token: session.accessToken,
    refreshToken: session.refreshToken,
    admin: buildAdminContext({ email, source: 'session' }),
    expiresInMs: session.expiresInMs,
    refreshExpiresInMs: session.refreshExpiresInMs,
  });
});

app.post('/api/admin/refresh', (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const rateLimitKeys = buildRateLimitKeys('admin-refresh', [getClientIp(req)]);
  const retryAfterMs = isRateLimited(rateLimitKeys);
  if (retryAfterMs > 0) {
    res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please try again later.' });
  }

  const refreshToken = getRequestRefreshToken(req, 'aurevia_admin_refresh_token', parsed.data.refreshToken ?? '');
  const refreshSession = getAdminRefreshSession(refreshToken);
  if (!refreshSession) {
    recordFailure(rateLimitKeys);
    return res.status(401).json({ ok: false, error: 'Invalid or expired refresh token.' });
  }

  clearFailures(rateLimitKeys);
  adminRefreshSessions.delete(hashToken(refreshToken));
  const session = issueAdminSession({ email: refreshSession.email });

  setSessionCookies(res, 'admin', session.accessToken, session.refreshToken);

  return res.json({
    ok: true,
    token: session.accessToken,
    refreshToken: session.refreshToken,
    expiresInMs: session.expiresInMs,
    refreshExpiresInMs: session.refreshExpiresInMs,
  });
});

app.post('/api/admin/logout', (req, res) => {
  const accessToken = getRequestToken(req, 'aurevia_admin_access_token');
  const refreshToken = getRequestRefreshToken(req, 'aurevia_admin_refresh_token');

  if (accessToken) {
    adminSessions.delete(hashToken(accessToken));
  }
  if (refreshToken) {
    adminRefreshSessions.delete(hashToken(refreshToken));
  }

  clearSessionCookies(res, 'admin');
  return res.status(204).end();
});

app.get('/api/admin/me', authMiddleware, (req, res) => {
  return res.json({
    ok: true,
    admin: req.admin ?? buildAdminContext({ source: 'api_key' }),
  });
});

app.get('/api/orders', authMiddleware, requireAdminPermission('orders.read'), async (_req, res) => {
  res.json({ ok: true, orders: await store.listOrders() });
});

app.get('/api/orders/:orderId', async (req, res) => {
  const order = await store.getOrder(req.params.orderId);
  if (!order) {
    return res.status(404).json({ ok: false, error: 'Order not found' });
  }

  const hasApiKey = Boolean(config.apiKey) && req.headers['x-api-key'] === config.apiKey;
  const adminSession = getAdminSession(req);
  const userSession = getUserSession(req);
  const clerkUser = await getClerkUserContext(req);
  const isOwner = Boolean(
    clerkUser?.id && order.userId === clerkUser.id
  ) || Boolean(userSession && order.userId === userSession.userId);

  if (!hasApiKey && !adminSession && !isOwner) {
    return res.status(401).json({ ok: false, error: 'Unauthorized order access.' });
  }

  return res.json({ ok: true, order });
});

app.get('/api/events', authMiddleware, requireAdminPermission('events.read'), async (_req, res) => {
  res.json({ ok: true, events: await store.listEvents() });
});

app.get('/api/admin/products', authMiddleware, requireAdminPermission('products.read'), async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const includeInactive = req.query.includeInactive === 'true';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : 'all';
  const page = parsePositiveInt(req.query.page, 1, 1, 100000);
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 1, 100);

  const allProducts = await store.listProducts({
    category,
    includeInactive: includeInactive || status !== 'active',
  });

  const filtered = allProducts.filter((product) => {
    const normalizedName = String(product.name ?? '').toLowerCase();
    const normalizedSubcategory = String(product.subcategory ?? '').toLowerCase();
    const normalizedDescription = String(product.description ?? '').toLowerCase();
    const normalizedId = String(product.id ?? '').toLowerCase();
    const isActive = product.isActive !== false;

    const matchesSearch = !search
      || normalizedName.includes(search)
      || normalizedSubcategory.includes(search)
      || normalizedDescription.includes(search)
      || normalizedId.includes(search);

    const matchesStatus = status === 'all'
      || (status === 'active' && isActive)
      || (status === 'inactive' && !isActive);

    return matchesSearch && matchesStatus;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const products = filtered.slice(startIndex, startIndex + pageSize);

  return res.json({
    ok: true,
    products,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  });
});

app.get('/api/products', async (req, res) => {
  const category = req.query.category;
  const includeInactive = req.query.includeInactive === 'true';

  const products = await store.listProducts({
    category: typeof category === 'string' ? category : undefined,
    includeInactive,
  });

  return res.json({ ok: true, products });
});

app.get('/api/featured-products', async (req, res) => {
  const section = typeof req.query.section === 'string' ? req.query.section : '';

  if (section) {
    const parsed = featuredSectionSchema.safeParse(section);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid featured section key.' });
    }

    return res.json({
      ok: true,
      section,
      products: await store.listFeaturedBySection({ section }),
    });
  }

  return res.json({
    ok: true,
    featured: await store.listFeaturedBySection(),
  });
});

app.put('/api/admin/featured-products/:sectionKey', authMiddleware, requireAdminPermission('featured.write'), async (req, res) => {
  const parsedSection = featuredSectionSchema.safeParse(req.params.sectionKey);
  if (!parsedSection.success) {
    return res.status(400).json({ ok: false, error: 'Invalid featured section key.' });
  }

  const parsedBody = featuredProductsSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ ok: false, error: parsedBody.error.flatten() });
  }

  const sectionKey = parsedSection.data;
  const expectedCategory = sectionCategoryRules[sectionKey];

  for (const productId of parsedBody.data.productIds) {
    const product = await store.getProduct(productId);
    if (!product) {
      return res.status(404).json({ ok: false, error: `Product ${productId} not found.` });
    }

    if (product.category !== expectedCategory) {
      return res.status(400).json({
        ok: false,
        error: `Product ${product.name} is not valid for ${sectionKey}.`,
      });
    }
  }

  await store.setFeaturedProducts(sectionKey, parsedBody.data.productIds);

  await store.pushEvent({
    type: 'featured.updated',
    sectionKey,
    productIds: parsedBody.data.productIds,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    ok: true,
    section: sectionKey,
    products: await store.listFeaturedBySection({ section: sectionKey }),
  });
});

app.post('/api/admin/products', authMiddleware, requireAdminPermission('products.write'), productImageUpload.single('image'), async (req, res) => {
  const uploadedImageUrl = req.file ? `${req.protocol}://${req.get('host')}/api/uploads/${req.file.filename}` : '';
  const rawPrice = typeof req.body?.price === 'number' ? req.body.price : Number(req.body?.price);
  const rawStockInput = req.body?.stockQuantity;
  const rawStockQuantity = rawStockInput === undefined || rawStockInput === null || rawStockInput === ''
    ? undefined
    : (typeof rawStockInput === 'number' ? rawStockInput : Number(rawStockInput));
  const candidate = {
    name: req.body?.name,
    price: rawPrice,
    category: req.body?.category,
    subcategory: req.body?.subcategory,
    image: uploadedImageUrl || String(req.body?.image ?? '').trim(),
    description: req.body?.description,
    stockQuantity: rawStockQuantity,
    isActive: parseBooleanInput(req.body?.isActive),
  };

  const parsed = productSchema.safeParse(candidate);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const id = `${parsed.data.category}-${Date.now()}`;
  const product = await store.createProduct({
    id,
    ...parsed.data,
    stockQuantity: parsed.data.stockQuantity ?? 0,
    isActive: parsed.data.isActive ?? true,
    createdAt: new Date().toISOString(),
  });

  await store.pushEvent({
    type: 'product.created',
    productId: id,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ ok: true, product });
});

app.post('/api/admin/products/:productId/image', authMiddleware, requireAdminPermission('products.write'), productImageUpload.single('image'), async (req, res) => {
  const { productId } = req.params;
  const existing = await store.getProduct(productId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Product not found' });
  }

  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'Product image file is required.' });
  }

  const previousFilename = extractUploadFilename(existing.image);
  const image = `${req.protocol}://${req.get('host')}/api/uploads/${req.file.filename}`;
  const product = await store.updateProduct(productId, { image });
  const nextFilename = extractUploadFilename(image);

  if (previousFilename && previousFilename !== nextFilename) {
    await removeOrphanedUploadFile(previousFilename);
  }

  await store.pushEvent({
    type: 'product.image_updated',
    productId,
    createdAt: new Date().toISOString(),
  });

  return res.json({ ok: true, product });
});

app.patch('/api/admin/products/:productId', authMiddleware, requireAdminPermission('products.write'), async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { productId } = req.params;
  const existing = await store.getProduct(productId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Product not found' });
  }

  const product = await store.updateProduct(productId, parsed.data);

  await store.pushEvent({
    type: 'product.updated',
    productId,
    createdAt: new Date().toISOString(),
  });

  return res.json({ ok: true, product });
});

app.delete('/api/admin/products/:productId', authMiddleware, requireAdminPermission('products.write'), async (req, res) => {
  const { productId } = req.params;
  const existing = await store.getProduct(productId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Product not found' });
  }

  const previousFilename = extractUploadFilename(existing.image);

  await store.deleteProduct(productId);

  if (previousFilename) {
    await removeOrphanedUploadFile(previousFilename);
  }

  await store.pushEvent({
    type: 'product.deleted',
    productId,
    createdAt: new Date().toISOString(),
  });

  return res.json({ ok: true });
});

app.post('/api/checkout/whatsapp', userAuthMiddleware, async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { customerName, customerPhone, customerWhatsApp, items, transferPhone } = parsed.data;
  const user = await ensureStoredClerkUser(req.user);
  const now = new Date().toISOString();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderId = `AUR-${Date.now()}`;

  const order = await store.createOrder({
    id: orderId,
    userId: req.user.id,
    userEmail: req.user.email,
    customerName: customerName ?? user?.name ?? '',
    customerPhone: customerPhone ?? transferPhone ?? user?.phone ?? '',
    customerWhatsApp: customerWhatsApp ?? customerPhone ?? transferPhone ?? user?.phone ?? '',
    items,
    subtotal,
    status: 'awaiting_payment',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'awaiting_payment',
    receiptUrl: '',
    transferReference: '',
    transferNote: '',
    bankDetails: {
      bankName: config.bankName,
      accountName: config.bankAccountName,
      accountNumber: config.bankAccountNumber,
      swiftCode: config.bankSwiftCode,
    },
    statusHistory: [
      {
        status: 'awaiting_payment',
        at: now,
      },
    ],
    createdAt: now,
  });

  await store.pushEvent({
    type: 'checkout.manual_order_created',
    createdAt: new Date().toISOString(),
    orderId,
  });

  const notifyTo = resolveBusinessRecipient();
  const dispatch = notifyTo
    ? await sendWhatsappMessage({
        to: notifyTo,
        body: buildOrderMessage(order),
      })
    : { ok: false, skipped: true, reason: 'WHATSAPP_NOTIFY_TO not configured.' };

  return res.status(201).json({
    ok: true,
    orderId,
    subtotal,
    order,
    bankDetails: {
      bankName: config.bankName,
      accountName: config.bankAccountName,
      accountNumber: config.bankAccountNumber,
      swiftCode: config.bankSwiftCode,
    },
    whatsappDispatch: dispatch,
  });
});

app.post('/api/checkout/card', userAuthMiddleware, async (req, res) => {
  const parsed = cardCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const user = await ensureStoredClerkUser(req.user);
  const now = new Date().toISOString();
  const { items, cardholderName, cardBrand, cardLast4, cardExpiry, billingEmail, billingPhone, paymentReference } = parsed.data;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderId = `AUR-${Date.now()}`;

  const order = await store.createOrder({
    id: orderId,
    userId: req.user.id,
    userEmail: billingEmail ?? req.user.email,
    customerName: cardholderName || user?.name || '',
    customerPhone: billingPhone ?? user?.phone ?? '',
    customerWhatsApp: billingPhone ?? user?.phone ?? '',
    items,
    subtotal,
    status: 'paid',
    paymentMethod: 'card',
    paymentStatus: 'captured',
    paymentProvider: cardBrand,
    paymentReference: paymentReference ?? `CARD-${orderId}`,
    paymentLast4: cardLast4,
    cardholderName,
    cardExpiry,
    receiptUrl: '',
    transferReference: '',
    transferNote: '',
    bankDetails: null,
    statusHistory: [
      {
        status: 'paid',
        at: now,
      },
    ],
    createdAt: now,
  });

  await store.pushEvent({
    type: 'checkout.card_order_created',
    createdAt: now,
    orderId,
  });

  return res.status(201).json({
    ok: true,
    orderId,
    subtotal,
    order,
  });
});

app.post('/api/orders/:orderId/receipt', receiptUpload.single('receipt'), async (req, res) => {
  const { orderId } = req.params;
  const order = await store.getOrder(orderId);

  if (!order) {
    return res.status(404).json({ ok: false, error: 'Order not found' });
  }

  const hasApiKey = Boolean(config.apiKey) && req.headers['x-api-key'] === config.apiKey;
  const adminSession = getAdminSession(req);
  const userSession = getUserSession(req);
  const clerkUser = await getClerkUserContext(req);
  const isOwner = Boolean(
    clerkUser?.id && order.userId === clerkUser.id
  ) || Boolean(userSession && order.userId === userSession.userId);

  if (!hasApiKey && !adminSession && !isOwner) {
    return res.status(401).json({ ok: false, error: 'Unauthorized order access.' });
  }

  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'Receipt file is required.' });
  }

  const parsed = submitReceiptSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const receiptUrl = `${req.protocol}://${req.get('host')}/api/uploads/${req.file.filename}`;

  const updated = await store.patchOrder(orderId, {
    receiptUrl,
    transferReference: parsed.data.transferReference ?? '',
    transferNote: parsed.data.note ?? '',
    status: 'awaiting_verification',
    statusHistory: [
      ...(order.statusHistory ?? []),
      {
        status: 'awaiting_verification',
        at: new Date().toISOString(),
      },
    ],
  });

  await store.pushEvent({
    type: 'checkout.receipt_uploaded',
    orderId,
    createdAt: new Date().toISOString(),
    receiptUrl,
  });

  return res.status(201).json({
    ok: true,
    order: updated,
  });
});

app.get('/api/uploads/:filename', async (req, res) => {
  const { filename } = req.params;
  const receiptPath = path.join(uploadsDir, filename);

  if (!fs.existsSync(receiptPath)) {
    return res.status(404).json({ ok: false, error: 'File not found.' });
  }

  const products = await store.listProducts({ includeInactive: true });
  const isProductImage = products.some((product) => {
    const image = String(product.image ?? '');
    return image.endsWith(`/api/uploads/${filename}`);
  });

  if (isProductImage) {
    return res.sendFile(receiptPath);
  }

  const adminSession = getAdminSession(req);
  const userSession = getUserSession(req);
  const hasApiKey = Boolean(config.apiKey) && req.headers['x-api-key'] === config.apiKey;

  let isOwner = false;
  if (userSession) {
    const orders = await store.listOrdersByUser(userSession.userId);
    isOwner = orders.some((order) => typeof order.receiptUrl === 'string' && order.receiptUrl.endsWith(`/api/uploads/${filename}`));
  }

  if (!hasApiKey && !adminSession && !isOwner) {
    return res.status(401).json({ ok: false, error: 'Unauthorized receipt access.' });
  }

  return res.sendFile(receiptPath);
});

app.post('/api/events', authMiddleware, requireAdminPermission('events.write'), async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const event = {
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  await store.pushEvent(event);

  let dispatch = { ok: false, skipped: true, reason: 'No message dispatched.' };
  if (event.userPhone && event.message) {
    dispatch = await sendWhatsappMessage({
      to: event.userPhone,
      body: event.message,
    });
  }

  return res.status(201).json({ ok: true, event, whatsappDispatch: dispatch });
});

app.post('/api/orders/:orderId/status', authMiddleware, requireAdminPermission('orders.write'), async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { orderId } = req.params;
  const updated = await store.updateOrderStatus(orderId, parsed.data.status);

  if (!updated) {
    return res.status(404).json({ ok: false, error: 'Order not found' });
  }

  const customerPhone = parsed.data.customerPhone || updated.customerPhone;
  const customerWhatsapp = updated.customerWhatsApp || customerPhone;
  const shouldNotify = parsed.data.notifyCustomer ?? true;

  const dispatch = shouldNotify && customerWhatsapp
    ? await sendWhatsappMessage({
        to: customerWhatsapp,
        body: buildStatusMessage({ orderId, status: parsed.data.status }),
      })
    : { ok: false, skipped: true, reason: 'Customer notification skipped.' };

  await store.pushEvent({
    type: 'order.status.updated',
    orderId,
    status: parsed.data.status,
    createdAt: new Date().toISOString(),
  });

  return res.json({ ok: true, order: await store.getOrder(orderId), whatsappDispatch: dispatch });
});

app.post('/api/webhooks/twilio/status', async (req, res) => {
  await store.pushEvent({
    type: 'twilio.status.webhook',
    createdAt: new Date().toISOString(),
    payload: req.body,
  });

  res.status(200).send('ok');
});

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    return res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, error: error.message });
  }

  if (error instanceof Error) {
    return res.status(400).json({ ok: false, error: error.message });
  }

  return res.status(500).json({ ok: false, error: 'Unexpected server error' });
});

try {
  store = await initializeDataStore();
  app.listen(config.port, () => {
    console.log(
      `Aurevia WhatsApp backend listening on http://localhost:${config.port} (storage: ${store.mode})`
    );
  });
} catch (error) {
  console.error('Failed to initialize data store:', error);
  process.exit(1);
}
