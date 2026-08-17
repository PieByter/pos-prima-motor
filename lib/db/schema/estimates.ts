import {
    pgTable,
    serial,
    text,
    integer,
    numeric,
    uuid,
    timestamp,
    index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { customers, vehicles } from './customers'
import { profiles } from './profiles'
import { items } from './master-data'

// ─── estimates (estimasi / quotation service) ───────────────────────────────
export const estimates = pgTable(
    'estimates',
    {
        id: serial('id').primaryKey(),
        customer_id: integer('customer_id').references(() => customers.id),
        vehicle_id: integer('vehicle_id').references(() => vehicles.id),
        estimate_number: text('estimate_number').notNull().unique(),
        description: text('description'),
        status: text('status', { enum: ['draft', 'sent', 'approved', 'converted', 'cancelled'] })
            .notNull()
            .default('draft'),
        total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
        notes: text('notes'),
        created_by: uuid('created_by').references(() => profiles.id),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_estimates_customer').on(t.customer_id),
        index('idx_estimates_status').on(t.status),
        index('idx_estimates_created_at').on(t.created_at),
    ],
)

// ─── estimate_items (baris part / jasa dalam estimasi) ─────────────────────
export const estimateItems = pgTable(
    'estimate_items',
    {
        id: serial('id').primaryKey(),
        estimate_id: integer('estimate_id').notNull().references(() => estimates.id, { onDelete: 'cascade' }),
        // item part (nullable untuk baris jasa)
        item_id: integer('item_id').references(() => items.id),
        name: text('name').notNull(),
        type: text('type', { enum: ['part', 'service'] }).notNull().default('part'),
        quantity: integer('quantity').notNull().default(1),
        price: numeric('price', { precision: 15, scale: 2 }).notNull(),
        subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
    },
    (t) => [index('idx_estimate_items_estimate_id').on(t.estimate_id)],
)

// ─── relations ───────────────────────────────────────────────────────────────

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
    customer: one(customers, {
        fields: [estimates.customer_id],
        references: [customers.id],
    }),
    vehicle: one(vehicles, {
        fields: [estimates.vehicle_id],
        references: [vehicles.id],
    }),
    createdBy: one(profiles, {
        fields: [estimates.created_by],
        references: [profiles.id],
    }),
    items: many(estimateItems),
}))

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
    estimate: one(estimates, {
        fields: [estimateItems.estimate_id],
        references: [estimates.id],
    }),
    item: one(items, {
        fields: [estimateItems.item_id],
        references: [items.id],
    }),
}))
