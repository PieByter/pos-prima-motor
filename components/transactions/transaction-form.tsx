"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  User,
  Wrench,
  CalendarDays,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type TransactionType } from "@/lib/data/transactions";
import { dummyItems, formatRupiah } from "@/lib/data/items";
import { dummyUsers } from "@/lib/data/users";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FormLineItem = {
  key: number; // unique key for React list rendering
  itemId: number | null;
  name: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  serviceFee: number;
  subtotal: number;
};

export type TransactionFormData = {
  customer: string;
  mechanicId: number | null;
  date: string;
  items: FormLineItem[];
  notes: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let nextKey = 100;
function newKey() {
  return nextKey++;
}

function emptyLine(): FormLineItem {
  return {
    key: newKey(),
    itemId: null,
    name: "",
    qty: 1,
    unitPrice: 0,
    discountPercent: 0,
    serviceFee: 0,
    subtotal: 0,
  };
}

function calcSubtotal(line: FormLineItem) {
  const itemTotal = line.unitPrice * line.qty;
  const discountAmount = itemTotal * (line.discountPercent / 100);
  return itemTotal - discountAmount + line.serviceFee;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function generateTrxId() {
  return `TRX-${Math.floor(10000 + Math.random() * 90000)}`;
}

const mechanics = dummyUsers.filter((u) => u.role === "Mekanik");

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TransactionFormProps {
  type: TransactionType;
  /** If provided, form is in edit mode */
  initialData?: TransactionFormData;
  /** Pre-set transaction ID (edit) */
  transactionId?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TransactionForm({
  type,
  initialData,
  transactionId,
}: TransactionFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const isSale = type === "sale";
  const trxId = transactionId ?? generateTrxId();

  /* ---- state ---- */
  const [customer, setCustomer] = useState(initialData?.customer ?? "");
  const [mechanicId, setMechanicId] = useState<string>(
    initialData?.mechanicId?.toString() ?? ""
  );
  const [date, setDate] = useState(initialData?.date ?? todayISO());
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [lines, setLines] = useState<FormLineItem[]>(
    initialData?.items?.length ? initialData.items : [emptyLine()]
  );

  /* ---- derived totals ---- */
  const totals = useMemo(() => {
    let itemsSubtotal = 0;
    let serviceFees = 0;
    let totalDiscount = 0;

    for (const l of lines) {
      const itemTotal = l.unitPrice * l.qty;
      const disc = itemTotal * (l.discountPercent / 100);
      itemsSubtotal += itemTotal;
      serviceFees += l.serviceFee;
      totalDiscount += disc;
    }

    const beforeTax = itemsSubtotal + serviceFees - totalDiscount;
    const taxRate = 0.11; // PPN 11%
    const tax = Math.round(beforeTax * taxRate);
    const grandTotal = beforeTax + tax;

    return { itemsSubtotal, serviceFees, totalDiscount, taxRate, tax, grandTotal };
  }, [lines]);

  /* ---- line helpers ---- */
  const updateLine = useCallback(
    (key: number, patch: Partial<FormLineItem>) => {
      setLines((prev) =>
        prev.map((l) => {
          if (l.key !== key) return l;
          const updated = { ...l, ...patch };
          updated.subtotal = calcSubtotal(updated);
          return updated;
        })
      );
    },
    []
  );

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, emptyLine()]);
  }, []);

  const removeLine = useCallback((key: number) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.key !== key);
      return next.length > 0 ? next : [emptyLine()];
    });
  }, []);

  const selectItem = useCallback(
    (key: number, itemId: string) => {
      const item = dummyItems.find((i) => i.id === Number(itemId));
      if (!item) return;
      updateLine(key, {
        itemId: item.id,
        name: item.name,
        unitPrice: isSale ? item.sellingPrice : item.purchasePrice,
        serviceFee: isSale ? item.serviceFee : 0,
      });
    },
    [updateLine, isSale]
  );

  /* ---- handlers ---- */
  const backHref = isSale
    ? "/dashboard/transactions/sales"
    : "/dashboard/transactions/purchases";

  const handleSave = () => {
    // In a real app, this would call an API to save the transaction
    alert(
      `${isEdit ? "Updated" : "Created"} ${isSale ? "sale" : "purchase"} transaction!\n\nCustomer: ${customer}\nItems: ${lines.length}\nTotal: ${formatRupiah(totals.grandTotal)}`
    );
    router.push(backHref);
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {isEdit ? "Edit Transaksi" : "Buat Transaksi Baru"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isSale
                ? "Catat penjualan sparepart & jasa service."
                : "Catat pembelian barang dari supplier."}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
            <Hash className="h-4 w-4" />
            {trxId}
          </span>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Top Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Customer / Supplier */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isSale ? "Customer" : "Supplier"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={
                      isSale
                        ? "Cari nama customer..."
                        : "Cari nama supplier..."
                    }
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-500 hover:text-sky-600"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Mechanic (sale only) */}
              {isSale ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mekanik Ditugaskan
                  </label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                    <Select value={mechanicId} onValueChange={setMechanicId}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Pilih mekanik..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mechanics.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div /> /* spacer */
              )}

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tanggal Transaksi
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-slate-700" />

            {/* Items Table */}
            <div className="overflow-x-auto -mx-6">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[30%]">
                      Item / Service
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                      Harga (Rp)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">
                      Diskon (%)
                    </th>
                    {isSale && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                        Jasa (Rp)
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {lines.map((line) => (
                    <tr
                      key={line.key}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      {/* Item picker */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <Select
                            value={line.itemId?.toString() ?? ""}
                            onValueChange={(val) => selectItem(line.key, val)}
                          >
                            <SelectTrigger className="pl-9 text-left">
                              <SelectValue placeholder="Cari item..." />
                            </SelectTrigger>
                            <SelectContent>
                              {dummyItems.map((item) => (
                                <SelectItem
                                  key={item.id}
                                  value={item.id.toString()}
                                >
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  <span className="ml-2 text-xs text-slate-400">
                                    {item.sku}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(e) =>
                            updateLine(line.key, {
                              qty: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="text-center w-20"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLine(line.key, {
                              unitPrice: Number(e.target.value),
                            })
                          }
                          className="text-right"
                        />
                      </td>

                      {/* Discount % */}
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={line.discountPercent}
                          onChange={(e) =>
                            updateLine(line.key, {
                              discountPercent: Math.min(
                                100,
                                Math.max(0, Number(e.target.value))
                              ),
                            })
                          }
                          className="text-center w-20"
                        />
                      </td>

                      {/* Service Fee (sale only) */}
                      {isSale && (
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            value={line.serviceFee}
                            onChange={(e) =>
                              updateLine(line.key, {
                                serviceFee: Number(e.target.value),
                              })
                            }
                            className="text-right"
                          />
                        </td>
                      )}

                      {/* Subtotal */}
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatRupiah(calcSubtotal(line))}
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Row */}
            <Button
              type="button"
              variant="outline"
              onClick={addLine}
              className="gap-2 border-dashed text-slate-600 dark:text-slate-300"
            >
              <Plus className="h-4 w-4 text-sky-500" />
              Tambah Baris Item
            </Button>

            {/* Notes + Totals */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              {/* Notes */}
              <div className="w-full sm:w-1/2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Catatan Transaksi
                </label>
                <Textarea
                  placeholder="Instruksi khusus atau detail garansi..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="w-full sm:w-5/12 lg:w-1/3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Subtotal (Items):</span>
                  <span>{formatRupiah(totals.itemsSubtotal)}</span>
                </div>
                {isSale && (
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Biaya Jasa:</span>
                    <span>{formatRupiah(totals.serviceFees)}</span>
                  </div>
                )}
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                    <span>Total Diskon:</span>
                    <span>- {formatRupiah(totals.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span>
                    Pajak ({Math.round(totals.taxRate * 100)}%):
                  </span>
                  <span>{formatRupiah(totals.tax)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    TOTAL
                  </span>
                  <span className="text-2xl font-bold text-sky-500">
                    {formatRupiah(totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(backHref)}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="bg-sky-500 hover:bg-sky-600 text-white px-6"
                onClick={handleSave}
              >
                {isEdit
                  ? isSale
                    ? "Simpan Penjualan"
                    : "Simpan Pembelian"
                  : isSale
                    ? "Buat Penjualan"
                    : "Buat Pembelian"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
