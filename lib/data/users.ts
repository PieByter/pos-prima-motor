export type UserRole = "Admin" | "Mekanik" | "Kasir";
export type UserStatus = "Aktif" | "Inactive";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  initials: string;
  avatarColor: string;
};

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

export const ROLES: UserRole[] = ["Admin", "Mekanik", "Kasir"];

export const dummyUsers: User[] = [
  {
    id: 1,
    name: "Admin Prima",
    email: "admin@primamotor.com",
    role: "Admin",
    status: "Aktif",
    lastLogin: "Just Now",
    initials: "AP",
    avatarColor: AVATAR_COLORS[0],
  },
  {
    id: 2,
    name: "Budi Santoso",
    email: "budi.mekanik@primamotor.com",
    role: "Mekanik",
    status: "Aktif",
    lastLogin: "2 hours ago",
    initials: "BS",
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: 3,
    name: "Dewi Putri",
    email: "dewi.kasir@primamotor.com",
    role: "Kasir",
    status: "Inactive",
    lastLogin: "5 days ago",
    initials: "DP",
    avatarColor: AVATAR_COLORS[7],
  },
  {
    id: 4,
    name: "Rudi Hermawan",
    email: "rudi.mekanik@primamotor.com",
    role: "Mekanik",
    status: "Aktif",
    lastLogin: "1 hour ago",
    initials: "RH",
    avatarColor: AVATAR_COLORS[2],
  },
  {
    id: 5,
    name: "Siti Aminah",
    email: "siti.kasir@primamotor.com",
    role: "Kasir",
    status: "Aktif",
    lastLogin: "30 minutes ago",
    initials: "SA",
    avatarColor: AVATAR_COLORS[3],
  },
  {
    id: 6,
    name: "Agus Prasetyo",
    email: "agus.mekanik@primamotor.com",
    role: "Mekanik",
    status: "Aktif",
    lastLogin: "3 hours ago",
    initials: "AP",
    avatarColor: AVATAR_COLORS[4],
  },
  {
    id: 7,
    name: "Rina Wati",
    email: "rina.kasir@primamotor.com",
    role: "Kasir",
    status: "Inactive",
    lastLogin: "2 weeks ago",
    initials: "RW",
    avatarColor: AVATAR_COLORS[5],
  },
  {
    id: 8,
    name: "Doni Saputra",
    email: "doni.admin@primamotor.com",
    role: "Admin",
    status: "Aktif",
    lastLogin: "Yesterday",
    initials: "DS",
    avatarColor: AVATAR_COLORS[6],
  },
  {
    id: 9,
    name: "Lina Marlina",
    email: "lina.kasir@primamotor.com",
    role: "Kasir",
    status: "Aktif",
    lastLogin: "4 hours ago",
    initials: "LM",
    avatarColor: AVATAR_COLORS[0],
  },
  {
    id: 10,
    name: "Hendra Gunawan",
    email: "hendra.mekanik@primamotor.com",
    role: "Mekanik",
    status: "Aktif",
    lastLogin: "6 hours ago",
    initials: "HG",
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: 11,
    name: "Yuli Astuti",
    email: "yuli.kasir@primamotor.com",
    role: "Kasir",
    status: "Inactive",
    lastLogin: "1 month ago",
    initials: "YA",
    avatarColor: AVATAR_COLORS[2],
  },
  {
    id: 12,
    name: "Bambang Tri",
    email: "bambang.mekanik@primamotor.com",
    role: "Mekanik",
    status: "Aktif",
    lastLogin: "8 hours ago",
    initials: "BT",
    avatarColor: AVATAR_COLORS[3],
  },
];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
