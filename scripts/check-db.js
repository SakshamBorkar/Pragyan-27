const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found')
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

async function rest(path, key) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })
  return { ok: res.ok, status: res.status, body: await res.text() }
}

async function main() {
  loadEnv()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const roleCheck = await rest('users?select=role&limit=1', key)
  console.log('users.role:', roleCheck.ok ? 'ok' : `missing (${roleCheck.body})`)

  const assignCheck = await rest('pi_assignments?select=id&limit=1', key)
  console.log('pi_assignments:', assignCheck.ok ? 'ok' : `missing (${assignCheck.body})`)
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
