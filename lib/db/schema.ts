import {
  pgTable,
  pgView,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  uuid,
} from 'drizzle-orm/pg-core'

// ─── profiles ───────────────────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'mekanik'] }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  profile_picture: text('profile_picture'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── items ───────────────────────────────────────────────────────────────────
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku'),
  category: text('category'),
  purchase_price: numeric('purchase_price', { precision: 15, scale: 2 }).notNull(),
  selling_price: numeric('selling_price', { precision: 15, scale: 2 }).notNull(),
  service_fee: numeric('service_fee', { precision: 15, scale: 2 }).notNull().default('0'),
  picture: text('picture'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── customers ───────────────────────────────────────────────────────────────
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── suppliers ───────────────────────────────────────────────────────────────
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── purchases ───────────────────────────────────────────────────────────────
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  supplier_id: integer('supplier_id').notNull(),
  invoice_number: text('invoice_number').notNull(),
  purchase_date: date('purchase_date').notNull(),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: text('status', { enum: ['completed', 'pending', 'cancelled'] }).notNull().default('pending'),
  created_by: uuid('created_by').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── purchase_details ─────────────────────────────────────────────────────────
export const purchaseDetails = pgTable('purchase_details', {
  id: serial('id').primaryKey(),
  purchase_id: integer('purchase_id').notNull(),
  item_id: integer('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 15, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
})

// ─── sales ───────────────────────────────────────────────────────────────────
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  mechanic_id: uuid('mechanic_id').notNull(),
  invoice_number: text('invoice_number').notNull(),
  sale_date: date('sale_date').notNull(),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: text('status', { enum: ['completed', 'pending', 'in_progress', 'cancelled'] })
    .notNull()
    .default('pending'),
  created_by: uuid('created_by').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── sale_details ─────────────────────────────────────────────────────────────
export const saleDetails = pgTable('sale_details', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').notNull(),
  item_id: integer('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  base_price: numeric('base_price', { precision: 15, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  final_price: numeric('final_price', { precision: 15, scale: 2 }).notNull(),
  service_fee: numeric('service_fee', { precision: 15, scale: 2 }).notNull().default('0'),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
})

// ─── stock_movements ──────────────────────────────────────────────────────────
export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id').notNull(),
  type: text('type', { enum: ['IN', 'OUT'] }).notNull(),
  quantity: integer('quantity').notNull(),
  reference_type: text('reference_type', { enum: ['purchase', 'sale'] }),
  reference_id: integer('reference_id'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── discounts ───────────────────────────────────────────────────────────────
export const discounts = pgTable('discounts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['percent', 'fixed'] }).notNull(),
  value: numeric('value', { precision: 15, scale: 2 }).notNull(),
  min_transaction: numeric('min_transaction', { precision: 15, scale: 2 }).notNull().default('0'),
  max_percent: numeric('max_percent', { precision: 5, scale: 2 }),
  is_active: boolean('is_active').notNull().default(true),
  start_date: date('start_date'),
  end_date: date('end_date'),
})

// ─── discount_items ───────────────────────────────────────────────────────────
export const discountItems = pgTable('discount_items', {
  discount_id: integer('discount_id').notNull(),
  item_id: integer('item_id').notNull(),
})

// ─── stock_summary VIEW ──────────────────────────────────────────────────────
export const stockSummary = pgView('stock_summary', {
  item_id: integer('item_id'),
  name: text('name'),
  sku: text('sku'),
  category: text('category'),
  total_in: integer('total_in'),
  total_out: integer('total_out'),
  current_stock: integer('current_stock'),
}).existing()

// ─── notifications ───────────────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['info', 'success', 'warning', 'error'] }).notNull().default('info'),
  is_read: boolean('is_read').notNull().default(false),
  link: text('link'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════════════════════════════════════

import { relations } from 'drizzle-orm'

// ─── profiles ───────────────────────────────────────────────────────────────
export const profilesRelations = relations(profiles, ({ many }) => ({
  purchases: many(purchases),
  sales: many(sales),
  notifications: many(notifications),
}))

// ─── items ───────────────────────────────────────────────────────────────────
export const itemsRelations = relations(items, ({ many }) => ({
  purchaseDetails: many(purchaseDetails),
  saleDetails: many(saleDetails),
  stockMovements: many(stockMovements),
  discountItems: many(discountItems),
}))

// ─── customers ───────────────────────────────────────────────────────────────
export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}))

// ─── suppliers ───────────────────────────────────────────────────────────────
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}))

// ─── purchases ───────────────────────────────────────────────────────────────
export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplier_id],
    references: [suppliers.id],
  }),
  createdBy: one(profiles, {
    fields: [purchases.created_by],
    references: [profiles.id],
  }),
  details: many(purchaseDetails),
}))

// ─── purchase_details ─────────────────────────────────────────────────────────
export const purchaseDetailsRelations = relations(purchaseDetails, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseDetails.purchase_id],
    references: [purchases.id],
  }),
  item: one(items, {
    fields: [purchaseDetails.item_id],
    references: [items.id],
  }),
}))

// ─── sales ───────────────────────────────────────────────────────────────────
export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customer_id],
    references: [customers.id],
  }),
  mechanic: one(profiles, {
    fields: [sales.mechanic_id],
    references: [profiles.id],
  }),
  createdBy: one(profiles, {
    fields: [sales.created_by],
    references: [profiles.id],
  }),
  details: many(saleDetails),
}))

// ─── sale_details ─────────────────────────────────────────────────────────────
export const saleDetailsRelations = relations(saleDetails, ({ one }) => ({
  sale: one(sales, {
    fields: [saleDetails.sale_id],
    references: [sales.id],
  }),
  item: one(items, {
    fields: [saleDetails.item_id],
    references: [items.id],
  }),
}))

// ─── stock_movements ──────────────────────────────────────────────────────────
export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  item: one(items, {
    fields: [stockMovements.item_id],
    references: [items.id],
  }),
}))

// ─── discounts ───────────────────────────────────────────────────────────────
export const discountsRelations = relations(discounts, ({ many }) => ({
  items: many(discountItems),
}))

// ─── discount_items ───────────────────────────────────────────────────────────
export const discountItemsRelations = relations(discountItems, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountItems.discount_id],
    references: [discounts.id],
  }),
  item: one(items, {
    fields: [discountItems.item_id],
    references: [items.id],
  }),
}))

// ─── notifications ───────────────────────────────────────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.user_id],
    references: [profiles.id],
  }),
}))
