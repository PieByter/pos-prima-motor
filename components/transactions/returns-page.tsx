"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/toast-provider";
import { Loader2, Plus, CheckCircle2, XCircle } from "lucide-react";

type ReturnItem = {
  id: number;
  return_date: string;
  reason: string;
  total_refund: number;
  status: string;
  created_at: string;
  sales?: { invoice_number: string } | null;
  purchases?: { invoice_number: string } | null;
};

type TransactionOption = {
  id: number;
  invoice_number: string;
  total_amount: number;
  date?: string;
};

type DetailItem = {
  item_id: number;
  quantity: number;
  refund_unit: number;
  name: string;
  sku?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processed: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processed: "Diproses",
  rejected: "Ditolak",
};

export function ReturnsPage({ type }: { type: "sales" | "purchases" }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const apiPath = type === "sales" ? "/api/returns/sales" : "/api/returns/purchases";
  const trxPath = type === "sales" ? "/api/sales" : "/api/purchases";
  const isSale = type === "sales";

  // Options transaksi (completed)
  const [transactions, setTransactions] = useState<TransactionOption[]>([]);
  const [selectedTrxId, setSelectedTrxId] = useState("");
  const [details, setDetails] = useState<DetailItem[]>([]);
  const [reason, setReason] = useState("");
  const [itemsLoading, setItemsLoading] = useState(false);
  const [qtyMap, setQtyMap] = useState<Record<number, number>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(apiPath, { cache: "no-store" });
      if (res.ok) setItems(await res.json());
    } catch { /* empty */ } finally {
      setIsLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchData]);

  // Load transaksi untuk dropdown (hanya completed)
  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetch(`${trxPath}?status=completed&limit=100`, { cache: "no-store" })
        .then((r) => r.json())
        .then((json) => {
          const rows = json?.data ?? [];
          setTransactions(
            rows.map((r: { id: number; invoice_number: string; total_amount: number | string; sale_date?: string; purchase_date?: string }) => ({
              id: r.id,
              invoice_number: r.invoice_number,
              total_amount: Number(r.total_amount ?? 0),
              date: r.sale_date ?? r.purchase_date,
            })),
          );
        })
        .catch(() => {});
    }, 0);
    return () => window.clearTimeout(t);
  }, [trxPath]);

  // Saat transaksi dipilih → load detail items
  const handleTrxChange = async (value: string) => {
    setSelectedTrxId(value);
    setDetails([]);
    setQtyMap({});
    if (!value) return;
    setItemsLoading(true);
    try {
      const res = await fetch(`${trxPath}/${value}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat detail");
      const trx = await res.json();
      const rows = (trx.details ?? []) as {
        item_id: number;
        quantity: number;
        final_price?: number | string;
        price?: number | string;
        subtotal?: number | string;
        item?: { name?: string; sku?: string | null } | null;
      }[];
      const mapped = rows.map((d) => {
        const qty = Number(d.quantity ?? 1);
        // Refund per unit: harga jual final (sales) atau harga beli (purchases)
        const totalLine = isSale
          ? Number(d.final_price ?? d.subtotal ?? 0)
          : Number(d.price ?? d.subtotal ?? 0);
        return {
          item_id: d.item_id,
          quantity: qty,
          refund_unit: qty > 0 ? totalLine / qty : 0,
          name: d.item?.name ?? `Item #${d.item_id}`,
          sku: d.item?.sku ?? null,
        };
      });
      setDetails(mapped);
      // Reset qty retur = 1 untuk semua item
      const next: Record<number, number> = {};
      for (const d of mapped) next[d.item_id] = 1;
      setQtyMap(next);
    } catch {
      showToast("Gagal memuat detail transaksi", "error");
    } finally {
      setItemsLoading(false);
    }
  };

  const setQty = (itemId: number, qty: number) => {
    const d = details.find((x) => x.item_id === itemId);
    if (!d) return;
    setQtyMap((prev) => ({ ...prev, [itemId]: Math.min(Math.max(1, qty), d.quantity) }));
  };

  const totalRefund = details.reduce((sum, d) => sum + d.refund_unit * (qtyMap[d.item_id] ?? 1), 0);

  const openDialog = () => {
    setDialogOpen(true);
    setSelectedTrxId("");
    setDetails([]);
    setReason("");
    setQtyMap({});
  };

  const handleSubmit = async () => {
    if (!selectedTrxId || details.length === 0) {
      showToast("Pilih transaksi terlebih dahulu", "error");
      return;
    }
    if (!reason.trim()) {
      showToast("Alasan retur wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const trxId = Number(selectedTrxId);
      const header = {
        [isSale ? "sale_id" : "purchase_id"]: trxId,
        reason: reason.trim(),
        total_refund: totalRefund,
      };
      const detailRows = details.map((d) => ({
        item_id: d.item_id,
        quantity: qtyMap[d.item_id] ?? 1,
        refund_amount: (d.refund_unit * (qtyMap[d.item_id] ?? 1)),
      }));

      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, details: detailRows }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Gagal membuat retur");
      }
      showToast("Retur berhasil dibuat", "success");
      setDialogOpen(false);
      await fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal membuat retur", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: number, status: "processed" | "rejected") => {
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal update status");
      showToast(status === "processed" ? "Retur diproses" : "Retur ditolak", "success");
      await fetchData();
    } catch {
      showToast("Gagal update status", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + tombol */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} retur</p>
        <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={openDialog}>
          <Plus className="h-4 w-4" /> Buat Retur
        </Button>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-white dark:bg-slate-800">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            Belum ada retur {isSale ? "penjualan" : "pembelian"}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Alasan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Refund</th>
                  <th className="px-4 py-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      {(isSale ? item.sales?.invoice_number : item.purchases?.invoice_number) ?? "-"}
                    </td>
                    <td className="px-4 py-3">{item.return_date}</td>
                    <td className="px-4 py-3 max-w-48 truncate">{item.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status] || ""}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(item.total_refund))}</td>
                    <td className="px-4 py-3">
                      {item.status === "pending" ? (
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600" onClick={() => handleStatus(item.id, "processed")}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Proses
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500" onClick={() => handleStatus(item.id, "rejected")}>
                            <XCircle className="h-3.5 w-3.5" /> Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 text-center block">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog Buat Retur */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Retur {isSale ? "Penjualan" : "Pembelian"}</DialogTitle>
            <DialogDescription>
              Pilih transaksi dan barang yang diretur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Transaksi <span className="text-red-500">*</span></Label>
              <Select value={selectedTrxId} onValueChange={handleTrxChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih invoice..." />
                </SelectTrigger>
                <SelectContent>
                  {transactions.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.invoice_number} · {formatCurrency(t.total_amount)}
                      {t.date ? ` · ${t.date}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {itemsLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              </div>
            )}

            {!itemsLoading && details.length > 0 && (
              <div className="space-y-2">
                <Label>Items <span className="text-red-500">*</span></Label>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {details.map((d) => (
                    <div key={d.item_id} className="flex items-center gap-3 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <p className="text-xs text-slate-400">
                          {formatCurrency(d.refund_unit)}/pcs · stok dibeli {d.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          max={d.quantity}
                          value={qtyMap[d.item_id] ?? 1}
                          onChange={(e) => setQty(d.item_id, Number(e.target.value) || 1)}
                          className="w-16 h-8 text-sm text-right"
                        />
                        <span className="text-xs text-slate-400">pcs</span>
                      </div>
                      <p className="text-sm font-semibold w-24 text-right">
                        {formatCurrency(d.refund_unit * (qtyMap[d.item_id] ?? 1))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Alasan Retur <span className="text-red-500">*</span></Label>
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isSale ? "Contoh: barang rusak, ukuran salah..." : "Contoh: barang cacat dari supplier..."}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
              <span className="text-sm text-slate-500">Total Refund</span>
              <span className="text-base font-bold text-red-600">{formatCurrency(totalRefund)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-sky-500 hover:bg-sky-600">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Retur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
