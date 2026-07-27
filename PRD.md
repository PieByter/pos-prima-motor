# PRD — POS Prima Motor

## 1. Overview

| Item | Detail |
| --- | --- |
| **Nama Aplikasi** | POS Prima Motor |
| **Deskripsi** | Aplikasi Point of Sale (POS) untuk toko sparepart motor. Mengelola penjualan, pembelian, stok barang, data pelanggan, supplier, diskon, dan laporan keuangan. |
| **Tech Stack** | Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **Database** | Supabase (PostgreSQL) + Supabase Auth |
| **Hosting** | Vercel |
| **UI Library** | shadcn/ui (New York style) + Lucide Icons |
| **Target User** | Admin toko & Mekanik |

---

## 2. Arsitektur & Koneksi Database

### 2.1 Tech Architecture

```text
┌───────────────────────────────────────────────────┐
│                   VERCEL (Hosting)                │
│  ┌─────────────────────────────────────────────┐  │
│  │           Next.js 16 (App Router)           │  │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐ │  │
│  │  │  Pages   │   │   API    │   │  Server  │ │  │
│  │  │ (RSC)    │   │  Routes  │   │ Actions  │ │  │
│  │  └────┬─────┘   └────┬─────┘   └────┬─────┘ │  │
│  │       └──────────────┴──────────────┘       │  │
│  │                      │                      │  │
│  │           Supabase Client (SDK)             │  │
│  └──────────────────────┬──────────────────────┘  │
└─────────────────────────┼─────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────┐
│                 SUPABASE (Backend)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   Auth   │  │ Storage  │  │   PostgreSQL DB  │   │
│  │ (Login)  │  │ (Gambar) │  │   (Data Utama)   │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2.2 Koneksi Supabase

**File:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

// Client-side (browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
```

**Environment Variables** (`.env.local`):

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

### 2.3 Database Schema (ERD)

```text
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│  auth.users  │       │   profiles   │       │    customers     │
│──────────────│       │──────────────│       │──────────────────│
│ id (UUID) PK │◄──────│ id (UUID) PK │       │ id (BIGSERIAL)   │
│ email        │       │ name         │       │ name             │
│ ...          │       │ role         │       │ phone            │
└──────┬───────┘       │ is_active    │       │ address          │
       │               │ profile_pic  │       └────────┬─────────┘
       │               └──────────────┘                │
       │                                               │
       │    ┌──────────────┐      ┌────────────────┐   │
       │    │  suppliers   │      │     items      │   │
       │    │──────────────│      │────────────────│   │
       │    │ id PK        │      │ id PK          │   │
       │    │ name         │      │ name           │   │
       │    │ phone        │      │ sku (UNIQUE)   │   │
       │    │ address      │      │ purchase_price │   │
       │    └──────┬───────┘      │ selling_price  │   │
       │           │              │ service_fee    │   │
       │           │              │ picture        │   │
       │           │              └───┬──────┬─────┘   │
       │           │                  │      │         │
       ▼           ▼                  │      │         ▼
┌──────────────────────┐    ┌────────────────────────────────┐
│     purchases        │    │          sales                 │
│──────────────────────│    │────────────────────────────────│
│ id PK                │    │ id PK                          │
│ supplier_id FK ──────│    │ customer_id FK ────────────────│
│ purchase_date        │    │ mechanic_id FK (auth.users)    │
│ total_amount         │    │ sale_date                      │
│ created_by (UUID) FK │    │ total_amount                   │
└──────────┬───────────┘    │ created_by (UUID) FK           │
           │                └──────────┬─────────────────────┘
           ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  purchase_details    │    │     sale_details         │
│──────────────────────│    │──────────────────────────│
│ id PK                │    │ id PK                    │
│ purchase_id FK       │    │ sale_id FK               │
│ item_id FK           │    │ item_id FK               │
│ quantity             │    │ quantity                 │
│ price                │    │ base_price               │
│ subtotal             │    │ discount_amount          │
└──────────────────────┘    │ final_price              │
                            │ service_fee              │
                            │ subtotal                 │
                            └──────────────────────────┘

┌──────────────────────┐    ┌──────────────┐    ┌────────────────┐
│   stock_movements    │    │  discounts   │    │ discount_items │
│──────────────────────│    │──────────────│    │────────────────│
│ id PK                │    │ id PK        │    │ discount_id FK │
│ item_id FK           │    │ name         │    │ item_id FK     │
│ type (IN/OUT)        │    │ type         │    │ PK(d_id,i_id)  │
│ quantity             │    │ value        │    └────────────────┘
│ reference_type       │    │ min_trans    │
│ reference_id         │    │ is_active    │
└──────────────────────┘    │ start_date   │
                            │ end_date     │
                            └──────────────┘
```

---

## 3. User Roles & Permissions

| Fitur | Admin | Mekanik |
| --- | --- | --- |
| Dashboard (lihat semua data) | ✅ | ❌ |
| Dashboard (lihat data sendiri) | ✅ | ✅ |
| Master Data (CRUD) | ✅ | ❌ |
| Pembelian (CRUD) | ✅ | ❌ |
| Penjualan (Create) | ✅ | ✅ |
| Penjualan (Edit/Delete) | ✅ | ❌ |
| Penjualan (Lihat sendiri) | ✅ | ✅ |
| Stok (Lihat) | ✅ | ✅ |
| Diskon (CRUD) | ✅ | ❌ |
| Laporan | ✅ | ❌ |
| Setting | ✅ | ❌ |

