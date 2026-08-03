CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"plate_number" text NOT NULL,
	"brand" text,
	"model" text,
	"year" integer,
	"color" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "vehicle_id" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "sale_type" text DEFAULT 'purchase' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_status" text DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "paid_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "remaining_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_vehicles_customer_id" ON "vehicles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_plate_number" ON "vehicles" USING btree ("plate_number");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sales_vehicle_id" ON "sales" USING btree ("vehicle_id");