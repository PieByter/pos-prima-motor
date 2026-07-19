-- ============================================
-- V5 — RLS Policies
-- POS Prima Motor
-- Depends on: V4__enable_rls.sql
-- ============================================

-- -----------------------------------------------
-- PROFILES: read own + admin full access
-- -----------------------------------------------
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------
-- ITEMS: read all authenticated, write admin only
-- -----------------------------------------------
CREATE POLICY "Authenticated users can read items"
  ON items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage items"
  ON items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------
-- CUSTOMERS: read all authenticated, write admin only
-- -----------------------------------------------
CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage customers"
  ON customers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------
-- SUPPLIERS: admin only
-- -----------------------------------------------
CREATE POLICY "Admin can manage suppliers"
  ON suppliers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------
-- PURCHASES & PURCHASE_DETAILS: admin only
-- -----------------------------------------------
CREATE POLICY "Admin can manage purchases"
  ON purchases FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage purchase details"
  ON purchase_details FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------
-- SALES: mekanik sees own, admin sees all
-- -----------------------------------------------
CREATE POLICY "Mekanik can view own sales"
  ON sales FOR SELECT
  USING (mechanic_id = auth.uid());

CREATE POLICY "Admin full access to sales"
  ON sales FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Mekanik can create sales"
  ON sales FOR INSERT
  WITH CHECK (mechanic_id = auth.uid());

-- -----------------------------------------------
-- SALE_DETAILS: inherit via join ke sales
-- -----------------------------------------------
CREATE POLICY "Users can read own sale details"
  ON sale_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_details.sale_id
      AND (sales.mechanic_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Admin can manage sale details"
  ON sale_details FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Mekanik can insert sale details"
  ON sale_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_details.sale_id
      AND sales.mechanic_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- STOCK_MOVEMENTS: read all authenticated, insert mekanik/admin
-- -----------------------------------------------
CREATE POLICY "Authenticated users can read stock"
  ON stock_movements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage stock movements"
  ON stock_movements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Mekanik can insert stock movements for sales"
  ON stock_movements FOR INSERT
  WITH CHECK (
    reference_type = 'sale' AND auth.role() = 'authenticated'
  );

-- -----------------------------------------------
-- DISCOUNTS & DISCOUNT_ITEMS: read all, write admin
-- -----------------------------------------------
CREATE POLICY "Authenticated users can read discounts"
  ON discounts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage discounts"
  ON discounts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can read discount items"
  ON discount_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage discount items"
  ON discount_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
