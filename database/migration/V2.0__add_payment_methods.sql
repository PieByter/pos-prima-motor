-- ============================================
-- V2.0 — Add Payment Methods & Payment Columns
-- POS Prima Motor
-- ============================================

-- ── 1. Payment Methods table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  icon VARCHAR,
  is_active BOOLEAN DEFAULT true
);

-- ── 2. Seed default payment methods ─────────────────────────────────────────
INSERT INTO payment_methods (name, icon, is_active) VALUES
  ('Tunai', 'cash', true),
  ('QRIS', 'qris', true),
  ('Transfer Bank', 'bank', true),
  ('Kartu Debit', 'debit', true),
  ('Kartu Kredit', 'credit', true)
ON CONFLICT DO NOTHING;

-- ── 3. Add payment columns to sales ─────────────────────────────────────────
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method_id BIGINT REFERENCES payment_methods(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount DECIMAL(15, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS change_amount DECIMAL(15, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── 4. Index for payment_method_id ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method_id);
