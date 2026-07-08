-- Combined migration — paste in Supabase SQL Editor if npm run db:migrate is unavailable

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

UPDATE users SET role = 'admin' WHERE email = 'sakshamborkar23@gmail.com';

CREATE TABLE IF NOT EXISTS pi_assignments (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_date DATE   NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS idx_pi_assignments_date ON pi_assignments (assigned_date);
ALTER TABLE pi_assignments
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_pi_number SMALLINT CHECK (completed_pi_number IN (1, 2));

ALTER TABLE pi_assignments
  ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pi_assignments_assigned_by ON pi_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS idx_pi_assignments_user ON pi_assignments (user_id);

-- Backfill admin attribution for rows created before assigned_by existed
UPDATE pi_assignments
SET assigned_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1)
WHERE assigned_by IS NULL;
