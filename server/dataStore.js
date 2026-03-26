import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

import { config } from './config.js';
import { defaultProducts } from './productsSeed.js';
import * as memoryStore from './store.js';

const defaultFeaturedBySection = {
  'story-aurevia': ['velvet-matte-01', 'high-shine-gloss-01', 'hydrating-tint-01'],
  'story-deconstructed': ['hydrating-tint-01', 'satin-color-01', 'precision-liner-01'],
  'shop-lip': ['velvet-matte-01', 'high-shine-gloss-01', 'satin-color-01'],
  'shop-skincare': ['recovery-balm-01', 'daily-serum-01', 'moisturizer-01'],
};

let activeStore = null;

function normalizeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    subcategory: row.subcategory,
    image: row.image,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

function normalizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    phone: row.phone,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

function normalizeOrder(row) {
  if (!row) return null;
  return {
    ...(row.payload ?? {}),
    id: row.id,
    userId: row.user_id ?? (row.payload?.userId ?? ''),
    userEmail: row.user_email ?? (row.payload?.userEmail ?? ''),
    status: row.status ?? (row.payload?.status ?? ''),
    subtotal: Number(row.subtotal ?? row.payload?.subtotal ?? 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : row.payload?.createdAt,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : row.payload?.updatedAt,
  };
}

function createMemoryAdapter() {
  return {
    mode: 'memory',
    createOrder: async (order) => memoryStore.createOrder(order),
    updateOrderStatus: async (orderId, status) => memoryStore.updateOrderStatus(orderId, status),
    patchOrder: async (orderId, patch) => memoryStore.patchOrder(orderId, patch),
    getOrder: async (orderId) => memoryStore.getOrder(orderId),
    listOrders: async () => memoryStore.listOrders(),
    listOrdersByUser: async (userId) => memoryStore.listOrdersByUser(userId),
    pushEvent: async (event) => memoryStore.pushEvent(event),
    listEvents: async () => memoryStore.listEvents(),
    listProducts: async (params) => memoryStore.listProducts(params),
    getProduct: async (productId) => memoryStore.getProduct(productId),
    createProduct: async (product) => memoryStore.createProduct(product),
    updateProduct: async (productId, patch) => memoryStore.updateProduct(productId, patch),
    deleteProduct: async (productId) => memoryStore.deleteProduct(productId),
    listFeaturedBySection: async (params) => memoryStore.listFeaturedBySection(params),
    setFeaturedProducts: async (section, productIds) => memoryStore.setFeaturedProducts(section, productIds),
    createUser: async (user) => memoryStore.createUser(user),
    getUserByEmail: async (email) => memoryStore.getUserByEmail(email),
    getUserById: async (userId) => memoryStore.getUserById(userId),
    updateUser: async (userId, patch) => memoryStore.updateUser(userId, patch),
  };
}

async function runSchemaMigrations(pool) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(schemaSql);
}

