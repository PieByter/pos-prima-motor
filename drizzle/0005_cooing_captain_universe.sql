-- ═══ Drift fix DB live (legacy) — tidak terdeteksi drizzle generate karena diff vs snapshot ═══
-- purchases.invoice_number: kolom tidak pernah ada di DB live (migration 0000 tidak benar-benar dijalankan),
-- tapi snapshot menganggap ada. IF NOT EXISTS membuat ini aman di DB fresh maupun legacy.
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "invoice_number" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "invoice_number" DROP DEFAULT;--> statement-breakpoint
-- Kolom legacy yang tidak dipakai app & tidak ada di schema.ts → bersihkan
--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN IF EXISTS "payment_method";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN IF EXISTS "payment_status";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN IF EXISTS "notes";
--> statement-breakpoint
ALTER TABLE "discount_items" ADD CONSTRAINT "discount_items_discount_id_item_id_pk" PRIMARY KEY("discount_id","item_id");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_discount_items_item_id" ON "discount_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_expenses_expense_date" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "idx_items_category" ON "items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_details_purchase_id" ON "purchase_details" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_returns_purchase_id" ON "purchase_returns" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_purchases_purchase_date" ON "purchases" USING btree ("purchase_date");--> statement-breakpoint
CREATE INDEX "idx_sale_details_sale_id" ON "sale_details" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_sales_sale_date" ON "sales" USING btree ("sale_date");--> statement-breakpoint
CREATE INDEX "idx_sales_mechanic" ON "sales" USING btree ("mechanic_id");--> statement-breakpoint
CREATE INDEX "idx_sales_customer" ON "sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_sales_returns_sale_id" ON "sales_returns" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_stock_item_id" ON "stock_movements" USING btree ("item_id");--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_sku_unique" UNIQUE("sku");--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_invoice_number_unique" UNIQUE("invoice_number");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_invoice_number_unique" UNIQUE("invoice_number");