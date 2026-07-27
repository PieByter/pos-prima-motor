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
