export type Item = {
  id: number;
  name: string;
  description: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  serviceFee: number;
  stock: number;
  picture: string | null;
  createdAt: string;
};

export const CATEGORIES = [
  "Brake System",
  "Oil & Fluids",
  "Accessories",
  "Tires & Wheels",
  "Maintenance",
  "Engine Parts",
  "Body Kits",
  "Electrical",
] as const;

export const dummyItems: Item[] = [
  {
    id: 1,
    name: "Honda Brake Pads - Front",
    description: "OEM standard replacement",
    sku: "BP-HND-001",
    category: "Brake System",
    purchasePrice: 12500,
    sellingPrice: 25000,
    serviceFee: 15000,
    stock: 124,
    picture: null,
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    name: "Motul 5100 4T 10W40",
    description: "Synthetic Blend - 1L",
    sku: "OIL-MTL-5100",
    category: "Oil & Fluids",
    purchasePrice: 82000,
    sellingPrice: 149900,
    serviceFee: 0,
    stock: 15,
    picture: null,
    createdAt: "2026-01-20",
  },
  {
    id: 3,
    name: "Yamaha Sport Windshield",
    description: "For R15 V3 model",
    sku: "ACC-YAM-WND",
    category: "Accessories",
    purchasePrice: 350000,
    sellingPrice: 550000,
    serviceFee: 50000,
    stock: 2,
    picture: null,
    createdAt: "2026-02-01",
  },
  {
    id: 4,
    name: "Michelin City Grip 2",
    description: "120/70-12 Rear",
    sku: "TR-MCH-CG2",
    category: "Tires & Wheels",
    purchasePrice: 420000,
    sellingPrice: 680000,
    serviceFee: 30000,
    stock: 45,
    picture: null,
    createdAt: "2026-02-05",
  },
  {
    id: 5,
    name: "Chain Clean & Lube Kit",
    description: "Generic Brand",
    sku: "CH-KIT-009",
    category: "Maintenance",
    purchasePrice: 150000,
    sellingPrice: 299900,
    serviceFee: 0,
    stock: 212,
    picture: null,
    createdAt: "2026-02-10",
  },
  {
    id: 6,
    name: "NGK Spark Plug CR8E",
    description: "Standard copper core",
    sku: "ENG-NGK-CR8E",
    category: "Engine Parts",
    purchasePrice: 18000,
    sellingPrice: 35000,
    serviceFee: 10000,
    stock: 89,
    picture: null,
    createdAt: "2026-02-12",
  },
  {
    id: 7,
    name: "Aspira Rear Shock Absorber",
    description: "For Vario 150 series",
    sku: "ENG-ASP-RSA",
    category: "Engine Parts",
    purchasePrice: 185000,
    sellingPrice: 320000,
    serviceFee: 50000,
    stock: 8,
    picture: null,
    createdAt: "2026-02-14",
  },
  {
    id: 8,
    name: "LED Headlight Bulb H4",
    description: "6000K White - Universal",
    sku: "ELC-LED-H4",
    category: "Electrical",
    purchasePrice: 45000,
    sellingPrice: 89000,
    serviceFee: 20000,
    stock: 34,
    picture: null,
    createdAt: "2026-02-18",
  },
];

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getStockStatus(stock: number) {
  if (stock <= 5) return { label: `${stock} in stock`, variant: "critical" as const };
  if (stock <= 20) return { label: `${stock} in stock`, variant: "warning" as const };
  return { label: `${stock} in stock`, variant: "safe" as const };
}
