import { z } from "zod";

export const customerSchema = z.object({
    name: z
        .string()
        .min(1, "Nama customer wajib diisi")
        .max(100, "Nama maksimal 100 karakter"),
    phone: z
        .string()
        .max(20, "Nomor HP maksimal 20 karakter")
        .regex(/^[\d\s\-+()]*$/, "Format nomor HP tidak valid")
        .optional()
        .or(z.literal("")),
    address: z
        .string()
        .max(500, "Alamat maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
    nik: z
        .string()
        .max(20, "NIK maksimal 20 karakter")
        .regex(/^\d*$/, "NIK hanya angka")
        .optional()
        .or(z.literal("")),
    email: z
        .string()
        .max(100, "Email maksimal 100 karakter")
        .email("Format email tidak valid")
        .optional()
        .or(z.literal("")),
    birth_date: z.string().optional().nullable().or(z.literal("")),
    customer_type: z.enum(["retail", "garage"]),
    notes: z
        .string()
        .max(500, "Catatan maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
});

export const supplierSchema = z.object({
    name: z
        .string()
        .min(1, "Nama supplier wajib diisi")
        .max(100, "Nama maksimal 100 karakter"),
    phone: z
        .string()
        .max(20, "Nomor telepon maksimal 20 karakter")
        .regex(/^[\d\s\-+()]*$/, "Format nomor telepon tidak valid")
        .optional()
        .or(z.literal("")),
    address: z
        .string()
        .max(500, "Alamat maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
    email: z
        .string()
        .max(100, "Email maksimal 100 karakter")
        .email("Format email tidak valid")
        .optional()
        .or(z.literal("")),
    is_active: z.boolean(),
    bank_name: z.string().max(100, "Nama bank maksimal 100 karakter").optional().or(z.literal("")),
    bank_account: z.string().max(50, "No. rekening maksimal 50 karakter").optional().or(z.literal("")),
    bank_account_holder: z.string().max(100, "Nama pemilik rekening maksimal 100 karakter").optional().or(z.literal("")),
    npwp: z.string().max(30, "NPWP maksimal 30 karakter").optional().or(z.literal("")),
    notes: z.string().max(500, "Catatan maksimal 500 karakter").optional().or(z.literal("")),
    // Kontak (1 supplier bisa punya banyak kontak)
    contacts: z
        .array(
            z.object({
                name: z.string().min(1, "Nama kontak wajib diisi").max(100),
                phone: z.string().max(20).optional().or(z.literal("")),
                position: z.string().max(100).optional().or(z.literal("")),
                email: z.string().email("Format email tidak valid").max(100).optional().or(z.literal("")),
                is_primary: z.boolean(),
                notes: z.string().max(500).optional().or(z.literal("")),
            })
        )
        .optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;
export type SupplierContactFormData = NonNullable<SupplierFormData["contacts"]>[number];

export const salaryPaymentSchema = z.object({
    mechanic_id: z.string().min(1, "Mekanik wajib dipilih"),
    payment_date: z.string().min(1, "Tanggal wajib diisi"),
    amount: z.coerce.number().min(0, "Nominal tidak boleh negatif"),
    period_start: z.string().optional().nullable(),
    period_end: z.string().optional().nullable(),
    payment_method_id: z.coerce.number().optional().nullable(),
    notes: z.string().max(500).optional().or(z.literal("")),
});

export const stockAdjustmentSchema = z.object({
    item_id: z.coerce.number().min(1, "Barang wajib dipilih"),
    adjustment_date: z.string().min(1, "Tanggal wajib diisi"),
    type: z.enum(["IN", "OUT"]),
    quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
    reason: z.enum(["damaged", "lost", "count_fix", "stock_in", "other"]),
    notes: z.string().max(500).optional().or(z.literal("")),
});

export const warrantyClaimSchema = z.object({
    sale_detail_id: z.coerce.number().min(1, "Detail penjualan wajib dipilih"),
    item_id: z.coerce.number().min(1, "Barang wajib dipilih"),
    claim_date: z.string().min(1, "Tanggal wajib diisi"),
    description: z.string().min(1, "Deskripsi wajib diisi").max(1000),
    status: z.enum(["pending", "approved", "rejected", "completed"]).default("pending"),
    resolution: z.enum(["repair", "replace", "refund", "none"]).default("none"),
    cost: z.coerce.number().min(0).default(0),
    notes: z.string().max(500).optional().or(z.literal("")),
});

export const purchaseOrderSchema = z.object({
    supplier_id: z.coerce.number().min(1, "Supplier wajib dipilih"),
    po_number: z.string().min(1, "No. PO wajib diisi").max(50),
    order_date: z.string().min(1, "Tanggal wajib diisi"),
    expected_date: z.string().optional().nullable(),
    status: z.enum(["draft", "sent", "partial", "received", "cancelled"]).default("draft"),
    notes: z.string().max(500).optional().or(z.literal("")),
    details: z
        .array(
            z.object({
                item_id: z.coerce.number().min(1, "Barang wajib dipilih"),
                quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
                price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
            })
        )
        .min(1, "Minimal 1 item"),
});

export type SalaryPaymentFormData = z.infer<typeof salaryPaymentSchema>;
export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
export type WarrantyClaimFormData = z.infer<typeof warrantyClaimSchema>;
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export const itemSchema = z.object({
    name: z.string().min(1, "Nama barang wajib diisi").max(200, "Nama maksimal 200 karakter"),
    description: z.string().optional().or(z.literal("")),
    sku: z.string().min(1, "SKU wajib diisi").max(20, "SKU maksimal 20 karakter"),
    category: z.string().min(1, "Kategori wajib dipilih"),
    purchasePrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
    sellingPrice: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
    serviceFee: z.coerce.number().min(0, "Biaya jasa tidak boleh negatif").optional(),
    stock: z.coerce.number().min(0, "Stok tidak boleh negatif").optional(),
    warrantyMonths: z.coerce.number().int().min(0, "Garansi tidak boleh negatif").optional().nullable(),
    picture: z.string().nullable().optional(),
});

export const discountSchema = z.object({
    name: z.string().min(1, "Nama diskon wajib diisi").max(100, "Nama maksimal 100 karakter"),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().min(1, "Nilai diskon harus lebih dari 0"),
    min_transaction: z.coerce.number().min(0, "Min. transaksi tidak boleh negatif").optional(),
    max_percent: z.coerce.number().min(0).max(100).optional().nullable(),
    is_active: z.boolean().optional(),
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
});

export const expenseSchema = z.object({
    description: z.string().min(1, "Deskripsi wajib diisi").max(200, "Deskripsi maksimal 200 karakter"),
    amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
    category: z.string().min(1, "Kategori wajib dipilih"),
    expense_date: z.string().min(1, "Tanggal wajib diisi"),
    notes: z.string().optional().nullable(),
});

export type ItemFormData = z.infer<typeof itemSchema>;
export type DiscountFormData = z.infer<typeof discountSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;

// ─── Sale Detail ────────────────────────────────────────────────────────────
const saleDetailSchema = z.object({
    item_id: z.number({ required_error: "Barang wajib dipilih" }),
    quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
    base_price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
    discount_amount: z.coerce.number().min(0, "Diskon tidak boleh negatif").optional().default(0),
    final_price: z.coerce.number().min(0, "Harga final tidak boleh negatif"),
    service_fee: z.coerce.number().min(0, "Jasa tidak boleh negatif").optional().default(0),
    subtotal: z.coerce.number().min(0, "Subtotal tidak boleh negatif"),
});

export const saleSchema = z.object({
    header: z.object({
        customer_id: z.number().nullable().optional(),
        mechanic_id: z.string().uuid("Mekanik wajib dipilih"),
        sale_date: z.string().min(1, "Tanggal wajib diisi"),
        status: z.enum(["completed", "pending", "in_progress", "cancelled"]).optional().default("completed"),
        invoice_number: z.string().optional(),
    }),
    details: z.array(saleDetailSchema).min(1, "Minimal 1 barang harus ditambahkan"),
}).refine(
    (data) => data.details.every((d) => d.final_price >= 0),
    { message: "Harga final tidak boleh negatif", path: ["details"] },
);

export const purchaseSchema = z.object({
    header: z.object({
        supplier_id: z.number({ required_error: "Supplier wajib dipilih" }),
        purchase_date: z.string().min(1, "Tanggal wajib diisi"),
        status: z.enum(["completed", "pending", "cancelled"]).optional().default("completed"),
        invoice_number: z.string().optional(),
    }),
    details: z.array(
        z.object({
            item_id: z.number({ required_error: "Barang wajib dipilih" }),
            quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
            price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
            subtotal: z.coerce.number().min(0, "Subtotal tidak boleh negatif"),
        }),
    ).min(1, "Minimal 1 barang harus ditambahkan"),
});

export type SaleFormData = z.infer<typeof saleSchema>;
export type PurchaseFormData = z.infer<typeof purchaseSchema>;
export type SaleDetailFormData = z.infer<typeof saleDetailSchema>;
