-- ============================================
-- POS Prima Motor — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  address TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  address TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  sku VARCHAR UNIQUE,
  category VARCHAR,
  purchase_price DECIMAL NOT NULL,
  selling_price DECIMAL NOT NULL,
  service_fee DECIMAL DEFAULT 0,
  picture VARCHAR,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT REFERENCES suppliers(id),
  invoice_number VARCHAR UNIQUE,
  purchase_date DATE NOT NULL,
  total_amount DECIMAL NOT NULL,
  status VARCHAR CHECK (status IN ('completed','pending','cancelled')) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_details (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT REFERENCES purchases(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES items(id),
  quantity INT NOT NULL,
  price DECIMAL NOT NULL,
  subtotal DECIMAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  mechanic_id UUID REFERENCES auth.users(id),
  invoice_number VARCHAR UNIQUE,
  sale_date DATE NOT NULL,
  total_amount DECIMAL NOT NULL,
  status VARCHAR CHECK (status IN ('completed','pending','in_progress','cancelled')) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_details (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES items(id),
  quantity INT NOT NULL,
  base_price DECIMAL NOT NULL,
  discount_amount DECIMAL DEFAULT 0,
  final_price DECIMAL NOT NULL,
  service_fee DECIMAL DEFAULT 0,
  subtotal DECIMAL NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id),
  type VARCHAR CHECK (type IN ('IN','OUT')) NOT NULL,
  quantity INT NOT NULL,
  reference_type VARCHAR CHECK (reference_type IN ('purchase','sale')),
  reference_id BIGINT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discounts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR CHECK (type IN ('percent','fixed')),
  value DECIMAL NOT NULL,
  min_transaction DECIMAL DEFAULT 0,
  max_percent DECIMAL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS discount_items (
  discount_id BIGINT REFERENCES discounts(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_id, item_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('admin','mekanik')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  profile_picture VARCHAR,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_purchase_details_purchase_id ON purchase_details(purchase_id);
CREATE INDEX IF NOT EXISTS idx_sale_details_sale_id ON sale_details(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_item_id ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_mechanic ON sales(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoice_number);

-- ============================================
-- 3. CREATE STOCK SUMMARY VIEW
-- ============================================

CREATE OR REPLACE VIEW stock_summary AS
SELECT
  i.id AS item_id,
  i.name,
  i.sku,
  i.category,
  COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) AS total_in,
  COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) AS total_out,
  COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) AS current_stock
FROM items i
LEFT JOIN stock_movements sm ON sm.item_id = i.id
GROUP BY i.id, i.name, i.sku, i.category;

-- ============================================
-- 4. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Profiles: read own + admin full
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

-- Items: read all authenticated, write admin only
CREATE POLICY "Authenticated users can read items"
  ON items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage items"
  ON items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Customers: read all authenticated, write admin only
CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage customers"
  ON customers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Suppliers: admin only
CREATE POLICY "Admin can manage suppliers"
  ON suppliers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Purchases: admin only
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

-- Sales: mekanik sees own, admin sees all
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

-- Sale details: inherit via join
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

-- Stock movements: read all authenticated
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

-- Discounts: read all, write admin
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

-- ============================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mekanik')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());