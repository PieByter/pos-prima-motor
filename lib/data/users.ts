export type UserRole = "Admin" | "Mekanik" | "Kasir";
export type UserStatus = "Aktif" | "Inactive";

export const ROLE_STYLES: Record<UserRole, string> = {
  Admin:
    "bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-300",
  Mekanik:
    "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300",
  Kasir:
    "bg-teal-50 text-teal-700 ring-teal-700/10 dark:bg-teal-900/30 dark:text-teal-300",
};

export const STATUS_STYLES: Record<UserStatus, string> = {
  Aktif:
    "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400",
  Inactive:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400",
};

export const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-slate-200 text-slate-600",
];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
