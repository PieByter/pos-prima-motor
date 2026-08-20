export type Item = {
  id: number;
  name: string;
  description: string;
  sku: string;
  category: string;
  /** ID kategori dari tabel categories (nullable) */
  categoryId?: number | null;
  /** ID brand dari tabel brands (nullable) */
  brandId?: number | null;
  purchasePrice: number;
  sellingPrice: number;
  serviceFee: number;
  stock: number;
  warrantyMonths?: number | null;
  picture: string | null;
  createdAt: string;
  /** IDs supplier terpilih (many-to-many via item_suppliers) */
  supplierIds?: number[];
  /** Nama supplier terpilih (untuk tampilan) */
  supplierNames?: string[];
  /** Supplier lengkap + harga beli per supplier */
  suppliers?: { id: number; name: string; purchase_price: number | null }[];
};

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getStockStatus(stock: number) {
  if (stock <= 5) return { label: `${stock} in stock`, variant: "critical" as const };
  if (stock <= 20) return { label: `${stock} in stock`, variant: "warning" as const };
  return { label: `${stock} in stock`, variant: "safe" as const };
}
