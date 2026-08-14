import {
    pgTable,
    serial,
    text,
    integer,
    numeric,
    boolean,
    uuid,
    date,
    timestamp,
    index,
    primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sales } from './sales'
import { profiles } from './profiles'
import { items } from './master-data'

// ─── payment_methods ──────────────────────────────────────────────────────────
export const paymentMethods = pgTable('payment_methods', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    icon: text('icon'),
    is_active: boolean('is_active').notNull().default(true),
})

// ─── business_settings (pengaturan toko: nama, PPN, low stock threshold, dll) ─
export const businessSettings = pgTable('business_settings', {
    id: serial('id').primaryKey(),
    shop_name: text('shop_name').notNull().default('Prima Motor'),
    shop_address: text('shop_address'),
    shop_phone: text('shop_phone'),
    whatsapp_number: text('whatsapp_number'),
    // Pajak PPN dalam persen (mis. 11) — dipakai form transaksi
    tax_percent: numeric('tax_percent', { precision: 5, scale: 2 }).notNull().default('11'),
    // Ambang stok menipis untuk peringatan (low stock)
    low_stock_threshold: integer('low_stock_threshold').notNull().default(5),
    // Catatan struk (footer)
    receipt_footer: text('receipt_footer'),
    updated_by: uuid('updated_by').references(() => profiles.id),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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

// ─── salary_payments (pembayaran gaji mingguan mekanik) ──────────────────────
export const salaryPayments = pgTable(
    'salary_payments',
    {
        id: serial('id').primaryKey(),
        mechanic_id: uuid('mechanic_id').notNull().references(() => profiles.id),
        payment_date: date('payment_date').notNull(),
        amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
        // Periode kerja yang dibayar (untuk gaji mingguan)
        period_start: date('period_start'),
        period_end: date('period_end'),
        payment_method_id: integer('payment_method_id').references(() => paymentMethods.id),
        notes: text('notes'),
        created_by: uuid('created_by').references(() => profiles.id),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_salary_payments_mechanic_id').on(t.mechanic_id),
        index('idx_salary_payments_payment_date').on(t.payment_date),
    ],
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

// ─── relations ───────────────────────────────────────────────────────────────

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
    sales: many(sales),
    expenses: many(expenses),
    salaryPayments: many(salaryPayments),
}))

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

export const salaryPaymentsRelations = relations(salaryPayments, ({ one }) => ({
    mechanic: one(profiles, {
        fields: [salaryPayments.mechanic_id],
        references: [profiles.id],
    }),
    paymentMethod: one(paymentMethods, {
        fields: [salaryPayments.payment_method_id],
        references: [paymentMethods.id],
    }),
    createdBy: one(profiles, {
        fields: [salaryPayments.created_by],
        references: [profiles.id],
    }),
}))

export const discountsRelations = relations(discounts, ({ many }) => ({
    items: many(discountItems),
}))

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
