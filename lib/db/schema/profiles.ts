import {
    pgTable,
    uuid,
    text,
    numeric,
    boolean,
    date,
    timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { purchases } from './purchases'
import { sales } from './sales'
import { notifications } from './activity'
import { salaryPayments } from './finance'
import { purchaseOrders } from './purchases'
import { stockAdjustments } from './stock'
import { warrantyClaims } from './warranty'

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

export const profilesRelations = relations(profiles, ({ many }) => ({
    purchases: many(purchases),
    sales: many(sales),
    notifications: many(notifications),
    salaryPayments: many(salaryPayments),
    purchaseOrders: many(purchaseOrders),
    stockAdjustments: many(stockAdjustments),
    warrantyClaims: many(warrantyClaims),
}))
