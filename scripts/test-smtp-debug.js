// Debug SMTP — run: node scripts/test-smtp-debug.js
const fs = require('fs')
const path = require('path')
const nodemailer = require('nodemailer')

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
    process.env[key] = val
  }
}

async function trySend(label, config) {
  const user = process.env.SMTP_USER.trim()
  const pass = process.env.SMTP_PASS.replace(/\s/g, '')
  console.log(`\n--- ${label} ---`)
  try {
    const t = nodemailer.createTransport({ ...config, auth: { user, pass } })
    await t.verify()
    console.log('✅ verify OK')
    await t.sendMail({
      from: user,
      to: user,
      subject: 'SMTP test',
      text: 'test',
    })
    console.log('✅ send OK')
    return true
  } catch (e) {
    console.log('❌', e.message.split('\n')[0])
    return false
  }
}

async function main() {
  loadEnv()
  console.log('SMTP_USER:', process.env.SMTP_USER)
  console.log('SMTP_PASS length:', process.env.SMTP_PASS.replace(/\s/g, '').length)

  if (await trySend('service:gmail', { service: 'gmail' })) return
  if (await trySend('587 STARTTLS', { host: 'smtp.gmail.com', port: 587, secure: false })) return
  if (await trySend('465 SSL', { host: 'smtp.gmail.com', port: 465, secure: true })) return

  console.log('\nAll methods failed — App Password may be for a different Google account than SMTP_USER.')
}

main()
