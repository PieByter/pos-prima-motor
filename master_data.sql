-- ============================================
-- 1. CREATE TABLES (tanpa foreign key ke auth.users dulu)
-- ============================================

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('admin','mekanik')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  profile_picture VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  address TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  address TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE items (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  sku VARCHAR UNIQUE,
  purchase_price DECIMAL NOT NULL,
  selling_price DECIMAL NOT NULL,
  service_fee DECIMAL DEFAULT 0,
  picture VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE purchases (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT REFERENCES suppliers(id),
  purchase_date DATE NOT NULL,
  total_amount DECIMAL NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE purchase_details (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT REFERENCES purchases(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES items(id),
  quantity INT NOT NULL,
  price DECIMAL NOT NULL,
  subtotal DECIMAL NOT NULL
);

CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  mechanic_id UUID REFERENCES auth.users(id),
  sale_date DATE NOT NULL,
  total_amount DECIMAL NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE sale_details (
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

CREATE TABLE stock_movements (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id),
  type VARCHAR CHECK (type IN ('IN','OUT')) NOT NULL,
  quantity INT NOT NULL,
  reference_type VARCHAR CHECK (reference_type IN ('purchase','sale')),
  reference_id BIGINT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE discounts (
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

CREATE TABLE discount_items (
  discount_id BIGINT REFERENCES discounts(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_id, item_id)
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('admin','mekanik')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  profile_picture VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 2. CREATE INDEXES (setelah semua table ada)
-- ============================================

CREATE INDEX idx_purchase_details_purchase_id ON purchase_details(purchase_id);
CREATE INDEX idx_sale_details_sale_id ON sale_details(sale_id);
CREATE INDEX idx_stock_item_id ON stock_movements(item_id);

-- ============================================
-- 3. CREATE POLICIES (untuk RLS Supabase)
-- ============================================

CREATE POLICY "mekanik lihat sales sendiri"
ON sales
FOR SELECT
USING (
  mechanic_id = auth.uid()
);

CREATE POLICY "admin full access"
ON sales
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 4. TEST QUERY (opsional, jalankan setelah data ada)
-- ============================================

-- SELECT p.role
-- FROM profiles p
-- WHERE p.id = auth.uid();