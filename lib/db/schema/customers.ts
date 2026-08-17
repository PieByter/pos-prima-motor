import {
    pgTable,
    serial,
    text,
    integer,
    date,
    timestamp,
    index,
    uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sales } from './sales'
import { profiles } from './profiles'

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
    points: integer('points').notNull().default(0),
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

// ─── vehicle_documents (STNK / pajak — jatuh tempo utk reminder) ─────────────
export const vehicleDocuments = pgTable(
    'vehicle_documents',
    {
        id: serial('id').primaryKey(),
        vehicle_id: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
        // Jenis dokumen: STNK tahunan / pajak
        doc_type: text('doc_type', { enum: ['stnk', 'pajak'] }).notNull().default('pajak'),
        // Tanggal jatuh tempo (ingatkan sebelum ini)
        due_date: date('due_date').notNull(),
        // Catatan bebas (mis. "pajak 5 tahunan")
        notes: text('notes'),
        created_by: integer('created_by'),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('idx_vehicle_documents_vehicle_id').on(t.vehicle_id), index('idx_vehicle_documents_due_date').on(t.due_date)],
)

// ─── appointments (antrian service / booking) ────────────────────────────────
export const appointments = pgTable(
    'appointments',
    {
        id: serial('id').primaryKey(),
        customer_id: integer('customer_id').references(() => customers.id),
        vehicle_id: integer('vehicle_id').references(() => vehicles.id),
        // Mekanik yang menangani (opsional, bisa di-assign kemudian)
        mechanic_id: uuid('mechanic_id').references(() => profiles.id),
        appointment_date: date('appointment_date').notNull(),
        // Antrian hari ini / booking
        status: text('status', { enum: ['waiting', 'in_progress', 'done', 'cancelled'] })
            .notNull()
            .default('waiting'),
        description: text('description'),
        notes: text('notes'),
        created_by: uuid('created_by'),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_appointments_date').on(t.appointment_date),
        index('idx_appointments_status').on(t.status),
        index('idx_appointments_mechanic_id').on(t.mechanic_id),
    ],
)

// ─── point_transactions (riwayat poin loyalty) ──────────────────────────────
export const pointTransactions = pgTable(
    'point_transactions',
    {
        id: serial('id').primaryKey(),
        customer_id: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
        // Positif = earn, negatif = redeem
        points: integer('points').notNull(),
        type: text('type', { enum: ['earn', 'redeem', 'adjust'] }).notNull().default('earn'),
        reference: text('reference'),
        created_by: uuid('created_by').references(() => profiles.id),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('idx_point_transactions_customer').on(t.customer_id)],
)

// ─── relations ───────────────────────────────────────────────────────────────

export const customersRelations = relations(customers, ({ many }) => ({
    sales: many(sales),
    vehicles: many(vehicles),
    pointTransactions: many(pointTransactions),
}))

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
    customer: one(customers, {
        fields: [pointTransactions.customer_id],
        references: [customers.id],
    }),
    createdBy: one(profiles, {
        fields: [pointTransactions.created_by],
        references: [profiles.id],
    }),
}))

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
    customer: one(customers, {
        fields: [vehicles.customer_id],
        references: [customers.id],
    }),
    sales: many(sales),
    documents: many(vehicleDocuments),
}))

export const vehicleDocumentsRelations = relations(vehicleDocuments, ({ one }) => ({
    vehicle: one(vehicles, {
        fields: [vehicleDocuments.vehicle_id],
        references: [vehicles.id],
    }),
}))

export const appointmentsRelations = relations(appointments, ({ one }) => ({
    customer: one(customers, {
        fields: [appointments.customer_id],
        references: [customers.id],
    }),
    vehicle: one(vehicles, {
        fields: [appointments.vehicle_id],
        references: [vehicles.id],
    }),
    mechanic: one(profiles, {
        fields: [appointments.mechanic_id],
        references: [profiles.id],
    }),
}))
