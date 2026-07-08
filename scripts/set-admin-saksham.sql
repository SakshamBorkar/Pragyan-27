-- Ensure admin account (run in Supabase SQL Editor if needed)
UPDATE users SET role = 'admin' WHERE email = 'sakshamborkar23@gmail.com';

-- Optional: demote other accounts if they were promoted by mistake
-- UPDATE users SET role = 'user' WHERE email = 'sakshamgame23@gmail.com' AND email != 'sakshamborkar23@gmail.com';