---

## 4. Navigasi & Sitemap

### 4.1 Struktur URL (App Router)

```text
app/
├── (auth)/
│   ├── login/page.tsx              → /login
│   └── layout.tsx                  → Layout tanpa sidebar
│
├── (dashboard)/
│   ├── layout.tsx                  → Layout dengan Sidebar + Navbar
│   ├── page.tsx                    → /  (Dashboard utama)
│   │
│   ├── master-data/
│   │   ├── items/page.tsx          → /master-data/items
│   │   ├── customers/page.tsx      → /master-data/customers
│   │   └── suppliers/page.tsx      → /master-data/suppliers
│   │
│   ├── purchases/
│   │   ├── page.tsx                → /purchases  (List)
│   │   ├── create/page.tsx         → /purchases/create
│   │   └── [id]/page.tsx           → /purchases/:id (Detail)
│   │
│   ├── sales/
│   │   ├── page.tsx                → /sales  (List)
│   │   ├── create/page.tsx         → /sales/create
│   │   └── [id]/page.tsx           → /sales/:id (Detail)
│   │
│   ├── stock/page.tsx              → /stock
│   ├── discounts/page.tsx          → /discounts
│   ├── reports/page.tsx            → /reports
│   │
│   └── settings/
│       ├── page.tsx                → /settings (Profil)
│       └── users/page.tsx          → /settings/users (Kelola User)
```

### 4.2 Sidebar Navigation

```text
┌─────────────────────────────┐
│  🏍️  PRIMA MOTOR            │  ← Logo + Nama Toko
│                             │
│  ─────────────────────────  │
│                             │
│  📊  Dashboard              │  ← Aktif: bg-primary text-white
│                             │
│  ─── Master Data ────────   │  ← Group Label (collapsible)
│  📦  Barang / Item          │
│  👥  Pelanggan              │
│  🏭  Supplier               │
│                             │
│  ─── Transaksi ──────────   │  ← Group Label (collapsible)
│  🛒  Pembelian              │
│  💰  Penjualan              │
│                             │
│  ─── Inventori ──────────   │
│  📋  Stok Barang            │
│  🏷️  Diskon                 │
│                             │
│  ─── Lainnya ────────────   │
│  📈  Laporan                │
│  ⚙️  Pengaturan             │
│                             │
│  ─────────────────────────  │
│  👤 Admin Prima Motor       │  ← User info + Logout
│     admin@prima.com         │
└─────────────────────────────┘
```

**Sidebar Behavior:**

- Desktop (≥1024px): Sidebar tetap terbuka di kiri, lebar 256px
- Tablet (768-1023px): Sidebar bisa di-collapse jadi icon only (64px)
- Mobile (<768px): Sidebar tersembunyi, muncul sebagai drawer/overlay saat klik hamburger

### 4.3 Top Navbar

```text
┌─────────────────────────────────────────────────────────────┐
│  ☰  │  Dashboard                    🔔  👤 Admin ▼         │
│     │  Selamat datang, Admin!                               │
└─────────────────────────────────────────────────────────────┘
  │      │                              │    │
  │      │                              │    └─ Dropdown: Profile, Logout
  │      └─ Breadcrumb / Page Title     └─ Notification bell
  └─ Toggle Sidebar (mobile/tablet)
```

---

## 5. Halaman & UI Design

### 5.1 Login Page (`/login`)

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│              🏍️  PRIMA MOTOR                         │
│              Point of Sale System                    │
│                                                      │
│         ┌──────────────────────────────┐             │
│         │  📧 Email                    │             │
│         │  ┌──────────────────────────┐│             │
│         │  │ admin@prima.com          ││             │
│         │  └──────────────────────────┘│             │
│         │                              │             │
│         │  🔒 Password                 │             │
│         │  ┌──────────────────────────┐│             │
│         │  │ ••••••••            👁️   ││             │
│         │  └──────────────────────────┘│             │
│         │                              │             │
│         │  [      Masuk / Login      ] │             │
│         │                              │             │
│         └──────────────────────────────┘             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Spesifikasi:**

- Supabase Auth `signInWithPassword()`
- Setelah login, redirect ke `/` (Dashboard)
- Simpan session via Supabase cookie/localStorage
- Jika belum login, redirect semua route ke `/login`

---

