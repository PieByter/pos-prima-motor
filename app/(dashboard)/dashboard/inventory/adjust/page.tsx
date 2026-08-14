"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/toast-provider";
import { Loader2, Package, Plus, Minus, Search } from "lucide-react";

type ItemOption = { id: number; name: string; sku: string | null; current_stock: number };

export default function StockAdjustmentPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ItemOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [qty, setQty] = useState("1");
  const [reasonType, setReasonType] = useState<string>("other");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/items?page=1&limit=500", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const rows = json?.data ?? [];
        setItems(rows);
      })
      .catch(() => {});
  }, []);

  const selectedItem = items.find((i) => i.id.toString() === selectedItemId);
  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedItemId || !qty || Number(qty) < 1) return;
    if (type === "OUT" && selectedItem && Number(qty) > selectedItem.current_stock) {
      showToast("Stok tidak mencukupi", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: Number(selectedItemId),
          type,
          quantity: Number(qty),
          reason: reasonType,
          notes: reason || null,
        }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast(`Stok berhasil diupdate (+${type === "IN" ? Number(qty) : -Number(qty)})`, "success");
      setSelectedItemId("");
      setQty("1");
      setReason("");
      setReasonType("other");
      // Refresh items
      const refresh = await fetch("/api/items?page=1&limit=500", { cache: "no-store" });
      const json = await refresh.json();
      setItems(json?.data ?? []);
    } catch {
      showToast("Gagal mengupdate stok", "error");
    } finally {
      setSaving(false);
    }
  }, [selectedItemId, type, qty, reason, reasonType, selectedItem, showToast]);

  return (
    <>
      <Navbar title="Adjustment Stok" subtitle="Catat stok masuk/keluar manual tanpa PO." />
      <div className="max-w-xl space-y-5">
        {/* Search Item */}
        <div className="rounded-xl border bg-white p-5 dark:bg-slate-800">
          <Label className="text-sm font-medium mb-2 block">Pilih Item</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-2 text-center">Item tidak ditemukan</p>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id.toString());
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedItemId === item.id.toString()
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  }`}
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {item.sku && <span className="ml-2 text-xs text-slate-400">{item.sku}</span>}
                  </div>
                  <span className={`text-xs font-semibold ${
                    item.current_stock <= 5 ? "text-red-500" : "text-slate-500"
                  }`}>
                    Stok: {item.current_stock}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedItem && (
          <div className="rounded-xl border bg-white p-5 dark:bg-slate-800 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
                <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedItem.name}</p>
                <p className="text-xs text-slate-400">SKU: {selectedItem.sku ?? "-"} | Stok saat ini: <strong>{selectedItem.current_stock}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tipe</Label>
                <Select value={type} onValueChange={(v) => setType(v as "IN" | "OUT")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">
                      <span className="flex items-center gap-2"><Plus className="h-4 w-4 text-emerald-500" /> Stok Masuk</span>
                    </SelectItem>
                    <SelectItem value="OUT">
                      <span className="flex items-center gap-2"><Minus className="h-4 w-4 text-red-500" /> Stok Keluar</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Jumlah</Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Kategori Alasan</Label>
              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_in">Stok Masuk Manual</SelectItem>
                  <SelectItem value="count_fix">Stok Opname / Koreksi</SelectItem>
                  <SelectItem value="damaged">Barang Rusak</SelectItem>
                  <SelectItem value="lost">Barang Hilang</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Keterangan (opsional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Barang datang dari supplier, stok opname, dll."
                rows={2}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saving || !qty || Number(qty) < 1}
              className="w-full gap-2 bg-sky-500 hover:bg-sky-600"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {type === "IN" ? "Konfirmasi Stok Masuk" : "Konfirmasi Stok Keluar"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
