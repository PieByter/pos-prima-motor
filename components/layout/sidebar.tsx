"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Bike,
  Users,
  Building2,
  ClipboardList,
  Bell,
  Receipt,
  RotateCcw,
  Tag,
  History,
  PlusCircle,
  TrendingUp,
  ClipboardCheck,
  Wallet,
  ShieldCheck,
  FileText,
  FilePlus2,
  BadgeDollarSign,
  Tags,
  ListOrdered,
  CalendarClock,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locales";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { LucideIcon } from "lucide-react";

type NavLink = { label: string; href: string; icon: LucideIcon; color?: string };
type NavGroup = { group: string; items: NavLink[] };
type NavItem = NavLink | NavGroup;

// label/group berisi KEY locale (diresolve via t() saat render)
const sidebarNav: NavItem[] = [
  {
    label: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "nav.dashboardMechanic",
    href: "/dashboard/mechanic",
    icon: Gauge,
  },
  {
    group: "nav.masterData",
    items: [
      { label: "nav.products", href: "/dashboard/master-data", icon: Database },
      { label: "nav.categoriesBrands", href: "/dashboard/master-data/categories", icon: Tags },
      { label: "nav.customers", href: "/dashboard/customers", icon: Users },
      { label: "nav.taxReminder", href: "/dashboard/customers/vehicle-documents", icon: CalendarClock },
      { label: "nav.suppliers", href: "/dashboard/suppliers", icon: Building2 },
    ],
  },
  {
    group: "nav.transactions",
    items: [
      { label: "nav.sales", href: "/dashboard/transactions/sales", icon: ShoppingCart },
      { label: "nav.purchases", href: "/dashboard/transactions/purchases", icon: ClipboardList },
      { label: "nav.serviceQueue", href: "/dashboard/transactions/appointments", icon: ListOrdered },
      { label: "nav.purchaseOrders", href: "/dashboard/transactions/purchase-orders", icon: FileText },
      { label: "nav.estimates", href: "/dashboard/transactions/estimates", icon: FilePlus2 },
      { label: "nav.inventory", href: "/dashboard/inventory", icon: Package },
      { label: "nav.adjustStock", href: "/dashboard/inventory/adjust", icon: PlusCircle },
      { label: "nav.adjustHistory", href: "/dashboard/inventory/adjustments", icon: History },
      { label: "nav.priceHistory", href: "/dashboard/inventory/price-history", icon: TrendingUp },
      { label: "nav.stockOpname", href: "/dashboard/inventory/opname", icon: ClipboardCheck },
    ],
  },
  {
    group: "nav.finance",
    items: [
      { label: "nav.expenses", href: "/dashboard/expenses", icon: Receipt },
      { label: "nav.salaryPayments", href: "/dashboard/salary-payments", icon: BadgeDollarSign },
      { label: "nav.receivables", href: "/dashboard/reports/receivables", icon: Wallet },
      { label: "nav.payables", href: "/dashboard/reports/payables", icon: Building2 },
      { label: "nav.discounts", href: "/dashboard/discounts", icon: Tag },
      { label: "nav.salesReturns", href: "/dashboard/returns/sales", icon: RotateCcw },
      { label: "nav.purchasesReturns", href: "/dashboard/returns/purchases", icon: RotateCcw },
    ],
  },
  {
    group: "nav.reportsAndSettings",
    items: [
      { label: "nav.reports", href: "/dashboard/reports", icon: BarChart3 },
      { label: "nav.warranty", href: "/dashboard/warranty", icon: ShieldCheck },
      { label: "nav.warrantyClaims", href: "/dashboard/warranty/claims", icon: ShieldCheck },
      { label: "nav.activityLog", href: "/dashboard/activity-log", icon: History },
      { label: "nav.notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "nav.settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-sky-500 text-white p-1.5 rounded-lg shadow-sm shadow-sky-500/40">
            <Bike className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Prima<span className="text-sky-500">Motor</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {sidebarNav.map((item, idx) => {
          if ("href" in item) {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                  active
                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors",
                    active ? "text-sky-500" : "group-hover:text-sky-500"
                  )}
                />
                <span className="text-sm">{t(item.label)}</span>
              </Link>
            );
          }

          return (
            <div key={idx} className="pt-4 pb-1">
              <p className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {t(item.group)}
              </p>
              {item.items.map((subItem) => {
                const SubIcon = subItem.icon;
                const active = isActive(subItem.href);
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                      active
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    <SubIcon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-colors",
                        active ? "text-sky-500" : "group-hover:text-sky-500"
                      )}
                    />
                    <span className="text-sm">{t(subItem.label)}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1 px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-sky-500 text-white text-xs font-bold">
              A
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              Administrator
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              admin@primamotor.com
            </p>
          </div>
          <button
            className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title={t("nav.logout")}
            onClick={handleLogout}
            aria-label={t("nav.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