### 5.2 Dashboard (`/`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard                                        Hari ini ▼    │
│  Selamat datang, Admin!                                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 💰       │  │ 🛒       │  │ 📦       │  │ 👥       │        │
│  │ Total    │  │ Total    │  │ Total    │  │ Total    │        │
│  │ Penjualan│  │ Pembelian│  │ Item     │  │ Customer │        │
│  │ Rp 25.5M │  │ Rp 18.2M │  │ 342      │  │ 156      │        │
│  │ ▲ 12%    │  │ ▼ 3%     │  │ ▲ 5      │  │ ▲ 8      │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐   │
│  │  📊 Grafik Penjualan       │  │  🏆 Item Terlaris       │   │
│  │     (Line/Bar Chart)       │  │                         │   │
│  │                             │  │  1. Ban IRC 80/90     │   │
│  │     ▄                       │  │  2. Oli Yamalube 1L   │   │
│  │   ▄ █ ▄                     │  │  3. Kampas Rem Honda  │   │
│  │ ▄ █ █ █ ▄                   │  │  4. Busi NGK          │   │
│  │ █ █ █ █ █                   │  │  5. V-Belt Vario      │   │
│  │ Sen Sel Rab Kam Jum Sab Min │  │                         │   │
│  └─────────────────────────────┘  └─────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐   │
│  │  ⚠️ Stok Menipis            │  │  🕐 Transaksi Terakhir  │   │
│  │                             │  │                         │   │
│  │  Kampas Rem  │ 3 pcs │ ⚠️  │  │  #INV-0045 │ Rp 250K  │   │
│  │  Baut 10mm   │ 5 pcs │ ⚠️  │  │  #INV-0044 │ Rp 1.2M  │   │
│  │  Seal Shock  │ 2 pcs │ 🔴  │  │  #INV-0043 │ Rp 89K   │   │
│  └─────────────────────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Komponen UI:**

- **Summary Cards** (4 kolom): Total Penjualan, Total Pembelian, Total Item, Total Customer
- **Chart Penjualan**: Line/Bar chart (gunakan library Recharts)
- **Item Terlaris**: Top 5 item paling banyak terjual
- **Stok Menipis**: Item dengan stok ≤ 5 (warning) atau ≤ 2 (danger)
- **Transaksi Terakhir**: 5 transaksi penjualan terbaru

**Data Query:**

```sql
-- Summary Cards
SELECT COUNT(*) FROM sales WHERE sale_date = CURRENT_DATE;
SELECT SUM(total_amount) FROM sales WHERE sale_date BETWEEN :start AND :end;
SELECT SUM(total_amount) FROM purchases WHERE purchase_date BETWEEN :start AND :end;

-- Item Terlaris
SELECT i.name, SUM(sd.quantity) as total_sold
FROM sale_details sd
JOIN items i ON i.id = sd.item_id
GROUP BY i.name
ORDER BY total_sold DESC LIMIT 5;

-- Stok Menipis
SELECT i.name,
  COALESCE(SUM(CASE WHEN sm.type='IN' THEN sm.quantity ELSE -sm.quantity END), 0) as stock
FROM items i
LEFT JOIN stock_movements sm ON sm.item_id = i.id
GROUP BY i.id, i.name
HAVING COALESCE(SUM(CASE WHEN sm.type='IN' THEN sm.quantity ELSE -sm.quantity END), 0) <= 5;
```

---

### 5.3 Master Data — Barang / Items (`/master-data/items`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Master Data > Barang                                           │
│                                                                  │
│  ┌──────────────────────────────┐          [+ Tambah Barang]    │
│  │  🔍 Cari barang...          │                                │
│  └──────────────────────────────┘                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ ☐ │ Foto │ Nama Barang    │ SKU      │ Harga Beli │ Harga  ││
│  │   │      │                │          │            │ Jual   ││
│  │───│──────│────────────────│──────────│────────────│────────││
│  │ ☐ │ 🖼️   │ Ban IRC 80/90  │ BAN-001  │ Rp 85.000  │Rp120K  ││
│  │ ☐ │ 🖼️   │ Oli Yamalube   │ OLI-001  │ Rp 28.000  │Rp 35K  ││
│  │ ☐ │ 🖼️   │ Kampas Rem     │ KR-001   │ Rp 15.000  │Rp 25K  ││
│  │ ☐ │ 🖼️   │ Busi NGK       │ BSI-001  │ Rp 12.000  │Rp 18K  ││
│  │ ☐ │ 🖼️   │ V-Belt Vario   │ VBL-001  │ Rp 65.000  │Rp 95K  ││
│  │───│──────│────────────────│──────────│────────────│────────││
│  │          │  ◀  1  2  3  ▶  │  Showing 1-10 of 50            ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Modal / Dialog — Tambah / Edit Barang:**

```text
┌──────────────────────────────────────────┐
│  Tambah Barang Baru                   ✕  │
│  ──────────────────────────────────────  │
│                                          │
│  Nama Barang *                           │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  SKU                                     │
│  ┌──────────────────────────────────┐    │
│  │ Auto-generate atau manual        │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌────────────────┐ ┌────────────────┐   │
│  │ Harga Beli *   │ │ Harga Jual *   │   │
│  │ Rp 0           │ │ Rp 0           │   │
│  └────────────────┘ └────────────────┘   │
│                                          │
│  Jasa Service                            │
│  ┌──────────────────────────────────┐    │
│  │ Rp 0                             │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Foto Barang                             │
│  ┌──────────────────────────────────┐    │
│  │  📁 Drag & drop atau klik upload │    │
│  └──────────────────────────────────┘    │
│                                          │
│        [Batal]        [Simpan]           │
└──────────────────────────────────────────┘
```

