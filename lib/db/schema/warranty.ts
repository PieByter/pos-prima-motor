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
import { saleDetails } from './sales'
import { items } from './master-data'
import { profiles } from './profiles'

// ─── warranty_claims (klaim garansi barang rusak dalam masa garansi) ─────────
export const warrantyClaims = pgTable(
    'warranty_claims',
    {
        id: serial('id').primaryKey(),
        sale_detail_id: integer('sale_detail_id').notNull().references(() => saleDetails.id),
        item_id: integer('item_id').notNull().references(() => items.id),
        claim_date: date('claim_date').notNull().defaultNow(),
        description: text('description').notNull(),
        status: text('status', { enum: ['pending', 'approved', 'rejected', 'completed'] })
            .notNull()
            .default('pending'),
        resolution: text('resolution', { enum: ['repair', 'replace', 'refund', 'none'] })
            .notNull()
            .default('none'),
        cost: numeric('cost', { precision: 15, scale: 2 }).notNull().default('0'),
        resolved_date: date('resolved_date'),
        notes: text('notes'),
        created_by: uuid('created_by').references(() => profiles.id),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_warranty_claims_sale_detail_id').on(t.sale_detail_id),
        index('idx_warranty_claims_status').on(t.status),
    ],
)

// ─── relations ───────────────────────────────────────────────────────────────

export const warrantyClaimsRelations = relations(warrantyClaims, ({ one }) => ({
    saleDetail: one(saleDetails, {
        fields: [warrantyClaims.sale_detail_id],
        references: [saleDetails.id],
    }),
    item: one(items, {
        fields: [warrantyClaims.item_id],
        references: [items.id],
    }),
    createdBy: one(profiles, {
        fields: [warrantyClaims.created_by],
        references: [profiles.id],
    }),
}))
