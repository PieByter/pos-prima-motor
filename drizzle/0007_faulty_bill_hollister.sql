CREATE TABLE "item_suppliers" (
	"item_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	CONSTRAINT "item_suppliers_item_id_supplier_id_pk" PRIMARY KEY("item_id","supplier_id")
);
--> statement-breakpoint
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_item_suppliers_supplier_id" ON "item_suppliers" USING btree ("supplier_id");