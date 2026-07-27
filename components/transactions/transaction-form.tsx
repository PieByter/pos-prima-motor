"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  User,
  Wrench,
  CalendarDays,
  Hash,
  Loader2,
  Banknote,
  Wallet,
  CreditCard,
  Smartphone,
  Landmark,
  Barcode,
  ScanLine,
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
import { formatRupiah } from "@/lib/data/items";
import { CameraBarcodeScanner } from "@/components/transactions/camera-barcode-scanner";

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
  mechanicId: string | null;
  date: string;
  items: FormLineItem[];
  notes: string;
};

type ItemOption = {
  id: number;
  name: string;
  sku: string | null;
  purchase_price: number;
  selling_price: number;
  service_fee: number;
};

type MechanicOption = {
  id: string;
  name: string;
};

type CustomerOption = {
  id: number;
  name: string;
  phone: string | null;
};

type PaymentMethodOption = {
  id: number;
  name: string;
  icon: string | null;
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
  const [customerId, setCustomerId] = useState<string>("");
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<CustomerOption[]>([]);
  const [mechanicId, setMechanicId] = useState<string>(
    initialData?.mechanicId?.toString() ?? ""
  );
  const [date, setDate] = useState(initialData?.date ?? todayISO());
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [lines, setLines] = useState<FormLineItem[]>(
    initialData?.items?.length ? initialData.items : [emptyLine()]
  );
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [mechanicOptions, setMechanicOptions] = useState<MechanicOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeMsg, setBarcodeMsg] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      setIsOptionsLoading(true);
      try {
        const [itemsRes, usersRes, paymentRes, customersRes] = await Promise.all([
          fetch("/api/items?page=1&limit=200", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
          fetch("/api/payment-methods", { cache: "no-store" }),
          fetch(`/api/${isSale ? "customers" : "suppliers"}?limit=500`, { cache: "no-store" }),
        ]);

        if (itemsRes.ok) {
          const itemsJson = await itemsRes.json();
          setItemOptions((itemsJson?.data ?? []) as ItemOption[]);
        }

        if (usersRes.ok) {
          const usersJson = (await usersRes.json()) as Array<{
            id: string;
            name: string;
            role: "admin" | "mekanik";
          }>;

          const mechanics = usersJson
            .filter((u) => u.role === "mekanik")
            .map((u) => ({ id: u.id, name: u.name }));

          setMechanicOptions(mechanics);
        }

        if (paymentRes.ok) {
          const paymentData = (await paymentRes.json()) as PaymentMethodOption[];
          setPaymentMethods(paymentData);
          if (paymentData.length > 0) {
            setPaymentMethodId(paymentData[0].id.toString());
          }
        }

        if (customersRes.ok) {
          const custJson = await customersRes.json();
          const opts = (custJson?.data ?? []) as CustomerOption[];
          if (isSale) {
            setCustomerOptions(opts);
          } else {
            setSupplierOptions(opts);
          }
        }
      } catch (error) {
        console.error("Failed to load form options:", error);
      } finally {
        setIsOptionsLoading(false);
      }
    };

    loadOptions();
  }, []);

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

    const cash = Number(cashAmount) || 0;
    const changeAmount = cash >= grandTotal ? cash - grandTotal : 0;

    return { itemsSubtotal, serviceFees, totalDiscount, taxRate, tax, grandTotal, cashAmount: cash, changeAmount };
  }, [lines, cashAmount]);

  /* ---- payment method helpers ---- */
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id.toString() === paymentMethodId);
  const isCashPayment = selectedPaymentMethod?.name?.toLowerCase() === "tunai";

  const getPaymentIcon = (icon: string | null) => {
    switch (icon) {
      case "cash": return <Banknote className="h-4 w-4" />;
      case "qris": return <Smartphone className="h-4 w-4" />;
      case "bank": return <Landmark className="h-4 w-4" />;
      case "debit": return <CreditCard className="h-4 w-4" />;
      case "credit": return <CreditCard className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

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
      const item = itemOptions.find((i) => i.id === Number(itemId));
      if (!item) return;
      updateLine(key, {
        itemId: item.id,
        name: item.name,
        unitPrice: isSale ? item.selling_price : item.purchase_price,
        serviceFee: isSale ? item.service_fee : 0,
      });
    },
    [updateLine, isSale, itemOptions]
  );

  /* ---- barcode scanner ---- */
  const handleBarcode = useCallback(async (sku: string) => {
    if (!sku.trim()) return;
    setBarcodeMsg(null);
    try {
      // Search item by SKU via API
      const res = await fetch(`/api/items?search=${encodeURIComponent(sku.trim())}&limit=1`);
      if (!res.ok) {
        setBarcodeMsg(`Tidak ditemukan: ${sku}`);
        return;
      }
      const json = await res.json();
      const items = json?.data ?? [];
      if (items.length === 0) {
        setBarcodeMsg(`SKU tidak dikenal: ${sku}`);
        return;
      }
      const item = items[0];
      const newLine = {
        key: newKey(),
        itemId: item.id,
        name: item.name,
        qty: 1,
        unitPrice: isSale ? Number(item.selling_price) : Number(item.purchase_price),
        discountPercent: 0,
        serviceFee: isSale ? Number(item.service_fee) : 0,
        subtotal: isSale ? Number(item.selling_price) : Number(item.purchase_price),
      };
      setLines((prev) => {
        // Check if item already exists in list → increment qty
        const existing = prev.find((l) => l.itemId === item.id);
        if (existing) {
          return prev.map((l) =>
            l.key === existing.key ? { ...l, qty: l.qty + 1, subtotal: calcSubtotal({ ...l, qty: l.qty + 1 }) } : l
          );
        }
        return [...prev, newLine];
      });
      setBarcodeMsg(`✅ ${item.name} ditambahkan`);
      setTimeout(() => setBarcodeMsg(null), 2000);
    } catch {
      setBarcodeMsg("Gagal mencari item");
    }
  }, [isSale]);

  /* ---- handlers ---- */
  const backHref = isSale
    ? "/dashboard/transactions/sales"
    : "/dashboard/transactions/purchases";

  const handleSave = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (isSale) {
        // ── Submit sale to API ─────────────────────────────────────────
        const header = {
          customer_id: customerId ? Number(customerId) : null,
          mechanic_id: mechanicId || null,
          sale_date: date,
          total_amount: totals.grandTotal,
          status: "completed" as const,
          payment_method_id: paymentMethodId ? Number(paymentMethodId) : null,
          cash_amount: isCashPayment ? totals.cashAmount : null,
          change_amount: isCashPayment ? totals.changeAmount : null,
          notes: notes || null,
        };

        const details = lines
          .filter((l) => l.itemId != null)
          .map((l) => ({
            item_id: l.itemId!,
            quantity: l.qty,
            base_price: l.unitPrice,
            discount_amount: Math.round(l.unitPrice * l.qty * (l.discountPercent / 100)),
            final_price: l.unitPrice * l.qty - Math.round(l.unitPrice * l.qty * (l.discountPercent / 100)) + l.serviceFee,
            service_fee: l.serviceFee,
            subtotal: l.unitPrice * l.qty - Math.round(l.unitPrice * l.qty * (l.discountPercent / 100)) + l.serviceFee,
          }));

        const res = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ header, details }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? "Gagal menyimpan penjualan");
        }

        router.push(backHref);
        router.refresh();
      } else {
        // ── Submit purchase to API ─────────────────────────────────────
        const header = {
          supplier_id: customerId ? Number(customerId) : null,
          purchase_date: date,
          total_amount: totals.grandTotal,
          status: "completed" as const,
        };

        const details = lines
          .filter((l) => l.itemId != null)
          .map((l) => ({
            item_id: l.itemId!,
            quantity: l.qty,
            price: l.unitPrice,
            subtotal: l.unitPrice * l.qty,
          }));

        const res = await fetch("/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ header, details }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? "Gagal menyimpan pembelian");
        }

        router.push(backHref);
        router.refresh();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-row items-start justify-between gap-4">
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
            {isEdit ? trxId : "Auto-generate"}
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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                  {isSale ? (
                    <Select value={customerId} onValueChange={(val) => {
                      setCustomerId(val);
                      const cust = customerOptions.find((c) => c.id.toString() === val);
                      setCustomer(cust?.name ?? "");
                    }}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Cari customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customerOptions.length === 0 && (
                          <SelectItem value="-1" disabled>
                            Tidak ada customer
                          </SelectItem>
                        )}
                        {customerOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            <span className="font-medium">{c.name}</span>
                            {c.phone && (
                              <span className="ml-2 text-xs text-slate-400">
                                {c.phone}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={customerId} onValueChange={(val) => {
                      setCustomerId(val);
                      const sup = supplierOptions.find((s) => s.id.toString() === val);
                      setCustomer(sup?.name ?? "");
                    }}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Cari supplier..." />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierOptions.length === 0 && (
                          <SelectItem value="-1" disabled>
                            Tidak ada supplier
                          </SelectItem>
                        )}
                        {supplierOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            <span className="font-medium">{s.name}</span>
                            {s.phone && (
                              <span className="ml-2 text-xs text-slate-400">
                                {s.phone}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                        {mechanicOptions.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
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

            {/* Barcode Scanner */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Scan barcode / ketik SKU..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBarcode(barcodeInput);
                      setBarcodeInput("");
                    }
                  }}
                  className="pl-9 font-mono text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setScannerOpen(true)}
                className="shrink-0 h-10 w-10"
                title="Scan pakai kamera"
              >
                <ScanLine className="h-4 w-4 text-sky-500" />
              </Button>
              {barcodeMsg && (
                <span className={`text-xs font-medium ${barcodeMsg.startsWith("✅") ? "text-emerald-600" : "text-amber-600"}`}>
                  {barcodeMsg}
                </span>
              )}
            </div>

            <CameraBarcodeScanner
              open={scannerOpen}
              onOpenChange={setScannerOpen}
              onDetected={(code) => {
                handleBarcode(code);
                setScannerOpen(false);
              }}
            />

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
                              {itemOptions.map((item) => (
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

            {/* Notes + Payment + Totals */}
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

              {/* Payment & Totals */}
              <div className="w-full sm:w-5/12 lg:w-1/3 space-y-3">
                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Metode Pembayaran
                  </label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode bayar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id.toString()}>
                          <span className="inline-flex items-center gap-2">
                            {getPaymentIcon(pm.icon)}
                            {pm.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cash payment fields */}
                {isCashPayment && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Jumlah Dibayar
                      </label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Kembalian
                      </label>
                      <div className="flex h-10 w-full items-center justify-end rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(totals.changeAmount)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
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
            </div>

            {/* Error message */}
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {formError}
              </div>
            )}

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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </span>
                ) : isEdit ? (
                  isSale ? "Simpan Penjualan" : "Simpan Pembelian"
                ) : isSale ? (
                  "Buat Penjualan"
                ) : (
                  "Buat Pembelian"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isOptionsLoading && (
        <div className="fixed bottom-4 right-4 rounded-lg border bg-white px-3 py-2 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading items & mechanics...
          </span>
        </div>
      )}
    </div>
  );
}
