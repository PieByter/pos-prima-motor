import type { InvoiceDetail } from "@/lib/data/invoice-details";

/**
 * Konversi nomor HP Indonesia ke format internasional untuk wa.me.
 * "0812-3456-7890" → "6281234567890"
 */
export function toWaNumber(phone: string): string {
    let digits = phone.replace(/[^\d]/g, "");
    if (digits.startsWith("0")) digits = "62" + digits.slice(1);
    else if (!digits.startsWith("62")) digits = "62" + digits;
    return digits;
}

/**
 * Buat teks struk ringkas untuk WhatsApp.
 */
export function buildReceiptMessage(invoice: InvoiceDetail): string {
    const lines: string[] = [];

    lines.push("🧾 *STRUK PEMBELIAN*");
    lines.push("Prima Motor");
    lines.push("------------------------------");
    lines.push(`Invoice : ${invoice.invoiceNumber}`);
    lines.push(`Tanggal : ${invoice.createdAt}`);
    lines.push(`Customer: ${invoice.entityName}`);
    if (invoice.entityPhone !== "-") lines.push(`No. HP  : ${invoice.entityPhone}`);
    if (invoice.entityPlate) lines.push(`Kendaraan: ${invoice.entityPlate}`);
    if (invoice.entityVehicle) lines.push(`          ${invoice.entityVehicle}`);
    if (invoice.mechanicName !== "-") lines.push(`Mekanik : ${invoice.mechanicName}`);
    lines.push("------------------------------");

    for (const item of invoice.items) {
        const type = item.type === "Service" ? "🔧" : "🛒";
        lines.push(`${type} ${item.name}`);
        lines.push(`   ${item.qty} x ${fmtRp(item.unitPrice)} = ${fmtRp(item.subtotal)}`);
    }

    lines.push("------------------------------");
    if (invoice.totalDiscount > 0) {
        lines.push(`Diskon   : ${fmtRp(invoice.totalDiscount)}`);
    }
    lines.push(`*TOTAL    : ${fmtRp(invoice.grandTotal)}*`);

    if (invoice.paymentStatus === "unpaid") {
        lines.push("Status   : ⚠️ Belum Lunas");
    } else if (invoice.paymentStatus === "partial" && invoice.remainingAmount != null) {
        lines.push(`Status   : Sebagian (sisa ${fmtRp(invoice.remainingAmount)})`);
    } else {
        lines.push("Status   : ✅ Lunas");
    }
    if (invoice.paymentMethod && invoice.paymentMethod !== "-") {
        lines.push(`Metode   : ${invoice.paymentMethod}`);
    }
    if (invoice.cashAmount != null && invoice.changeAmount != null) {
        lines.push(`Tunai    : ${fmtRp(invoice.cashAmount)}`);
        lines.push(`Kembali  : ${fmtRp(invoice.changeAmount)}`);
    }
    lines.push("------------------------------");
    lines.push("Terima kasih 🙏");
    lines.push("Prima Motor - Prima Motor");

    return lines.join("\n");
}

function fmtRp(value: number): string {
    return "Rp " + Number(value).toLocaleString("id-ID");
}

/**
 * Buka WhatsApp dengan struk terisi (link wa.me, tanpa API — kasir tinggal tekan kirim).
 * Return false kalau nomor tidak valid.
 */
export function openWhatsAppReceipt(invoice: InvoiceDetail): boolean {
    const raw = invoice.entityPhone;
    if (!raw || raw === "-") return false;

    const number = toWaNumber(raw);
    if (number.length < 10) return false;

    const message = buildReceiptMessage(invoice);
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
    return true;
}
