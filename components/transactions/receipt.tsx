"use client";

import { useRef } from "react";
import { Bike } from "lucide-react";
import { formatRupiah } from "@/lib/data/items";
import type { InvoiceDetail } from "@/lib/data/invoice-details";
import { Button } from "@/components/ui/button";

interface ReceiptProps {
  invoice: InvoiceDetail;
}

export function Receipt({ invoice }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const isSale = invoice.transactionType === "sale";

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content");
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = `Struk - ${invoice.invoiceNumber}`;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      // Fallback: use browser print
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk - ${invoice.invoiceNumber}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #000;
              padding: 12px 16px;
              width: 80mm;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .header h1 { font-size: 16px; font-weight: bold; }
            .header p { font-size: 10px; color: #555; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
            .items { width: 100%; border-collapse: collapse; margin: 6px 0; }
            .items th { font-size: 10px; text-align: left; border-bottom: 1px solid #000; padding: 4px 0; }
            .items td { font-size: 11px; padding: 3px 0; vertical-align: top; }
            .items .qty { text-align: center; }
            .items .price { text-align: right; }
            .totals { margin-top: 6px; }
            .totals .row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
            .totals .grand-total { font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
            .footer { text-align: center; margin-top: 12px; font-size: 10px; border-top: 1px dashed #000; padding-top: 8px; }
            .payment-info { margin-top: 6px; padding-top: 4px; border-top: 1px dashed #000; }
            @media print {
              body { width: 100%; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
    document.title = originalTitle;
  };

  return (
    <>
      {/* ── Print button ── */}
      <Button
        variant="outline"
        className="gap-2 no-print"
        onClick={handlePrint}
      >
        <PrinterIcon />
        Cetak Struk
      </Button>

      {/* ── Hidden receipt content (used for printing) ── */}
      <div id="receipt-content" style={{ display: "none" }}>
        <div ref={printRef}>
          {/* Store Header */}
          <div className="header">
            <h1>PRIMA MOTOR</h1>
            <p>Toko Sparepart & Service Motor</p>
            <p>{invoice.createdAt}</p>
          </div>

          <div className="divider" />

          {/* Invoice Info */}
          <div className="info-row">
            <span>No. Invoice</span>
            <span>{invoice.invoiceNumber}</span>
          </div>
          <div className="info-row">
            <span>{isSale ? "Customer" : "Supplier"}</span>
            <span>{invoice.entityName}</span>
          </div>
          {isSale && invoice.mechanicName !== "-" && (
            <div className="info-row">
              <span>Mekanik</span>
              <span>{invoice.mechanicName}</span>
            </div>
          )}

          <div className="divider" />

          {/* Items Table */}
          <table className="items">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Item</th>
                <th className="qty" style={{ width: "15%" }}>Qty</th>
                <th className="price" style={{ width: "35%" }}>Harga</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="qty">{item.qty}</td>
                  <td className="price">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divider" />

          {/* Totals */}
          <div className="totals">
            <div className="row">
              <span>Subtotal</span>
              <span>{formatRupiah(invoice.subtotal)}</span>
            </div>
            {invoice.totalDiscount > 0 && (
              <div className="row">
                <span>Diskon</span>
                <span>-{formatRupiah(invoice.totalDiscount)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="row">
                <span>Pajak ({invoice.taxPercent}%)</span>
                <span>{formatRupiah(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="row grand-total">
              <span>TOTAL</span>
              <span>{formatRupiah(invoice.grandTotal)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="payment-info">
            <div className="info-row">
              <span>Pembayaran</span>
              <span>{invoice.paymentMethod}</span>
            </div>
            {invoice.cashAmount != null && (
              <>
                <div className="info-row">
                  <span>Tunai</span>
                  <span>{formatRupiah(invoice.cashAmount)}</span>
                </div>
                {invoice.changeAmount != null && invoice.changeAmount > 0 && (
                  <div className="info-row">
                    <span>Kembali</span>
                    <span>{formatRupiah(invoice.changeAmount)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PrinterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 01-2-2V8a2 2 0 012-2h2m12 12h2a2 2 0 002-2V8a2 2 0 00-2-2h-2m-2-4H8a2 2 0 00-2 2v4h12V4a2 2 0 00-2-2zM8 14h8v6H8v-6z" />
    </svg>
  );
}
