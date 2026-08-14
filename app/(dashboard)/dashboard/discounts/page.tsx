"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2, Tag, Percent, Pencil, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast-provider";

type DiscountRow = {
  id: number;
  name: string;
  type: "percent" | "fixed";
  value: number;
  min_transaction: number;
  max_percent: number | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  items?: { id: number; name: string; sku: string | null }[];
};

type ItemOption = { id: number; name: string; sku: string | null };

export default function DiscountsPage() {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    name: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    min_transaction: "0",
    max_percent: "",
    is_active: true,
    start_date: "",
    end_date: "",
  });

  const API = "/api/discounts";

  const fetchDiscounts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.append("search", search);
      const res = await fetch(`${API}?${params}`);
      if (res.ok) {
        const json = await res.json();
        setDiscounts(json?.data ?? []);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchDiscounts();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchDiscounts]);

  useEffect(() => {
    fetch("/api/items?page=1&limit=500", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setItems(json?.data ?? []))
      .catch(() => {});
  }, []);

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase().includes(itemSearch.toLowerCase())),
  );

  const resetForm = () => {
    setForm({ name: "", type: "percent", value: "", min_transaction: "0", max_percent: "", is_active: true, start_date: "", end_date: "" });
    setSelectedItemIds(new Set());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.value) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        value: Number(form.value),
        min_transaction: Number(form.min_transaction),
        is_active: form.is_active,
      };
      if (form.max_percent) payload.max_percent = Number(form.max_percent);
      if (form.start_date) payload.start_date = form.start_date;
      if (form.end_date) payload.end_date = form.end_date;

      const res = editingId
        ? await fetch(`${API}/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discount: payload, itemIds: [...selectedItemIds] }),
          })
        : await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discount: payload, itemIds: [...selectedItemIds] }),
          });

      if (res.ok) {
        resetForm();
        showToast(editingId ? "Diskon diperbarui" : "Diskon berhasil ditambahkan", "success");
        fetchDiscounts();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Gagal menyimpan diskon", "error");
      }
    } catch { showToast("Gagal menyimpan diskon", "error"); } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (discount: DiscountRow) => {
    setEditingId(discount.id);
    setForm({
      name: discount.name,
      type: discount.type,
      value: String(discount.value),
      min_transaction: String(discount.min_transaction ?? 0),
      max_percent: discount.max_percent != null ? String(discount.max_percent) : "",
      is_active: discount.is_active,
      start_date: discount.start_date ?? "",
      end_date: discount.end_date ?? "",
    });
    try {
      const res = await fetch(`${API}/${discount.id}`, { cache: "no-store" });
      if (res.ok) {
        const detail = await res.json();
        setSelectedItemIds(new Set((detail?.items ?? []).map((i: { id: number }) => i.id)));
      }
    } catch { /* ignore */ }
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus diskon ini?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Diskon dihapus", "success");
        fetchDiscounts();
      }
    } catch { showToast("Gagal menghapus", "error"); }
  };

  const handleToggleActive = async (discount: DiscountRow) => {
    try {
      await fetch(`${API}/${discount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: { is_active: !discount.is_active } }),
      });
      fetchDiscounts();
    } catch { /* ignore */ }
  };

  const formatValue = (d: DiscountRow) => {
    if (d.type === "percent") return `${d.value}%`;
    return formatCurrency(d.value);
  };

  const toggleItem = (id: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <>
      <Navbar title="Diskon" subtitle="Kelola diskon & promosi." />
      <div className="space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari diskon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Tambah Diskon
          </Button>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{editingId ? "Edit Diskon" : "Tambah Diskon"}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Input placeholder="Nama diskon" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "percent" | "fixed" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Persen (%)</SelectItem>
                  <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder={form.type === "percent" ? "Nilai (%)" : "Nilai (Rp)"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" className="bg-sky-500 hover:bg-sky-600" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Batal</Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              <Input type="number" placeholder="Min. transaksi" value={form.min_transaction} onChange={(e) => setForm({ ...form, min_transaction: e.target.value })} />
              <Input type="number" placeholder="Max % (opsional)" value={form.max_percent} onChange={(e) => setForm({ ...form, max_percent: e.target.value })} />
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Aktif</span>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
              </div>
            </div>

            {/* Item picker */}
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Berlaku untuk barang tertentu ({selectedItemIds.size} dipilih — kosong = semua barang)
              </p>
              <div className="relative mb-2 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Cari barang..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Barang tidak ditemukan</p>
                ) : (
                  filteredItems.slice(0, 100).map((item) => (
                    <label key={item.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="h-3.5 w-3.5 accent-sky-500"
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.sku && <span className="text-xs text-slate-400">{item.sku}</span>}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border bg-white dark:bg-slate-800">
          {isLoading ? (
            <div className="space-y-3 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : discounts.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Belum ada diskon.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Nilai</th>
                    <th className="px-4 py-3">Min. Transaksi</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {discounts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.items?.length ? `${d.items.length} barang` : "Semua barang"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                          {d.type === "percent" ? <Percent className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                          {formatValue(d)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatCurrency(d.min_transaction)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {d.start_date || d.end_date
                          ? `${d.start_date ? d.start_date.slice(8) + "/" + d.start_date.slice(5, 7) : "…"} – ${d.end_date ? d.end_date.slice(8) + "/" + d.end_date.slice(5, 7) : "…"}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(d)}
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            d.is_active
                              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {d.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(d)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(d.id)} title="Hapus">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
