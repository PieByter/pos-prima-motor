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

// ─── categories ──────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── brands ──────────────────────────────────────────────────────────────────
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── items ───────────────────────────────────────────────────────────────────
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku'),
  category: text('category'),
  category_id: integer('category_id'),
  brand_id: integer('brand_id'),
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
  payment_method_id: integer('payment_method_id'),
  cash_amount: numeric('cash_amount', { precision: 15, scale: 2 }),
  change_amount: numeric('change_amount', { precision: 15, scale: 2 }),
  notes: text('notes'),
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

// ─── payment_methods ──────────────────────────────────────────────────────────
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  is_active: boolean('is_active').notNull().default(true),
})

// ─── expenses ────────────────────────────────────────────────────────────────
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  category: text('category', { enum: ['operational', 'utilities', 'rent', 'salary', 'others'] }).notNull().default('others'),
  expense_date: date('expense_date').notNull(),
  payment_method_id: integer('payment_method_id'),
  notes: text('notes'),
  created_by: uuid('created_by'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── sales_returns ───────────────────────────────────────────────────────────
export const salesReturns = pgTable('sales_returns', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').notNull(),
  return_date: date('return_date').notNull(),
  reason: text('reason').notNull(),
  total_refund: numeric('total_refund', { precision: 15, scale: 2 }).notNull(),
  status: text('status', { enum: ['pending', 'processed', 'rejected'] }).notNull().default('pending'),
  processed_by: uuid('processed_by'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── sales_return_details ─────────────────────────────────────────────────────
export const salesReturnDetails = pgTable('sales_return_details', {
  id: serial('id').primaryKey(),
  return_id: integer('return_id').notNull(),
  item_id: integer('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  refund_amount: numeric('refund_amount', { precision: 15, scale: 2 }).notNull(),
})

// ─── purchase_returns ─────────────────────────────────────────────────────────
export const purchaseReturns = pgTable('purchase_returns', {
  id: serial('id').primaryKey(),
  purchase_id: integer('purchase_id').notNull(),
  return_date: date('return_date').notNull(),
  reason: text('reason').notNull(),
  total_refund: numeric('total_refund', { precision: 15, scale: 2 }).notNull(),
  status: text('status', { enum: ['pending', 'processed', 'rejected'] }).notNull().default('pending'),
  processed_by: uuid('processed_by'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── purchase_return_details ──────────────────────────────────────────────────
export const purchaseReturnDetails = pgTable('purchase_return_details', {
  id: serial('id').primaryKey(),
  return_id: integer('return_id').notNull(),
  item_id: integer('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  refund_amount: numeric('refund_amount', { precision: 15, scale: 2 }).notNull(),
})

// ─── activity_logs ───────────────────────────────────────────────────────────
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id'),
  action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
  entity: text('entity').notNull(),
  entity_id: text('entity_id'),
  description: text('description'),
  metadata: text('metadata'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

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
export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.category_id],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [items.brand_id],
    references: [brands.id],
  }),
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
  paymentMethod: one(paymentMethods, {
    fields: [sales.payment_method_id],
    references: [paymentMethods.id],
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

// ─── categories ──────────────────────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}))

// ─── brands ──────────────────────────────────────────────────────────────────
export const brandsRelations = relations(brands, ({ many }) => ({
  items: many(items),
}))

// ─── expenses ─────────────────────────────────────────────────────────────────
export const expensesRelations = relations(expenses, ({ one }) => ({
  paymentMethod: one(paymentMethods, {
    fields: [expenses.payment_method_id],
    references: [paymentMethods.id],
  }),
  createdBy: one(profiles, {
    fields: [expenses.created_by],
    references: [profiles.id],
  }),
}))

// ─── sales_returns ───────────────────────────────────────────────────────────
export const salesReturnsRelations = relations(salesReturns, ({ one, many }) => ({
  sale: one(sales, {
    fields: [salesReturns.sale_id],
    references: [sales.id],
  }),
  details: many(salesReturnDetails),
}))

// ─── sales_return_details ─────────────────────────────────────────────────────
export const salesReturnDetailsRelations = relations(salesReturnDetails, ({ one }) => ({
  return: one(salesReturns, {
    fields: [salesReturnDetails.return_id],
    references: [salesReturns.id],
  }),
  item: one(items, {
    fields: [salesReturnDetails.item_id],
    references: [items.id],
  }),
}))

// ─── purchase_returns ─────────────────────────────────────────────────────────
export const purchaseReturnsRelations = relations(purchaseReturns, ({ one, many }) => ({
  purchase: one(purchases, {
    fields: [purchaseReturns.purchase_id],
    references: [purchases.id],
  }),
  details: many(purchaseReturnDetails),
}))

// ─── purchase_return_details ──────────────────────────────────────────────────
export const purchaseReturnDetailsRelations = relations(purchaseReturnDetails, ({ one }) => ({
  return: one(purchaseReturns, {
    fields: [purchaseReturnDetails.return_id],
    references: [purchaseReturns.id],
  }),
  item: one(items, {
    fields: [purchaseReturnDetails.item_id],
    references: [items.id],
  }),
}))

// ─── payment_methods ─────────────────────────────────────────────────────────
export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  sales: many(sales),
  expenses: many(expenses),
}))

// ─── activity_logs ───────────────────────────────────────────────────────────
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [activityLogs.user_id],
    references: [profiles.id],
  }),
}))

// ─── notifications ───────────────────────────────────────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.user_id],
    references: [profiles.id],
  }),
}))
