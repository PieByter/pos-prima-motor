ALTER TABLE "public"."customers" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE "public"."point_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"points" integer NOT NULL,
	"type" text DEFAULT 'earn' NOT NULL,
	"reference" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "public"."point_transactions" ADD CONSTRAINT "point_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."point_transactions" ADD CONSTRAINT "point_transactions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_point_transactions_customer" ON "public"."point_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."increment_customer_points"(customer_id int, delta int)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "public"."customers" SET "points" = "points" + delta, "updated_at" = now() WHERE "id" = customer_id;
END;
$$;
