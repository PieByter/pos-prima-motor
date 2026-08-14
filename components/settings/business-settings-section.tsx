"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/toast-provider";
import { Loader2, Store, Percent, PackageOpen, MessageCircle } from "lucide-react";
import type { BusinessSettings } from "@/lib/services/business-settings.service";

export function BusinessSettingsSection() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
    whatsapp_number: "",
    tax_percent: "11",
    low_stock_threshold: "5",
    receipt_footer: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/business-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: BusinessSettings | null) => {
        if (cancelled || !data) return;
        setSettings(data);
        setForm({
          shop_name: data.shop_name ?? "",
          shop_address: data.shop_address ?? "",
          shop_phone: data.shop_phone ?? "",
          whatsapp_number: data.whatsapp_number ?? "",
          tax_percent: String(data.tax_percent ?? 11),
          low_stock_threshold: String(data.low_stock_threshold ?? 5),
          receipt_footer: data.receipt_footer ?? "",
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!form.shop_name.trim()) {
      showToast("Nama toko wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_name: form.shop_name.trim(),
          shop_address: form.shop_address.trim() || null,
          shop_phone: form.shop_phone.trim() || null,
          whatsapp_number: form.whatsapp_number.trim() || null,
          tax_percent: Number(form.tax_percent || 0),
          low_stock_threshold: Number(form.low_stock_threshold || 0),
          receipt_footer: form.receipt_footer.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast("Pengaturan bisnis disimpan", "success");
      setSettings((prev) => prev ? { ...prev, ...JSON.parse(JSON.stringify(form)) } : prev);
    } catch {
      showToast("Gagal menyimpan pengaturan", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
            <Store className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Info Toko</h3>
            <p className="text-xs text-slate-500">Nama & kontak yang tampil di struk.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nama Toko <span className="text-red-500">*</span></Label>
            <Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>No. Telepon Toko</Label>
            <Input value={form.shop_phone} onChange={(e) => setForm({ ...form, shop_phone: e.target.value })} placeholder="021-1234567" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Alamat</Label>
            <Input value={form.shop_address} onChange={(e) => setForm({ ...form, shop_address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> Nomor WhatsApp Toko
            </Label>
            <Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="0812-3456-7890" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="inline-flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" /> Pajak PPN (%)
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.tax_percent}
              onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
            />
            <p className="text-xs text-slate-400">Dipakai form transaksi (default 11%).</p>
          </div>
          <div className="space-y-1.5">
            <Label className="inline-flex items-center gap-1.5">
              <PackageOpen className="h-3.5 w-3.5" /> Ambang Stok Menipis
            </Label>
            <Input
              type="number"
              min="1"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
            />
            <p className="text-xs text-slate-400">Peringatan stok menipis (default 5).</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Catatan Kaki Struk</Label>
          <Textarea
            rows={2}
            value={form.receipt_footer}
            onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
            placeholder="Contoh: Garansi 3 bulan untuk sparepart. Terima kasih!"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-sky-500 hover:bg-sky-600">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Pengaturan
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Terakhir diupdate: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString("id-ID") : "—"}
      </p>
    </div>
  );
}
