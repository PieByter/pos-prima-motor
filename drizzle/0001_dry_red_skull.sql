CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"description" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"category" text DEFAULT 'others' NOT NULL,
	"expense_date" date NOT NULL,
	"payment_method_id" integer,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_return_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"refund_amount" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"return_date" date NOT NULL,
	"reason" text NOT NULL,
	"total_refund" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_return_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"refund_amount" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"return_date" date NOT NULL,
	"reason" text NOT NULL,
	"total_refund" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "brand_id" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_method_id" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "cash_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "change_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "notes" text;