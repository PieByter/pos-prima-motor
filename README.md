# 🏍️ POS Prima Motor

> Point of Sale untuk toko sparepart motor — kelola penjualan, pembelian, stok, pelanggan, supplier, diskon & laporan.

## ✨ Fitur

- **Dashboard** — ringkasan penjualan, stok menipis, transaksi terbaru, performa mekanik
- **Master Data** — kelola barang (item), kategori, brand
- **Transaksi** — penjualan & pembelian dengan barcode scanner, struk cetak, diskon
- **Inventori** — stok real-time, mutasi stok, stok opname, riwayat harga
- **Pelanggan & Supplier** — CRUD lengkap dengan pencarian
- **Retur** — retur penjualan & pembelian dengan pengembalian stok
- **Diskon** — diskon persen/nominal, periode, minimum transaksi
- **Biaya Operasional** — catat pengeluaran harian
- **Laporan** — penjualan, pembelian, laba/rugi, performa mekanik, gaji mingguan
- **Notifikasi Real-time** — alert stok kritis, transaksi besar, retur (via Supabase Realtime)
- **Role-based Access** — Admin (full akses) & Mekanik (terbatas)
- **Dark Mode** + **i18n** (ID/EN)
- **PWA** — bisa di-install di HP sebagai app

## 🛠️ Tech Stack

| Layer | Teknologi |
| ------- | ----------- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Icons | lucide-react |
| PWA | Web App Manifest + Service Worker |

## 🚀 Getting Started

### Prasyarat

- **Node.js** 20+
- **pnpm** (pakai `corepack enable`)
- **Supabase project** (free tier cukup)

### Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd pos-prima-motor

# 2. Install dependencies
pnpm install

# 3. Copy & isi environment variables
cp .env .env.local
# Edit .env.local — isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#   SUPABASE_SERVICE_ROLE_KEY, dan DATABASE_URL dari Supabase Dashboard.

# 4. Jalankan database migration
pnpm db:migrate

# 5. Jalankan dev server
pnpm dev
# Buka http://localhost:3000
```

### Environment Variables

| Variable | Dari mana |
| ---------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (port 6543 pooler) |

> ⚠️ `.env.local` jangan di-commit ke git. Template: `.env`

## 📦 Scripts

| Command | Fungsi |
| --------- | -------- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate file migration SQL dari schema |
| `pnpm db:migrate` | Apply migration ke database |
| `pnpm db:studio` | Buka Drizzle Studio (GUI) |

## 📁 Struktur Project

```text
app/                    # Next.js App Router
├── (auth)/             # Login, register, forgot password
├── (dashboard)/        # Dashboard + semua halaman POS
└── api/                # REST API routes (40+ endpoints)

components/
├── ui/                 # shadcn/ui primitives
├── layout/             # Sidebar, navbar, notification dropdown
├── dashboard/          # Komponen dashboard
├── transactions/       # Form transaksi, receipt, barcode scanner
├── master-data/        # Form & tabel master data
├── customers/          # Form & tabel customer
├── suppliers/          # Form & tabel supplier
├── reports/            # Tabel laporan
└── settings/           # Profile, user management

lib/
├── db/                 # Drizzle schema + migrator
├── services/           # Business logic layer
├── supabase/           # Supabase client (client, server, admin)
├── hooks/              # Custom hooks
├── types/              # TypeScript types
├── locales/            # i18n (ID + EN)
└── data/               # Format utilities
```

## 🗄️ Database

19 tabel + 1 view, dikelola via Drizzle ORM:

`profiles` · `categories` · `brands` · `items` · `customers` · `suppliers` · `purchases` · `purchase_details` · `sales` · `sale_details` · `stock_movements` · `stock_summary` (view) · `discounts` · `discount_items` · `payment_methods` · `expenses` · `sales_returns` · `sales_return_details` · `purchase_returns` · `purchase_return_details` · `activity_logs` · `notifications`

> Schema source of truth: `lib/db/schema.ts` (schema-first — ubah schema, lalu generate)  
> Migrations: `./drizzle/` — apply via `npx drizzle-kit migrate`

### Workflow migrasi (standar)

```bash
# 1. Ubah lib/db/schema.ts sesuai kebutuhan
# 2. Generate file migration (lokal, tanpa efek ke database)
npx drizzle-kit generate

# 3. Review file .sql yang dibuat di ./drizzle/ (wajib, 5 detik)

# 4. Push ke Supabase
npx drizzle-kit migrate
```

> `drizzle.config.ts` wajib pakai `DIRECT_URL` (port 5432), bukan pooled `DATABASE_URL` (port 6543) — keduanya sudah dikonfigurasi.  
> Alternatif setara: `pnpm db:generate` / `pnpm db:migrate` (script `lib/db/migrate.ts`), hasilnya sama.

## 📄 License

Private — Prima Motor.
