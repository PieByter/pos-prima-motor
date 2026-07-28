"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ROLE_STYLES,
  STATUS_STYLES,
  getInitials,
  AVATAR_COLORS,
} from "@/lib/data/users";
import { UserFormDialog } from "./user-form-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

const USERS_PER_PAGE = 3;

type UiUser = {
  id: number;
  apiId: string;
  name: string;
  email: string;
  role: "Admin" | "Mekanik" | "Kasir";
  status: "Aktif" | "Inactive";
  lastLogin: string;
  initials: string;
  avatarColor: string;
  weekly_salary?: number;
  service_commission_pct?: number;
  hire_date?: string;
};

export function UsersTable() {
  const [users, setUsers] = useState<UiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UiUser | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<UiUser | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) {
          let errorMessage = `Failed to fetch users (${response.status})`;
          try {
            const errorText = await response.text();
            const parsed = errorText ? JSON.parse(errorText) : null;
            if (parsed?.error) errorMessage += `: ${parsed.error}`;
          } catch {
            // Fall back to status-only error message
          }
          if (response.status === 500) {
            setUsers([]);
            return;
          }
          throw new Error(errorMessage);
        }

        const json = await response.json();
        const rows = (json ?? []) as Array<{
          id: string;
          name: string;
          role: "admin" | "mekanik";
          is_active: boolean;
          created_at: string;
          weekly_salary?: number;
          service_commission_pct?: number;
          hire_date?: string;
        }>;

        const mapped: UiUser[] = rows.map((u, idx) => ({
          id: idx + 1,
          apiId: u.id,
          name: u.name,
          email: `${u.name.toLowerCase().replace(/\s+/g, ".")}@primamotor.com`,
          role: u.role === "admin" ? "Admin" : "Mekanik",
          status: u.is_active ? "Aktif" : "Inactive",
          lastLogin: "-",
          initials: getInitials(u.name),
          avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          weekly_salary: u.weekly_salary,
          service_commission_pct: u.service_commission_pct,
          hire_date: u.hire_date,
        }));

        setUsers(mapped);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * USERS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * USERS_PER_PAGE, users.length);

  async function handleToggleStatus(id: number) {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const patch = await fetch(`/api/users/${target.apiId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: target.status !== "Aktif" }),
    });

    if (patch.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: u.status === "Aktif" ? "Inactive" : "Aktif" }
            : u
        )
      );
    }
  }

  async function handleDeleteUser(id: number) {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const del = await fetch(`/api/users/${target.apiId}`, { method: "DELETE" });
    if (del.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  }

  async function handleSaveUser(data: {
    name: string;
    role: "admin" | "mekanik";
    is_active: boolean;
    password?: string;
    weekly_salary?: number;
    service_commission_pct?: number;
    hire_date?: string;
  }) {
    if (editingUser) {
      // Edit existing user — send only provided fields
      const payload: Record<string, unknown> = {
        name: data.name,
        role: data.role,
        is_active: data.is_active,
      }
      if (data.password) payload.password = data.password
      if (data.weekly_salary !== undefined) payload.weekly_salary = data.weekly_salary
      if (data.service_commission_pct !== undefined) payload.service_commission_pct = data.service_commission_pct
      if (data.hire_date !== undefined) payload.hire_date = data.hire_date

      const res = await fetch(`/api/users/${editingUser.apiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error("Failed to save user:", err.error)
        return // stop — don't refresh list on error
      }
    }
    // Refresh list
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const rows = (json ?? []) as Array<{
        id: string;
        name: string;
        role: "admin" | "mekanik";
        is_active: boolean;
        created_at: string;
        weekly_salary?: number;
        service_commission_pct?: number;
        hire_date?: string;
      }>;
      const mapped: UiUser[] = rows.map((u, idx) => ({
        id: idx + 1,
        apiId: u.id,
        name: u.name,
        email: `${u.name.toLowerCase().replace(/\s+/g, ".")}@primamotor.com`,
        role: u.role === "admin" ? "Admin" : "Mekanik",
        status: u.is_active ? "Aktif" : "Inactive",
        lastLogin: "-",
        initials: getInitials(u.name),
        avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        weekly_salary: u.weekly_salary,
        service_commission_pct: u.service_commission_pct,
        hire_date: u.hire_date,
      }));
      setUsers(mapped);
    }
  }

  function openEdit(user: UiUser) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function openReset(user: UiUser) {
    setResettingUser(user);
    setResetDialogOpen(true);
  }

  async function handleResetPassword(userId: string, newPassword: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Gagal mereset password");
    }
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Daftar Pengguna
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola akses dan akun karyawan
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setDialogOpen(true);
          }}
          className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Nama
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell"
                >
                  Terakhir Login
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell"
                >
                  Gaji/Minggu
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell"
                >
                  Komisi
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </span>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data pengguna.
                  </td>
                </tr>
              ) : (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {/* Name & Email */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${user.avatarColor}`}
                      >
                        {user.initials}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[user.role]}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[user.status]}`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {user.lastLogin}
                  </td>

                  {/* Weekly Salary */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right hidden md:table-cell">
                    {user.role === "Mekanik" && user.weekly_salary ? (
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(user.weekly_salary)}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>

                  {/* Commission % */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right hidden md:table-cell">
                    {user.role === "Mekanik" && user.service_commission_pct ? (
                      <span className="font-mono font-medium text-sky-600 dark:text-sky-400">
                        {user.service_commission_pct}%
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-sky-500"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Pengguna
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.status === "Aktif" ? (
                            <>
                              <ShieldOff className="h-4 w-4" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              Aktifkan
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => openReset(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus Pengguna
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 sm:px-6">
          <p className="text-sm text-slate-700 dark:text-slate-400">
            Showing{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {startIndex}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {endIndex}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900 dark:text-white">
              {users.length}
            </span>{" "}
            results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show max 5 page buttons around current page
                if (totalPages <= 5) return true;
                if (page === 1 || page === totalPages) return true;
                return Math.abs(page - currentPage) <= 1;
              })
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && page - prev > 1;
                return (
                  <span key={page} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-1 text-slate-400 text-sm">…</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      className={`h-8 w-8 ${
                        currentPage === page
                          ? "bg-sky-500 hover:bg-sky-600 text-white"
                          : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </span>
                );
              })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />

      <ResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        user={resettingUser ? { apiId: resettingUser.apiId, name: resettingUser.name } : null}
        onReset={handleResetPassword}
      />
    </section>
  );
}
