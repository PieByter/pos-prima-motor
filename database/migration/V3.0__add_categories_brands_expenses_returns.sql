-- ============================================
-- V3.0 — Categories, Brands, Expenses, Returns
-- POS Prima Motor
-- ============================================

-- ── 1. Categories ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO categories (name, description) VALUES
  ('Brake System', 'Sistem pengereman'),
  ('Oil & Fluids', 'Oli & cairan'),
  ('Accessories', 'Aksesoris'),
  ('Tires & Wheels', 'Ban & velg'),
  ('Maintenance', 'Perawatan'),
  ('Engine Parts', 'Suku cadang mesin'),
  ('Body Kits', 'Body motor'),
  'Electrical', 'Kelistrikan'),
  ('Transmission', 'Transmisi')
ON CONFLICT DO NOTHING;

-- ── 2. Brands ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO brands (name) VALUES
  ('Honda'),
  ('Yamaha'),
  ('Suzuki'),
  ('Kawasaki'),
  ('Motul'),
  ('Michelin'),
  ('NGK'),
  ('Ohlins'),
  ('Brembo'),
  ('DID'),
  ('IRC'),
  ('Federal')
ON CONFLICT DO NOTHING;

-- ── 3. Add FK columns to items ─────────────────────────────────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS brand_id BIGINT REFERENCES brands(id);

CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_brand_id ON items(brand_id);

-- ── 4. Expenses ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  description VARCHAR NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category VARCHAR CHECK (category IN ('operational','utilities','rent','salary','others')) DEFAULT 'others',
  expense_date DATE NOT NULL,
  payment_method_id BIGINT REFERENCES payment_methods(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ── 5. Sales Returns ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_returns (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id),
  return_date DATE NOT NULL,
  reason TEXT NOT NULL,
  total_refund DECIMAL(15, 2) NOT NULL,
  status VARCHAR CHECK (status IN ('pending','processed','rejected')) DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_returns_sale ON sales_returns(sale_id);

CREATE TABLE IF NOT EXISTS sales_return_details (
  id BIGSERIAL PRIMARY KEY,
  return_id BIGINT REFERENCES sales_returns(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES items(id),
  quantity INT NOT NULL,
  refund_amount DECIMAL(15, 2) NOT NULL
);

-- ── 6. Purchase Returns ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_returns (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT REFERENCES purchases(id),
  return_date DATE NOT NULL,
  reason TEXT NOT NULL,
  total_refund DECIMAL(15, 2) NOT NULL,
  status VARCHAR CHECK (status IN ('pending','processed','rejected')) DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_returns_purchase ON purchase_returns(purchase_id);

CREATE TABLE IF NOT EXISTS purchase_return_details (
  id BIGSERIAL PRIMARY KEY,
  return_id BIGINT REFERENCES purchase_returns(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES items(id),
  quantity INT NOT NULL,
  refund_amount DECIMAL(15, 2) NOT NULL
);
