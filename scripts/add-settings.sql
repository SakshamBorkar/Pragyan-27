CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

-- Initialize the induction sheet link setting
INSERT INTO settings (key, value)
VALUES ('induction_sheet_link', '')
ON CONFLICT (key) DO NOTHING;
