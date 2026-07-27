"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Loader2, Download } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast-provider";

type ExpenseRow = {
  id: number;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  notes: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  operational: "Operasional",
  utilities: "Utilitas",
  rent: "Sewa",
  salary: "Gaji",
  others: "Lainnya",
};

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "others", expense_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.append("search", search);
      const res = await fetch(`/api/expenses?${params}`);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json?.data ?? []);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchExpenses() }, [fetchExpenses]);

  const handleCreate = async () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          amount: Number(form.amount),
          category: form.category,
          expense_date: form.expense_date,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ description: "", amount: "", category: "others", expense_date: new Date().toISOString().slice(0, 10), notes: "" });
        showToast("Pengeluaran berhasil dicatat", "success");
        fetchExpenses();
      } else {
        showToast("Gagal mencatat pengeluaran", "error");
      }
    } catch { showToast("Gagal mencatat pengeluaran", "error"); } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus pengeluaran ini?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Pengeluaran berhasil dihapus", "success");
        fetchExpenses();
      }
    } catch { showToast("Gagal menghapus pengeluaran", "error"); }
  };

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <Navbar title="Pengeluaran" subtitle="Catat biaya operasional toko." />
      <div className="space-y-4">
        {/* Stats + Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-lg border bg-white px-4 py-2 dark:bg-slate-800">
            <span className="text-xs text-slate-500">Total Pengeluaran</span>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/api/export?type=expenses", "_blank")}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-800">
            <div className="grid gap-3 sm:grid-cols-5">
              <Input placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input type="number" placeholder="Jumlah (Rp)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border px-3 py-2 text-sm dark:bg-slate-700">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" className="bg-sky-500 hover:bg-sky-600" onClick={handleCreate} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border bg-white dark:bg-slate-800">
          {isLoading ? (
            <div className="space-y-3 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : expenses.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Belum ada pengeluaran.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-right">Jumlah</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">{e.expense_date}</td>
                      <td className="px-4 py-3 font-medium">{e.description}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">{CATEGORY_LABELS[e.category] || e.category}</span></td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(Number(e.amount))}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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
