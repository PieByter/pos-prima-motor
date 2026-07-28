-- V6.0__add_mechanic_compensation.sql
-- Add weekly_salary, service_commission_pct, and hire_date to profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS weekly_salary DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_commission_pct DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hire_date DATE;
