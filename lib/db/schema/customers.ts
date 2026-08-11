import {
    pgTable,
    serial,
    text,
    integer,
    date,
    timestamp,
    index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sales } from './sales'

// ─── customers ───────────────────────────────────────────────────────────────
export const customers = pgTable('customers', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    // Data pelengkap: identitas & tipe pelanggan (retail / bengkel rekanan)
    nik: text('nik'),
    email: text('email'),
    birth_date: date('birth_date'),
    customer_type: text('customer_type', { enum: ['retail', 'garage'] }).notNull().default('retail'),
    notes: text('notes'),
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

// ─── relations ───────────────────────────────────────────────────────────────

export const customersRelations = relations(customers, ({ many }) => ({
    sales: many(sales),
    vehicles: many(vehicles),
}))

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
    customer: one(customers, {
        fields: [vehicles.customer_id],
        references: [customers.id],
    }),
    sales: many(sales),
}))
