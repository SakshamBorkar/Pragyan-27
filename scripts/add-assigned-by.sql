-- Track which admin allotted each assignment
ALTER TABLE pi_assignments
  ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pi_assignments_assigned_by ON pi_assignments (assigned_by);

UPDATE pi_assignments
SET assigned_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1)
WHERE assigned_by IS NULL;
