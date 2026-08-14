CREATE TABLE "business_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_name" text DEFAULT 'Prima Motor' NOT NULL,
	"shop_address" text,
	"shop_phone" text,
	"whatsapp_number" text,
	"tax_percent" numeric(5, 2) DEFAULT '11' NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"receipt_footer" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;