-- Backfill which admin allotted existing assignments (run once if names show as "An admin allotted")
UPDATE pi_assignments
SET assigned_by = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1)
WHERE assigned_by IS NULL;
