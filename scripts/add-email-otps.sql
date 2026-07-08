-- OTP codes for email verification during registration
CREATE TABLE IF NOT EXISTS email_otps (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT        NOT NULL,
  otp_hash   TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps (email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps (expires_at);