**Fitur Tabel:**

- Search / filter by nama atau SKU
- Pagination (10, 25, 50 per page)
- Sort per kolom (klik header)
- Bulk delete (checkbox)
- Action per row: Edit (✏️), Delete (🗑️)

---

### 5.4 Master Data — Pelanggan (`/master-data/customers`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Master Data > Pelanggan                                        │
│                                                                  │
│  🔍 Cari pelanggan...                      [+ Tambah Pelanggan] │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ # │ Nama Pelanggan    │ No. Telepon    │ Alamat       │ Aksi││
│  │───│───────────────────│────────────────│──────────────│─────││
│  │ 1 │ Budi Santoso      │ 0812-3456-7890 │ Jl. Merdeka  │ ✏️🗑️││
│  │ 2 │ Andi Wijaya       │ 0856-1234-5678 │ Jl. Sudirman │ ✏️🗑️││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Fields:** name*, phone, address

---

### 5.5 Master Data — Supplier (`/master-data/suppliers`)

Sama seperti Pelanggan. **Fields:** name*, phone, address

---

### 5.6 Pembelian (`/purchases`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Pembelian                                                       │
│                                                                  │
│  🔍 Cari...  📅 Filter Tanggal           [+ Buat Pembelian]     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ # │ Tanggal    │ Supplier       │ Total       │ Dibuat │Aksi││
│  │───│────────────│────────────────│─────────────│────────│────││
│  │ 1 │ 2026-02-26 │ PT Astra Honda │ Rp 5.250.000│ Admin  │ 👁️ ││
│  │ 2 │ 2026-02-25 │ CV Yamaha Part │ Rp 3.100.000│ Admin  │ 👁️ ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Form Buat Pembelian (`/purchases/create`):**

```text
┌──────────────────────────────────────────────────────────────────┐
│  Buat Pembelian Baru                                            │
│                                                                  │
│  ┌─────────────────────┐  ┌──────────────────────┐              │
│  │ Supplier *          │  │ Tanggal *            │              │
│  │ [Pilih Supplier ▼]  │  │ [2026-02-26]         │              │
│  └─────────────────────┘  └──────────────────────┘              │
│                                                                  │
│  Detail Barang                              [+ Tambah Baris]    │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Barang           │ Qty │ Harga Beli     │ Subtotal    │  ✕  ││
│  │──────────────────│─────│────────────────│─────────────│─────││
│  │ [Cari barang ▼]  │ [1] │ [Rp 85.000]   │ Rp 85.000   │  🗑️ ││
│  │ [Cari barang ▼]  │ [5] │ [Rp 28.000]   │ Rp 140.000  │  🗑️ ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│                              Total: Rp 225.000                   │
│                                                                  │
│                    [Batal]        [Simpan Pembelian]             │
└──────────────────────────────────────────────────────────────────┘
```

**Logic saat simpan:**

1. Insert ke `purchases` (header)
2. Insert ke `purchase_details` (detail per item)
3. Insert ke `stock_movements` (type = 'IN' per item)
4. Update stok otomatis

---

### 5.7 Penjualan (`/sales`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Penjualan                                                       │
│                                                                  │
│  🔍 Cari...  📅 Filter Tanggal           [+ Buat Penjualan]    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ # │ Tanggal    │ Pelanggan   │ Mekanik │ Total     │ Aksi   ││
│  │───│────────────│─────────────│─────────│───────────│────────││
│  │ 1 │ 2026-02-26 │ Budi S.     │ Doni    │ Rp 250.000│ 👁️ ✏️ 🗑️││
│  │ 2 │ 2026-02-26 │ Walk-in     │ Eko     │ Rp 1.2jt  │ 👁️ ✏️ 🗑️││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Form Buat Penjualan (`/sales/create`):**

```text
┌──────────────────────────────────────────────────────────────────┐
│  Buat Penjualan Baru                                            │
│                                                                  │
│  ┌─────────────────────┐  ┌──────────────────────┐              │
│  │ Pelanggan           │  │ Mekanik *            │              │
│  │ [Pilih/Buat Baru ▼] │  │ [Pilih Mekanik ▼]   │              │
│  └─────────────────────┘  └──────────────────────┘              │
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ Tanggal *            │                                       │
│  │ [2026-02-26]         │                                       │
│  └──────────────────────┘                                       │
│                                                                  │
│  Detail Barang                              [+ Tambah Baris]    │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Barang       │Qty│Harga   │Diskon   │Jasa    │Subtotal │ ✕  ││
│  │──────────────│───│────────│─────────│────────│─────────│────││
│  │[Cari item ▼] │[1]│Rp 120K │Rp 0    │Rp 15K  │Rp 135K  │ 🗑️ ││
│  │[Cari item ▼] │[2]│Rp 35K  │Rp 5K   │Rp 0    │Rp 65K   │ 🗑️ ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌───────────────────────────────┐                               │
│  │ Diskon Transaksi             │                                │
│  │ [Pilih diskon ▼]  -Rp 10.000 │                                │
│  └───────────────────────────────┘                               │
│                                                                  │
│                Subtotal:    Rp 200.000                            │
│                Diskon:     -Rp  10.000                            │
│                ──────────────────────                             │
│                TOTAL:       Rp 190.000                            │
│                                                                  │
│                   [Batal]        [Simpan Penjualan]              │
└──────────────────────────────────────────────────────────────────┘
```

