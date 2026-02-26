"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Pencil,
  User,
  Wrench,
  CreditCard,
  Droplet,
  Cog,
  Disc3,
  Package,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type InvoiceDetail,
  type InvoiceItem,
  ITEM_TYPE_STYLES,
  formatRupiah,
} from "@/lib/data/invoice-details";
import { STATUS_STYLES } from "@/lib/data/transactions";

const ICON_MAP: Record<InvoiceItem["icon"], React.ElementType> = {
  wrench: Wrench,
  droplet: Droplet,
  cog: Cog,
  "disc-brake": Disc3,
  package: Package,
  truck: Truck,
};

interface TransactionDetailProps {
  invoice: InvoiceDetail;
  backHref: string;
}

export function TransactionDetail({
  invoice,
  backHref,
}: TransactionDetailProps) {
  const router = useRouter();
  const statusStyle = STATUS_STYLES[invoice.status];
  const isSale = invoice.transactionType === "sale";

  return (
    <div className="max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href={backHref} className="hover:text-sky-500 transition-colors">
          {isSale ? "Penjualan" : "Pembelian"}
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-medium text-slate-900 dark:text-white">
          {invoice.invoiceNumber}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${statusStyle.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
              {invoice.status}
            </span>
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Created on {invoice.createdAt}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              router.push(`${backHref}/${invoice.id}/edit`)
            }
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button className="bg-sky-500 hover:bg-sky-600 text-white gap-2">
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className={`grid gap-6 ${isSale ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {/* Customer / Supplier Info */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <User className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">
              {isSale ? "Info Customer" : "Info Supplier"}
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Nama</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.entityName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Telepon</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.entityPhone}
              </span>
            </div>
            {invoice.entityVehicle && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kendaraan</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.entityVehicle}
                </span>
              </div>
            )}
            {invoice.entityPlate && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plat Nomor</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.entityPlate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mechanic Info (only for sales) */}
        {isSale && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Info Mekanik</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ditugaskan</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.mechanicName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Station</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.mechanicStation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Mulai</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.jobStart}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Selesai</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.jobEnd}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Ringkasan Pembayaran</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Metode</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">ID Transaksi</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.transactionId}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-dashed border-slate-200 dark:border-slate-600 pt-3">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Total Bayar
              </span>
              <span className="font-bold text-sky-500">
                {formatRupiah(invoice.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {isSale ? "Detail Service & Sparepart" : "Detail Barang Pembelian"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium" scope="col">
                  Detail Item
                </th>
                <th className="px-6 py-3 font-medium text-center" scope="col">
                  Tipe
                </th>
                <th className="px-6 py-3 font-medium text-right hidden sm:table-cell" scope="col">
                  Harga Satuan
                </th>
                <th className="px-6 py-3 font-medium text-center" scope="col">
                  Qty
                </th>
                <th className="px-6 py-3 font-medium text-right hidden md:table-cell" scope="col">
                  Diskon
                </th>
                <th className="px-6 py-3 font-medium text-right" scope="col">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {invoice.items.map((item) => {
                const IconComp = ICON_MAP[item.icon];
                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${ITEM_TYPE_STYLES[item.type]}`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                      {formatRupiah(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                      {item.qty}
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell">
                      {item.discount > 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          - {formatRupiah(item.discount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-2 bg-slate-50/50 dark:bg-slate-900/30 p-6">
          <div className="flex w-full max-w-xs justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>Subtotal</span>
            <span>{formatRupiah(invoice.subtotal)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex w-full max-w-xs justify-between text-sm text-green-600 dark:text-green-400">
              <span>Total Diskon</span>
              <span>- {formatRupiah(invoice.totalDiscount)}</span>
            </div>
          )}
          <div className="flex w-full max-w-xs justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>Pajak ({invoice.taxPercent}%)</span>
            <span>{formatRupiah(invoice.taxAmount)}</span>
          </div>
          <div className="my-2 h-px w-full max-w-xs bg-slate-200 dark:bg-slate-600" />
          <div className="flex w-full max-w-xs justify-between text-lg font-bold text-slate-900 dark:text-white">
            <span>Grand Total</span>
            <span>{formatRupiah(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-2">
        <p className="text-xs text-slate-400">
          Invoice dibuat oleh {invoice.createdBy} pada {invoice.createdAt}
        </p>
      </div>
    </div>
  );
}
