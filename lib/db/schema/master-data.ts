import {
    pgTable,
    serial,
    text,
    integer,
    numeric,
    boolean,
    timestamp,
    index,
    primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { purchases } from './purchases'
import { purchaseOrders } from './purchases'
import { saleDetails } from './sales'
import { purchaseDetails } from './purchases'
import { stockMovements } from './stock'
import { stockAdjustments } from './stock'
import { warrantyClaims } from './warranty'
import { purchaseOrderDetails } from './purchases'
import { discountItems } from './finance'
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

// ─── suppliers ───────────────────────────────────────────────────────────────
export const suppliers = pgTable('suppliers', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    // Kontak & identitas: email, status aktif, info bank untuk transfer, NPWP
    email: text('email'),
    is_active: boolean('is_active').notNull().default(true),
    bank_name: text('bank_name'),
    bank_account: text('bank_account'),
    bank_account_holder: text('bank_account_holder'),
    npwp: text('npwp'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── supplier_contacts (banyak kontak per supplier — 1 supplier bisa punya beberapa sales/CS) ──
export const supplierContacts = pgTable(
    'supplier_contacts',
    {
        id: serial('id').primaryKey(),
        supplier_id: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        phone: text('phone'),
        position: text('position'),
        email: text('email'),
        is_primary: boolean('is_primary').notNull().default(false),
        notes: text('notes'),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('idx_supplier_contacts_supplier_id').on(t.supplier_id)],
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

// ─── relations ───────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
    items: many(items),
}))

export const brandsRelations = relations(brands, ({ many }) => ({
    items: many(items),
}))

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
    stockAdjustments: many(stockAdjustments),
    warrantyClaims: many(warrantyClaims),
    purchaseOrderDetails: many(purchaseOrderDetails),
}))

export const suppliersRelations = relations(suppliers, ({ many }) => ({
    purchases: many(purchases),
    itemSuppliers: many(itemSuppliers),
    contacts: many(supplierContacts),
    purchaseOrders: many(purchaseOrders),
}))

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
    supplier: one(suppliers, {
        fields: [supplierContacts.supplier_id],
        references: [suppliers.id],
    }),
}))

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
