import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultProducts } from './productsSeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoStorePath = process.env.DEMO_DATA_PATH
  ? path.resolve(process.env.DEMO_DATA_PATH)
  : path.join(__dirname, '.demo-store.json');

let orders = new Map();
let events = [];
let products = new Map(defaultProducts.map((product) => [product.id, product]));
let users = new Map();
let featuredBySection = new Map([
  ['story-aurevia', ['velvet-matte-01', 'high-shine-gloss-01', 'hydrating-tint-01']],
  ['story-deconstructed', ['hydrating-tint-01', 'satin-color-01', 'precision-liner-01']],
  ['shop-lip', ['velvet-matte-01', 'high-shine-gloss-01', 'satin-color-01']],
  ['shop-skincare', ['recovery-balm-01', 'daily-serum-01', 'moisturizer-01']],
]);

function toMap(entries = []) {
  return new Map(
    Array.isArray(entries)
      ? entries.filter((entry) => Array.isArray(entry) && entry.length >= 2)
      : []
  );
}

function snapshotState() {
  return {
    orders: [...orders.values()],
    events,
    products: [...products.values()],
    users: [...users.values()],
    featuredBySection: [...featuredBySection.entries()],
  };
}

function persistState() {
  if (process.env.PERSIST_DEMO_DATA === 'false') {
    return;
  }

  try {
    fs.writeFileSync(demoStorePath, `${JSON.stringify(snapshotState(), null, 2)}\n`, 'utf8');
  } catch {
    // Demo persistence is best-effort; runtime behavior should continue even if the snapshot cannot be written.
  }
}

function loadPersistedState() {
  if (process.env.PERSIST_DEMO_DATA === 'false' || !fs.existsSync(demoStorePath)) {
    return false;
  }

  try {
    const raw = fs.readFileSync(demoStorePath, 'utf8');
    if (!raw.trim()) {
      return false;
    }

    const snapshot = JSON.parse(raw);

    orders = new Map(
      (Array.isArray(snapshot.orders) ? snapshot.orders : [])
        .filter((order) => order && typeof order.id === 'string')
        .map((order) => [order.id, order])
    );
    events = Array.isArray(snapshot.events) ? snapshot.events : [];
    products = new Map(
      (Array.isArray(snapshot.products) ? snapshot.products : [])
        .filter((product) => product && typeof product.id === 'string')
        .map((product) => [product.id, product])
    );
    users = new Map(
      (Array.isArray(snapshot.users) ? snapshot.users : [])
        .filter((user) => user && typeof user.id === 'string')
        .map((user) => [user.id, user])
    );
    featuredBySection = new Map(
      (Array.isArray(snapshot.featuredBySection) ? snapshot.featuredBySection : [])
        .filter((entry) => Array.isArray(entry) && typeof entry[0] === 'string')
        .map(([sectionKey, productIds]) => [sectionKey, Array.isArray(productIds) ? productIds : []])
    );

    return true;
  } catch {
    return false;
  }
}

if (!loadPersistedState()) {
  persistState();
}

export function createOrder(order) {
  orders.set(order.id, order);
  persistState();
  return order;
}

export function updateOrderStatus(orderId, status) {
  const existing = orders.get(orderId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    status,
    statusHistory: [
      ...(existing.statusHistory ?? []),
      {
        status,
        at: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  orders.set(orderId, updated);
  persistState();
  return updated;
}

export function patchOrder(orderId, patch) {
  const existing = orders.get(orderId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  orders.set(orderId, updated);
  persistState();
  return updated;
}

export function getOrder(orderId) {
  return orders.get(orderId) ?? null;
}

export function listOrders() {
  return [...orders.values()];
}

export function listOrdersByUser(userId) {
  return [...orders.values()]
    .filter((order) => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function pushEvent(event) {
  events.push(event);
  persistState();
  return event;
}

export function listEvents() {
  return events;
}

export function listProducts({ category, includeInactive = false } = {}) {
  return [...products.values()]
    .filter((product) => {
      if (category && product.category !== category) {
        return false;
      }

      if (!includeInactive && product.isActive === false) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getProduct(productId) {
  return products.get(productId) ?? null;
}

export function createProduct(product) {
  products.set(product.id, product);
  persistState();
  return product;
}

export function updateProduct(productId, patch) {
  const existing = products.get(productId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  products.set(productId, updated);
  persistState();
  return updated;
}

export function deleteProduct(productId) {
  const deleted = products.delete(productId);

  if (deleted) {
    featuredBySection.forEach((productIds, sectionKey) => {
      const nextIds = productIds.filter((id) => id !== productId);
      featuredBySection.set(sectionKey, nextIds);
    });
  }

  if (deleted) {
    persistState();
  }

  return deleted;
}

export function listFeaturedBySection({ section, includeInactive = false } = {}) {
  const serializeProducts = (productIds) =>
    productIds
      .map((id) => products.get(id))
      .filter((product) => {
        if (!product) {
          return false;
        }

        if (!includeInactive && product.isActive === false) {
          return false;
        }

        return true;
      });

  if (section) {
    const ids = featuredBySection.get(section) ?? [];
    return serializeProducts(ids);
  }

  return [...featuredBySection.entries()].reduce((acc, [sectionKey, ids]) => {
    acc[sectionKey] = serializeProducts(ids);
    return acc;
  }, {});
}

export function setFeaturedProducts(section, productIds) {
  const uniqueIds = [...new Set(productIds)];
  featuredBySection.set(section, uniqueIds);
  persistState();
  return uniqueIds;
}

export function createUser(user) {
  users.set(user.id, user);
  persistState();
  return user;
}

export function getUserByEmail(email) {
  return [...users.values()].find((user) => user.email === email) ?? null;
}

export function getUserById(userId) {
  return users.get(userId) ?? null;
}

export function updateUser(userId, patch) {
  const existing = users.get(userId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  users.set(userId, updated);
  persistState();
  return updated;
}