**Logic saat simpan:**

1. Insert ke `sales` (header)
2. Insert ke `sale_details` (detail per item, termasuk diskon & jasa)
3. Insert ke `stock_movements` (type = 'OUT' per item)
4. Validasi stok cukup sebelum simpan

---

### 5.8 Stok Barang (`/stock`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Stok Barang                                                     │
│                                                                  │
│  🔍 Cari barang...   Filter: [Semua ▼] [Stok Menipis ▼]        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ # │ Barang         │ SKU     │ Stok │ Masuk │ Keluar│Status ││
│  │───│────────────────│─────────│──────│───────│───────│───────││
│  │ 1 │ Ban IRC 80/90  │ BAN-001 │  25  │  50   │  25   │ 🟢   ││
│  │ 2 │ Oli Yamalube   │ OLI-001 │  40  │ 100   │  60   │ 🟢   ││
│  │ 3 │ Kampas Rem     │ KR-001  │   3  │  20   │  17   │ 🟡   ││
│  │ 4 │ Seal Shock     │ SS-001  │   1  │  10   │   9   │ 🔴   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  🟢 Stok Aman (>10)   🟡 Menipis (≤5)   🔴 Kritis (≤2)         │
└──────────────────────────────────────────────────────────────────┘
```

**Stok dihitung dari `stock_movements`:**

```sql
SELECT i.id, i.name, i.sku,
  COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) AS total_in,
  COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) AS total_out,
  COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) AS current_stock
FROM items i
LEFT JOIN stock_movements sm ON sm.item_id = i.id
GROUP BY i.id, i.name, i.sku
ORDER BY current_stock ASC;
```

---

### 5.9 Diskon (`/discounts`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Diskon                                                          │
│                                                                  │
│  🔍 Cari...                                [+ Tambah Diskon]    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ # │ Nama Diskon     │ Tipe   │ Nilai │ Berlaku      │ Aktif ││
│  │───│─────────────────│────────│───────│──────────────│───────││
│  │ 1 │ Diskon Lebaran  │ Persen │ 10%   │ 01/03 - 15/04│ 🟢   ││
│  │ 2 │ Potongan Member │ Fixed  │ Rp 5K │ Sepanjang    │ 🟢   ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Fields form:**

- Nama diskon*
- Tipe (percent / fixed)*
- Nilai*
- Min. transaksi
- Max persen (untuk tipe percent)
- Tanggal mulai & berakhir
- Aktif (toggle)
- Item terkait (multi-select, opsional — jika kosong berlaku semua)

---

### 5.10 Laporan (`/reports`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Laporan                                                         │
│                                                                  │
│  Tab: [Penjualan] [Pembelian] [Laba/Rugi]                       │
│                                                                  │
│  📅 Periode: [01/02/2026] - [26/02/2026]   [🔍 Filter]         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  📊 Grafik Penjualan per Hari (Bar Chart)                   ││
│  │                                                              ││
│  │    ▄▄                                                        ││
│  │  ▄▄██▄▄    ▄▄                                                ││
│  │  ██████▄▄  ██▄▄▄▄                                            ││
│  │  ████████████████                                             ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────┐                        │
│  │ Total Penjualan :  Rp 25.500.000    │                        │
│  │ Total Pembelian :  Rp 18.200.000    │                        │
│  │ Laba Kotor      :  Rp  7.300.000    │                        │
│  │ Total Jasa      :  Rp  1.250.000    │                        │
│  │ ─────────────────────────────────── │                        │
│  │ Laba Bersih     :  Rp  8.550.000    │                        │
│  └──────────────────────────────────────┘                        │
│                                                                  │
│  [📥 Export Excel]  [🖨️ Print]                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### 5.11 Pengaturan (`/settings`)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Pengaturan                                                      │
│                                                                  │
│  Tab: [Profil Saya] [Kelola User]                                │
│                                                                  │
│  ── Profil Saya ──────────────────────────────────────────────   │
│                                                                  │
│  ┌──────┐  Nama: Admin Prima Motor                               │
│  │ 👤   │  Email: admin@prima.com                               │
│  │ foto │  Role: Admin                                           │
│  └──────┘                                                        │
│           [📷 Ganti Foto]  [✏️ Edit Profil]  [🔒 Ganti Password]│
│                                                                  │
│  ── Kelola User (Admin Only) ─────────────────────────────────   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ # │ Nama         │ Email            │ Role    │ Aktif │ Aksi││
│  │───│──────────────│──────────────────│─────────│───────│─────││
│  │ 1 │ Admin        │ admin@prima.com  │ Admin   │ 🟢    │ ✏️  ││
│  │ 2 │ Doni Mekanik │ doni@prima.com   │ Mekanik │ 🟢    │ ✏️🗑️││
│  │ 3 │ Eko Mekanik  │ eko@prima.com    │ Mekanik │ 🔴    │ ✏️🗑️││
│  └──────────────────────────────────────────────────────────────┘│
│                                           [+ Tambah User]       │
└──────────────────────────────────────────────────────────────────┘
```

