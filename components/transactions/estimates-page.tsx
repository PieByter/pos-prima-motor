"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/toast-provider";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRightToLine,
  Eye,
} from "lucide-react";
import type { Estimate, EstimateWithDetails, PaginatedResponse } from "@/lib/types/database";
import { formatRupiah } from "@/lib/data/items";
import { useLocale } from "@/lib/locales";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ITEMS_PER_PAGE = 10;

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: "estimates.statusDraft", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  sent: { label: "estimates.statusSent", cls: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400" },
  approved: { label: "estimates.statusApproved", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  converted: { label: "estimates.statusConverted", cls: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400" },
  cancelled: { label: "estimates.statusCancelled", cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
};

type EstimateRow = Estimate & {
  customer?: { id: number; name: string; phone: string | null } | null;
  vehicle?: { id: number; plate_number: string; brand: string | null; model: string | null } | null;
};

type LineItem = {
  item_id: string;
  name: string;
  type: "part" | "service";
  quantity: string;
  price: string;
};

type CustomerOption = { id: number; name: string; phone: string | null };
type VehicleOption = { id: number; plate_number: string; brand: string | null; model: string | null; customer_id: number };

export function EstimatesPage() {
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);
  const [detailEstimate, setDetailEstimate] = useState<EstimateWithDetails | null>(null);
  const [convertTarget, setConvertTarget] = useState<EstimateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EstimateRow | null>(null);

  const [form, setForm] = useState({
    customer_id: "",
    vehicle_id: "",
    description: "",
    notes: "",
    items: [] as LineItem[],
  });

  const fetchEstimates = useCallback(async (page = currentPage, status = statusFilter) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(ITEMS_PER_PAGE));
      if (status !== "all") params.append("status", status);
      const res = await fetch(`/api/estimates?${params}`, { cache: "no-store" });
      const result = (await res.json()) as PaginatedResponse<EstimateRow>;
      setEstimates(result.data ?? []);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      setEstimates([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEstimates();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchEstimates]);

  useEffect(() => {
    if (!dialogOpen) return;
    const timer = window.setTimeout(() => {
      void Promise.all([
        fetch("/api/customers?limit=500", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/vehicles?limit=500", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/items?limit=500", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([c, v, it]) => {
          const cl = Array.isArray(c) ? c : (c as { data?: CustomerOption[] }).data ?? [];
          setCustomers(cl);
          setVehicles(Array.isArray(v) ? v : []);
          const il = Array.isArray(it) ? it : (it as { data?: { id: number; name: string }[] }).data ?? [];
          setItems(il);
        })
        .catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dialogOpen]);

  function addLine() {
    setForm((f) => ({
      ...f,
      items: [...f.items, { item_id: "", name: "", type: "part", quantity: "1", price: "" }],
    }));
  }

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setForm((f) => {
      const items = f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
      return { ...f, items };
    });
  }

  function removeLine(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit() {
    if (form.items.length === 0 || form.items.some((it) => !it.name.trim() || !it.price)) {
      showToast(t("estimates.requireItems"), "error");
      return;
    }
    setSaving(true);
    try {
      const items = form.items.map((it) => ({
        item_id: it.item_id ? Number(it.item_id) : null,
        name: it.name.trim(),
        type: it.type,
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
      }));
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: form.customer_id ? Number(form.customer_id) : null,
          vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
          description: form.description || null,
          notes: form.notes || null,
          items,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t("estimates.saveFailed"));
      showToast(t("estimates.saved"), "success");
      setDialogOpen(false);
      setForm({ customer_id: "", vehicle_id: "", description: "", notes: "", items: [] });
      await fetchEstimates(1, statusFilter);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("estimates.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/estimates?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed");
      showToast(t("estimates.statusUpdated"), "success");
      await fetchEstimates();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("estimates.saveFailed"), "error");
    }
  }

  async function performConvert(id: number) {
    try {
      const res = await fetch("/api/estimates/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t("estimates.convertFailed"));
      showToast(t("estimates.converted", { inv: json.sale?.invoice_number ?? "" }), "success");
      await fetchEstimates();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("estimates.convertFailed"), "error");
      throw new Error("Convert failed");
    }
  }

  async function performDelete(id: number) {
    try {
      const res = await fetch(`/api/estimates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(t("estimates.deleted"), "success");
      await fetchEstimates();
    } catch {
      showToast(t("estimates.deleteFailed"), "error");
      throw new Error("Delete failed");
    }
  }

  async function handleView(id: number) {
    try {
      const res = await fetch(`/api/estimates?id=${id}`, { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as EstimateWithDetails;
        setDetailEstimate(json);
      }
    } catch { /* ignore */ }
  }

  const filteredVehicles = form.customer_id
    ? vehicles.filter((v) => v.customer_id === Number(form.customer_id))
    : vehicles;

  return (
    <div className="space-y-6">
      <Navbar title={t("nav.estimates")} subtitle={t("estimates.subtitle")} />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder={t("common.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="draft">{t("estimates.statusDraft")}</SelectItem>
            <SelectItem value="sent">{t("estimates.statusSent")}</SelectItem>
            <SelectItem value="approved">{t("estimates.statusApproved")}</SelectItem>
            <SelectItem value="converted">{t("estimates.statusConverted")}</SelectItem>
            <SelectItem value="cancelled">{t("estimates.statusCancelled")}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> {t("estimates.create")}
        </Button>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-800">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader className="h-7 w-7 animate-spin text-sky-500" />
          </div>
        ) : estimates.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">{t("estimates.noData")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3">{t("estimates.number")}</th>
                  <th className="px-4 py-3">{t("masterData.customer")}</th>
                  <th className="px-4 py-3">{t("transactions.vehicleLabel")}</th>
                  <th className="px-4 py-3 text-right">{t("common.total")}</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                  <th className="px-4 py-3">{t("estimates.date")}</th>
                  <th className="px-4 py-3 text-center w-40">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {estimates.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">{e.estimate_number}</td>
                    <td className="px-4 py-3 font-medium">{e.customer?.name ?? t("dashboard.walkInCustomer")}</td>
                    <td className="px-4 py-3 text-slate-500">{e.vehicle?.plate_number ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatRupiah(e.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[e.status].cls}`}>
                        {t(STATUS_META[e.status].label)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(e.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400" title={t("common.preview")} onClick={() => handleView(e.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {e.status === "draft" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-sky-600" onClick={() => handleStatus(e.id, "sent")}>
                              <Send className="h-3 w-3" /> {t("estimates.send")}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" title={t("estimates.delete")} onClick={() => setDeleteTarget(e)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {e.status === "sent" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600" onClick={() => handleStatus(e.id, "approved")}>
                              <CheckCircle2 className="h-3 w-3" /> {t("estimates.approve")}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" title={t("estimates.cancel")} onClick={() => handleStatus(e.id, "cancelled")}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {e.status === "approved" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-violet-600" onClick={() => setConvertTarget(e)}>
                              <ArrowRightToLine className="h-3 w-3" /> {t("estimates.convert")}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" title={t("estimates.cancel")} onClick={() => handleStatus(e.id, "cancelled")}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-slate-500">{t("inventory.pageInfo", { page: currentPage, total: totalPages })}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                {t("inventory.prev")}
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                {t("inventory.next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog Buat Estimasi ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("estimates.createTitle")}</DialogTitle>
            <DialogDescription>{t("estimates.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("masterData.customer")}</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v, vehicle_id: "" })}>
                  <SelectTrigger><SelectValue placeholder={t("estimates.selectCustomer")} /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("transactions.vehicleLabel")}</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t("estimates.selectVehicle")} /></SelectTrigger>
                  <SelectContent>
                    {filteredVehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.plate_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("estimates.description")}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("estimates.descriptionPlaceholder")} />
            </div>

            {/* Baris item */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("estimates.items")}</Label>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addLine}>
                  <Plus className="h-3.5 w-3.5" /> {t("estimates.addItem")}
                </Button>
              </div>
              {form.items.map((it, idx) => (
                <div key={idx} className="space-y-1.5 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                  <div className="flex gap-2">
                    <Select value={it.type} onValueChange={(v) => updateLine(idx, { type: v as "part" | "service", item_id: "" })}>
                      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="part">{t("estimates.typePart")}</SelectItem>
                        <SelectItem value="service">{t("estimates.typeService")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto text-red-400" onClick={() => removeLine(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {it.type === "part" && (
                    <Select value={it.item_id} onValueChange={(v) => updateLine(idx, { item_id: v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder={t("estimates.selectItem")} /></SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input value={it.name} onChange={(e) => updateLine(idx, { name: e.target.value })} placeholder={it.type === "service" ? t("estimates.serviceNamePlaceholder") : t("masterData.itemName")} className="h-8" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" min="1" value={it.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} placeholder={t("transactions.qty")} className="h-8" />
                    <Input type="number" min="0" value={it.price} onChange={(e) => updateLine(idx, { price: e.target.value })} placeholder={t("transactions.price")} className="h-8" />
                  </div>
                </div>
              ))}
              {form.items.length === 0 && (
                <p className="text-xs text-slate-400">{t("estimates.noLinesYet")}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("masterData.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("estimates.notesPlaceholder")} rows={2} />
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

      {/* ── Dialog Detail ── */}
      <Dialog open={!!detailEstimate} onOpenChange={(o) => { if (!o) setDetailEstimate(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{detailEstimate?.estimate_number}</DialogTitle>
            <DialogDescription>
              {detailEstimate?.customer?.name}
              {detailEstimate?.vehicle ? ` · ${detailEstimate.vehicle.plate_number}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailEstimate && (
            <div className="space-y-3 pt-1">
              {detailEstimate.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300">{detailEstimate.description}</p>
              )}
              <div className="space-y-1.5">
                {(detailEstimate.items ?? []).map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      <Badge variant="secondary" className="mr-2 text-[10px]">
                        {it.type === "service" ? t("estimates.typeService") : t("estimates.typePart")}
                      </Badge>
                      {it.name} <span className="text-xs text-slate-400">×{it.quantity}</span>
                    </span>
                    <span className="font-mono text-xs shrink-0">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-sm font-medium">{t("common.total")}</span>
                <span className="text-sm font-bold">{formatRupiah(detailEstimate.total_amount)}</span>
              </div>
              {detailEstimate.notes && (
                <p className="text-xs text-slate-400">{detailEstimate.notes}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailEstimate(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Konfirmasi Convert ── */}
      <ConfirmDialog
        open={convertTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConvertTarget(null);
        }}
        title={t("estimates.convertConfirm")}
        description={convertTarget ? convertTarget.estimate_number : undefined}
        confirmLabel={t("estimates.convert")}
        onConfirm={() => {
          if (convertTarget) return performConvert(convertTarget.id);
        }}
      />

      {/* ── Dialog Konfirmasi Hapus ── */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("estimates.deleteConfirm")}
        description={deleteTarget ? deleteTarget.estimate_number : undefined}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (deleteTarget) return performDelete(deleteTarget.id);
        }}
      />
    </div>
  );
}
