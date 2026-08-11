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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import type { WarrantyClaimWithDetails, PaginatedResponse } from "@/lib/types/database";
import { formatCurrency } from "@/lib/format";

const ITEMS_PER_PAGE = 10;

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  approved: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Disetujui",
  rejected: "Ditolak",
  completed: "Selesai",
};

const resolutionLabels: Record<string, string> = {
  repair: "Perbaikan",
  replace: "Ganti Baru",
  refund: "Refund",
  none: "—",
};

export function WarrantyClaimsPage() {
  const { showToast } = useToast();
  const [claims, setClaims] = useState<WarrantyClaimWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sale_detail_id: "",
    item_id: "",
    claim_date: new Date().toISOString().slice(0, 10),
    description: "",
    cost: "0",
    notes: "",
  });

  const fetchClaims = useCallback(async (page = currentPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/warranty-claims?${params}`, { cache: "no-store" });
      const result = (await res.json()) as PaginatedResponse<WarrantyClaimWithDetails>;
      setClaims(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  async function handleSubmit() {
    if (!form.sale_detail_id || !form.item_id || !form.description.trim()) {
      showToast("Lengkapi data klaim", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/warranty-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_detail_id: Number(form.sale_detail_id),
          item_id: Number(form.item_id),
          claim_date: form.claim_date,
          description: form.description,
          cost: Number(form.cost || 0),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast("Klaim garansi dibuat", "success");
      setDialogOpen(false);
      setForm({ ...form, sale_detail_id: "", item_id: "", description: "", cost: "0", notes: "" });
      setCurrentPage(1);
      await fetchClaims(1);
    } catch {
      showToast("Gagal membuat klaim", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/warranty-claims?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolved_date: status === "completed" || status === "rejected" ? new Date().toISOString().slice(0, 10) : null,
        }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast("Status klaim diperbarui", "success");
      await fetchClaims();
    } catch {
      showToast("Gagal update status", "error");
    }
  }

  return (
    <div className="space-y-6">
      <Navbar
        title="Klaim Garansi"
        subtitle="Kelola klaim garansi barang rusak dalam masa garansi."
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">{total} klaim</span>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <ShieldAlert className="h-4 w-4" /> Buat Klaim
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Item</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoice</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tgl Klaim</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deskripsi</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Biaya</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-32">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center">
                  <Loader className="h-7 w-7 animate-spin text-sky-500 mx-auto" />
                </TableCell></TableRow>
              ) : claims.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center text-sm text-slate-400">
                  Belum ada klaim garansi
                </TableCell></TableRow>
              ) : (
                claims.map((c) => (
                  <TableRow key={c.id} className="border-slate-100 dark:border-slate-800">
                    <TableCell className="px-5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.item?.name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{c.item?.sku ?? ""}</p>
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-600 dark:text-slate-300 font-mono">
                      {c.sale?.invoice_number ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-600 dark:text-slate-300">
                      {(c.sale as unknown as { customer?: { name?: string } })?.customer?.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-500">
                      {new Date(c.claim_date).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-500 dark:text-slate-400 max-w-48 truncate">
                      {c.description}
                    </TableCell>
                    <TableCell className="px-5 text-right text-sm font-mono text-slate-700 dark:text-slate-200">
                      {Number(c.cost) > 0 ? formatCurrency(Number(c.cost)) : "—"}
                    </TableCell>
                    <TableCell className="px-5">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border ${statusStyles[c.status] ?? ""}`}>
                        {statusLabels[c.status] ?? c.status}
                      </Badge>
                      {c.resolution !== "none" && c.status === "approved" && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{resolutionLabels[c.resolution]}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-5">
                      {c.status === "pending" ? (
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatus(c.id, "approved")}>
                            Setuju
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => handleStatus(c.id, "rejected")}>
                            Tolak
                          </Button>
                        </div>
                      ) : c.status === "approved" ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatus(c.id, "completed")}>
                          Selesai
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Buat Klaim */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Klaim Garansi</DialogTitle>
            <DialogDescription>Isi detail barang yang diklaim garansi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Detail Penjualan (sale_detail_id) <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.sale_detail_id} onChange={(e) => setForm({ ...form, sale_detail_id: e.target.value })} placeholder="Lihat di halaman Garansi" />
            </div>
            <div className="space-y-1.5">
              <Label>Item ID <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })} placeholder="ID barang" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tanggal Klaim <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.claim_date} onChange={(e) => setForm({ ...form, claim_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Biaya (Rp)</Label>
                <Input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi Kerusakan <span className="text-red-500">*</span></Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Jelaskan kerusakan / keluhan" />
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
