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
import { Loader2, Plus, Play, CheckCircle2, XCircle, User, MessageCircle } from "lucide-react";
import type { AppointmentWithDetails, AppointmentStatus } from "@/lib/services/appointments.service";
import { openWhatsApp, buildAppointmentReminderMessage } from "@/lib/utils/whatsapp";
import { useLocale } from "@/lib/locales";

// Label pakai KEY locale — di-resolve via t() saat render
const STATUS_META: Record<AppointmentStatus, { label: string; cls: string }> = {
  waiting: { label: "mechanic.waiting", cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  in_progress: { label: "mechanic.inProgress", cls: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400" },
  done: { label: "mechanic.done", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  cancelled: { label: "appointments.cancelTitle", cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
};

type CustomerOption = { id: number; name: string; phone: string | null };

export function AppointmentsPage() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const [items, setItems] = useState<AppointmentWithDetails[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    appointment_date: new Date().toISOString().slice(0, 10),
    description: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/appointments?date=${date}`, { cache: "no-store" });
      if (res.ok) {
        const list = await res.json();
        setItems(Array.isArray(list) ? list : []);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/customers?limit=500", { cache: "no-store" })
        .then((r) => r.json())
        .then((json) => setCustomers(json?.data ?? []))
        .catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const waiting = items.filter((i) => i.status === "waiting").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const done = items.filter((i) => i.status === "done").length;

  async function handleSubmit() {
    if (!form.appointment_date) {
      showToast(t("appointments.dateRequired"), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: form.customer_id ? Number(form.customer_id) : null,
          appointment_date: form.appointment_date,
          description: form.description || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(t("appointments.queueAdded"), "success");
      setDialogOpen(false);
      setForm({ customer_id: "", appointment_date: new Date().toISOString().slice(0, 10), description: "", notes: "" });
      setDate(form.appointment_date);
      await fetchData();
    } catch {
      showToast(t("appointments.addQueueFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: number, status: AppointmentStatus) {
    try {
      const res = await fetch(`/api/appointments?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(t("appointments.statusUpdated"), "success");
      await fetchData();
    } catch {
      showToast(t("appointments.statusUpdateFailed"), "error");
    }
  }

  return (
    <>
      <Navbar
        title={t("nav.serviceQueue")}
        subtitle={t("appointments.subtitle")}
      />
      <div className="space-y-4">
        {/* Statistik */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500">{t("mechanic.waiting")}</p>
            <p className="text-lg font-bold text-amber-600">{waiting}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500">{t("mechanic.inProgress")}</p>
            <p className="text-lg font-bold text-sky-600">{inProgress}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500">{t("mechanic.done")}</p>
            <p className="text-lg font-bold text-emerald-600">{done}</p>
          </div>
        </div>

        {/* Filter + aksi */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
            <Button size="sm" variant="outline" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>
              {t("time.today")}
            </Button>
          </div>
          <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> {t("appointments.addQueue")}
          </Button>
        </div>

        {/* Tabel */}
        <div className="rounded-xl border bg-white dark:bg-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
            </div>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">{t("appointments.noQueue")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">{t("masterData.customer")}</th>
                    <th className="px-4 py-3">{t("transactions.vehicleLabel")}</th>
                    <th className="px-4 py-3">{t("appointments.description")}</th>
                    <th className="px-4 py-3">{t("transactions.mechanic")}</th>
                    <th className="px-4 py-3">{t("common.status")}</th>
                    <th className="px-4 py-3 text-center w-40">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{a.customer?.name ?? t("dashboard.walkInCustomer")}</p>
                        {a.customer?.phone && <p className="text-xs text-slate-400">{a.customer.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {a.vehicle ? (
                          <>
                            <p className="font-mono text-xs">{a.vehicle.plate_number}</p>
                            <p className="text-xs text-slate-400">{[a.vehicle.brand, a.vehicle.model].filter(Boolean).join(" ")}</p>
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-40 truncate">{a.description ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{a.mechanic?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[a.status].cls}`}>
                          {STATUS_META[a.status] ? t(STATUS_META[a.status].label) : a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-emerald-600"
                            disabled={!a.customer?.phone}
                            title={t("appointments.waReminderTitle")}
                            onClick={() => {
                              if (a.customer?.phone) openWhatsApp(a.customer.phone, buildAppointmentReminderMessage(a));
                            }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          {a.status === "waiting" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-sky-600" onClick={() => handleStatus(a.id, "in_progress")}>
                              <Play className="h-3 w-3" /> {t("mechanic.take")}
                            </Button>
                          )}
                          {a.status === "in_progress" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600" onClick={() => handleStatus(a.id, "done")}>
                              <CheckCircle2 className="h-3 w-3" /> {t("mechanic.done")}
                            </Button>
                          )}
                          {(a.status === "waiting" || a.status === "in_progress") && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => handleStatus(a.id, "cancelled")} title={t("appointments.cancelTitle")}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <DialogTitle>{t("appointments.addQueueTitle")}</DialogTitle>
            <DialogDescription>{t("appointments.addQueueDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("masterData.customer")}</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("appointments.selectCustomerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__walkin">{t("appointments.walkinOption")}</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3 w-3" /> {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("appointments.date")} <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("appointments.description")}</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("appointments.descriptionPlaceholder")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-sky-500 hover:bg-sky-600">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
