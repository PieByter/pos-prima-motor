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
import { customers, vehicles } from './customers'
import { profiles } from './profiles'
import { paymentMethods } from './finance'
import { items } from './master-data'
import { warrantyClaims } from './warranty'
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

// ─── relations ───────────────────────────────────────────────────────────────

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

export const saleDetailsRelations = relations(saleDetails, ({ one, many }) => ({
    sale: one(sales, {
        fields: [saleDetails.sale_id],
        references: [sales.id],
    }),
    item: one(items, {
        fields: [saleDetails.item_id],
        references: [items.id],
    }),
    warrantyClaims: many(warrantyClaims),
}))

export const salesReturnsRelations = relations(salesReturns, ({ one, many }) => ({
    sale: one(sales, {
        fields: [salesReturns.sale_id],
        references: [sales.id],
    }),
    details: many(salesReturnDetails),
}))

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
