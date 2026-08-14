import {
    pgTable,
    pgView,
    serial,
    text,
    integer,
    uuid,
    date,
    timestamp,
    index,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { items } from './master-data'
import { profiles } from './profiles'

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

// ─── stock_adjustments (stok opname / barang rusak / hilang) ─────────────────
export const stockAdjustments = pgTable(
    'stock_adjustments',
    {
        id: serial('id').primaryKey(),
        item_id: integer('item_id').notNull().references(() => items.id),
        adjustment_date: date('adjustment_date').notNull().defaultNow(),
        type: text('type', { enum: ['IN', 'OUT'] }).notNull(),
        quantity: integer('quantity').notNull(),
        reason: text('reason', { enum: ['damaged', 'lost', 'count_fix', 'stock_in', 'other'] })
            .notNull()
            .default('other'),
        notes: text('notes'),
        created_by: uuid('created_by').references(() => profiles.id),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('idx_stock_adjustments_item_id').on(t.item_id), index('idx_stock_adjustments_date').on(t.adjustment_date)],
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

// ─── relations ───────────────────────────────────────────────────────────────

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
    item: one(items, {
        fields: [stockMovements.item_id],
        references: [items.id],
    }),
}))

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
    item: one(items, {
        fields: [stockAdjustments.item_id],
        references: [items.id],
    }),
    createdBy: one(profiles, {
        fields: [stockAdjustments.created_by],
        references: [profiles.id],
    }),
}))
