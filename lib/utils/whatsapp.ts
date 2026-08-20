import type { InvoiceDetail } from "@/lib/data/invoice-details";
import type { ReceivableRow } from "@/lib/types/database";
import type { VehicleDocumentWithVehicle } from "@/lib/services/vehicle-documents.service";
import type { AppointmentWithDetails } from "@/lib/services/appointments.service";

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
    if (invoice.taxAmount > 0) {
        lines.push(`Pajak ${invoice.taxPercent > 0 ? `(${invoice.taxPercent}%)` : ""} : ${fmtRp(invoice.taxAmount)}`);
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

/**
 * Buka WhatsApp dengan pesan bebas (link wa.me, tanpa API).
 * Return false kalau nomor tidak valid.
 */
export function openWhatsApp(phone: string, message: string): boolean {
    const number = toWaNumber(phone);
    if (number.length < 10) return false;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
    return true;
}

/** Pesan pengingat tagihan piutang. */
export function buildReceivableReminderMessage(row: ReceivableRow): string {
    const lines: string[] = [];
    lines.push("💳 *Pengingat Pembayaran*");
    lines.push("Prima Motor");
    lines.push("------------------------------");
    lines.push(`Halo *${row.customer_name}*,`);
    lines.push("");
    lines.push(`Kami mengingatkan tagihan Anda untuk invoice *${row.invoice_number}*:`);
    lines.push(`Total tagihan : ${fmtRp(row.total_amount)}`);
    lines.push(`Sudah dibayar : ${fmtRp(row.paid_amount)}`);
    lines.push(`*Sisa tagihan : ${fmtRp(row.remaining_amount)}*`);
    lines.push("");
    lines.push("Mohon segera melakukan pembayaran. Terima kasih 🙏");
    return lines.join("\n");
}

/** Pesan pengingat pajak/STNK kendaraan. */
export function buildVehicleDocReminderMessage(doc: VehicleDocumentWithVehicle): string {
    const owner = doc.vehicle?.customers?.name ?? "Pelanggan";
    const plate = doc.vehicle?.plate_number ?? "-";
    const type = doc.doc_type === "stnk" ? "STNK" : "Pajak Tahunan";
    const due = new Date(doc.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const lines: string[] = [];
    lines.push("📅 *Pengingat Dokumen Kendaraan*");
    lines.push("Prima Motor");
    lines.push("------------------------------");
    lines.push(`Halo *${owner}*,`);
    lines.push("");
    lines.push(`Dokumen *${type}* kendaraan *${plate}* Anda akan jatuh tempo pada:`);
    lines.push(`*${due}*`);
    if (doc.notes) lines.push(`Catatan: ${doc.notes}`);
    lines.push("");
    lines.push("Segera perpanjang agar tidak terkena denda. Terima kasih 🙏");
    return lines.join("\n");
}

/** Pesan pengingat jadwal servis. */
export function buildAppointmentReminderMessage(appt: AppointmentWithDetails): string {
    const name = appt.customer?.name ?? "Pelanggan";
    const date = new Date(appt.appointment_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const plate = appt.vehicle?.plate_number;
    const lines: string[] = [];
    lines.push("🔧 *Pengingat Jadwal Servis*");
    lines.push("Prima Motor");
    lines.push("------------------------------");
    lines.push(`Halo *${name}*,`);
    lines.push("");
    lines.push(`Anda memiliki jadwal servis pada:`);
    lines.push(`*${date}*`);
    if (plate) lines.push(`Kendaraan: ${plate}`);
    if (appt.description) lines.push(`Keterangan: ${appt.description}`);
    lines.push("");
    lines.push("Mohon hadir tepat waktu. Terima kasih 🙏");
    return lines.join("\n");
}

/** Pesan konfirmasi ke supplier bahwa barang PO sudah diterima. */
export function buildPurchaseOrderReceivedMessage(po: {
    po_number?: string | null;
    order_date?: string | null;
    supplier?: { name?: string | null } | null;
    details?: Array<{ quantity: number; price: number | string; item?: { name?: string | null } | null }>;
}): string {
    const lines: string[] = [];
    lines.push("📦 *Konfirmasi Penerimaan Barang*");
    lines.push("Prima Motor");
    lines.push("------------------------------");
    lines.push(`No. PO : ${po.po_number ?? "-"}`);
    if (po.order_date) lines.push(`Tgl PO : ${new Date(po.order_date).toLocaleDateString("id-ID")}`);
    lines.push("------------------------------");
    if (po.details && po.details.length > 0) {
        for (const d of po.details) {
            lines.push(`🛒 ${d.item?.name ?? "Item"}`);
            lines.push(`   ${d.quantity} x ${fmtRp(Number(d.price))}`);
        }
        lines.push("------------------------------");
    }
    lines.push("Barang sudah kami terima. Terima kasih 🙏");
    lines.push("Prima Motor");
    return lines.join("\n");
}
