"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Bike,
  LayoutDashboard,
  Database,
  ShoppingCart,
  ClipboardList,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Building2,
  ChevronRight,
  Receipt,
  RotateCcw,
  Bell,
  Tag,
  FileText,
  BadgeDollarSign,
  ShieldCheck,
  PlusCircle,
  History,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavLink = { label: string; href: string; icon: LucideIcon };
type NavGroup = { group: string; items: NavLink[] };
type NavItem = NavLink | NavGroup;

const sidebarNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    group: "Data Master",
    items: [
      { label: "Produk / Sparepart", href: "/dashboard/master-data", icon: Database },
      { label: "Kategori & Brand", href: "/dashboard/master-data/categories", icon: Tags },
      { label: "Data Customer", href: "/dashboard/customers", icon: Users },
      { label: "Data Supplier", href: "/dashboard/suppliers", icon: Building2 },
    ],
  },
  {
    group: "Transaksi",
    items: [
      { label: "Penjualan", href: "/dashboard/transactions/sales", icon: ShoppingCart },
      { label: "Pembelian", href: "/dashboard/transactions/purchases", icon: ClipboardList },
      { label: "Purchase Order", href: "/dashboard/transactions/purchase-orders", icon: FileText },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package },
      { label: "Adjust Stok", href: "/dashboard/inventory/adjust", icon: PlusCircle },
      { label: "Riwayat Adjust", href: "/dashboard/inventory/adjustments", icon: History },
    ],
  },
  {
    group: "Keuangan",
    items: [
      { label: "Pengeluaran", href: "/dashboard/expenses", icon: Receipt },
      { label: "Gaji Mekanik", href: "/dashboard/salary-payments", icon: BadgeDollarSign },
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
      { label: "Notifikasi", href: "/dashboard/notifications", icon: Bell },
      { label: "Pengaturan", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Administrator");
  const [userEmail, setUserEmail] = useState("admin@primamotor.com");

  // Close on route change
  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setUserName(data?.profile?.name ?? "Administrator");
        setUserEmail(data?.user?.email ?? "admin@primamotor.com");
      } catch {
        // silently fail
      }
    };
    loadProfile();
  }, []);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      onOpenChange(false);
      router.replace("/login");
      router.refresh();
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (!open) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* ── Drawer panel ── */}
      <aside
        id="mobile-sidebar"
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl md:hidden",
          "flex flex-col",
          "animate-in slide-in-from-left duration-300"
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={() => onOpenChange(false)}
          >
            <div className="bg-sky-500 text-white p-1.5 rounded-lg shadow-sm shadow-sky-500/40">
              <Bike className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Prima<span className="text-sky-500">Motor</span>
            </span>
          </Link>

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {sidebarNav.map((item, idx) => {
            if ("href" in item) {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-all group mb-0.5",
                    active
                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0",
                        active ? "text-sky-500" : "text-slate-400 group-hover:text-sky-500"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                </Link>
              );
            }

            return (
              <div key={idx} className="mt-4 mb-1">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
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
                        "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-all group mb-0.5",
                        active
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <SubIcon
                          className={cn(
                            "h-4.5 w-4.5 shrink-0",
                            active ? "text-sky-500" : "text-slate-400 group-hover:text-sky-500"
                          )}
                        />
                        <span>{subItem.label}</span>
                      </div>
                      {active && <ChevronRight className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-sky-500 text-white text-sm font-bold">
                {initials || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {userName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {userEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors shrink-0"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
