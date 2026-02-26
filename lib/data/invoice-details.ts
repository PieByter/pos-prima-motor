import { formatRupiah } from "@/lib/data/items";
import type { TransactionStatus, TransactionType } from "@/lib/data/transactions";

export type InvoiceItemType = "Service" | "Part";

export type InvoiceItem = {
  id: number;
  name: string;
  description: string;
  type: InvoiceItemType;
  unitPrice: number;
  qty: number;
  discount: number;
  subtotal: number;
  icon: "wrench" | "droplet" | "cog" | "disc-brake" | "package" | "truck";
};

export type InvoiceDetail = {
  id: number;
  invoiceNumber: string;
  status: TransactionStatus;
  createdAt: string;
  transactionType: TransactionType;
  // Customer / Supplier
  entityName: string;
  entityPhone: string;
  entityVehicle?: string;
  entityPlate?: string;
  // Mechanic
  mechanicName: string;
  mechanicStation: string;
  jobStart: string;
  jobEnd: string;
  // Payment
  paymentMethod: string;
  transactionId: string;
  // Items
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  // Meta
  createdBy: string;
};

export const ITEM_TYPE_STYLES: Record<InvoiceItemType, string> = {
  Service:
    "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300",
  Part: "bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-300",
};

// Dummy sale invoices
export const dummySaleInvoices: Record<number, InvoiceDetail> = {
  1: {
    id: 1,
    invoiceNumber: "INV-2026-001",
    status: "Completed",
    createdAt: "2026-02-26 • 10:30 AM",
    transactionType: "sale",
    entityName: "Budi Santoso",
    entityPhone: "+62 812 3456 7890",
    entityVehicle: "Honda Vario 150",
    entityPlate: "B 1234 XYZ",
    mechanicName: "Agus Setiawan",
    mechanicStation: "Bay 03",
    jobStart: "10:35 AM",
    jobEnd: "11:45 AM",
    paymentMethod: "Credit Card (Visa)",
    transactionId: "TRX-998877",
    items: [
      {
        id: 1,
        name: "Full Service Package",
        description: "Standard periodic maintenance",
        type: "Service",
        unitPrice: 150000,
        qty: 1,
        discount: 0,
        subtotal: 150000,
        icon: "wrench",
      },
      {
        id: 2,
        name: "Synthetic Engine Oil",
        description: "Motul Scooter LE 10W-30",
        type: "Part",
        unitPrice: 85000,
        qty: 1,
        discount: 0,
        subtotal: 85000,
        icon: "droplet",
      },
      {
        id: 3,
        name: "CVT Roller Set",
        description: "Original Honda Parts",
        type: "Part",
        unitPrice: 120000,
        qty: 1,
        discount: 20000,
        subtotal: 100000,
        icon: "cog",
      },
      {
        id: 4,
        name: "Brake Pad Front",
        description: "Nissin Brake Systems",
        type: "Part",
        unitPrice: 75000,
        qty: 2,
        discount: 0,
        subtotal: 150000,
        icon: "disc-brake",
      },
    ],
    subtotal: 505000,
    totalDiscount: 20000,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 485000,
    createdBy: "Admin User",
  },
  2: {
    id: 2,
    invoiceNumber: "INV-2026-002",
    status: "Pending",
    createdAt: "2026-02-26 • 02:15 PM",
    transactionType: "sale",
    entityName: "Sarah Smith",
    entityPhone: "+62 813 9876 5432",
    entityVehicle: "Yamaha NMAX 155",
    entityPlate: "D 5678 ABC",
    mechanicName: "Steve L.",
    mechanicStation: "Bay 01",
    jobStart: "02:20 PM",
    jobEnd: "-",
    paymentMethod: "Pending",
    transactionId: "-",
    items: [
      {
        id: 1,
        name: "Oil Change Service",
        description: "Basic oil change with filter",
        type: "Service",
        unitPrice: 35000,
        qty: 1,
        discount: 0,
        subtotal: 35000,
        icon: "wrench",
      },
      {
        id: 2,
        name: "Yamalube Blue Core",
        description: "0.8L Synthetic",
        type: "Part",
        unitPrice: 10000,
        qty: 1,
        discount: 0,
        subtotal: 10000,
        icon: "droplet",
      },
    ],
    subtotal: 45000,
    totalDiscount: 0,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 45000,
    createdBy: "Admin User",
  },
  3: {
    id: 3,
    invoiceNumber: "INV-2026-003",
    status: "Completed",
    createdAt: "2026-02-25 • 09:00 AM",
    transactionType: "sale",
    entityName: "Robert Johnson",
    entityPhone: "+62 821 1111 2222",
    entityVehicle: "Honda PCX 160",
    entityPlate: "B 9999 DEF",
    mechanicName: "Mike R.",
    mechanicStation: "Bay 02",
    jobStart: "09:10 AM",
    jobEnd: "10:45 AM",
    paymentMethod: "Cash",
    transactionId: "TRX-998800",
    items: [
      {
        id: 1,
        name: "Full Service Package",
        description: "Standard periodic maintenance",
        type: "Service",
        unitPrice: 150000,
        qty: 1,
        discount: 0,
        subtotal: 150000,
        icon: "wrench",
      },
      {
        id: 2,
        name: "Michelin City Grip 2",
        description: "120/70-12 Rear",
        type: "Part",
        unitPrice: 200000,
        qty: 1,
        discount: 0,
        subtotal: 200000,
        icon: "disc-brake",
      },
    ],
    subtotal: 350000,
    totalDiscount: 0,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 350000,
    createdBy: "Admin User",
  },
  4: {
    id: 4,
    invoiceNumber: "INV-2026-004",
    status: "In Progress",
    createdAt: "2026-02-25 • 01:00 PM",
    transactionType: "sale",
    entityName: "Emily Davis",
    entityPhone: "+62 856 3333 4444",
    entityVehicle: "Suzuki Address",
    entityPlate: "F 2345 GHI",
    mechanicName: "Steve L.",
    mechanicStation: "Bay 01",
    jobStart: "01:10 PM",
    jobEnd: "-",
    paymentMethod: "Pending",
    transactionId: "-",
    items: [
      {
        id: 1,
        name: "Brake Pad Replacement",
        description: "Front and rear service",
        type: "Service",
        unitPrice: 50000,
        qty: 1,
        discount: 0,
        subtotal: 50000,
        icon: "wrench",
      },
      {
        id: 2,
        name: "Brake Pad Set",
        description: "Suzuki OEM",
        type: "Part",
        unitPrice: 39500,
        qty: 1,
        discount: 0,
        subtotal: 39500,
        icon: "disc-brake",
      },
    ],
    subtotal: 89500,
    totalDiscount: 0,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 89500,
    createdBy: "Admin User",
  },
  5: {
    id: 5,
    invoiceNumber: "INV-2026-005",
    status: "Cancelled",
    createdAt: "2026-02-24 • 04:30 PM",
    transactionType: "sale",
    entityName: "Michael Brown",
    entityPhone: "+62 877 5555 6666",
    entityVehicle: "Honda Beat",
    entityPlate: "B 7890 JKL",
    mechanicName: "Unassigned",
    mechanicStation: "-",
    jobStart: "-",
    jobEnd: "-",
    paymentMethod: "Cancelled",
    transactionId: "-",
    items: [
      {
        id: 1,
        name: "Chain Clean & Lube",
        description: "Standard chain maintenance",
        type: "Service",
        unitPrice: 12000,
        qty: 1,
        discount: 0,
        subtotal: 12000,
        icon: "wrench",
      },
    ],
    subtotal: 12000,
    totalDiscount: 0,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 12000,
    createdBy: "Admin User",
  },
};

