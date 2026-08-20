"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MessageCircle,
  User,
  Wrench,
  CreditCard,
  Droplet,
  Cog,
  Disc3,
  Package,
  Truck,
  Banknote,
  Smartphone,
  Landmark,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Receipt } from "@/components/transactions/receipt";
import { useToast } from "@/lib/toast-provider";
import {
  type InvoiceDetail,
  type InvoiceItem,
  ITEM_TYPE_STYLES,
  formatRupiah,
} from "@/lib/data/invoice-details";
import { STATUS_STYLES } from "@/lib/data/transactions";
import { openWhatsAppReceipt } from "@/lib/utils/whatsapp";
import { useLocale } from "@/lib/locales";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ICON_MAP: Record<InvoiceItem["icon"], React.ElementType> = {
  wrench: Wrench,
  droplet: Droplet,
  cog: Cog,
  "disc-brake": Disc3,
  package: Package,
  truck: Truck,
};

function getPaymentIcon(icon: string | null) {
  switch (icon) {
    case "cash": return <Banknote className="h-4 w-4" />;
    case "qris": return <Smartphone className="h-4 w-4" />;
    case "bank": return <Landmark className="h-4 w-4" />;
    case "debit": return <CreditCard className="h-4 w-4" />;
    case "credit": return <CreditCard className="h-4 w-4" />;
    default: return <Wallet className="h-4 w-4" />;
  }
}

interface TransactionDetailProps {
  invoice: InvoiceDetail;
  backHref: string;
}