**Tambah User = Supabase Auth signup + insert ke `profiles`**

---

## 6. Komponen UI (shadcn/ui)

### 6.1 Komponen yang Digunakan

| Komponen | Kegunaan |
| --- | --- |
| `Button` | Semua tombol aksi |
| `Input` | Form fields |
| `Table` | Data tables di semua halaman list |
| `Dialog` | Modal tambah/edit data |
| `Select` | Dropdown pilihan (supplier, pelanggan, dll) |
| `Command` (Combobox) | Searchable dropdown (cari item, customer) |
| `Card` | Summary cards di dashboard |
| `Badge` | Status label (aktif/nonaktif, stok) |
| `Tabs` | Tab navigasi di laporan & settings |
| `Sheet` | Mobile sidebar drawer |
| `DropdownMenu` | Menu aksi per row & user dropdown navbar |
| `Avatar` | Foto profil user |
| `Breadcrumb` | Navigasi breadcrumb di navbar |
| `Pagination` | Navigasi halaman tabel |
| `Calendar` + `Popover` | Date picker |
| `Toast` / `Sonner` | Notifikasi sukses/error |
| `AlertDialog` | Konfirmasi hapus data |
| `Skeleton` | Loading state |
| `Switch` | Toggle aktif/nonaktif |

### 6.2 Folder Structure Komponen

```text
components/
├── ui/                        ← shadcn/ui (auto-generated)
│   ├── button.tsx
│   ├── input.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── ...
│
├── layout/
│   ├── sidebar.tsx            ← Sidebar navigasi
│   ├── navbar.tsx             ← Top navbar
│   ├── sidebar-item.tsx       ← Item di sidebar
│   └── mobile-sidebar.tsx     ← Sidebar versi mobile (Sheet)
│
├── dashboard/
│   ├── summary-cards.tsx      ← 4 card ringkasan
│   ├── sales-chart.tsx        ← Grafik penjualan
│   ├── top-items.tsx          ← Item terlaris
│   ├── low-stock-alert.tsx    ← Peringatan stok menipis
│   └── recent-transactions.tsx
│
├── data-table/
│   ├── data-table.tsx         ← Reusable table component
│   ├── data-table-pagination.tsx
│   ├── data-table-toolbar.tsx ← Search + Filter
│   └── columns/
│       ├── items-columns.tsx
│       ├── customers-columns.tsx
│       ├── suppliers-columns.tsx
│       ├── purchases-columns.tsx
│       ├── sales-columns.tsx
│       └── stock-columns.tsx
│
├── forms/
│   ├── item-form.tsx
│   ├── customer-form.tsx
│   ├── supplier-form.tsx
│   ├── purchase-form.tsx
│   ├── sale-form.tsx
│   └── discount-form.tsx
│
└── shared/
    ├── page-header.tsx        ← Judul halaman + tombol aksi
    ├── delete-dialog.tsx      ← Konfirmasi hapus (reusable)
    ├── empty-state.tsx        ← Tampilan data kosong
    └── currency-input.tsx     ← Input format Rupiah
```

---

## 7. Design System

### 7.1 Warna

| Token | Warna | Kegunaan |
| --- | --- | --- |
| `primary` | Blue 600 `#2563EB` | Tombol utama, sidebar aktif, link |
| `destructive` | Red 600 `#DC2626` | Hapus, error, stok kritis |
| `warning` | Amber 500 `#F59E0B` | Stok menipis, peringatan |
| `success` | Green 600 `#16A34A` | Stok aman, aktif, sukses |
| `background` | White `#FFFFFF` | Background utama |
| `sidebar` | Slate 900 `#0F172A` | Background sidebar gelap |
| `muted` | Slate 100 `#F1F5F9` | Background secondary |

### 7.2 Typography

| Element | Font | Size | Weight |
| --- | --- | --- | --- |
| Page Title | Geist Sans | 24px (text-2xl) | Semibold (600) |
| Section Title | Geist Sans | 18px (text-lg) | Semibold (600) |
| Table Header | Geist Sans | 14px (text-sm) | Medium (500) |
| Body | Geist Sans | 14px (text-sm) | Normal (400) |
| Caption | Geist Sans | 12px (text-xs) | Normal (400) |
| Monospace (harga) | Geist Mono | 14px (text-sm) | Medium (500) |

### 7.3 Spacing & Layout

- Sidebar width: 256px (desktop), 64px (collapsed), 0 (mobile)
- Navbar height: 64px
- Content padding: 24px (p-6)
- Card gap: 16px (gap-4)
- Table row height: 48px
- Border radius: 8px (rounded-lg)

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout |
| --- | --- | --- |
| Mobile | < 768px | Sidebar hidden (hamburger menu), single column cards, table scroll horizontal |
| Tablet | 768px - 1023px | Sidebar collapsed (icon only), 2 column cards |
| Desktop | ≥ 1024px | Sidebar full, 4 column cards, full table |

---

## 9. State Management & Data Flow

### 9.1 Data Fetching Pattern

