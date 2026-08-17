"use client";

import { useCallback, useState } from "react";
import { ShoppingCart, AlertTriangle, ArrowRight, PackagePlus } from "lucide-react";
import { DashboardCard, SectionHeader, EmptyState, LoadingSpinner } from "@/components/dashboard/ui/dashboard-card";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLocale } from "@/lib/locales";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/components/ui/button";

type RestockItem = {
  item_id: number;
  name: string;
  sku: string | null;
  current_stock: number;
  sold_30_days: number;
  avg_daily: number;
  days_until_empty: number;
  recommended_qty: number;
  urgency: "critical" | "high" | "medium";
};

export function RestockRecommendations() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const { data: items, isLoading } = useFetch<RestockItem[]>("/api/stock/restock-recommendations");
  const [creatingPO, setCreatingPO] = useState(false);

  const data = items ?? [];

  const handleAutoPO = useCallback(async () => {
    if (creatingPO) return;
    setCreatingPO(true);
    try {
      const res = await fetch("/api/purchase-orders/auto", { method: "POST", cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? t("dashboard.autoPOFailed"));
      }
      if (json.created > 0 && json.skipped_no_supplier > 0) {
        showToast(t("dashboard.autoPOCreatedSkip", { n: json.created, skipped: json.skipped_no_supplier }), "success");
      } else if (json.created > 0) {
        showToast(t("dashboard.autoPOCreated", { n: json.created }), "success");
      } else if (json.skipped_no_supplier > 0) {
        showToast(t("dashboard.autoPOSkipAll", { skipped: json.skipped_no_supplier }), "warning");
      } else {
        showToast(t("dashboard.autoPOEmpty"), "info");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("dashboard.autoPOFailed"), "error");
    } finally {
      setCreatingPO(false);
    }
  }, [creatingPO, showToast, t]);

  return (
    <DashboardCard>
      <SectionHeader label={t("dashboard.autoRestock")} title={t("dashboard.restockRecommendations")}>
        {data.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {t("dashboard.criticalCount", { n: data.filter((i) => i.urgency === "critical").length })}
          </Badge>
        )}
      </SectionHeader>

      <div className="space-y-2 px-4 pb-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <EmptyState message={t("dashboard.stockSufficient")} />
        ) : (
          data.slice(0, 8).map((item) => (
            <div
              key={item.item_id}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
            >
              <div className={`rounded-lg p-2 ${
                item.urgency === "critical"
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : item.urgency === "high"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                    : "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
              }`}>
                {item.urgency === "critical" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t("dashboard.stockSoldLine", { stock: item.current_stock, sold: item.sold_30_days })}
                  {item.days_until_empty < 30 && (
                    <span className="ml-1 text-amber-500 font-medium">
                      {t("dashboard.estimatedEmpty", { n: item.days_until_empty })}
                    </span>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  +{item.recommended_qty}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{t("dashboard.buy")}</p>
              </div>
            </div>
          ))
        )}

        {data.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8 w-full sm:w-auto"
              disabled={creatingPO}
              onClick={handleAutoPO}
            >
              <PackagePlus className="h-3.5 w-3.5" />
              {creatingPO ? t("common.loading") : t("dashboard.autoCreatePO")}
            </Button>
            <Link
              href="/dashboard/inventory"
              className="flex items-center justify-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400"
            >
              {t("common.seeAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
