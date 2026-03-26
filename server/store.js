import { defaultProducts } from './productsSeed.js';

const orders = new Map();
const events = [];
const products = new Map(defaultProducts.map((product) => [product.id, product]));
const users = new Map();
const featuredBySection = new Map([
  ['story-aurevia', ['velvet-matte-01', 'high-shine-gloss-01', 'hydrating-tint-01']],
  ['story-deconstructed', ['hydrating-tint-01', 'satin-color-01', 'precision-liner-01']],
  ['shop-lip', ['velvet-matte-01', 'high-shine-gloss-01', 'satin-color-01']],
  ['shop-skincare', ['recovery-balm-01', 'daily-serum-01', 'moisturizer-01']],
]);

export function createOrder(order) {
  orders.set(order.id, order);
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
  return uniqueIds;
}

export function createUser(user) {
  users.set(user.id, user);
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
  return updated;
}
