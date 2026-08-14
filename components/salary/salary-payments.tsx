"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/toast-provider";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader, Plus, Trash2, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import type { SalaryPaymentWithMechanic, PaginatedResponse, Profile, PaymentMethod } from "@/lib/types/database";
import { formatCurrency } from "@/lib/format";

const ITEMS_PER_PAGE = 10;

export function SalaryPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<SalaryPaymentWithMechanic[]>([]);
  const [mechanics, setMechanics] = useState<Profile[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    mechanic_id: "",
    payment_date: new Date().toISOString().slice(0, 10),
    amount: "",
    period_start: "",
    period_end: "",
    payment_method_id: "",
    notes: "",
  });

  const fetchPayments = useCallback(async (page = currentPage) => {
    try {
      const res = await fetch(`/api/salary-payments?page=${page}&limit=${ITEMS_PER_PAGE}`, { cache: "no-store" });
      const result = (await res.json()) as PaginatedResponse<SalaryPaymentWithMechanic>;
      setPayments(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchPayments();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchPayments]);

  useEffect(() => {
    // Load mechanics & payment methods
    Promise.all([
      fetch("/api/users?role=mekanik&limit=500", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/payment-methods", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([m, p]) => {
        const rows = Array.isArray(m) ? m : (m as { data?: Profile[] }).data ?? [];
        setMechanics(rows.filter((u: Profile) => u.role === "mekanik"));
        setMethods(Array.isArray(p) ? p : []);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!form.mechanic_id || !form.payment_date || !form.amount || Number(form.amount) <= 0) {
      showToast("Lengkapi mekanik, tanggal, dan nominal", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/salary-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mechanic_id: form.mechanic_id,
          payment_date: form.payment_date,
          amount: Number(form.amount),
          period_start: form.period_start || null,
          period_end: form.period_end || null,
          payment_method_id: form.payment_method_id ? Number(form.payment_method_id) : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Gagal");
      }
      showToast("Pembayaran gaji tercatat", "success");
      setDialogOpen(false);
      setForm({ ...form, amount: "", notes: "", period_start: "", period_end: "" });
      await fetchPayments(1);
      setCurrentPage(1);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus catatan gaji ini?")) return;
    try {
      const res = await fetch(`/api/salary-payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      showToast("Catatan dihapus", "success");
      await fetchPayments();
    } catch {
      showToast("Gagal menghapus", "error");
    }
  }

  return (
    <div className="space-y-6">
      <Navbar
        title="Gaji Mekanik"
        subtitle="Catat pembayaran gaji mingguan mekanik."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Wallet className="h-4 w-4" />
          {total} catatan pembayaran
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Bayar Gaji
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mekanik</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tanggal</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Periode</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Nominal</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Metode</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-16">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-16 text-center">
                  <Loader className="h-7 w-7 animate-spin text-sky-500 mx-auto" />
                </TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-slate-400">
                  Belum ada catatan gaji
                </TableCell></TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id} className="border-slate-100 dark:border-slate-800">
                    <TableCell className="px-5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.mechanic?.name ?? "—"}</p>
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(p.payment_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="px-5 text-xs text-slate-500 dark:text-slate-400">
                      {p.period_start && p.period_end
                        ? `${p.period_start.slice(8)}/${p.period_start.slice(5, 7)} – ${p.period_end.slice(8)}/${p.period_end.slice(5, 7)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 font-mono">
                        {formatCurrency(p.amount)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-500 dark:text-slate-400">
                      {p.payment_method?.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => { setCurrentPage((p) => p - 1); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => { setCurrentPage((p) => p + 1); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Bayar Gaji */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bayar Gaji Mekanik</DialogTitle>
            <DialogDescription>Catat pembayaran gaji mingguan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Mekanik <span className="text-red-500">*</span></Label>
              <Select value={form.mechanic_id} onValueChange={(v) => setForm({ ...form, mechanic_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih mekanik" /></SelectTrigger>
                <SelectContent>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tanggal Bayar <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Nominal <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" placeholder="500000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Periode Mulai</Label>
                <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Periode Selesai</Label>
                <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Metode Pembayaran</Label>
              <Select value={form.payment_method_id} onValueChange={(v) => setForm({ ...form, payment_method_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving && <Loader className="h-4 w-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
