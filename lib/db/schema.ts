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
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── profiles ───────────────────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'mekanik'] }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  profile_picture: text('profile_picture'),
  weekly_salary: numeric('weekly_salary', { precision: 12, scale: 2 }).notNull().default('0'),
  service_commission_pct: numeric('service_commission_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  hire_date: date('hire_date'),
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
export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    sku: text('sku').unique(),
    category: text('category'),
    category_id: integer('category_id').references(() => categories.id),
    brand_id: integer('brand_id').references(() => brands.id),
    purchase_price: numeric('purchase_price', { precision: 15, scale: 2 }).notNull(),
    selling_price: numeric('selling_price', { precision: 15, scale: 2 }).notNull(),
    service_fee: numeric('service_fee', { precision: 15, scale: 2 }).notNull().default('0'),
    stock: integer('stock'),
    warranty_months: integer('warranty_months'),
    picture: text('picture'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_items_category').on(t.category)],
)

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

// ─── vehicles (motor milik customer) ─────────────────────────────────────────
export const vehicles = pgTable(
  'vehicles',
  {
    id: serial('id').primaryKey(),
    customer_id: integer('customer_id').notNull().references(() => customers.id),
    plate_number: text('plate_number').notNull(),
    brand: text('brand'),
    model: text('model'),
    year: integer('year'),
    color: text('color'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_vehicles_customer_id').on(t.customer_id), index('idx_vehicles_plate_number').on(t.plate_number)],
)

// ─── purchases ───────────────────────────────────────────────────────────────
export const purchases = pgTable(
  'purchases',
  {
    id: serial('id').primaryKey(),
    supplier_id: integer('supplier_id').notNull().references(() => suppliers.id),
    invoice_number: text('invoice_number').notNull().unique(),
    purchase_date: date('purchase_date').notNull(),
    total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
    status: text('status', { enum: ['completed', 'pending', 'cancelled'] }).notNull().default('pending'),
    // Status pembayaran ke supplier: lunas / sebagian / utang
    payment_status: text('payment_status', { enum: ['paid', 'partial', 'unpaid'] }).notNull().default('paid'),
    paid_amount: numeric('paid_amount', { precision: 15, scale: 2 }),
    remaining_amount: numeric('remaining_amount', { precision: 15, scale: 2 }),
    created_by: uuid('created_by').notNull().references(() => profiles.id),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_purchases_purchase_date').on(t.purchase_date)],
)

// ─── purchase_payments (riwayat pembayaran hutang supplier) ──────────────────
export const purchasePayments = pgTable(
  'purchase_payments',
  {
    id: serial('id').primaryKey(),
    purchase_id: integer('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    payment_date: date('payment_date').notNull().defaultNow(),
    payment_method_id: integer('payment_method_id').references(() => paymentMethods.id),
    notes: text('notes'),
    created_by: uuid('created_by').references(() => profiles.id),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_purchase_payments_purchase_id').on(t.purchase_id),
    index('idx_purchase_payments_payment_date').on(t.payment_date),
  ],
)

// ─── item_suppliers (many-to-many: item ↔ supplier + harga beli per supplier) ──
export const itemSuppliers = pgTable(
  'item_suppliers',
  {
    item_id: integer('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    supplier_id: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    // Harga beli khusus dari supplier ini (nullable → pakai items.purchase_price sebagai fallback)
    purchase_price: numeric('purchase_price', { precision: 15, scale: 2 }),
  },
  (t) => [
    primaryKey({ columns: [t.item_id, t.supplier_id] }),
    index('idx_item_suppliers_supplier_id').on(t.supplier_id),
  ],
)

// ─── purchase_details ─────────────────────────────────────────────────────────
export const purchaseDetails = pgTable(
  'purchase_details',
  {
    id: serial('id').primaryKey(),
    purchase_id: integer('purchase_id').notNull().references(() => purchases.id),
    item_id: integer('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').notNull(),
    price: numeric('price', { precision: 15, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  },
  (t) => [index('idx_purchase_details_purchase_id').on(t.purchase_id)],
)

// ─── sales ───────────────────────────────────────────────────────────────────
export const sales = pgTable(
  'sales',
  {
    id: serial('id').primaryKey(),
    customer_id: integer('customer_id').references(() => customers.id),
    vehicle_id: integer('vehicle_id').references(() => vehicles.id),
    mechanic_id: uuid('mechanic_id').notNull().references(() => profiles.id),
    invoice_number: text('invoice_number').notNull().unique(),
    sale_date: date('sale_date').notNull(),
    total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
    status: text('status', { enum: ['completed', 'pending', 'in_progress', 'cancelled'] })
      .notNull()
      .default('pending'),
    // Jenis transaksi: beli barang saja / service saja / hybrid (beli + service)
    sale_type: text('sale_type', { enum: ['purchase', 'service', 'hybrid'] })
      .notNull()
      .default('purchase'),
    // Status pembayaran: lunas / sebagian / utang (belum bayar)
    payment_status: text('payment_status', { enum: ['paid', 'partial', 'unpaid'] })
      .notNull()
      .default('paid'),
    paid_amount: numeric('paid_amount', { precision: 15, scale: 2 }),
    remaining_amount: numeric('remaining_amount', { precision: 15, scale: 2 }),
    payment_method_id: integer('payment_method_id').references(() => paymentMethods.id),
    cash_amount: numeric('cash_amount', { precision: 15, scale: 2 }),
    change_amount: numeric('change_amount', { precision: 15, scale: 2 }),
    notes: text('notes'),
    created_by: uuid('created_by').notNull().references(() => profiles.id),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_sales_sale_date').on(t.sale_date),
    index('idx_sales_mechanic').on(t.mechanic_id),
    index('idx_sales_customer').on(t.customer_id),
    index('idx_sales_vehicle_id').on(t.vehicle_id),
  ],
)

// ─── sale_payments (riwayat pembayaran utang / angsuran) ─────────────────────
export const salePayments = pgTable(
  'sale_payments',
  {
    id: serial('id').primaryKey(),
    sale_id: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    payment_date: date('payment_date').notNull().defaultNow(),
    payment_method_id: integer('payment_method_id').references(() => paymentMethods.id),
    notes: text('notes'),
    created_by: uuid('created_by').references(() => profiles.id),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_sale_payments_sale_id').on(t.sale_id), index('idx_sale_payments_payment_date').on(t.payment_date)],
)

// ─── sale_details ─────────────────────────────────────────────────────────────
export const saleDetails = pgTable(
  'sale_details',
  {
    id: serial('id').primaryKey(),
    sale_id: integer('sale_id').notNull().references(() => sales.id),
    item_id: integer('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').notNull(),
    base_price: numeric('base_price', { precision: 15, scale: 2 }).notNull(),
    discount_amount: numeric('discount_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    final_price: numeric('final_price', { precision: 15, scale: 2 }).notNull(),
    service_fee: numeric('service_fee', { precision: 15, scale: 2 }).notNull().default('0'),
    subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
    // Garansi snapshot saat transaksi (bulan). Berasal dari items.warranty_months.
    warranty_months: integer('warranty_months'),
  },
  (t) => [index('idx_sale_details_sale_id').on(t.sale_id)],
)

// ─── stock_movements ──────────────────────────────────────────────────────────
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: serial('id').primaryKey(),
    item_id: integer('item_id').notNull().references(() => items.id),
    type: text('type', { enum: ['IN', 'OUT'] }).notNull(),
    quantity: integer('quantity').notNull(),
    reference_type: text('reference_type', { enum: ['purchase', 'sale'] }),
    reference_id: integer('reference_id'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_stock_item_id').on(t.item_id)],
)

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
export const discountItems = pgTable(
  'discount_items',
  {
    discount_id: integer('discount_id').notNull().references(() => discounts.id),
    item_id: integer('item_id').notNull().references(() => items.id),
  },
  (t) => [primaryKey({ columns: [t.discount_id, t.item_id] }), index('idx_discount_items_item_id').on(t.item_id)],
)

// ─── stock_summary VIEW ──────────────────────────────────────────────────────
// View dikelola Drizzle (definisi asli dari V1.3__create_views.sql)
// security_invoker = true → view memakai hak/RLS pemanggil, bukan pembuat view
// (menghindari perilaku "SECURITY DEFINER" bawaan view di Postgres 15+).
export const stockSummary = pgView('stock_summary', {
  item_id: integer('item_id'),
  name: text('name'),
  sku: text('sku'),
  category: text('category'),
  total_in: integer('total_in'),
  total_out: integer('total_out'),
  current_stock: integer('current_stock'),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT
  i.id AS item_id,
  i.name,
  i.sku,
  i.category,
  COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) AS total_in,
  COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) AS total_out,
  COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) AS current_stock
FROM items i
LEFT JOIN stock_movements sm ON sm.item_id = i.id
GROUP BY i.id, i.name, i.sku, i.category`,
  )

// ─── payment_methods ──────────────────────────────────────────────────────────
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  is_active: boolean('is_active').notNull().default(true),
})

// ─── expenses ────────────────────────────────────────────────────────────────
export const expenses = pgTable(
  'expenses',
  {
    id: serial('id').primaryKey(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    category: text('category', { enum: ['operational', 'utilities', 'rent', 'salary', 'others'] }).notNull().default('others'),
    expense_date: date('expense_date').notNull(),
    payment_method_id: integer('payment_method_id').references(() => paymentMethods.id),
    notes: text('notes'),
    created_by: uuid('created_by').references(() => profiles.id),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_expenses_expense_date').on(t.expense_date)],
)

// ─── sales_returns ───────────────────────────────────────────────────────────
export const salesReturns = pgTable(
  'sales_returns',
  {
    id: serial('id').primaryKey(),
    sale_id: integer('sale_id').notNull().references(() => sales.id),
    return_date: date('return_date').notNull(),
    reason: text('reason').notNull(),
    total_refund: numeric('total_refund', { precision: 15, scale: 2 }).notNull(),
    status: text('status', { enum: ['pending', 'processed', 'rejected'] }).notNull().default('pending'),
    processed_by: uuid('processed_by'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_sales_returns_sale_id').on(t.sale_id)],
)

// ─── sales_return_details ─────────────────────────────────────────────────────
export const salesReturnDetails = pgTable('sales_return_details', {
  id: serial('id').primaryKey(),
  return_id: integer('return_id').notNull().references(() => salesReturns.id),
  item_id: integer('item_id').notNull().references(() => items.id),
  quantity: integer('quantity').notNull(),
  refund_amount: numeric('refund_amount', { precision: 15, scale: 2 }).notNull(),
})

// ─── purchase_returns ─────────────────────────────────────────────────────────
export const purchaseReturns = pgTable(
  'purchase_returns',
  {
    id: serial('id').primaryKey(),
    purchase_id: integer('purchase_id').notNull().references(() => purchases.id),
    return_date: date('return_date').notNull(),
    reason: text('reason').notNull(),
    total_refund: numeric('total_refund', { precision: 15, scale: 2 }).notNull(),
    status: text('status', { enum: ['pending', 'processed', 'rejected'] }).notNull().default('pending'),
    processed_by: uuid('processed_by'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_purchase_returns_purchase_id').on(t.purchase_id)],
)

// ─── purchase_return_details ──────────────────────────────────────────────────
export const purchaseReturnDetails = pgTable('purchase_return_details', {
  id: serial('id').primaryKey(),
  return_id: integer('return_id').notNull().references(() => purchaseReturns.id),
  item_id: integer('item_id').notNull().references(() => items.id),
  quantity: integer('quantity').notNull(),
  refund_amount: numeric('refund_amount', { precision: 15, scale: 2 }).notNull(),
})

// ─── activity_logs ───────────────────────────────────────────────────────────
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').references(() => profiles.id),
    action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
    entity: text('entity').notNull(),
    entity_id: text('entity_id'),
    description: text('description'),
    metadata: text('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_activity_logs_created_at').on(t.created_at)],
)

// ─── notifications ───────────────────────────────────────────────────────────
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull().references(() => profiles.id),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: text('type', { enum: ['info', 'success', 'warning', 'error'] }).notNull().default('info'),
    is_read: boolean('is_read').notNull().default(false),
    link: text('link'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_notifications_user_id').on(t.user_id)],
)

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
  itemSuppliers: many(itemSuppliers),
  purchaseDetails: many(purchaseDetails),
  saleDetails: many(saleDetails),
  stockMovements: many(stockMovements),
  discountItems: many(discountItems),
}))

// ─── item_suppliers ─────────────────────────────────────────────────────────
export const itemSuppliersRelations = relations(itemSuppliers, ({ one }) => ({
  item: one(items, {
    fields: [itemSuppliers.item_id],
    references: [items.id],
  }),
  supplier: one(suppliers, {
    fields: [itemSuppliers.supplier_id],
    references: [suppliers.id],
  }),
}))

// ─── customers ───────────────────────────────────────────────────────────────
export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  vehicles: many(vehicles),
}))

// ─── vehicles ────────────────────────────────────────────────────────────────
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  customer: one(customers, {
    fields: [vehicles.customer_id],
    references: [customers.id],
  }),
  sales: many(sales),
}))

// ─── suppliers ───────────────────────────────────────────────────────────────
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
  itemSuppliers: many(itemSuppliers),
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
  payments: many(purchasePayments),
}))

// ─── purchase_payments ───────────────────────────────────────────────────────
export const purchasePaymentsRelations = relations(purchasePayments, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchasePayments.purchase_id],
    references: [purchases.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [purchasePayments.payment_method_id],
    references: [paymentMethods.id],
  }),
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
  vehicle: one(vehicles, {
    fields: [sales.vehicle_id],
    references: [vehicles.id],
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
  payments: many(salePayments),
}))

// ─── sale_payments ───────────────────────────────────────────────────────────
export const salePaymentsRelations = relations(salePayments, ({ one }) => ({
  sale: one(sales, {
    fields: [salePayments.sale_id],
    references: [sales.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [salePayments.payment_method_id],
    references: [paymentMethods.id],
  }),
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
