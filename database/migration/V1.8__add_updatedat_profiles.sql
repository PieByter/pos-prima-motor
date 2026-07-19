-- ============================================
-- V1.8 — Add updated_at to profiles if missing
-- POS Prima Motor
-- ============================================

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Add trigger to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger first to avoid duplicate error, then recreate
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();
