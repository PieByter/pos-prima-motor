-- ============================================
-- V2 — Create Indexes
-- POS Prima Motor
-- Depends on: V1__create_tables.sql
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
