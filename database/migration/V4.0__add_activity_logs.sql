-- ============================================
-- V4.0 — Activity Logs
-- POS Prima Motor
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR CHECK (action IN ('create','update','delete')) NOT NULL,
  entity VARCHAR NOT NULL,
  entity_id VARCHAR,
  description TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
