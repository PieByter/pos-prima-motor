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
import { Loader, ShieldAlert, ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import type { WarrantyClaimWithDetails, PaginatedResponse } from "@/lib/types/database";
import { formatCurrency } from "@/lib/format";
import { useLocale } from "@/lib/locales";

const ITEMS_PER_PAGE = 10;

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  approved: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
};

// Label pakai KEY locale — di-resolve via t() saat render
const statusLabels: Record<string, string> = {
  pending: "warrantyClaims.statusPending",
  approved: "warrantyClaims.statusApproved",
  rejected: "warrantyClaims.statusRejected",
  completed: "warrantyClaims.statusCompleted",
};

const resolutionLabels: Record<string, string> = {
  repair: "warrantyClaims.resolutionRepair",
  replace: "warrantyClaims.resolutionReplace",
  refund: "warrantyClaims.resolutionRefund",
  none: "warrantyClaims.resolutionNone",
};

/** Item garansi aktif dari /api/warranty (untuk dropdown) */
type WarrantyOption = {
  sale_detail_id: number;
  sale_id: number;
  invoice_number: string;
  item_id: number;
  item_name: string;
  sku: string | null;
  customer_name: string;
  warranty_until: string;
};

export function WarrantyClaimsPage() {
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const [claims, setClaims] = useState<WarrantyClaimWithDetails[]>([]);
  const [warrantyOptions, setWarrantyOptions] = useState<WarrantyOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyOption | null>(null);
  const [form, setForm] = useState({
    claim_date: new Date().toISOString().slice(0, 10),
    description: "",
    cost: "0",
    notes: "",
  });

  // Dialog proses klaim (setuju → resolution + cost)
  const [processDialog, setProcessDialog] = useState<WarrantyClaimWithDetails | null>(null);
  const [processForm, setProcessForm] = useState({
    resolution: "repair" as "repair" | "replace" | "refund" | "none",
    cost: "",
  });
  const [processing, setProcessing] = useState(false);

  const fetchClaims = useCallback(async (page = currentPage) => {
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
    const timer = window.setTimeout(() => {
      void fetchClaims();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchClaims]);

  // Load daftar garansi aktif untuk dropdown
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/warranty?status=active", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => setWarrantyOptions(Array.isArray(list) ? list : []))
        .catch(() => setWarrantyOptions([]));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit() {
    if (!selectedWarranty || !form.description.trim()) {
      showToast(t("warrantyClaims.claimRequire"), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/warranty-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_detail_id: selectedWarranty.sale_detail_id,
          item_id: selectedWarranty.item_id,
          claim_date: form.claim_date,
          description: form.description,
          cost: Number(form.cost || 0),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(t("warrantyClaims.claimCreated"), "success");
      setDialogOpen(false);
      setSelectedWarranty(null);
      setForm({ claim_date: new Date().toISOString().slice(0, 10), description: "", cost: "0", notes: "" });
      setCurrentPage(1);
      await fetchClaims(1);
    } catch {
      showToast(t("warrantyClaims.claimCreateFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  // Buka dialog proses (Setuju)
  function openProcessDialog(claim: WarrantyClaimWithDetails) {
    setProcessDialog(claim);
    setProcessForm({
      resolution: claim.resolution !== "none" ? claim.resolution : "repair",
      cost: claim.cost ? String(claim.cost) : "0",
    });
  }

  // Approve dengan resolution + cost
  async function handleApprove() {
    if (!processDialog) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/warranty-claims?id=${processDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          resolution: processForm.resolution,
          cost: Number(processForm.cost || 0),
          resolved_date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(t("warrantyClaims.claimApproved"), "success");
      setProcessDialog(null);
      await fetchClaims();
    } catch {
      showToast(t("warrantyClaims.statusUpdateFailed"), "error");
    } finally {
      setProcessing(false);
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
      if (!res.ok) throw new Error("Failed");
      showToast(status === "completed" ? t("warrantyClaims.claimCompleted") : t("warrantyClaims.claimRejected"), "success");
      await fetchClaims();
    } catch {
      showToast(t("warrantyClaims.statusUpdateFailed"), "error");
    }
  }

  return (
    <div className="space-y-6">
      <Navbar
        title={t("nav.warrantyClaims")}
        subtitle={t("warrantyClaims.subtitle")}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("masterData.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("masterData.allStatuses")}</SelectItem>
              <SelectItem value="pending">{t("warrantyClaims.statusPending")}</SelectItem>
              <SelectItem value="approved">{t("warrantyClaims.statusApproved")}</SelectItem>
              <SelectItem value="rejected">{t("warrantyClaims.statusRejected")}</SelectItem>
              <SelectItem value="completed">{t("warrantyClaims.statusCompleted")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">{t("warrantyClaims.claimCount", { n: total })}</span>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <ShieldAlert className="h-4 w-4" /> {t("warrantyClaims.createClaim")}
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("warrantyClaims.item")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("transactions.invoice")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("masterData.customer")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("warrantyClaims.claimDate")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("warrantyClaims.description")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">{t("warrantyClaims.cost")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("common.status")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-32">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center">
                  <Loader className="h-7 w-7 animate-spin text-sky-500 mx-auto" />
                </TableCell></TableRow>
              ) : claims.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center text-sm text-slate-400">
                  {t("warrantyClaims.noData")}
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
                      {new Date(c.claim_date).toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-500 dark:text-slate-400 max-w-48 truncate">
                      {c.description}
                    </TableCell>
                    <TableCell className="px-5 text-right text-sm font-mono text-slate-700 dark:text-slate-200">
                      {Number(c.cost) > 0 ? formatCurrency(Number(c.cost)) : "—"}
                    </TableCell>
                    <TableCell className="px-5">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border ${statusStyles[c.status] ?? ""}`}>
                        {statusLabels[c.status] ? t(statusLabels[c.status]) : c.status}
                      </Badge>
                      {c.resolution !== "none" && c.status === "approved" && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{resolutionLabels[c.resolution] ? t(resolutionLabels[c.resolution]) : c.resolution}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-5">
                      {c.status === "pending" ? (
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openProcessDialog(c)}>
                            <Wrench className="h-3.5 w-3.5" /> {t("warrantyClaims.process")}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => handleStatus(c.id, "rejected")}>
                            {t("warrantyClaims.reject")}
                          </Button>
                        </div>
                      ) : c.status === "approved" ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatus(c.id, "completed")}>
                          {t("warrantyClaims.statusCompleted")}
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
            <p className="text-xs text-slate-500">{t("inventory.pageInfo", { page: currentPage, total: totalPages })}</p>
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
            <DialogTitle>{t("warrantyClaims.createTitle")}</DialogTitle>
            <DialogDescription>{t("warrantyClaims.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("warrantyClaims.warrantyItem")} <span className="text-red-500">*</span></Label>
              <Select
                value={selectedWarranty ? String(selectedWarranty.sale_detail_id) : ""}
                onValueChange={(v) => {
                  const opt = warrantyOptions.find((w) => String(w.sale_detail_id) === v);
                  setSelectedWarranty(opt ?? null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("warrantyClaims.selectWarranty")} />
                </SelectTrigger>
                <SelectContent>
                  {warrantyOptions.length === 0 ? (
                    <SelectItem value="__none__" disabled>{t("warrantyClaims.noActiveWarranty")}</SelectItem>
                  ) : (
                    warrantyOptions.map((w) => (
                      <SelectItem key={w.sale_detail_id} value={String(w.sale_detail_id)}>
                        {w.item_name} · {w.invoice_number} · {w.customer_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedWarranty && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("warrantyClaims.skuUntil", { sku: selectedWarranty.sku ?? "-", date: selectedWarranty.warranty_until })}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("warrantyClaims.claimDate")} <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.claim_date} onChange={(e) => setForm({ ...form, claim_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("warrantyClaims.costLabel")}</Label>
                <Input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("warrantyClaims.damageDesc")} <span className="text-red-500">*</span></Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("warrantyClaims.damagePlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving && <Loader className="h-4 w-4 animate-spin" />} {t("settings.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Proses Klaim (Setuju → resolution + cost) */}
      <Dialog open={!!processDialog} onOpenChange={(o) => { if (!o) setProcessDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("warrantyClaims.processTitle")}</DialogTitle>
            <DialogDescription>
              {processDialog ? t("warrantyClaims.claimHash", { id: processDialog.id, item: processDialog.item?.name ?? "" }) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("warrantyClaims.resolution")} <span className="text-red-500">*</span></Label>
              <Select
                value={processForm.resolution}
                onValueChange={(v) => setProcessForm({ ...processForm, resolution: v as "repair" | "replace" | "refund" | "none" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("warrantyClaims.selectResolution")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repair">{t("warrantyClaims.resolutionRepairOpt")}</SelectItem>
                  <SelectItem value="replace">{t("warrantyClaims.resolutionReplaceOpt")}</SelectItem>
                  <SelectItem value="refund">{t("warrantyClaims.resolutionRefundOpt")}</SelectItem>
                  <SelectItem value="none">{t("warrantyClaims.resolutionNoneOpt")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Biaya (Rp)</Label>
              <Input
                type="number"
                min="0"
                value={processForm.cost}
                onChange={(e) => setProcessForm({ ...processForm, cost: e.target.value })}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("warrantyClaims.approveHint")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialog(null)} disabled={processing}>{t("common.cancel")}</Button>
            <Button onClick={handleApprove} disabled={processing} className="gap-2">
              {processing && <Loader className="h-4 w-4 animate-spin" />} {t("warrantyClaims.approveClaim")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