```text
Page (Server Component)
  └── fetch data from Supabase
       └── Pass data as props to Client Components
            └── Client Components handle interactions (forms, modals)
                 └── Server Actions untuk mutasi data (insert/update/delete)
                      └── revalidatePath() untuk refresh data
```

### 9.2 Contoh Pattern

```typescript
// app/(dashboard)/master-data/items/page.tsx (Server Component)
import { supabase } from '@/lib/supabase'
import { ItemsDataTable } from '@/components/data-table/items-data-table'

export default async function ItemsPage() {
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title="Barang" action={<AddItemButton />} />
      <ItemsDataTable data={items ?? []} />
    </div>
  )
}
```

```typescript
// app/actions/items.ts (Server Action)
'use server'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function createItem(formData: FormData) {
  const { error } = await supabase.from('items').insert({
    name: formData.get('name'),
    sku: formData.get('sku'),
    purchase_price: formData.get('purchase_price'),
    selling_price: formData.get('selling_price'),
    service_fee: formData.get('service_fee') || 0,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/master-data/items')
}
```

---

## 10. Prioritas Pengembangan (Roadmap)

### Phase 1 — Foundation (Minggu 1)

- [x] Setup project Next.js + Supabase + Tailwind
- [x] Setup database schema di Supabase
- [x] Install shadcn/ui components
- [ ] Layout: Sidebar + Navbar
- [ ] Auth: Login page + middleware protect routes
- [ ] Profiles table + auto-create on signup

### Phase 2 — Master Data (Minggu 2)

- [ ] CRUD Barang (items) + upload foto ke Supabase Storage
- [ ] CRUD Pelanggan (customers)
- [ ] CRUD Supplier (suppliers)
- [ ] Reusable DataTable component

### Phase 3 — Transaksi (Minggu 3)

- [ ] Pembelian: form + auto stock_movements IN
- [ ] Penjualan: form + auto stock_movements OUT + diskon
- [ ] Detail view pembelian & penjualan

### Phase 4 — Dashboard & Laporan (Minggu 4)

- [ ] Dashboard: summary cards, charts (Recharts), alerts
- [ ] Halaman Stok
- [ ] Halaman Laporan + export Excel/print
- [ ] CRUD Diskon

### Phase 5 — Polish (Minggu 5)

- [ ] Settings: profil, kelola user
- [ ] RLS policies Supabase
- [ ] Responsive testing
- [ ] Deploy ke Vercel
- [ ] Testing & bug fixing

---

## 11. 💡 Tambahan Fitur Baru (Belum Ada Sebelumnya)

### Fitur 15 — Dashboard Filter by Date Range (Nilai: 15)

**Deskripsi:**
Menambahkan filter rentang tanggal (date range picker) pada halaman Dashboard agar pengguna bisa melihat data summary cards dan grafik penjualan berdasarkan periode tertentu (misal: Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, atau custom range).

**Komponen yang Terpengaruh:**

- `components/dashboard/summary-cards.tsx`
- `components/dashboard/sales-chart.tsx`
- `components/dashboard/top-selling-items.tsx`
- `components/dashboard/recent-transactions.tsx`
- `components/dashboard/low-stock-alert.tsx`

**Spesifikasi:**

- Tambahkan dropdown/picker di bagian atas dashboard: `[Hari Ini | 7 Hari | 30 Hari | Custom Range ▼]`
- Saat filter berubah, semua data di dashboard (summary cards & chart) ikut berubah sesuai periode
- Default: "Hari Ini"
- Gunakan komponen `Calendar` + `Popover` dari shadcn/ui untuk custom range
- State filter disimpan di URL query params (`?from=2026-01-01&to=2026-01-31`) agar bisa di-bookmark

---

### Fitur 16 — Dark Mode Toggle (Nilai: 15)

**Deskripsi:**
Memastikan fitur dark mode berfungsi penuh di seluruh halaman aplikasi. Komponen `theme-toggle.tsx` sudah ada, tetapi perlu diverifikasi dan dilengkapi agar semua komponen konsisten saat mode gelap.

**Komponen yang Terpengaruh:**

- `components/theme-toggle.tsx` — Pastikan berfungsi (toggle light/dark/system)
- `app/globals.css` — Tambahkan CSS variables untuk dark mode jika belum lengkap
- `lib/theme-provider.tsx` — Pastikan `next-themes` Provider sudah terintegrasi dengan benar
- Semua komponen UI — Pastikan tidak ada warna hardcoded yang terlihat buruk di dark mode

**Spesifikasi:**

- Gunakan library `next-themes` untuk mengelola tema
- Theme toggle harus punya 3 opsi: Light, Dark, System
- Simpan preferensi ke localStorage
- Sidebar, Navbar, Tabel, Dialog, Form, Card, Chart semuanya harus konsisten di dark mode
- Pastikan transisi tema halus (tanpa flash putih saat reload di dark mode)
- Tambahkan script `suppressHydrationWarning` di `layout.tsx`

---

### Fitur 17 — Activity Log (Nilai: 15)

