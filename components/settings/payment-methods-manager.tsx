"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast-provider";
import { Plus, Pencil, Trash2, Loader2, CreditCard, Wallet, Banknote, Smartphone } from "lucide-react";

type PaymentMethod = {
  id: number;
  name: string;
  icon: string | null;
  is_active: boolean;
};

const ICON_OPTIONS = [
  { value: "", label: "Tanpa icon", icon: null },
  { value: "credit-card", label: "Kartu Kredit", icon: CreditCard },
  { value: "wallet", label: "E-Wallet", icon: Wallet },
  { value: "cash", label: "Tunai", icon: Banknote },
  { value: "smartphone", label: "QRIS / Mobile", icon: Smartphone },
];

export function PaymentMethodsManager() {
  const { showToast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "", is_active: true });

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/payment-methods", { cache: "no-store" });
      if (res.ok) {
        const list = await res.json();
        setMethods(Array.isArray(list) ? list : []);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchMethods();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchMethods]);

  const resetForm = () => {
    setForm({ name: "", icon: "", is_active: true });
    setEditingId(null);
    setDialogOpen(false);
  };

  const openAdd = () => {
    setForm({ name: "", icon: "", is_active: true });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setForm({ name: m.name, icon: m.icon ?? "", is_active: m.is_active });
    setEditingId(m.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Nama metode bayar wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon || null,
        is_active: form.is_active,
      };
      const res = editingId
        ? await fetch(`/api/payment-methods/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/payment-methods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("Gagal");
      showToast(editingId ? "Metode bayar diperbarui" : "Metode bayar ditambahkan", "success");
      resetForm();
      await fetchMethods();
    } catch {
      showToast("Gagal menyimpan metode bayar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (m: PaymentMethod) => {
    try {
      const res = await fetch(`/api/payment-methods/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !m.is_active }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast(m.is_active ? "Metode dinonaktifkan" : "Metode diaktifkan", "success");
      await fetchMethods();
    } catch {
      showToast("Gagal update status", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus metode bayar ini? Transaksi lama tetap aman.")) return;
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      showToast("Metode bayar dihapus", "success");
      await fetchMethods();
    } catch {
      showToast("Gagal menghapus (mungkin masih dipakai transaksi)", "error");
    }
  };

  return (
    <>
      <Navbar
        title="Metode Pembayaran"
        subtitle="Kelola metode bayar: tunai, transfer, QRIS, e-wallet, dll."
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{methods.length} metode terdaftar</p>
          <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Metode
          </Button>
        </div>

        <div className="rounded-xl border bg-white dark:bg-slate-800">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : methods.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">
              Belum ada metode pembayaran. Tambahkan di atas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Icon</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {methods.map((m) => {
                    const iconOpt = ICON_OPTIONS.find((o) => o.value === m.icon);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-medium">{m.name}</td>
                        <td className="px-4 py-3 text-slate-500">{iconOpt?.label ?? "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(m)}
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.is_active
                                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                            }`}
                          >
                            {m.is_active ? "Aktif" : "Nonaktif"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(m)} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(m.id)} title="Hapus">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Tambah/Edit */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Metode Bayar" : "Tambah Metode Bayar"}</DialogTitle>
            <DialogDescription>
              Contoh: Tunai, Transfer BCA, QRIS, GoPay, dll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nama Metode <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Tunai / Transfer / QRIS"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const selected = form.icon === opt.value;
                  return (
                    <button
                      key={opt.value || "__none"}
                      type="button"
                      onClick={() => setForm({ ...form, icon: opt.value })}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors ${
                        selected
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {opt.icon ? <opt.icon className="h-4 w-4" /> : <span className="h-4 w-4" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 accent-sky-500"
              />
              <Label className="text-sm">Aktif (muncul di form transaksi)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-sky-500 hover:bg-sky-600">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
