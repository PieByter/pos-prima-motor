-- V5.0__add_price_history_and_stock_opname.sql
-- Price history tracking
CREATE TABLE IF NOT EXISTS price_history (
  id          BIGSERIAL PRIMARY KEY,
  item_id     BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  old_price   DECIMAL(12,2) NOT NULL,
  new_price   DECIMAL(12,2) NOT NULL,
  field       VARCHAR(20) NOT NULL CHECK (field IN ('purchase_price', 'selling_price', 'service_fee')),
  changed_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_item ON price_history(item_id, created_at DESC);

-- Stock opname / adjustment
CREATE TABLE IF NOT EXISTS stock_opname (
  id            BIGSERIAL PRIMARY KEY,
  item_id       BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  system_stock  INTEGER NOT NULL,
  physical_stock INTEGER NOT NULL,
  difference    INTEGER NOT NULL,
  reason        TEXT,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')) DEFAULT 'OUT',
  adjusted_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_opname_item ON stock_opname(item_id, created_at DESC);

-- Minimum stock levels for auto restock
CREATE TABLE IF NOT EXISTS item_restock_settings (
  id              BIGSERIAL PRIMARY KEY,
  item_id         BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE UNIQUE,
  min_stock       INTEGER NOT NULL DEFAULT 5,
  recommended_qty INTEGER NOT NULL DEFAULT 10,
  is_active       BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restock_item ON item_restock_settings(item_id);
