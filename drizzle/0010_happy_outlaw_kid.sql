CREATE TABLE "purchase_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"payment_date" date DEFAULT now() NOT NULL,
	"payment_method_id" integer,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "warranty_months" integer;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "payment_status" text DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "paid_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "remaining_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "sale_details" ADD COLUMN "warranty_months" integer;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_purchase_payments_purchase_id" ON "purchase_payments" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_payments_payment_date" ON "purchase_payments" USING btree ("payment_date");