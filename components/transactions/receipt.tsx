"use client";

import { useRef, useState } from "react";
import { formatRupiah } from "@/lib/data/items";
import type { InvoiceDetail } from "@/lib/data/invoice-details";
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";

interface ReceiptProps {
  invoice: InvoiceDetail;
}

export function Receipt({ invoice }: ReceiptProps) {
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
          Cetak Struk
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-4 w-4" />
          {showPreview ? "Sembunyikan" : "Pratinjau"}
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
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          <p style={{ marginTop: "4px" }}>{new Date().toLocaleString("id-ID")}</p>
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
  return (
    <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "12px", color: "#000" }}>
      {/* Store Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>PRIMA MOTOR</h1>
        <p style={{ fontSize: "10px", color: "#555", margin: "2px 0" }}>
          Toko Sparepart &amp; Service Motor
        </p>
        <p style={{ fontSize: "10px", color: "#555", margin: 0 }}>
          {invoice.createdAt}
        </p>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Invoice Info */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
        <span>No. Invoice</span>
        <span style={{ fontWeight: "bold" }}>{invoice.invoiceNumber}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
        <span>{isSale ? "Customer" : "Supplier"}</span>
        <span>{invoice.entityName}</span>
      </div>
      {isSale && invoice.mechanicName !== "-" && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
          <span>Mekanik</span>
          <span>{invoice.mechanicName}</span>
        </div>
      )}

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "6px 0" }}>
        <thead>
          <tr>
            <th style={{ fontSize: "10px", textAlign: "left", borderBottom: "1px solid #000", padding: "4px 0", width: "50%" }}>
              Item
            </th>
            <th style={{ fontSize: "10px", textAlign: "center", borderBottom: "1px solid #000", padding: "4px 0", width: "15%" }}>
              Qty
            </th>
            <th style={{ fontSize: "10px", textAlign: "right", borderBottom: "1px solid #000", padding: "4px 0", width: "35%" }}>
              Harga
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
          <span>Subtotal</span>
          <span>{formatRupiah(invoice.subtotal)}</span>
        </div>
        {invoice.totalDiscount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
            <span>Diskon</span>
            <span>-{formatRupiah(invoice.totalDiscount)}</span>
          </div>
        )}
        {invoice.taxAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
            <span>Pajak ({invoice.taxPercent}%)</span>
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
          <span>TOTAL</span>
          <span>{formatRupiah(invoice.grandTotal)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ marginTop: "6px", paddingTop: "4px", borderTop: "1px dashed #000" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
          <span>Pembayaran</span>
          <span>{invoice.paymentMethod}</span>
        </div>
        {invoice.cashAmount != null && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
              <span>Tunai</span>
              <span>{formatRupiah(invoice.cashAmount)}</span>
            </div>
            {invoice.changeAmount != null && invoice.changeAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                <span>Kembali</span>
                <span>{formatRupiah(invoice.changeAmount)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
