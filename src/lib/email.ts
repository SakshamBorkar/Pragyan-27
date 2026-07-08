import nodemailer from 'nodemailer'
import { APP_NAME, APP_TAGLINE } from '@/lib/branding'

function cleanEnv(value: string | undefined): string {
  if (!value) return ''
  let v = value.trim()
  if (v.includes(' #')) v = v.split(' #')[0].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  return v
}

export function getSmtpCredentials() {
  const user = cleanEnv(process.env.SMTP_USER)
  const pass = cleanEnv(process.env.SMTP_PASS).replace(/\s/g, '')
  return { user, pass }
}

function getTransporter() {
  const { user, pass } = getSmtpCredentials()

  if (!user || !pass) {
    return null
  }

  // Gmail works most reliably with the built-in service preset
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

function formatOtpDisplay(code: string): string {
  return code.split('').join(' ')
}

function buildOtpEmailHtml(code: string): string {
  const otpDisplay = formatOtpDisplay(code)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME} verification</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background-color:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <span style="display:inline-block;background-color:rgba(232,201,125,0.07);border:1px solid rgba(232,201,125,0.2);color:#e8c97d;font-size:13px;font-weight:500;letter-spacing:0.04em;padding:8px 20px;border-radius:999px;">
                ✨ ${APP_NAME}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">${APP_TAGLINE}</p>
              <h1 style="margin:12px 0 0;font-size:24px;font-weight:600;color:#ffffff;line-height:1.3;">Verify your email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 0;text-align:center;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#9ca3af;">
                Use this code to complete your ${APP_NAME} registration:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;text-align:center;">
              <div style="display:inline-block;background-color:#0f0f1a;border:1px solid rgba(232,201,125,0.27);border-radius:12px;padding:18px 28px;">
                <p style="margin:0;font-size:34px;font-weight:700;letter-spacing:0.35em;color:#e8c97d;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
                  ${otpDisplay}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">
                Expires in 10 minutes. If you did not request this, you can ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#12121f;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:11px;color:#4b5563;">${APP_NAME} · ${APP_TAGLINE}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function sendRegistrationOtp(email: string, code: string): Promise<void> {
  const transporter = getTransporter()
  const { user } = getSmtpCredentials()
  const from = cleanEnv(process.env.SMTP_FROM) || user || 'noreply@pragyan.local'

  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[dev] Registration OTP for ${email}: ${code}`)
      return
    }
    throw new Error('Email service is not configured.')
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: `Your ${APP_NAME} verification code`,
    text: [
      `${APP_NAME} — ${APP_TAGLINE}`,
      '',
      `Your verification code is: ${code}`,
      '',
      'This code expires in 10 minutes.',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: buildOtpEmailHtml(code),
  })
}

export function isEmailConfigured(): boolean {
  const { user, pass } = getSmtpCredentials()
  return Boolean(user && pass)
}
