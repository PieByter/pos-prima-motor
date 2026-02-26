import { formatRupiah } from "@/lib/data/items";

export type TransactionStatus =
  | "Completed"
  | "Pending"
  | "In Progress"
  | "Cancelled";

export type TransactionType = "sale" | "purchase";

export type Transaction = {
  id: number;
  invoiceNumber: string;
  date: string;
  customerOrSupplier: string;
  customerInitials: string;
  avatarColor: string;
  mechanic: string;
  status: TransactionStatus;
  totalAmount: number;
};

export const STATUS_STYLES: Record<TransactionStatus, { dot: string; bg: string }> = {
  Completed: {
    dot: "bg-green-500",
    bg: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  Pending: {
    dot: "bg-yellow-500",
    bg: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  "In Progress": {
    dot: "bg-blue-500",
    bg: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  Cancelled: {
    dot: "bg-red-500",
    bg: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export const STATUSES: TransactionStatus[] = [
  "Completed",
  "Pending",
  "In Progress",
  "Cancelled",
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const dummySales: Transaction[] = [
  {
    id: 1,
    invoiceNumber: "INV-2026-001",
    date: "2026-02-26",
    customerOrSupplier: "John Doe",
    customerInitials: "JD",
    avatarColor: AVATAR_COLORS[0],
    mechanic: "Mike R.",
    status: "Completed",
    totalAmount: 125000,
  },
  {
    id: 2,
    invoiceNumber: "INV-2026-002",
    date: "2026-02-26",
    customerOrSupplier: "Sarah Smith",
    customerInitials: "SS",
    avatarColor: AVATAR_COLORS[1],
    mechanic: "Steve L.",
    status: "Pending",
    totalAmount: 45000,
  },
  {
    id: 3,
    invoiceNumber: "INV-2026-003",
    date: "2026-02-25",
    customerOrSupplier: "Robert Johnson",
    customerInitials: "RJ",
    avatarColor: AVATAR_COLORS[2],
    mechanic: "Mike R.",
    status: "Completed",
    totalAmount: 350000,
  },
  {
    id: 4,
    invoiceNumber: "INV-2026-004",
    date: "2026-02-25",
    customerOrSupplier: "Emily Davis",
    customerInitials: "ED",
    avatarColor: AVATAR_COLORS[3],
    mechanic: "Steve L.",
    status: "In Progress",
    totalAmount: 89500,
  },
  {
    id: 5,
    invoiceNumber: "INV-2026-005",
    date: "2026-02-24",
    customerOrSupplier: "Michael Brown",
    customerInitials: "MB",
    avatarColor: AVATAR_COLORS[4],
    mechanic: "Unassigned",
    status: "Cancelled",
    totalAmount: 12000,
  },
  {
    id: 6,
    invoiceNumber: "INV-2026-006",
    date: "2026-02-24",
    customerOrSupplier: "Andi Prasetyo",
    customerInitials: "AP",
    avatarColor: AVATAR_COLORS[5],
    mechanic: "Mike R.",
    status: "Completed",
    totalAmount: 275000,
  },
  {
    id: 7,
    invoiceNumber: "INV-2026-007",
    date: "2026-02-23",
    customerOrSupplier: "Lisa Wulandari",
    customerInitials: "LW",
    avatarColor: AVATAR_COLORS[6],
    mechanic: "Steve L.",
    status: "Completed",
    totalAmount: 198000,
  },
  {
    id: 8,
    invoiceNumber: "INV-2026-008",
    date: "2026-02-23",
    customerOrSupplier: "Bambang Sutrisno",
    customerInitials: "BS",
    avatarColor: AVATAR_COLORS[7],
    mechanic: "Mike R.",
    status: "Pending",
    totalAmount: 67500,
  },
];

export const dummyPurchases: Transaction[] = [
  {
    id: 1,
    invoiceNumber: "PO-2026-001",
    date: "2026-02-26",
    customerOrSupplier: "PT Astra Honda Motor",
    customerInitials: initials("PT Astra Honda Motor"),
    avatarColor: AVATAR_COLORS[0],
    mechanic: "-",
    status: "Completed",
    totalAmount: 4500000,
  },
  {
    id: 2,
    invoiceNumber: "PO-2026-002",
    date: "2026-02-25",
    customerOrSupplier: "Motul Indonesia",
    customerInitials: initials("Motul Indonesia"),
    avatarColor: AVATAR_COLORS[1],
    mechanic: "-",
    status: "Pending",
    totalAmount: 2800000,
  },
  {
    id: 3,
    invoiceNumber: "PO-2026-003",
    date: "2026-02-24",
    customerOrSupplier: "Michelin Tires",
    customerInitials: initials("Michelin Tires"),
    avatarColor: AVATAR_COLORS[2],
    mechanic: "-",
    status: "Completed",
    totalAmount: 6720000,
  },
  {
    id: 4,
    invoiceNumber: "PO-2026-004",
    date: "2026-02-23",
    customerOrSupplier: "NGK Spark Plugs",
    customerInitials: initials("NGK Spark Plugs"),
    avatarColor: AVATAR_COLORS[3],
    mechanic: "-",
    status: "In Progress",
    totalAmount: 1800000,
  },
  {
    id: 5,
    invoiceNumber: "PO-2026-005",
    date: "2026-02-22",
    customerOrSupplier: "Aspira Parts",
    customerInitials: initials("Aspira Parts"),
    avatarColor: AVATAR_COLORS[4],
    mechanic: "-",
    status: "Completed",
    totalAmount: 3250000,
  },
  {
    id: 6,
    invoiceNumber: "PO-2026-006",
    date: "2026-02-21",
    customerOrSupplier: "Federal Parts",
    customerInitials: initials("Federal Parts"),
    avatarColor: AVATAR_COLORS[5],
    mechanic: "-",
    status: "Cancelled",
    totalAmount: 950000,
  },
  {
    id: 7,
    invoiceNumber: "PO-2026-007",
    date: "2026-02-20",
    customerOrSupplier: "Indoparts",
    customerInitials: initials("Indoparts"),
    avatarColor: AVATAR_COLORS[6],
    mechanic: "-",
    status: "Completed",
    totalAmount: 5100000,
  },
];

export { formatRupiah };
