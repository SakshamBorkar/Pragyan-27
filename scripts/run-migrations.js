// Run: node scripts/run-migrations.js
// Requires DATABASE_URL in .env.local (Supabase → Settings → Database → Connection string → URI)

const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    const key = trimmed.slice(0, i).trim()
    let val = trimmed.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (val.includes(' #')) val = val.split(' #')[0].trim()
    if (!process.env[key]) process.env[key] = val
  }
}

function readSql(filename) {
  const file = path.join(__dirname, filename)
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim()
}

async function main() {
  loadEnv()

  const ref = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
    : null
  const pass = process.env.SUPABASE_DB_PASSWORD

  const url =
    process.env.DATABASE_URL ||
    (pass && ref
      ? [
          `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
          `postgresql://postgres:${encodeURIComponent(pass)}@db.${ref}.supabase.co:5432/postgres`,
        ]
      : null)
  if (!url) {
    console.error('\nMissing DATABASE_URL (or SUPABASE_DB_PASSWORD) in .env.local')
    console.error('Add DATABASE_URL from Supabase → Project Settings → Database → Connection string (URI)')
    console.error('Or paste scripts/migrate-all.sql into Supabase SQL Editor and run it there.\n')
    process.exit(1)
  }

  const urls = Array.isArray(url) ? url : [url]

  // Try pooler + direct host (IPv6 fallback for db.*.supabase.co)
  if (pass && ref) {
    const regions = ['ap-south-1', 'ap-southeast-1', 'us-east-1', 'eu-west-1']
    for (const region of regions) {
      urls.unshift(`postgresql://postgres.${ref}:${encodeURIComponent(pass)}@aws-0-${region}.pooler.supabase.com:6543/postgres`)
    }
    try {
      const dns = require('dns').promises
      const { address } = await dns.lookup(`db.${ref}.supabase.co`, { family: 6 })
      urls.unshift(`postgresql://postgres:${encodeURIComponent(pass)}@[${address}]:5432/postgres?sslmode=require`)
    } catch {
      // ignore DNS lookup failure
    }
  }

  let pg
  try {
    pg = require('pg')
  } catch {
    console.error('Installing pg… run: npm install pg')
    process.exit(1)
  }

  let client
  let lastError

  for (const connectionString of urls) {
    try {
      client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
      await client.connect()
      console.log('Connected to database.')
      break
    } catch (err) {
      lastError = err
      client = null
    }
  }

  if (!client) {
    throw lastError ?? new Error('Could not connect to database')
  }

  const sql = readSql('migrate-all.sql')
  if (!sql) throw new Error('migrate-all.sql is empty')

  console.log('Running migrate-all.sql…')
  await client.query(sql)
  console.log('✅ migrate-all.sql')

  await client.end()
  console.log('\n✅ All migrations complete.')
}

main().catch(err => {
  console.error('\nMigration failed:', err.message)
  process.exit(1)
})
