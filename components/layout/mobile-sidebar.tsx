"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bike,
  LayoutDashboard,
  Database,
  ShoppingCart,
  Truck,
  Package,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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
    group: "Management",
    items: [
      { label: "Master Data", href: "/dashboard/master-data", icon: Database },
      { label: "Penjualan", href: "/dashboard/transactions/sales", icon: ShoppingCart },
      { label: "Pembelian", href: "/dashboard/transactions/purchases", icon: Truck },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package },
    ],
  },
  {
    group: "Analytics & Tools",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("Username");
  const [userEmail, setUserEmail] = useState("email@example.com");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const name = data?.profile?.name ?? "Username";
        const email = data?.user?.email ?? "email@example.com";
        setUserName(name);
        setUserEmail(email);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();
  }, []);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Always redirect to login even if network request fails.
    } finally {
      setOpen(false);
      router.replace("/login");
      router.refresh();
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="sm:hidden rounded-xl border border-slate-200/80 bg-white/80 p-2.5 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-white/95 backdrop-blur-xl dark:bg-slate-950/95">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

        <div className="flex h-16 items-center border-b border-slate-200/80 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="rounded-2xl p-1.5 text-white shadow-lg shadow-sky-500/25"
              style={{ backgroundColor: "#0ea5e9" }}
            >
              <Bike className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Prima<span className="text-sky-500">Motor</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarNav.map((item, idx) => {
            if ("href" in item) {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all",
                    isActive(item.href)
                      ? "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/10 dark:text-sky-300"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                  )}
                >
                  <Icon className="h-5 w-5 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <div key={idx}>
                <div className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  {item.group}
                </div>
                {item.items.map((subItem) => {
                  const SubIcon = subItem.icon;
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all",
                        isActive(subItem.href)
                          ? "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/10 dark:text-sky-300"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                      )}
                    >
                      <SubIcon className="h-5 w-5 text-slate-400" />
                      <span>{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            <Avatar className="h-10 w-10">
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{ backgroundColor: "#0ea5e9" }}
              >
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
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
