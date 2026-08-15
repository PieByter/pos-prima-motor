"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/data/items";
import type { InvoiceDetail } from "@/lib/data/invoice-details";
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";
import { useLocale } from "@/lib/locales";

interface ReceiptProps {
  invoice: InvoiceDetail;
}

export function Receipt({ invoice }: ReceiptProps) {
  const { t, locale } = useLocale();
  const isSale = invoice.transactionType === "sale";
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    // Add printing class to body, then trigger print
    document.body.classList.add("printing-receipt");
    window.print();
    document.body.classList.remove("printing-receipt");
  };

  return (
    <>
      {/* ── Print / Preview buttons ── */}
      <div className="flex gap-2 receipt-no-print">
        <Button
          variant="default"
          className="gap-2"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          {t("receipt.print")}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-4 w-4" />
          {showPreview ? t("common.hide") : t("common.preview")}
        </Button>
      </div>

      {/* ── Receipt Preview (shown inline) ── */}
      {showPreview && (
        <div className="mt-4 bg-white border border-slate-200 rounded-lg p-6 max-w-sm mx-auto shadow-md">
          <ReceiptContent invoice={invoice} isSale={isSale} />
        </div>
      )}

      {/* ── Receipt for printing (visible only when printing) ── */}
      <div className="receipt-container hidden print:block" style={{ display: "none" }}>
        <ReceiptContent invoice={invoice} isSale={isSale} />
        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "10px", paddingTop: "8px", borderTop: "1px dashed #000" }}>
          <p>{t("receipt.thanks")}</p>
          <p>{t("receipt.noReturn")}</p>
          <p style={{ marginTop: "4px" }}>{new Date().toLocaleString(locale)}</p>
        </div>
      </div>
    </>
  );
}

/** The actual receipt content, used by both preview and print */
function ReceiptContent({
  invoice,
  isSale,
}: {
  invoice: InvoiceDetail;
  isSale: boolean;
}) {
  const { t } = useLocale();
  return (
    <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "12px", color: "#000" }}>
      {/* Store Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>{t("receipt.storeName")}</h1>
        <p style={{ fontSize: "10px", color: "#555", margin: "2px 0" }}>
          {t("receipt.storeDesc")}
        </p>
        <p style={{ fontSize: "10px", color: "#555", margin: 0 }}>
          {invoice.createdAt}
        </p>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Invoice Info */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
        <span>{t("transactions.invoiceNumber")}</span>
        <span style={{ fontWeight: "bold" }}>{invoice.invoiceNumber}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
        <span>{isSale ? t("transactions.customerLabel") : t("transactions.supplierLabel")}</span>
        <span>{invoice.entityName}</span>
      </div>
      {isSale && invoice.mechanicName !== "-" && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
          <span>{t("transactions.mechanic")}</span>
          <span>{invoice.mechanicName}</span>
        </div>
      )}

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "6px 0" }}>
        <thead>
          <tr>
            <th style={{ fontSize: "10px", textAlign: "left", borderBottom: "1px solid #000", padding: "4px 0", width: "50%" }}>
              {t("transactions.item")}
            </th>
            <th style={{ fontSize: "10px", textAlign: "center", borderBottom: "1px solid #000", padding: "4px 0", width: "15%" }}>
              {t("transactions.qty")}
            </th>
            <th style={{ fontSize: "10px", textAlign: "right", borderBottom: "1px solid #000", padding: "4px 0", width: "35%" }}>
              {t("transactions.price")}
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td style={{ fontSize: "11px", padding: "3px 0", verticalAlign: "top" }}>
                {item.name}
              </td>
              <td style={{ fontSize: "11px", padding: "3px 0", textAlign: "center", verticalAlign: "top" }}>
                {item.qty}
              </td>
              <td style={{ fontSize: "11px", padding: "3px 0", textAlign: "right", verticalAlign: "top" }}>
                {formatRupiah(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Totals */}
      <div style={{ marginTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
          <span>{t("receipt.subtotal")}</span>
          <span>{formatRupiah(invoice.subtotal)}</span>
        </div>
        {invoice.totalDiscount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
            <span>{t("receipt.discount")}</span>
            <span>-{formatRupiah(invoice.totalDiscount)}</span>
          </div>
        )}
        {invoice.taxAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
            <span>{t("receipt.tax")} ({invoice.taxPercent}%)</span>
            <span>{formatRupiah(invoice.taxAmount)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            fontWeight: "bold",
            borderTop: "2px solid #000",
            paddingTop: "4px",
            marginTop: "4px",
          }}
        >
          <span>{t("receipt.total")}</span>
          <span>{formatRupiah(invoice.grandTotal)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ marginTop: "6px", paddingTop: "4px", borderTop: "1px dashed #000" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
          <span>{t("receipt.payment")}</span>
          <span>{invoice.paymentMethod}</span>
        </div>
        {invoice.cashAmount != null && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
              <span>{t("receipt.cash")}</span>
              <span>{formatRupiah(invoice.cashAmount)}</span>
            </div>
            {invoice.changeAmount != null && invoice.changeAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                <span>{t("receipt.change")}</span>
                <span>{formatRupiah(invoice.changeAmount)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