// Dummy purchase invoices
export const dummyPurchaseInvoices: Record<number, InvoiceDetail> = {
  1: {
    id: 1,
    invoiceNumber: "PO-2026-001",
    status: "Completed",
    createdAt: "2026-02-26 • 08:00 AM",
    transactionType: "purchase",
    entityName: "PT Astra Honda Motor",
    entityPhone: "+62 21 888 9999",
    mechanicName: "-",
    mechanicStation: "-",
    jobStart: "-",
    jobEnd: "-",
    paymentMethod: "Bank Transfer",
    transactionId: "TRF-001122",
    items: [
      {
        id: 1,
        name: "Honda Brake Pads (Bulk)",
        description: "OEM Front - 50 pcs",
        type: "Part",
        unitPrice: 12500,
        qty: 50,
        discount: 0,
        subtotal: 625000,
        icon: "package",
      },
      {
        id: 2,
        name: "CVT Roller Set",
        description: "Original Honda - 30 pcs",
        type: "Part",
        unitPrice: 95000,
        qty: 30,
        discount: 0,
        subtotal: 2850000,
        icon: "cog",
      },
      {
        id: 3,
        name: "Spark Plug CR8E",
        description: "NGK Standard - 100 pcs",
        type: "Part",
        unitPrice: 10250,
        qty: 100,
        discount: 0,
        subtotal: 1025000,
        icon: "package",
      },
    ],
    subtotal: 4500000,
    totalDiscount: 0,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 4500000,
    createdBy: "Admin User",
  },
  2: {
    id: 2,
    invoiceNumber: "PO-2026-002",
    status: "Pending",
    createdAt: "2026-02-25 • 10:00 AM",
    transactionType: "purchase",
    entityName: "Motul Indonesia",
    entityPhone: "+62 21 777 8888",
    mechanicName: "-",
    mechanicStation: "-",
    jobStart: "-",
    jobEnd: "-",
    paymentMethod: "Pending",
    transactionId: "-",
    items: [
      {
        id: 1,
        name: "Motul 5100 4T 10W40",
        description: "Synthetic Blend 1L - 20 pcs",
        type: "Part",
        unitPrice: 82000,
        qty: 20,
        discount: 0,
        subtotal: 1640000,
        icon: "droplet",
      },
      {
        id: 2,
        name: "Motul Scooter LE 10W-30",
        description: "0.8L - 30 pcs",
        type: "Part",
        unitPrice: 38000,
        qty: 30,
        discount: 20000,
        subtotal: 1140000,
        icon: "droplet",
      },
    ],
    subtotal: 2800000,
    totalDiscount: 20000,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 2780000,
    createdBy: "Admin User",
  },
  3: {
    id: 3,
    invoiceNumber: "PO-2026-003",
    status: "Completed",
    createdAt: "2026-02-24 • 09:30 AM",
    transactionType: "purchase",
    entityName: "Michelin Tires",
    entityPhone: "+62 21 666 7777",
    mechanicName: "-",
    mechanicStation: "-",
    jobStart: "-",
    jobEnd: "-",
    paymentMethod: "Bank Transfer",
    transactionId: "TRF-003344",
    items: [
      {
        id: 1,
        name: "Michelin City Grip 2",
        description: "120/70-12 - 16 pcs",
        type: "Part",
        unitPrice: 420000,
        qty: 16,
        discount: 0,
        subtotal: 6720000,
        icon: "disc-brake",
      },
    ],
    subtotal: 6720000,
    totalDiscount: 0,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: 6720000,
    createdBy: "Admin User",
  },
};

export function getInvoice(
  type: "sale" | "purchase",
  id: number
): InvoiceDetail | undefined {
  return type === "sale"
    ? dummySaleInvoices[id]
    : dummyPurchaseInvoices[id];
}

export { formatRupiah };