**Deskripsi:**
Mencatat semua aktivitas penting (create/update/delete) yang dilakukan oleh pengguna ke dalam tabel `activity_logs` untuk keperluan audit trail. Setiap perubahan data akan tercatat siapa yang melakukan, kapan, aksi apa, dan data apa yang diubah.

**Tabel Database:**

```sql
CREATE TABLE activity_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  entity_type VARCHAR(50) NOT NULL,  -- contoh: 'items', 'customers', 'sales', dll
  entity_id   BIGINT,                -- ID record yang diubah
  changes     JSONB,                 -- Simpan data lama & baru (untuk UPDATE)
  description TEXT,                  -- Deskripsi singkat aktivitas
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

**Halaman Activity Log (`/activity-log`):**

```text
┌──────────────────────────────────────────────────────────────────┐
│  Activity Log                                                    │
│                                                                  │
│  🔍 Cari...   📅 Filter Tanggal   [Semua Entity ▼]             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Waktu          │ User      │ Aksi    │ Entitas    │ Detail  ││
│  │────────────────│───────────│─────────│────────────│─────────││
│  │ 26/02 10:30   │ Admin     │ UPDATE  │ Items (15) │ Harga   ││
│  │ 26/02 10:25   │ Doni      │ CREATE  │ Sales (45) │ Trans.  ││
│  │ 26/02 10:20   │ Admin     │ DELETE  │ Items (12) │ Ban IRC ││
│  └──────────────────────────────────────────────────────────────┘│
│                                           [Load More...]         │
└──────────────────────────────────────────────────────────────────┘
```

**Cara Kerja:**

- **Opsi A — Database Trigger (Direkomendasikan):** Buat trigger function di PostgreSQL yang otomatis mencatat ke `activity_logs` setiap ada INSERT/UPDATE/DELETE di tabel-tabel utama.
- **Opsi B — Aplikasi Level:** Panggil fungsi `logActivity()` dari setiap Server Action setelah operasi berhasil.
- Tampilkan hanya untuk role Admin di sidebar.
- Data activity log bersifat read-only (tidak bisa dihapus/diedit).

---

### Fitur 18 — HPP (Harga Pokok Penjualan) / Laba per Item (Nilai: 15)

**Deskripsi:**
Menambahkan perhitungan otomatis laba kotor per item dan total pada laporan keuangan. Laba dihitung dari `selling_price - purchase_price` untuk setiap item yang terjual, dikalikan quantity, dan dikurangi diskon.

**Komponen yang Terpengaruh:**

- `app/(dashboard)/reports/page.tsx` — Tambahkan tab/ringkasan laba
- Laporan Laba/Rugi per periode

**Database (cukup gunakan existing fields):**

```sql
-- items table sudah punya:
-- purchase_price (harga beli)
-- selling_price (harga jual)
-- Laba per item = selling_price - purchase_price

-- sale_details table sudah punya:
-- quantity, base_price, discount_amount, service_fee, final_price
```

**Perhitungan Laba:**

```sql
SELECT
  sd.item_id,
  i.name AS item_name,
  SUM(sd.quantity) AS qty_terjual,
  i.purchase_price,
  AVG(sd.base_price) AS harga_jual_rata,
  (AVG(sd.base_price) - i.purchase_price) AS laba_per_unit,
  SUM((sd.base_price - i.purchase_price) * sd.quantity) AS laba_kotor,
  SUM(sd.service_fee) AS total_jasa,
  SUM(sd.discount_amount) AS total_diskon,
  SUM(sd.subtotal) AS total_penjualan
FROM sale_details sd
JOIN items i ON i.id = sd.item_id
JOIN sales s ON s.id = sd.sale_id
WHERE s.sale_date BETWEEN :start_date AND :end_date
GROUP BY sd.item_id, i.name, i.purchase_price
ORDER BY laba_kotor DESC;
```

**Ringkasan Laba di Halaman Laporan:**

```text
┌──────────────────────────────────────────────────────────────────┐
│  Laporan Laba / Rugi                         📅 Periode tertentu │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Ringkasan Keuangan                                         │ │
│  │                                                             │ │
│  │  Total Penjualan      Rp 25.500.000                         │ │
│  │  Harga Pokok Penjualan Rp 18.200.000  ← (modal barang)      │ │
│  │  ─────────────────────────────────────                       │ │
│  │  Laba Kotor           Rp  7.300.000                         │ │
│  │  Total Jasa Service   Rp  1.250.000                         │ │
│  │  ─────────────────────────────────────                       │ │
│  │  Laba Bersih          Rp  8.550.000                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Detail Laba per Item                                       │ │
│  │                                                             │ │
│  │  Item          │ Qty │ Modal   │ Jual    │ Laba    │ %      │ │
│  │ ───────────────│─────│─────────│─────────│─────────│────────│ │
│  │  Ban IRC 80/90 │ 10  │ Rp 85K  │ Rp 120K │ Rp 35K  │ 41%    │ │
│  │  Oli Yamalube  │ 25  │ Rp 28K  │ Rp 35K  │ Rp 7K   │ 25%    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Akses Tampilan:**

- Hanya role Admin yang bisa melihat laporan laba
- Tampilkan di tab "Laba/Rugi" pada halaman `/reports`
- Bisa di-export ke Excel
