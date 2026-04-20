import nodemailer from "nodemailer";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

export async function sendMagicLinkEmail(email, token, appUrl = APP_URL) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const normalizedBaseUrl = String(appUrl || APP_URL).replace(/\/+$/, "");
  const link = `${normalizedBaseUrl}/?auth_token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your Kanji Study sign-in link",
    text: `Click this link to sign in (expires in 15 minutes):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:40px 24px;background:#f9fafb;border-radius:12px;">
        <h2 style="margin:0 0 8px;font-size:22px;color:#1c2230;">Sign in to Kanji Study</h2>
        <p style="margin:0 0 24px;color:#555;font-size:15px;">Click the button below to sign in. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${link}"
           style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
          Sign in
        </a>
        <p style="margin:28px 0 0;font-size:12px;color:#aaa;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
