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
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;

export const itemSchema = z.object({
    name: z.string().min(1, "Nama barang wajib diisi").max(200, "Nama maksimal 200 karakter"),
    description: z.string().optional().or(z.literal("")),
    sku: z.string().min(1, "SKU wajib diisi").max(20, "SKU maksimal 20 karakter"),
    category: z.string().min(1, "Kategori wajib dipilih"),
    purchasePrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
    sellingPrice: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
    serviceFee: z.coerce.number().min(0, "Biaya jasa tidak boleh negatif").optional(),
    stock: z.coerce.number().min(0, "Stok tidak boleh negatif").optional(),
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
