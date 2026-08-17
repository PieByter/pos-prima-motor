"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader, Coins, Plus, Minus, History } from "lucide-react";
import type { Customer, CustomerLoyalty, PointTransaction } from "@/lib/types/database";
import { useLocale } from "@/lib/locales";

type Props = {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function CustomerPointsDialog({ customer, open, onOpenChange, onUpdated }: Props) {
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const [data, setData] = useState<CustomerLoyalty | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/loyalty?customer_id=${customer.id}`, { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as CustomerLoyalty;
        setData(json);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (!open || !customer) return;
    const timer = window.setTimeout(() => {
      setPointsInput("");
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, customer, load]);

  async function handleAction(action: "earn" | "redeem") {
    if (!customer) return;
    const points = Number(pointsInput);
    if (!points || points <= 0) {
      showToast(t("loyalty.pointsRequired"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customer.id, action, points, reference: t("loyalty.manual") }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? t("loyalty.failed"));
      }
      showToast(action === "earn" ? t("loyalty.earned") : t("loyalty.redeemed"), "success");
      setPointsInput("");
      await load();
      onUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("loyalty.failed"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  function typeBadge(tx: PointTransaction) {
    if (tx.points > 0) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
          {t("loyalty.earnBadge")}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
        {t("loyalty.redeemBadge")}
      </Badge>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">{t("loyalty.title")}</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {customer?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Saldo */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-center">
            <p className="text-xs text-emerald-700 dark:text-emerald-400">{t("loyalty.balance")}</p>
            <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {isLoading ? "..." : data?.balance ?? 0}
            </p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">{t("loyalty.current")}</p>
          </div>

          {/* Form tambah / tukar */}
          <div className="space-y-2">
            <Label>{t("loyalty.pointsPlaceholder")}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                placeholder={t("loyalty.pointsPlaceholder")}
                disabled={submitting}
              />
              <Button
                size="sm"
                className="gap-1 bg-emerald-500 hover:bg-emerald-600 shrink-0"
                disabled={submitting || isLoading}
                onClick={() => handleAction("earn")}
              >
                <Plus className="h-4 w-4" /> {t("loyalty.earn")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-amber-600 shrink-0"
                disabled={submitting || isLoading}
                onClick={() => handleAction("redeem")}
              >
                <Minus className="h-4 w-4" /> {t("loyalty.redeem")}
              </Button>
            </div>
          </div>

          {/* Riwayat */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <History className="h-3.5 w-3.5" /> {t("loyalty.history")}
            </p>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : !data || data.transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">{t("loyalty.noHistory")}</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {data.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {typeBadge(tx)}
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(tx.created_at).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {tx.reference && (
                        <p className="mt-0.5 text-xs text-slate-400 truncate">{tx.reference}</p>
                      )}
                    </div>
                    <span className={`text-sm font-bold font-mono shrink-0 ${tx.points > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
