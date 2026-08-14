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
  BadgeDollarSign,
  Tags,
  ListOrdered,
  CalendarClock,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { LucideIcon } from "lucide-react";

type NavLink = { label: string; href: string; icon: LucideIcon; color?: string };
type NavGroup = { group: string; items: NavLink[] };
type NavItem = NavLink | NavGroup;

const sidebarNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Dashboard Mekanik",
    href: "/dashboard/mechanic",
    icon: Gauge,
  },
  {
    group: "Data Master",
    items: [
      { label: "Data Produk", href: "/dashboard/master-data", icon: Database },
      { label: "Kategori & Brand", href: "/dashboard/master-data/categories", icon: Tags },
      { label: "Data Customer", href: "/dashboard/customers", icon: Users },
      { label: "Reminder Pajak", href: "/dashboard/customers/vehicle-documents", icon: CalendarClock },
      { label: "Data Supplier", href: "/dashboard/suppliers", icon: Building2 },
    ],
  },
  {
    group: "Transaksi",
    items: [
      { label: "Penjualan", href: "/dashboard/transactions/sales", icon: ShoppingCart },
      { label: "Pembelian", href: "/dashboard/transactions/purchases", icon: ClipboardList },
      { label: "Antrian Service", href: "/dashboard/transactions/appointments", icon: ListOrdered },
      { label: "Purchase Order", href: "/dashboard/transactions/purchase-orders", icon: FileText },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package },
      { label: "Adjust Stok", href: "/dashboard/inventory/adjust", icon: PlusCircle },
      { label: "Riwayat Adjust", href: "/dashboard/inventory/adjustments", icon: History },
      { label: "Riwayat Harga", href: "/dashboard/inventory/price-history", icon: TrendingUp },
      { label: "Stok Opname", href: "/dashboard/inventory/opname", icon: ClipboardCheck },
    ],
  },
  {
    group: "Keuangan",
    items: [
      { label: "Pengeluaran", href: "/dashboard/expenses", icon: Receipt },
      { label: "Gaji Mekanik", href: "/dashboard/salary-payments", icon: BadgeDollarSign },
      { label: "Piutang", href: "/dashboard/reports/receivables", icon: Wallet },
      { label: "Hutang", href: "/dashboard/reports/payables", icon: Building2 },
      { label: "Diskon", href: "/dashboard/discounts", icon: Tag },
      { label: "Retur Penjualan", href: "/dashboard/returns/sales", icon: RotateCcw },
      { label: "Retur Pembelian", href: "/dashboard/returns/purchases", icon: RotateCcw },
    ],
  },
  {
    group: "Laporan & Pengaturan",
    items: [
      { label: "Laporan", href: "/dashboard/reports", icon: BarChart3 },
      { label: "Garansi", href: "/dashboard/warranty", icon: ShieldCheck },
      { label: "Klaim Garansi", href: "/dashboard/warranty/claims", icon: ShieldCheck },
      { label: "Activity Log", href: "/dashboard/activity-log", icon: History },
      { label: "Notifikasi", href: "/dashboard/notifications", icon: Bell },
      { label: "Pengaturan", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={idx} className="pt-4 pb-1">
              <p className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {item.group}
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
                    <span className="text-sm">{subItem.label}</span>
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
            title="Keluar"
            onClick={handleLogout}
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
