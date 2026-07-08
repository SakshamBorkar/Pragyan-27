-- Add scheduling completion tracking to pi_assignments
ALTER TABLE pi_assignments
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_pi_number SMALLINT CHECK (completed_pi_number IN (1, 2));
