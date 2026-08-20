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
import { useBusinessSettings } from "@/lib/hooks/use-business-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type TransactionType } from "@/lib/data/transactions";
import { formatRupiah } from "@/lib/data/items";
import type { Vehicle } from "@/lib/types/database";
import { CameraBarcodeScanner } from "@/components/transactions/camera-barcode-scanner";
import { SaleSuccessDialog } from "@/components/transactions/sale-success-dialog";
import { useLocale } from "@/lib/locales";

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
  stock: number;
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
  stock?: number;
  suppliers?: { id: number; name: string; purchase_price: number | null }[];
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
    stock: 0,
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
  /** Numeric DB id — dipakai untuk PATCH saat edit */
  numericId?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TransactionForm({
  type,
  initialData,
  transactionId,
  numericId,
}: TransactionFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const isEdit = !!initialData;
  const isSale = type === "sale";
  const trxId = transactionId ?? generateTrxId();

  /* ---- state ---- */
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
  const [saleType, setSaleType] = useState<"purchase" | "service" | "hybrid">("purchase");
  const [vehicleOptions, setVehicleOptions] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "partial" | "unpaid">("paid");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeMsg, setBarcodeMsg] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [savedSale, setSavedSale] = useState<{ id: number; invoiceNumber: string } | null>(null);

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
  }, [isSale]);

  /* ---- derived totals ---- */
  const taxPercent = useBusinessSettings().settings.tax_percent ?? 11;
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
    const taxRate = taxPercent / 100; // PPN dinamis dari pengaturan bisnis
    const tax = Math.round(beforeTax * taxRate);
    const grandTotal = beforeTax + tax;

    const cash = Number(cashAmount) || 0;
    const changeAmount = cash >= grandTotal ? cash - grandTotal : 0;

    return { itemsSubtotal, serviceFees, totalDiscount, taxRate, tax, grandTotal, cashAmount: cash, changeAmount };
  }, [lines, cashAmount, taxPercent]);

  /* ---- payment method helpers ---- */
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id.toString() === paymentMethodId);
  const isCashPayment = selectedPaymentMethod?.name?.toLowerCase() === "tunai";

  /* ---- payment status helpers ---- */
  const paidValue =
    paymentStatus === "paid" ? totals.grandTotal : Number(paidAmount) || 0;
  const remainingAmount = Math.max(0, totals.grandTotal - paidValue);

  // Auto-fill paid amount when payment status changes
  const handlePaymentStatusChange = (val: "paid" | "partial" | "unpaid") => {
    setPaymentStatus(val);
    if (val === "paid") setPaidAmount(totals.grandTotal.toString());
    else if (val === "unpaid") setPaidAmount("0");
  };

  // Load vehicles when customer is selected (sale only)
  const handleCustomerChange = (val: string) => {
    setCustomerId(val);
    setVehicleId("");
    setVehicleOptions([]);

    if (isSale && val) {
      fetch(`/api/vehicles?customer_id=${val}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => setVehicleOptions(Array.isArray(list) ? list : []))
        .catch(() => setVehicleOptions([]));
    }
  };

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

      let unitPrice: number;
      if (isSale) {
        unitPrice = item.selling_price;
      } else {
        // Mode pembelian: coba harga khusus dari supplier terpilih, fallback ke harga beli utama
        const supplierPrice =
          supplierOptions.find((s) => s.id.toString() === customerId)
            ?.id != null
            ? (item.suppliers ?? []).find(
                (s) => s.id === Number(customerId)
              )?.purchase_price
            : null;
        unitPrice = supplierPrice ?? item.purchase_price;
      }

      updateLine(key, {
        itemId: item.id,
        name: item.name,
        unitPrice,
        serviceFee: isSale ? item.service_fee : 0,
        stock: item.stock ?? 0,
      });
    },
    [updateLine, isSale, itemOptions, supplierOptions, customerId]
  );

  /* ---- barcode scanner ---- */
  const handleBarcode = useCallback(async (sku: string) => {
    if (!sku.trim()) return;
    setBarcodeMsg(null);
    try {
      // Lookup item by exact SKU + real-time stock
      const res = await fetch(`/api/items/lookup?sku=${encodeURIComponent(sku.trim())}`, { cache: "no-store" });
      if (res.status === 404) {
        setBarcodeMsg(t("transactions.barcodeUnknown", { sku }));
        return;
      }
      if (!res.ok) {
        setBarcodeMsg(t("transactions.barcodeSearchFailed"));
        return;
      }
      const item = await res.json();
      const stock = Number(item.stock ?? 0);

      // Real-time stock check
      if (stock <= 0) {
        setBarcodeMsg(t("transactions.stockOut", { name: item.name }));
        return;
      }

      const existingLine = lines.find((l) => l.itemId === item.id);
      if (existingLine && existingLine.qty + 1 > stock) {
        setBarcodeMsg(t("transactions.stockNotEnough", { stock }));
        return;
      }

      const newLine = {
        key: newKey(),
        itemId: item.id,
        name: item.name,
        qty: 1,
        unitPrice: isSale ? Number(item.selling_price) : Number(item.purchase_price),
        discountPercent: 0,
        serviceFee: isSale ? Number(item.service_fee) : 0,
        subtotal: isSale ? Number(item.selling_price) : Number(item.purchase_price),
        stock,
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
      setBarcodeMsg(t("transactions.barcodeAdded", { name: item.name, stock }));
      setTimeout(() => setBarcodeMsg(null), 2000);
    } catch {
      setBarcodeMsg(t("transactions.barcodeSearchFailed"));
    }
  }, [isSale, t, lines]);

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
          vehicle_id: vehicleId ? Number(vehicleId) : null,
          mechanic_id: mechanicId || null,
          sale_date: date,
          total_amount: totals.grandTotal,
          status: "completed" as const,
          sale_type: saleType,
          payment_status: paymentStatus,
          paid_amount: paymentStatus === "unpaid" ? 0 : paidValue,
          remaining_amount: paymentStatus === "paid" ? 0 : remainingAmount,
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

        const res = await fetch(
          isEdit && numericId ? `/api/sales/${numericId}` : "/api/sales",
          {
            method: isEdit && numericId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ header, details }),
          },
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? t("transactions.saveSaleFailed"));
        }
if (isEdit && numericId) {
          // Edit → kembali ke daftar seperti biasa
          router.push(backHref);
          router.refresh();
        } else {
          // Transaksi baru → tampilkan dialog sukses (kirim struk via WA)
          const saved = (await res.json()) as { id: number; invoice_number: string };
          setSavedSale({ id: saved.id, invoiceNumber: saved.invoice_number });
        }
      } else {
        // ── Submit purchase to API ─────────────────────────────────────
        const header = {
          supplier_id: customerId ? Number(customerId) : null,
          purchase_date: date,
          total_amount: totals.grandTotal,
          status: "completed" as const,
          payment_status: paymentStatus,
          paid_amount: paymentStatus === "unpaid" ? 0 : paidValue,
          remaining_amount: paymentStatus === "paid" ? 0 : remainingAmount,
          payment_method_id: paymentMethodId ? Number(paymentMethodId) : null,
          notes: notes || null,
        };

        const details = lines
          .filter((l) => l.itemId != null)
          .map((l) => ({
            item_id: l.itemId!,
            quantity: l.qty,
            price: l.unitPrice,
            subtotal: l.unitPrice * l.qty,
          }));

        const res = await fetch(
          isEdit && numericId ? `/api/purchases/${numericId}` : "/api/purchases",
          {
            method: isEdit && numericId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ header, details }),
          },
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? t("transactions.savePurchaseFailed"));
        }

        router.push(backHref);
        router.refresh();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("transactions.saveTrxFailed"));
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
              {isEdit ? t("transactions.editTransaction") : t("transactions.newTransactionTitle")}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isSale
                ? t("transactions.createSaleSubtitle")
                : t("transactions.createPurchaseSubtitle")}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
            <Hash className="h-4 w-4" />
            {isEdit ? trxId : t("transactions.autoGenerate")}
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
                  {isSale ? t("transactions.customerLabel") : t("transactions.supplierLabel")}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                  {isSale ? (
                    <Select value={customerId} onValueChange={handleCustomerChange}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder={t("transactions.searchCustomerPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {customerOptions.length === 0 && (
                          <SelectItem value="-1" disabled>
                            {t("transactions.noCustomerOption")}
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
                    }}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder={t("transactions.searchSupplierPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierOptions.length === 0 && (
                          <SelectItem value="-1" disabled>
                            {t("transactions.noSupplierOption")}
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
                    {t("transactions.mechanic")}
                  </label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                    <Select value={mechanicId} onValueChange={setMechanicId}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder={t("transactions.selectMechanicPlaceholder")} />
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
                  {t("transactions.transactionDate")}
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

            {/* Sale type + Vehicle (sale only) */}
            {isSale && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Jenis Transaksi */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("transactions.saleType")}
                  </label>
                  <Select value={saleType} onValueChange={(v) => setSaleType(v as typeof saleType)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("transactions.selectSaleTypePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">{t("transactions.saleTypeGoods")}</SelectItem>
                      <SelectItem value="service">{t("transactions.saleTypeService")}</SelectItem>
                      <SelectItem value="hybrid">{t("transactions.saleTypeHybrid")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    {saleType === "purchase" && t("transactions.saleTypeGoodsHint")}
                    {saleType === "service" && t("transactions.saleTypeServiceHint")}
                    {saleType === "hybrid" && t("transactions.saleTypeHybridHint")}
                  </p>
                </div>

                {/* Kendaraan */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("transactions.vehiclePlate")}
                  </label>
                  <Select
                    value={vehicleId}
                    onValueChange={setVehicleId}
                    disabled={!customerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        customerId
                          ? vehicleOptions.length > 0
                            ? t("transactions.selectVehiclePlaceholder")
                            : t("transactions.noVehicleRegistered")
                          : t("transactions.selectCustomerFirst")
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleOptions.map((v) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          <span className="font-medium">{v.plate_number}</span>
                          {v.model && (
                            <span className="ml-2 text-xs text-slate-400">{v.model}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    {t("transactions.vehicleHint")}
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-slate-700" />

            {/* Barcode Scanner */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder={t("transactions.scanBarcode")}
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
                title={t("transactions.scanCameraTitle")}
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
                      {t("transactions.item")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">
                      {t("transactions.qty")}
                    </th>
                    {isSale && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">
                        {t("transactions.stockLabel")}
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                      {t("transactions.price")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">
                      {t("transactions.discount")}
                    </th>
                    {isSale && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                        {t("transactions.serviceFee")}
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                      {t("transactions.subtotal")}
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
                              <SelectValue placeholder={t("transactions.searchItem")} />
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
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(line.key, {
                                qty: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className={`text-center w-20 ${isSale && line.itemId != null && line.qty > line.stock ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                          />
                          {isSale && line.itemId != null && line.qty > line.stock && (
                            <span className="text-[10px] font-medium text-red-600 whitespace-nowrap">
                              {t("transactions.stockExceeded", { stock: line.stock })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock (sale only) */}
                      {isSale && (
                        <td className="px-4 py-3 text-center">
                          {line.itemId != null ? (
                            <span className={line.qty > line.stock ? "text-red-600 font-semibold" : "text-slate-600 dark:text-slate-300"}>
                              {line.stock}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                      )}

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
              {t("transactions.addRowItem")}
            </Button>

            {/* Notes + Payment + Totals */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              {/* Notes */}
              <div className="w-full sm:w-1/2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("transactions.transactionNotes")}
                </label>
                <Textarea
                  placeholder={t("transactions.notesPlaceholderForm")}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Payment & Totals */}
              <div className="w-full sm:w-5/12 lg:w-1/3 space-y-3">
                {/* Payment Status (sale & purchase) */}
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("transactions.paymentStatus")}
                    </label>
                    <Select
                      value={paymentStatus}
                      onValueChange={(v) => handlePaymentStatusChange(v as typeof paymentStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("transactions.selectStatusPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">{t("transactions.statusPaid")}</SelectItem>
                        <SelectItem value="partial">{t("transactions.statusPartial")}</SelectItem>
                        <SelectItem value="unpaid">📝 {isSale ? t("transactions.statusUnpaidSale") : t("transactions.statusUnpaidPurchase")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Paid amount for partial/unpaid */}
                  {paymentStatus !== "paid" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {t("transactions.amountPaid")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={totals.grandTotal}
                          placeholder="0"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {t("transactions.remainingBalance")}
                        </label>
                        <div className="flex h-10 w-full items-center justify-end rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {formatRupiah(remainingAmount)}
                        </div>
                      </div>
                    </div>
                  )}
                </>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("transactions.paymentMethod")}
                  </label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("transactions.paymentMethodPlaceholder")} />
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
                        {t("transactions.cashAmount")}
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
                        {t("transactions.changeAmount")}
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
                    <span>{t("transactions.subtotalItems")}</span>
                    <span>{formatRupiah(totals.itemsSubtotal)}</span>
                  </div>
                  {isSale && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{t("transactions.serviceFeesTotal")}</span>
                      <span>{formatRupiah(totals.serviceFees)}</span>
                    </div>
                  )}
                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                      <span>{t("transactions.totalDiscountLine")}</span>
                      <span>- {formatRupiah(totals.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span>
                      {t("transactions.taxLine", { pct: Math.round(totals.taxRate * 100) })}
                    </span>
                    <span>{formatRupiah(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {t("transactions.grandTotal")}
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
                {t("common.cancel")}
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
                    {t("transactions.saving")}
                  </span>
                ) : isEdit ? (
                  isSale ? t("transactions.saveSale") : t("transactions.savePurchase")
                ) : isSale ? (
                  t("transactions.createSaleSubmit")
                ) : (
                  t("transactions.createPurchaseSubmit")
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
            {t("transactions.loadingOptions")}
          </span>
        </div>
      )}
      {savedSale && (
        <SaleSuccessDialog
          open={!!savedSale}
          onOpenChange={(open) => {
            if (!open) setSavedSale(null);
          }}
          saleId={savedSale.id}
          invoiceNumber={savedSale.invoiceNumber}
          backHref={backHref}
        />
      )}
    </div>
  );
}
