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
import { Loader, Plus, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { PurchaseOrderWithDetails, PaginatedResponse, Supplier, Item } from "@/lib/types/database";
import { formatCurrency } from "@/lib/format";
import { useLocale } from "@/lib/locales";

const ITEMS_PER_PAGE = 10;

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  sent: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
  partial: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
};

// Label pakai KEY locale — di-resolve via t() saat render
const statusLabels: Record<string, string> = {
  draft: "purchaseOrders.statusDraft",
  sent: "purchaseOrders.statusSent",
  partial: "purchaseOrders.statusPartial",
  received: "purchaseOrders.statusReceived",
  cancelled: "purchaseOrders.statusCancelled",
};

type POItemRow = { item_id: string; quantity: string; price: string };

export function PurchaseOrdersPage() {
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const [orders, setOrders] = useState<PurchaseOrderWithDetails[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplier_id: "",
    po_number: "",
    order_date: new Date().toISOString().slice(0, 10),
    expected_date: "",
    notes: "",
  });
  const [rows, setRows] = useState<POItemRow[]>([{ item_id: "", quantity: "1", price: "" }]);

  const fetchOrders = useCallback(async (page = currentPage) => {
    try {
      const res = await fetch(`/api/purchase-orders?page=${page}&limit=${ITEMS_PER_PAGE}`, { cache: "no-store" });
      const result = (await res.json()) as PaginatedResponse<PurchaseOrderWithDetails>;
      setOrders(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchOrders();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchOrders]);

  useEffect(() => {
    Promise.all([
      fetch("/api/suppliers?page=1&limit=500", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/items?page=1&limit=500", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([s, i]) => {
        setSuppliers(s?.data ?? []);
        setItems(i?.data ?? []);
      })
      .catch(() => {});
  }, []);

  function handleAddRow() {
    setRows((prev) => [...prev, { item_id: "", quantity: "1", price: "" }]);
  }

  function handleRowChange(idx: number, field: keyof POItemRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function handleRemoveRow(idx: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  const totalAmount = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.price) || 0), 0);

  async function handleSubmit() {
    if (!form.supplier_id || !form.po_number.trim()) {
      showToast(t("purchaseOrders.supplierRequired"), "error");
      return;
    }
    const details = rows
      .filter((r) => r.item_id)
      .map((r) => ({
        item_id: Number(r.item_id),
        quantity: Number(r.quantity) || 0,
        price: Number(r.price) || 0,
      }));
    if (details.length === 0) {
      showToast(t("purchaseOrders.minOneItem"), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: Number(form.supplier_id),
          po_number: form.po_number.trim(),
          order_date: form.order_date,
          expected_date: form.expected_date || null,
          notes: form.notes || null,
          details,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? t("purchaseOrders.createFailed"));
      }
      showToast(t("purchaseOrders.created"), "success");
      setDialogOpen(false);
      setForm({ supplier_id: "", po_number: "", order_date: new Date().toISOString().slice(0, 10), expected_date: "", notes: "" });
      setRows([{ item_id: "", quantity: "1", price: "" }]);
      setCurrentPage(1);
      await fetchOrders(1);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("purchaseOrders.createFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: number, status: string) {
    try {
      // Konfirmasi saat menerima barang — akan membuat transaksi pembelian + stok masuk
      if (status === "received") {
        const ok = confirm(t("purchaseOrders.receiveConfirm"));
        if (!ok) return;
      }
      const res = await fetch(`/api/purchase-orders?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { purchase?: { id: number; invoice_number: string } | null };
      if (status === "received" && json.purchase) {
        showToast(t("purchaseOrders.receivedWithPurchase", { invoice: json.purchase.invoice_number }), "success");
      } else {
        showToast(t("purchaseOrders.statusUpdated"), "success");
      }
      await fetchOrders();
    } catch {
      showToast(t("purchaseOrders.statusUpdateFailed"), "error");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t("purchaseOrders.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/purchase-orders?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(t("purchaseOrders.deleted"), "success");
      await fetchOrders();
    } catch {
      showToast(t("purchaseOrders.deleteFailed"), "error");
    }
  }

  return (
    <div className="space-y-6">
      <Navbar
        title={t("nav.purchaseOrders")}
        subtitle={t("purchaseOrders.subtitle")}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{t("purchaseOrders.count", { n: total })}</span>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> {t("purchaseOrders.create")}
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("purchaseOrders.noPo")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("masterData.supplier")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("purchaseOrders.poDate")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("purchaseOrders.expectedDate")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("purchaseOrders.items")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">{t("common.total")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("common.status")}</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-28">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center">
                  <Loader className="h-7 w-7 animate-spin text-sky-500 mx-auto" />
                </TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-16 text-center text-sm text-slate-400">
                  {t("purchaseOrders.noData")}
                </TableCell></TableRow>
              ) : (
                orders.map((po) => (
                  <TableRow key={po.id} className="border-slate-100 dark:border-slate-800">
                    <TableCell className="px-5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{po.po_number}</p>
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-600 dark:text-slate-300">{po.supplier?.name ?? "—"}</TableCell>
                    <TableCell className="px-5 text-sm text-slate-500">{new Date(po.order_date).toLocaleDateString(locale)}</TableCell>
                    <TableCell className="px-5 text-sm text-slate-500">
                      {po.expected_date ? new Date(po.expected_date).toLocaleDateString(locale) : "—"}
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-500">{t("purchaseOrders.itemCount", { n: po.details?.length ?? 0 })}</TableCell>
                    <TableCell className="px-5 text-right text-sm font-mono text-slate-700 dark:text-slate-200">
                      {formatCurrency(Number(po.total_amount))}
                    </TableCell>
                    <TableCell className="px-5">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border ${statusStyles[po.status] ?? ""}`}>
                        {statusLabels[po.status] ? t(statusLabels[po.status]) : po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5">
                      <div className="flex gap-1 justify-center">
                        {po.status === "draft" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatus(po.id, "sent")}>
                              {t("purchaseOrders.send")}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500 p-0" onClick={() => handleDelete(po.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {po.status === "sent" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatus(po.id, "received")}>
                            {t("purchaseOrders.receive")}
                          </Button>
                        )}
                        {(po.status === "received" || po.status === "cancelled") && <span className="text-xs text-slate-400">—</span>}
                      </div>
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

      {/* Dialog Buat PO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-500" />
              <div>
                <DialogTitle>{t("purchaseOrders.createTitle")}</DialogTitle>
                <DialogDescription>{t("purchaseOrders.createDesc")}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("masterData.supplier")} <span className="text-red-500">*</span></Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t("purchaseOrders.selectSupplier")} /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("purchaseOrders.noPo")} <span className="text-red-500">*</span></Label>
                <Input value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} placeholder={t("purchaseOrders.poNumberPlaceholder")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("purchaseOrders.orderDate")} <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("purchaseOrders.expectedArrival")}</Label>
                <Input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
              </div>
            </div>

            {/* Item rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t("purchaseOrders.items")} <span className="text-red-500">*</span></Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddRow} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {t("purchaseOrders.addItem")}
                </Button>
              </div>
              {rows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select value={row.item_id} onValueChange={(v) => handleRowChange(idx, "item_id", v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={t("purchaseOrders.selectItemPlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      {items.map((it) => (
                        <SelectItem key={it.id} value={String(it.id)}>
                          {it.name}{it.sku ? ` (${it.sku})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => handleRowChange(idx, "quantity", e.target.value)}
                    placeholder={t("transactions.qty")}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={row.price}
                    onChange={(e) => handleRowChange(idx, "price", e.target.value)}
                    placeholder={t("transactions.price")}
                    className="w-28"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0" onClick={() => handleRemoveRow(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-end text-sm pt-1">
                <span className="text-slate-500 mr-2">{t("common.total")}:</span>
                <span className="font-semibold font-mono">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("masterData.notes")}</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("purchaseOrders.notesOptionalPlaceholder")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving && <Loader className="h-4 w-4 animate-spin" />} {t("purchaseOrders.savePo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