async function seedDefaults(pool) {
  const existingProducts = await pool.query('SELECT COUNT(*)::int AS count FROM products');
  if (existingProducts.rows[0]?.count === 0) {
    for (const product of defaultProducts) {
      await pool.query(
        `INSERT INTO products (id, name, price, category, subcategory, image, description, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          product.id,
          product.name,
          product.price,
          product.category,
          product.subcategory,
          product.image,
          product.description,
          product.isActive !== false,
          product.createdAt ?? new Date().toISOString(),
        ]
      );
    }
  }

  const existingFeatured = await pool.query('SELECT COUNT(*)::int AS count FROM featured_sections');
  if (existingFeatured.rows[0]?.count === 0) {
    for (const [sectionKey, productIds] of Object.entries(defaultFeaturedBySection)) {
      await pool.query(
        `INSERT INTO featured_sections (section_key, product_ids, updated_at)
         VALUES ($1, $2::jsonb, NOW())`,
        [sectionKey, JSON.stringify(productIds)]
      );
    }
  }
}

function createPostgresAdapter(pool) {
  return {
    mode: 'postgres',

    async createOrder(order) {
      await pool.query(
        `INSERT INTO orders (id, user_id, user_email, status, subtotal, payload, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
        [
          order.id,
          order.userId ?? null,
          order.userEmail ?? null,
          order.status,
          Number(order.subtotal ?? 0),
          JSON.stringify(order),
          order.createdAt ?? new Date().toISOString(),
          order.updatedAt ?? null,
        ]
      );
      return order;
    },

    async getOrder(orderId) {
      const result = await pool.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [orderId]);
      if (!result.rows[0]) return null;
      return normalizeOrder(result.rows[0]);
    },

    async listOrders() {
      const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return result.rows.map(normalizeOrder);
    },

    async listOrdersByUser(userId) {
      const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return result.rows.map(normalizeOrder);
    },

    async patchOrder(orderId, patch) {
      const existing = await this.getOrder(orderId);
      if (!existing) return null;

      const updated = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      await pool.query(
        `UPDATE orders
         SET user_id = $2,
             user_email = $3,
             status = $4,
             subtotal = $5,
             payload = $6::jsonb,
             updated_at = $7
         WHERE id = $1`,
        [
          orderId,
          updated.userId ?? null,
          updated.userEmail ?? null,
          updated.status ?? '',
          Number(updated.subtotal ?? 0),
          JSON.stringify(updated),
          updated.updatedAt,
        ]
      );

      return updated;
    },

    async updateOrderStatus(orderId, status) {
      const existing = await this.getOrder(orderId);
      if (!existing) return null;

      return this.patchOrder(orderId, {
        status,
        statusHistory: [
          ...(existing.statusHistory ?? []),
          { status, at: new Date().toISOString() },
        ],
      });
    },

    async pushEvent(event) {
      await pool.query(
        `INSERT INTO events (type, created_at, payload)
         VALUES ($1, $2, $3::jsonb)`,
        [event.type ?? 'event.unknown', event.createdAt ?? new Date().toISOString(), JSON.stringify(event)]
      );
      return event;
    },

    async listEvents() {
      const result = await pool.query('SELECT payload FROM events ORDER BY id DESC LIMIT 1000');
      return result.rows.map((row) => row.payload);
    },

    async listProducts({ category, includeInactive = false } = {}) {
      const values = [];
      const where = [];

      if (category) {
        values.push(category);
        where.push(`category = $${values.length}`);
      }

      if (!includeInactive) {
        where.push('is_active = true');
      }

      const sql = `SELECT * FROM products ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY name ASC`;
      const result = await pool.query(sql, values);
      return result.rows.map(normalizeProduct);
    },

    async getProduct(productId) {
      const result = await pool.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [productId]);
      if (!result.rows[0]) return null;
      return normalizeProduct(result.rows[0]);
    },

    async createProduct(product) {
      await pool.query(
        `INSERT INTO products (id, name, price, category, subcategory, image, description, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          product.id,
          product.name,
          Number(product.price),
          product.category,
          product.subcategory,
          product.image,
          product.description,
          product.isActive !== false,
          product.createdAt ?? new Date().toISOString(),
          product.updatedAt ?? null,
        ]
      );
      return this.getProduct(product.id);
    },

    async updateProduct(productId, patch) {
      const existing = await this.getProduct(productId);
      if (!existing) return null;

      const merged = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      await pool.query(
        `UPDATE products
         SET name = $2,
             price = $3,
             category = $4,
             subcategory = $5,
             image = $6,
             description = $7,
             is_active = $8,
             updated_at = $9
         WHERE id = $1`,
        [
          productId,
          merged.name,
          Number(merged.price),
          merged.category,
          merged.subcategory,
          merged.image,
          merged.description,
          merged.isActive !== false,
          merged.updatedAt,
        ]
      );

      return this.getProduct(productId);
    },

    async deleteProduct(productId) {
      const result = await pool.query('DELETE FROM products WHERE id = $1', [productId]);
      if (result.rowCount > 0) {
        const featured = await this.listFeaturedBySection();
        for (const [sectionKey, products] of Object.entries(featured)) {
          const nextIds = products.filter((item) => item.id !== productId).map((item) => item.id);
          await this.setFeaturedProducts(sectionKey, nextIds);
        }
      }

      return result.rowCount > 0;
    },

    async listFeaturedBySection({ section, includeInactive = false } = {}) {
      const sectionsQuery = section
        ? await pool.query('SELECT section_key, product_ids FROM featured_sections WHERE section_key = $1', [section])
        : await pool.query('SELECT section_key, product_ids FROM featured_sections');

      const allProducts = await this.listProducts({ includeInactive: true });
      const productsMap = new Map(allProducts.map((product) => [product.id, product]));

      const hydrate = (ids) =>
        (Array.isArray(ids) ? ids : [])
          .map((id) => productsMap.get(id))
          .filter((product) => {
            if (!product) return false;
            if (!includeInactive && product.isActive === false) return false;
            return true;
          });

      if (section) {
        const ids = sectionsQuery.rows[0]?.product_ids ?? [];
        return hydrate(ids);
      }

      return sectionsQuery.rows.reduce((acc, row) => {
        acc[row.section_key] = hydrate(row.product_ids);
        return acc;
      }, {});
    },

    async setFeaturedProducts(sectionKey, productIds) {
      const uniqueIds = [...new Set(productIds)];
      await pool.query(
        `INSERT INTO featured_sections (section_key, product_ids, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (section_key)
         DO UPDATE SET product_ids = EXCLUDED.product_ids, updated_at = NOW()`,
        [sectionKey, JSON.stringify(uniqueIds)]
      );

      return uniqueIds;
    },

    async createUser(user) {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, phone, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          user.id,
          user.name,
          user.email,
          user.passwordHash,
          user.phone ?? '',
          user.createdAt ?? new Date().toISOString(),
          user.updatedAt ?? null,
        ]
      );
      return {
        ...user,
        phone: user.phone ?? '',
      };
    },

    async getUserByEmail(email) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
      if (!result.rows[0]) return null;
      return normalizeUser(result.rows[0]);
    },

    async getUserById(userId) {
      const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
      if (!result.rows[0]) return null;
      return normalizeUser(result.rows[0]);
    },

    async updateUser(userId, patch) {
      const existing = await this.getUserById(userId);
      if (!existing) return null;

      const updated = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      await pool.query(
        `UPDATE users
         SET name = $2,
             email = $3,
             password_hash = $4,
             phone = $5,
             updated_at = $6
         WHERE id = $1`,
        [
          userId,
          updated.name,
          updated.email,
          updated.passwordHash,
          updated.phone ?? '',
          updated.updatedAt,
        ]
      );

      return updated;
    },
  };
}

export async function initializeDataStore() {
  if (activeStore) {
    return activeStore;
  }

  if (!config.usePostgres || !config.databaseUrl) {
    activeStore = createMemoryAdapter();
    return activeStore;
  }

  const pool = new Pool({ connectionString: config.databaseUrl });

  if (config.autoMigrate) {
    await runSchemaMigrations(pool);
    await seedDefaults(pool);
  }

  activeStore = createPostgresAdapter(pool);
  return activeStore;
}

export function getDataStore() {
  if (!activeStore) {
    throw new Error('Data store not initialized. Call initializeDataStore() before using the repository.');
  }

  return activeStore;
}
