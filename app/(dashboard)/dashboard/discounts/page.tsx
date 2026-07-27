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
import { Plus, Search, Loader2, Tag, Percent } from "lucide-react";
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
};

export default function DiscountsPage() {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setIsLoading(true);
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

  useEffect(() => { fetchDiscounts() }, [fetchDiscounts]);

  const handleCreate = async () => {
    if (!form.name || !form.value) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        type: form.type,
        value: Number(form.value),
        min_transaction: Number(form.min_transaction),
        is_active: form.is_active,
      };
      if (form.max_percent) payload.max_percent = Number(form.max_percent);
      if (form.start_date) payload.start_date = form.start_date;
      if (form.end_date) payload.end_date = form.end_date;

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: payload, itemIds: [] }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", type: "percent", value: "", min_transaction: "0", max_percent: "", is_active: true, start_date: "", end_date: "" });
        showToast("Diskon berhasil ditambahkan", "success");
        fetchDiscounts();
      } else {
        showToast("Gagal menambahkan diskon", "error");
      }
    } catch { showToast("Gagal menambahkan diskon", "error"); } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (discount: DiscountRow) => {
    try {
      await fetch(`${API}/${discount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !discount.is_active }),
      });
      fetchDiscounts();
    } catch { /* ignore */ }
  };

  const formatValue = (d: DiscountRow) => {
    if (d.type === "percent") return `${d.value}%`;
    return formatCurrency(d.value);
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
          <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Tambah Diskon
          </Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-800">
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
                <Button size="sm" className="bg-sky-500 hover:bg-sky-600" onClick={handleCreate} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Input type="number" placeholder="Min. transaksi" value={form.min_transaction} onChange={(e) => setForm({ ...form, min_transaction: e.target.value })} />
              <Input type="number" placeholder="Max % (opsional)" value={form.max_percent} onChange={(e) => setForm({ ...form, max_percent: e.target.value })} />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Aktif</span>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
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
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {discounts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                          {d.type === "percent" ? <Percent className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                          {formatValue(d)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatCurrency(d.min_transaction)}</td>
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
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/api/discounts/${d.id}`}>Detail</a>
                        </Button>
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
