-- ============================================
-- V1 — Create Tables
-- POS Prima Motor
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
