-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security) untuk pos-prima-motor
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Cara pakai (pilih salah satu):
--   A. Supabase Dashboard → SQL Editor → paste SEMUA isi file ini → Run.
--   B. Tambahkan DIRECT_URL ke .env.local (Project Settings → Database →
--      Connection string → Direct connection), lalu jalankan `npm run db:migrate`
--      jika file ini sudah didaftarkan sebagai Drizzle custom migration.
--
-- Prinsip desain:
--   • Semua akses data aplikasi lewat SERVICE ROLE KEY (bypass RLS), jadi
--     tabel bisnis cukup DIKUNCI total untuk anon/authenticated (tanpa policy).
--   • Hanya `notifications` yang butuh policy, karena realtime subscription
--     dari browser memakai anon key + user session (RLS-aware).
--   • `profiles` diberi policy baca/ubah profil sendiri sebagai pertahanan
--     tambahan (defense in depth).
--
-- File ini IDEMPOTENT — aman dijalankan ulang.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES — user hanya bisa lihat & ubah profilnya sendiri
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. NOTIFICATIONS — wajib agar realtime notifikasi tetap jalan di browser
--    (INSERT dilakukan server via service role; cukup SELECT + UPDATE untuk
--     pengiriman event realtime ke user pemilik notifikasi)
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. TABEL BISNIS LAIN — dikunci total untuk anon/authenticated.
--    Tanpa policy = deny all. Aplikasi mengakses via service role (bypass RLS),
--    jadi ini aman dan TIDAK mengubah perilaku aplikasi.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_details        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_details            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_returns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_return_details    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_returns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_return_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs           ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- 3b. TABEL TAMBAHAN — dibuat via Dashboard (belum ada di Drizzle schema).
--      Sama: dikunci total, service role tetap bypass.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.appointments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings       ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. VIEW stock_summary — hardening (Postgres 15+):
--    security_invoker = true agar view memakai hak/RLS pemanggil, bukan pembuat
--    view (menghindari perilaku "SECURITY DEFINER" bawaan view).
--    Sudah diterapkan via Drizzle migration `0011_tiny_firebrand` & schema
--    `lib/db/schema.ts` (pgView.with({ securityInvoker: true })).
--    Baris di bawah idempoten — aman dijalankan ulang, mis. pada DB fresh.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER VIEW public.stock_summary SET (security_invoker = true);

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. FUNGSI — set search_path eksplisit (finding "Function Search Path Mutable"):
--    • update_profiles_updated_at  → search_path = ''   (hanya pakai pg_catalog)
--    • update_item_stock           → search_path = public (referensi tabel items)
--    Mencegah search_path hijacking oleh role pemanggil. Idempoten.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER FUNCTION public.update_profiles_updated_at() SET search_path = '';
ALTER FUNCTION public.update_item_stock() SET search_path = public;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Verifikasi (opsional — jalankan setelah Run untuk memastikan):
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
-- ═══════════════════════════════════════════════════════════════════════════════
