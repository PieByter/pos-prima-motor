ALTER TABLE "profiles" ADD COLUMN "weekly_salary" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "service_commission_pct" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "hire_date" date;