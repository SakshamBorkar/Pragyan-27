-- Run in Supabase SQL Editor (once) to add roles support.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Promote your account to admin (replace with your email):
-- UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