export function TransactionDetail({
  invoice,
  backHref,
}: TransactionDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLocale();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleWhatsApp() {
    if (invoice.entityPhone === "-" || !invoice.entityPhone) {
      showToast(t("transactions.customerNoPhone"), "error");
      return;
    }
    const ok = openWhatsAppReceipt(invoice);
    if (!ok) showToast(t("transactions.invalidPhone"), "error");
  }
  const statusStyle = STATUS_STYLES[invoice.status];
  const isSale = invoice.transactionType === "sale";

  async function performDelete() {
    try {
      const endpoint = isSale
        ? `/api/sales/${invoice.id}`
        : `/api/purchases/${invoice.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? t("common.failedToDelete"));
      }
      showToast(t("common.successfullyDeleted"), "success");
      router.push(backHref);
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("common.failedToDelete"),
        "error"
      );
      throw err;
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href={backHref} className="hover:text-sky-500 transition-colors">
          {isSale ? t("nav.sales") : t("nav.purchases")}
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-medium text-slate-900 dark:text-white">
          {invoice.invoiceNumber}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("transactions.invoiceLabel")} #{invoice.invoiceNumber}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${statusStyle.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
              {invoice.status}
            </span>
            {invoice.saleType && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                  invoice.saleType === "service"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    : invoice.saleType === "hybrid"
                    ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300"
                    : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                }`}
              >
                {invoice.saleType === "service"
                  ? t("transactions.typeService")
                  : invoice.saleType === "hybrid"
                  ? t("transactions.typeHybrid")
                  : t("transactions.typeGoods")}
              </span>
            )}
            {invoice.paymentStatus && invoice.paymentStatus !== "paid" && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                  invoice.paymentStatus === "unpaid"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                {invoice.paymentStatus === "unpaid" ? t("transactions.debt") : t("transactions.partialDp")}
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {t("transactions.createdOn", { date: invoice.createdAt })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              router.push(`${backHref}/${invoice.id}/edit`)
            }
          >
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Button>
          {invoice.transactionType === "sale" && (
            <Button
              variant="outline"
              className="gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-600"
              onClick={handleWhatsApp}
              title={t("transactions.sendWhatsAppTitle")}
            >
              <MessageCircle className="h-4 w-4" />
              {t("transactions.sendWhatsApp")}
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2 text-red-600 dark:text-red-400 hover:text-red-600"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t("common.delete")}
          </Button>
          <Receipt invoice={invoice} />
        </div>
      </div>

      {/* Info Cards */}
      <div className={`grid gap-6 ${isSale ? "grid-cols-3" : "grid-cols-2"}`}>
        {/* Customer / Supplier Info */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <User className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">
              {isSale ? t("transactions.customerInfo") : t("transactions.supplierInfo")}
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t("transactions.nameLabel")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.entityName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t("transactions.phoneLabel")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.entityPhone}
              </span>
            </div>
            {invoice.entityVehicle && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("transactions.vehicleLabel")}</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.entityVehicle}
                </span>
              </div>
            )}
            {invoice.entityPlate && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("masterData.plateNumber")}</span>
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
              <h3 className="font-semibold">{t("transactions.mechanicInfo")}</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("transactions.assigned")}</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.mechanicName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("transactions.station")}</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.mechanicStation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("transactions.startTime")}</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoice.jobStart}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("transactions.endTime")}</span>
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
            <h3 className="font-semibold">{t("transactions.paymentSummary")}</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t("transactions.method")}</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                {invoice.paymentMethodIcon && getPaymentIcon(invoice.paymentMethodIcon)}
                {invoice.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t("transactions.transactionId")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {invoice.transactionId}
              </span>
            </div>
            {invoice.cashAmount != null && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t("transactions.cashAmount")}</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatRupiah(invoice.cashAmount)}
                  </span>
                </div>
                {invoice.changeAmount != null && invoice.changeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t("transactions.changeAmount")}</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(invoice.changeAmount)}
                    </span>
                  </div>
                )}
              </>
            )}
            {invoice.paidAmount != null && invoice.paymentStatus !== "paid" && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    {invoice.paymentStatus === "unpaid" ? t("transactions.downPayment") : t("transactions.paidDp")}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatRupiah(invoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t("transactions.remainingBalance")}</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {formatRupiah(invoice.remainingAmount ?? invoice.grandTotal)}
                  </span>
                </div>
              </>
            )}
            <div className="mt-2 flex justify-between border-t border-dashed border-slate-200 dark:border-slate-600 pt-3">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {t("transactions.totalPaid")}
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
            {isSale ? t("transactions.detailServiceItems") : t("transactions.detailPurchaseItems")}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium" scope="col">
                  {t("transactions.detailItem")}
                </th>
                <th className="px-6 py-3 font-medium text-center" scope="col">
                  {t("masterData.type")}
                </th>
                <th className="px-6 py-3 font-medium text-right" scope="col">
                  {t("transactions.pricePerUnit")}
                </th>
                <th className="px-6 py-3 font-medium text-center" scope="col">
                  {t("transactions.qty")}
                </th>
                <th className="px-6 py-3 font-medium text-right" scope="col">
                  {t("transactions.discount")}
                </th>
                <th className="px-6 py-3 font-medium text-right" scope="col">
                  {t("transactions.subtotal")}
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
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                      {formatRupiah(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                      {item.qty}
                    </td>
                    <td className="px-6 py-4 text-right">
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
            <span>{t("transactions.subtotal")}</span>
            <span>{formatRupiah(invoice.subtotal)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex w-full max-w-xs justify-between text-sm text-green-600 dark:text-green-400">
              <span>{t("transactions.totalDiscount")}</span>
              <span>- {formatRupiah(invoice.totalDiscount)}</span>
            </div>
          )}
          <div className="flex w-full max-w-xs justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>{t("transactions.tax")} ({invoice.taxPercent}%)</span>
            <span>{formatRupiah(invoice.taxAmount)}</span>
          </div>
          <div className="my-2 h-px w-full max-w-xs bg-slate-200 dark:bg-slate-600" />
          <div className="flex w-full max-w-xs justify-between text-lg font-bold text-slate-900 dark:text-white">
            <span>{t("transactions.grandTotal")}</span>
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

      {/* Dialog konfirmasi hapus */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("common.confirmDelete")}
        description={`${t("transactions.invoiceLabel")} #${invoice.invoiceNumber}`}
        confirmLabel={t("common.delete")}
        onConfirm={performDelete}
      />
    </div>
  );
}
