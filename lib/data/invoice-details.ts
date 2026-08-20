import { formatRupiah } from "@/lib/data/items";
import type { TransactionStatus, TransactionType } from "@/lib/data/transactions";

export type InvoiceItemType = "Service" | "Part";

export type InvoiceItem = {
  id: number;
  name: string;
  description: string;
  type: InvoiceItemType;
  unitPrice: number;
  qty: number;
  discount: number;
  subtotal: number;
  icon: "wrench" | "droplet" | "cog" | "disc-brake" | "package" | "truck";
};

export type InvoiceDetail = {
  id: number;
  invoiceNumber: string;
  status: TransactionStatus;
  saleType?: string;
  paymentStatus?: string;
  createdAt: string;
  transactionType: TransactionType;
  // Customer / Supplier
  entityName: string;
  entityPhone: string;
  entityVehicle?: string;
  entityPlate?: string;
  // Mechanic
  mechanicName: string;
  mechanicStation: string;
  jobStart: string;
  jobEnd: string;
  // Payment
  paymentMethod: string;
  paymentMethodIcon: string | null;
  transactionId: string;
  cashAmount: number | null;
  changeAmount: number | null;
  paidAmount?: number | null;
  remainingAmount?: number | null;
  // Items
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  // Meta
  createdBy: string;
};

export const ITEM_TYPE_STYLES: Record<InvoiceItemType, string> = {
  Service:
    "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300",
  Part: "bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-300",
};

/**
 * Konversi baris sale (dengan relasi) dari database menjadi InvoiceDetail.
 * Dipakai bersama oleh halaman detail penjualan & dialog cetak ulang struk.
 */
export function mapSaleToInvoice(sale: {
  id: number;
  invoice_number: string;
  status: string;
  sale_type?: string | null;
  payment_status?: string | null;
  created_at: string;
  total_amount: number;
  paid_amount?: number | null;
  remaining_amount?: number | null;
  cash_amount?: number | null;
  change_amount?: number | null;
  created_by: string;
  customer?: { name?: string | null; phone?: string | null } | null;
  vehicle?: { brand?: string | null; model?: string | null; plate_number?: string | null } | null;
  mechanic?: { name?: string | null } | null;
  payment_method?: { name?: string | null; icon?: string | null } | null;
  details?: Array<{
    id: number;
    quantity: number;
    base_price: number;
    discount_amount: number;
    service_fee: number;
    subtotal: number;
    item?: { name?: string | null; description?: string | null } | null;
  }>;
}): InvoiceDetail {
  const subtotal = (sale.details ?? []).reduce((sum, d) => sum + d.subtotal, 0);
  const totalDiscount = (sale.details ?? []).reduce(
    (sum, d) => sum + d.discount_amount,
    0
  );
  // Rincian PPN — subtotal di sale_details = DPP (belum termasuk pajak).
  // Pajak = total yang dibayar − DPP.
  const taxAmount = Math.max(0, sale.total_amount - subtotal);

  const invoice: InvoiceDetail = {
    id: sale.id,
    invoiceNumber: sale.invoice_number,
    status:
      sale.status === "completed"
        ? "Completed"
        : sale.status === "pending"
          ? "Pending"
          : sale.status === "in_progress"
            ? "In Progress"
            : "Cancelled",
    saleType: sale.sale_type ?? undefined,
    paymentStatus: sale.payment_status ?? undefined,
    createdAt: new Date(sale.created_at).toLocaleString("id-ID"),
    transactionType: "sale",
    entityName: sale.customer?.name ?? "Walk-in Customer",
    entityPhone: sale.customer?.phone ?? "-",
    entityVehicle: sale.vehicle
      ? [sale.vehicle.brand, sale.vehicle.model].filter(Boolean).join(" ") || undefined
      : undefined,
    entityPlate: sale.vehicle?.plate_number ?? undefined,
    mechanicName: sale.mechanic?.name ?? "-",
    mechanicStation: "-",
    jobStart: "-",
    jobEnd: "-",
    paymentMethod: sale.payment_method?.name ?? "-",
    paymentMethodIcon: sale.payment_method?.icon ?? null,
    transactionId: sale.invoice_number,
    cashAmount: sale.cash_amount ?? null,
    changeAmount: sale.change_amount ?? null,
    paidAmount: sale.paid_amount ?? null,
    remainingAmount: sale.remaining_amount ?? null,
    items: (sale.details ?? []).map((d) => ({
      id: d.id,
      name: d.item?.name ?? "Item",
      description: d.item?.description ?? "",
      type: d.service_fee > 0 ? "Service" : "Part",
      unitPrice: d.base_price,
      qty: d.quantity,
      discount: d.discount_amount,
      subtotal: d.subtotal,
      icon: d.service_fee > 0 ? "wrench" : "package",
    })),
    subtotal,
    totalDiscount,
    taxAmount,
    taxPercent: 0,
    grandTotal: sale.total_amount,
    createdBy: sale.created_by,
  };

  // Hitung persen pajak dari nilai (untuk tampilan "Pajak (11%)")
  if (invoice.taxAmount > 0 && invoice.subtotal > 0) {
    invoice.taxPercent = Math.round((invoice.taxAmount / invoice.subtotal) * 1000) / 10;
  }

  return invoice;
}

export { formatRupiah };
