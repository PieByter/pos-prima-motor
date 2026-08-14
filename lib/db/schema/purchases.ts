import {
    pgTable,
    serial,
    text,
    integer,
    numeric,
    uuid,
    date,
    timestamp,
    index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { suppliers, items } from './master-data'
import { profiles } from './profiles'
import { paymentMethods } from './finance'
// ─── purchase_orders (PO ke supplier sebelum barang datang) ──────────────────
export const purchaseOrders = pgTable(
    'purchase_orders',
    {
        id: serial('id').primaryKey(),
        supplier_id: integer('supplier_id').notNull().references(() => suppliers.id),
        po_number: text('po_number').notNull().unique(),
        order_date: date('order_date').notNull(),
        expected_date: date('expected_date'),
        status: text('status', { enum: ['draft', 'sent', 'partial', 'received', 'cancelled'] })
            .notNull()
            .default('draft'),
        total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
        notes: text('notes'),
        created_by: uuid('created_by').notNull().references(() => profiles.id),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('idx_purchase_orders_supplier_id').on(t.supplier_id), index('idx_purchase_orders_order_date').on(t.order_date)],
)

// ─── purchase_order_details ──────────────────────────────────────────────────
export const purchaseOrderDetails = pgTable(
    'purchase_order_details',
    {
        id: serial('id').primaryKey(),
        po_id: integer('po_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
        item_id: integer('item_id').notNull().references(() => items.id),
        quantity: integer('quantity').notNull(),
        // Jumlah yang sudah diterima (untuk tracking penerimaan bertahap)
        received_quantity: integer('received_quantity').notNull().default(0),
        price: numeric('price', { precision: 15, scale: 2 }).notNull(),
        subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
    },
    (t) => [index('idx_purchase_order_details_po_id').on(t.po_id)],
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

// ─── relations ───────────────────────────────────────────────────────────────

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    supplier: one(suppliers, {
        fields: [purchaseOrders.supplier_id],
        references: [suppliers.id],
    }),
    createdBy: one(profiles, {
        fields: [purchaseOrders.created_by],
        references: [profiles.id],
    }),
    details: many(purchaseOrderDetails),
}))

export const purchaseOrderDetailsRelations = relations(purchaseOrderDetails, ({ one }) => ({
    po: one(purchaseOrders, {
        fields: [purchaseOrderDetails.po_id],
        references: [purchaseOrders.id],
    }),
    item: one(items, {
        fields: [purchaseOrderDetails.item_id],
        references: [items.id],
    }),
}))

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

export const purchaseReturnsRelations = relations(purchaseReturns, ({ one, many }) => ({
    purchase: one(purchases, {
        fields: [purchaseReturns.purchase_id],
        references: [purchases.id],
    }),
    details: many(purchaseReturnDetails),
}))

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
