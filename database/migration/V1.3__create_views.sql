-- ============================================
-- V3 — Create Views
-- POS Prima Motor
-- Depends on: V1__create_tables.sql
-- ============================================

-- Stock summary: aggregasi stok per item berdasarkan stock_movements
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
