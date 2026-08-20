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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, CalendarClock, MessageCircle } from "lucide-react";
import type { VehicleDocumentWithVehicle } from "@/lib/services/vehicle-documents.service";
import { openWhatsApp, buildVehicleDocReminderMessage } from "@/lib/utils/whatsapp";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { useLocale } from "@/lib/locales";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type VehicleOption = {
  id: number;
  plate_number: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  customer_id: number;
};

export function VehicleDocumentsPage() {
  const { showToast } = useToast();
  const { isAdmin } = useUserRole();
  const { t } = useLocale();
  const [docs, setDocs] = useState<VehicleDocumentWithVehicle[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleDocumentWithVehicle | null>(null);
  const [form, setForm] = useState({
    vehicle_id: "",
    doc_type: "pajak" as "stnk" | "pajak",
    due_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicle-documents", { cache: "no-store" });
      if (res.ok) {
        const list = await res.json();
        setDocs(Array.isArray(list) ? list : []);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/vehicles?limit=500", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => setVehicles(Array.isArray(list) ? list : []))
        .catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const daysUntil = (due: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((new Date(due).getTime() - today.getTime()) / 86400000);
  };

  const sorted = [...docs].sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date));
  const expiringSoon = sorted.filter((d) => daysUntil(d.due_date) <= 30 && daysUntil(d.due_date) >= 0).length;
  const expired = sorted.filter((d) => daysUntil(d.due_date) < 0).length;

  async function handleSubmit() {
    if (!form.vehicle_id || !form.due_date) {
      showToast(t("vehicleDocuments.requireVehicleDue"), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vehicle-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: Number(form.vehicle_id),
          doc_type: form.doc_type,
          due_date: form.due_date,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(t("vehicleDocuments.added"), "success");
      setDialogOpen(false);
      setForm({ vehicle_id: "", doc_type: "pajak", due_date: new Date().toISOString().slice(0, 10), notes: "" });
      await fetchData();
    } catch {
      showToast(t("vehicleDocuments.addFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function performDelete(id: number) {
    try {
      const res = await fetch(`/api/vehicle-documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(t("vehicleDocuments.deleted"), "success");
      await fetchData();
    } catch {
      showToast(t("vehicleDocuments.deleteFailed"), "error");
      throw new Error("Delete failed");
    }
  }

  return (
    <>
      <Navbar
        title={t("vehicleDocuments.title")}
        subtitle={t("vehicleDocuments.subtitle")}
      />
      <div className="space-y-4">
        {/* Statistik */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500">{t("vehicleDocuments.expiring30")}</p>
            <p className="text-lg font-bold text-amber-600">{expiringSoon}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500">{t("vehicleDocuments.overdue")}</p>
            <p className="text-lg font-bold text-red-600">{expired}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500">{t("vehicleDocuments.totalRecorded")}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{docs.length}</p>
          </div>
        </div>

        {/* Aksi */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{t("vehicleDocuments.adminOnlyNote")}</p>
          {isAdmin && (
            <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> {t("vehicleDocuments.addReminder")}
            </Button>
          )}
        </div>

        {/* Tabel */}
        <div className="rounded-xl border bg-white dark:bg-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">
              {t("vehicleDocuments.noReminders")} {isAdmin ? t("vehicleDocuments.clickAddReminder") : ""}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">{t("vehicleDocuments.vehicle")}</th>
                    <th className="px-4 py-3">{t("vehicleDocuments.owner")}</th>
                    <th className="px-4 py-3">{t("vehicleDocuments.type")}</th>
                    <th className="px-4 py-3">{t("vehicleDocuments.dueDate")}</th>
                    <th className="px-4 py-3">{t("common.status")}</th>
                    {isAdmin && <th className="px-4 py-3 w-16"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sorted.map((d) => {
                    const days = daysUntil(d.due_date);
                    const status =
                      days < 0
                        ? { label: t("vehicleDocuments.statusOverdue"), cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" }
                        : days <= 30
                          ? { label: t("vehicleDocuments.statusDaysLeft", { n: days }), cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" }
                          : { label: t("vehicleDocuments.statusDays", { n: days }), cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" };
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{d.vehicle?.plate_number ?? "-"}</p>
                          <p className="text-xs text-slate-400">
                            {[d.vehicle?.brand, d.vehicle?.model, d.vehicle?.year].filter(Boolean).join(" ") || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-600 dark:text-slate-300">{d.vehicle?.customers?.name ?? "-"}</p>
                          <p className="text-xs text-slate-400">{d.vehicle?.customers?.phone ?? ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-[11px]">
                            {d.doc_type === "stnk" ? t("vehicleDocuments.stnk") : t("vehicleDocuments.tax")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{d.due_date}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>
                            <CalendarClock className="h-3 w-3 mr-1" /> {status.label}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-emerald-600"
                                disabled={!d.vehicle?.customers?.phone}
                                title={t("vehicleDocuments.waReminderTitle")}
                                onClick={() => {
                                  if (d.vehicle?.customers?.phone) openWhatsApp(d.vehicle.customers.phone, buildVehicleDocReminderMessage(d));
                                }}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => setDeleteTarget(d)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog tambah */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("vehicleDocuments.addTitle")}</DialogTitle>
            <DialogDescription>
              {t("vehicleDocuments.addDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("vehicleDocuments.vehicle")} <span className="text-red-500">*</span></Label>
              <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("vehicleDocuments.selectVehicle")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.plate_number} · {[v.brand, v.model].filter(Boolean).join(" ") || "?"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("vehicleDocuments.type")} <span className="text-red-500">*</span></Label>
                <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v as "stnk" | "pajak" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pajak">{t("vehicleDocuments.typeAnnualTax")}</SelectItem>
                    <SelectItem value="stnk">{t("vehicleDocuments.typeStnk")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("vehicleDocuments.dueDate")} <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-sky-500 hover:bg-sky-600">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("settings.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("vehicleDocuments.deleteConfirm")}
        description={
          deleteTarget
            ? `${deleteTarget.vehicle?.plate_number ?? ""} · ${
                deleteTarget.doc_type === "stnk"
                  ? t("vehicleDocuments.stnk")
                  : t("vehicleDocuments.tax")
              }`
            : undefined
        }
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (deleteTarget) return performDelete(deleteTarget.id);
        }}
      />
    </>
  );
}
