const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    const key = trimmed.slice(0, i).trim()
    let val = trimmed.slice(i + 1).trim()
    if (val.includes(' #')) val = val.split(' #')[0].trim()
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  loadEnv()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL

  const res = await fetch(`${base}/rest/v1/users?select=name,email,role&order=id.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const users = await res.json()
  console.log(JSON.stringify(users, null, 2))
}

main().catch(console.error)
