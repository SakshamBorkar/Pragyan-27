// Run once: node scripts/migrate.js
// Creates the users table in your Supabase Postgres DB.
//
// Alternatively, paste this SQL directly in the Supabase SQL Editor:
//
//   CREATE TABLE IF NOT EXISTS users (
//     id         BIGSERIAL PRIMARY KEY,
//     name       TEXT        NOT NULL,
//     email      TEXT UNIQUE NOT NULL,
//     password   TEXT        NOT NULL,
//     created_at TIMESTAMPTZ DEFAULT NOW()
//   );

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function migrate() {
  console.log('Running migration via Supabase RPC…')

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id         BIGSERIAL PRIMARY KEY,
        name       TEXT        NOT NULL,
        email      TEXT UNIQUE NOT NULL,
        password   TEXT        NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  })

  if (error) {
    // RPC not available — instruct manual step
    console.log('\n⚠️  Could not run migration via RPC.')
    console.log('Paste the following SQL in your Supabase SQL Editor (supabase.com → your project → SQL Editor):\n')
    console.log(`CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`)
    process.exit(0)
  }

  console.log('✅ Migration complete. Table "users" is ready.')
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
