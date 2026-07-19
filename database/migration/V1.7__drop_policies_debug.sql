-- ============================================
-- V7 — Drop All RLS Policies (DEBUG / RESET)
-- POS Prima Motor
-- ============================================
-- PERINGATAN: File ini hanya untuk keperluan debug atau reset environment.
-- JANGAN jalankan di production kecuali memang diperlukan.
-- Setelah drop, jalankan juga:
--   ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;
-- ============================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access to profiles" ON profiles;

DROP POLICY IF EXISTS "Authenticated users can read items" ON items;
DROP POLICY IF EXISTS "Admin can manage items" ON items;

DROP POLICY IF EXISTS "Authenticated users can read customers" ON customers;
DROP POLICY IF EXISTS "Admin can manage customers" ON customers;

DROP POLICY IF EXISTS "Admin can manage suppliers" ON suppliers;

DROP POLICY IF EXISTS "Admin can manage purchases" ON purchases;
DROP POLICY IF EXISTS "Admin can manage purchase details" ON purchase_details;

DROP POLICY IF EXISTS "Mekanik can view own sales" ON sales;
DROP POLICY IF EXISTS "Admin full access to sales" ON sales;
DROP POLICY IF EXISTS "Mekanik can create sales" ON sales;

DROP POLICY IF EXISTS "Users can read own sale details" ON sale_details;
DROP POLICY IF EXISTS "Admin can manage sale details" ON sale_details;
DROP POLICY IF EXISTS "Mekanik can insert sale details" ON sale_details;

DROP POLICY IF EXISTS "Authenticated users can read stock" ON stock_movements;
DROP POLICY IF EXISTS "Admin can manage stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Mekanik can insert stock movements for sales" ON stock_movements;

DROP POLICY IF EXISTS "Authenticated users can read discounts" ON discounts;
DROP POLICY IF EXISTS "Admin can manage discounts" ON discounts;

DROP POLICY IF EXISTS "Authenticated users can read discount items" ON discount_items;
DROP POLICY IF EXISTS "Admin can manage discount items" ON discount_items;
