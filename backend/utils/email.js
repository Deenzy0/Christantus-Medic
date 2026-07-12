/**
 * Email utility using Resend Node.js SDK.
 * Handles all transactional emails:
 * - Email verification on registration
 * - Password reset links
 */
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BUSINESS_NAME = 'Christantus Medical Consult';

/**
 * Send email verification link to a newly registered user.
 * @param {string} toEmail - recipient email address
 * @param {string} name - recipient's first name
 * @param {string} token - the verification token from the database
 */
const sendVerificationEmail = async (toEmail, name, token) => {
  const verifyUrl = `${FRONTEND_URL}/verify-email.html?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `Verify your email — ${BUSINESS_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your email</title>
      </head>
      <body style="margin:0;padding:0;background:#F7FAFC;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7FAFC;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,31,51,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:#0B5FFF;padding:32px 40px;text-align:center;">
                    <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:10px 16px;">
                      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">✚ ${BUSINESS_NAME}</span>
                    </div>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0A1F33;letter-spacing:-0.5px;">
                      Verify your email address
                    </h1>
                    <p style="margin:0 0 12px;font-size:15px;color:#44566B;line-height:1.6;">
                      Hi ${name}, welcome to ${BUSINESS_NAME}!
                    </p>
                    <p style="margin:0 0 32px;font-size:15px;color:#44566B;line-height:1.6;">
                      Please verify your email address to activate your account and start ordering medications and booking consultations.
                    </p>
                    <div style="text-align:center;margin-bottom:32px;">
                      <a href="${verifyUrl}"
                         style="display:inline-block;background:#0B5FFF;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:-0.2px;">
                        Verify My Email
                      </a>
                    </div>
                    <p style="margin:0 0 8px;font-size:13px;color:#44566B;line-height:1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 32px;font-size:12px;color:#0B5FFF;word-break:break-all;">
                      ${verifyUrl}
                    </p>
                    <div style="background:#F7FAFC;border-radius:8px;padding:16px;border-left:3px solid #0B5FFF;">
                      <p style="margin:0;font-size:13px;color:#44566B;line-height:1.5;">
                        <strong>This link expires in 24 hours.</strong> If you didn't create an account with us, you can safely ignore this email.
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#F7FAFC;padding:24px 40px;border-top:1px solid #E1E8F0;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#7E92A8;">
                      © ${new Date().getFullYear()} ${BUSINESS_NAME} · Licensed Pharmacy, Onitsha, Nigeria
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  });

  if (error) throw new Error(`Failed to send verification email: ${error.message}`);
  return data;
};

/**
 * Send a password reset link.
 * @param {string} toEmail - recipient email address
 * @param {string} name - recipient's name
 * @param {string} token - the reset token from the database
 */
const sendPasswordResetEmail = async (toEmail, name, token) => {
  const resetUrl = `${FRONTEND_URL}/reset-password.html?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `Reset your password — ${BUSINESS_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset your password</title>
      </head>
      <body style="margin:0;padding:0;background:#F7FAFC;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7FAFC;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,31,51,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:#0A1F33;padding:32px 40px;text-align:center;">
                    <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:12px;padding:10px 16px;">
                      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">✚ ${BUSINESS_NAME}</span>
                    </div>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0A1F33;letter-spacing:-0.5px;">
                      Reset your password
                    </h1>
                    <p style="margin:0 0 12px;font-size:15px;color:#44566B;line-height:1.6;">
                      Hi ${name},
                    </p>
                    <p style="margin:0 0 32px;font-size:15px;color:#44566B;line-height:1.6;">
                      We received a request to reset your password. Click the button below to choose a new one.
                    </p>
                    <div style="text-align:center;margin-bottom:32px;">
                      <a href="${resetUrl}"
                         style="display:inline-block;background:#0B5FFF;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:-0.2px;">
                        Reset My Password
                      </a>
                    </div>
                    <p style="margin:0 0 8px;font-size:13px;color:#44566B;line-height:1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 32px;font-size:12px;color:#0B5FFF;word-break:break-all;">
                      ${resetUrl}
                    </p>
                    <div style="background:#FEF3E2;border-radius:8px;padding:16px;border-left:3px solid #D97706;">
                      <p style="margin:0;font-size:13px;color:#44566B;line-height:1.5;">
                        <strong>This link expires in 1 hour.</strong> If you didn't request a password reset, please ignore this email — your password will not be changed.
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#F7FAFC;padding:24px 40px;border-top:1px solid #E1E8F0;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#7E92A8;">
                      © ${new Date().getFullYear()} ${BUSINESS_NAME} · Licensed Pharmacy, Onitsha, Nigeria
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  });

  if (error) throw new Error(`Failed to send password reset email: ${error.message}`);
  return data;
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
