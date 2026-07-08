-- Run in Supabase SQL Editor to enable PI date assignments.
CREATE TABLE IF NOT EXISTS pi_assignments (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_date DATE   NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS idx_pi_assignments_date ON pi_assignments (assigned_date);
CREATE INDEX IF NOT EXISTS idx_pi_assignments_user ON pi_assignments (user_id);
