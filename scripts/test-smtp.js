// Test Gmail SMTP for registration OTP
// Run: node scripts/test-smtp.js you@example.com

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

async function main() {
  loadEnv()
  const to = process.argv[2]
  if (!to) {
    console.error('Usage: node scripts/test-smtp.js recipient@email.com')
    process.exit(1)
  }

  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '')
  if (!user || !pass) {
    console.error('\nMissing SMTP_USER or SMTP_PASS in .env.local')
    console.error('Add your Gmail App Password to SMTP_PASS, then run again.\n')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: pass.replace(/\s/g, '') },
  })

  const code = '123456'
  console.log('Sending test OTP email to', to, '...')
  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject: 'Pragyan PI Scheduler — SMTP test',
    text: `Test successful. Sample OTP: ${code}`,
  })
  console.log('✅ Email sent. Check inbox (and spam).')
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message)
  if (err.message.includes('Invalid login')) {
    console.error('Use a Google App Password (not your normal Gmail password).')
  }
  process.exit(1)
})
