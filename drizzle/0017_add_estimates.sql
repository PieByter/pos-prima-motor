CREATE TABLE "public"."estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"vehicle_id" integer,
	"estimate_number" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estimates_estimate_number_unique" UNIQUE("estimate_number")
);--> statement-breakpoint
CREATE TABLE "public"."estimate_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"estimate_id" integer NOT NULL,
	"item_id" integer,
	"name" text NOT NULL,
	"type" text DEFAULT 'part' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL
);--> statement-breakpoint
ALTER TABLE "public"."estimates" ADD CONSTRAINT "estimates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."estimates" ADD CONSTRAINT "estimates_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."estimates" ADD CONSTRAINT "estimates_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."estimate_items" ADD CONSTRAINT "estimate_items_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."estimate_items" ADD CONSTRAINT "estimate_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_estimates_customer" ON "public"."estimates" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_estimates_status" ON "public"."estimates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_estimates_created_at" ON "public"."estimates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_estimate_items_estimate_id" ON "public"."estimate_items" USING btree ("estimate_id");--> statement-breakpoint
