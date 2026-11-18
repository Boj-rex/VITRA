import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import os from "os";

function getEmailDataDir(): string {
  if (process.env.VITRA_DEV_DATA_DIR?.trim()) {
    return process.env.VITRA_DEV_DATA_DIR.trim();
  }
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    Boolean(process.env.NETLIFY) ||
    process.env.NODE_ENV === "production";

  if (isServerless) {
    return path.join(os.tmpdir(), ".vitra-dev-data");
  }
  return path.join(process.cwd(), ".vitra-dev-data");
}

export interface SupportInquiry {
  name: string;
  email: string;
  category?: string;
  subject: string;
  message: string;
  ip?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider: "gmail" | "smtp" | "resend" | "local_dev";
  error?: string;
  recipient: string;
  savedLocally: boolean;
}

const DEFAULT_RECIPIENT = "Bolajim@gmail.com";
export const DEFAULT_NO_REPLY_EMAIL = "no-reply@vitra.app";

/**
 * Returns the designated no-reply address for automated outbound notifications
 * (login security OTP codes and official payment receipts).
 */
export function getNoReplyEmail(): string {
  return (process.env.NO_REPLY_EMAIL || DEFAULT_NO_REPLY_EMAIL).trim();
}

/**
 * Saves a copy of every support inquiry to local disk so no message is ever lost,
 * even during local testing or if network/SMTP experiences hiccups.
 */
function persistInquiryLocally(
  inquiry: SupportInquiry,
  provider: string,
  deliveryStatus: string,
  errorMessage?: string
) {
  try {
    const dir = getEmailDataDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const file = path.join(dir, "support-inquiries.json");
    let existing: Array<{
      id: string;
      receivedAt: string;
      provider: string;
      deliveryStatus: string;
      error?: string;
      name: string;
      email: string;
      category?: string;
      subject: string;
      message: string;
      ip?: string;
    }> = [];

    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, "utf8");
        existing = JSON.parse(raw);
      } catch {
        existing = [];
      }
    }

    existing.unshift({
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      receivedAt: new Date().toISOString(),
      provider,
      deliveryStatus,
      error: errorMessage,
      name: inquiry.name,
      email: inquiry.email,
      category: inquiry.category || "General Inquiry",
      subject: inquiry.subject,
      message: inquiry.message,
      ip: inquiry.ip,
    });

    // Keep the latest 500 inquiries
    if (existing.length > 500) {
      existing = existing.slice(0, 500);
    }

    fs.writeFileSync(file, JSON.stringify(existing, null, 2), "utf8");
  } catch (err) {
    console.error("[Email] Failed to persist inquiry locally:", err);
  }
}

/**
 * Builds a styled HTML email representing the Vitra Scrapbook theme.
 */
function buildSupportEmailHtml(inquiry: SupportInquiry, recipient: string): string {
  const categoryLabel = inquiry.category || "General Inquiry";
  const receivedTime = new Date().toUTCString();
  const mailtoReply = `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent(`Re: [Vitra Support] ${inquiry.subject}`)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Vitra Support Inquiry</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#F4F1EA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;margin:0 auto;background:#FFFFFF;border:2px solid #111111;box-shadow:4px 4px 0px #111111;border-radius:12px;overflow:hidden;">
    <!-- Header with Vitra Brand Yellow Accent -->
    <tr>
      <td style="background:#F8D849;border-bottom:2px solid #111111;padding:18px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block;background:#111111;color:#FFFFFF;font-weight:900;font-size:12px;letter-spacing:1px;padding:3px 8px;border-radius:4px;text-transform:uppercase;">
                VITRA CV STUDIO
              </span>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:900;color:#111111;letter-spacing:-0.5px;">
                New Support Inquiry
              </h1>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="display:inline-block;background:#FFFFFF;border:1.5px solid #111111;box-shadow:2px 2px 0px #111111;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;color:#111111;">
                ${categoryLabel}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding:24px;">
        <!-- Sender Meta Table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF9F4;border:1.5px solid #E2DDD2;border-radius:8px;padding:14px;margin-bottom:20px;">
          <tr>
            <td style="font-size:12px;color:#66665E;font-weight:700;padding:4px 0;width:110px;">FROM:</td>
            <td style="font-size:14px;color:#111111;font-weight:700;padding:4px 0;">${escapeHtml(inquiry.name)}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#66665E;font-weight:700;padding:4px 0;">EMAIL:</td>
            <td style="font-size:14px;color:#1B3AFF;font-weight:600;padding:4px 0;">
              <a href="mailto:${escapeHtml(inquiry.email)}" style="color:#1B3AFF;text-decoration:underline;">${escapeHtml(inquiry.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#66665E;font-weight:700;padding:4px 0;">SUBJECT:</td>
            <td style="font-size:14px;color:#111111;font-weight:700;padding:4px 0;">${escapeHtml(inquiry.subject)}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#66665E;font-weight:700;padding:4px 0;">TIME (UTC):</td>
            <td style="font-size:12px;color:#55564E;padding:4px 0;">${receivedTime}</td>
          </tr>
        </table>

        <!-- Message Box -->
        <div style="margin-bottom:24px;">
          <div style="font-size:11px;font-weight:800;color:#888880;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">
            CUSTOMER MESSAGE
          </div>
          <div style="background:#FFFFFF;border:2px solid #111111;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#1F2421;white-space:pre-wrap;box-shadow:3px 3px 0px #E5E7EB;">${escapeHtml(inquiry.message)}</div>
        </div>

        <!-- Call to Action -->
        <div style="text-align:center;padding:10px 0 6px;">
          <a href="${mailtoReply}" style="display:inline-block;background:#F8D849;border:2px solid #111111;box-shadow:3px 3px 0px #111111;color:#111111;text-decoration:none;font-weight:800;font-size:13px;padding:12px 24px;border-radius:50px;letter-spacing:0.5px;">
            REPLY TO ${escapeHtml(inquiry.name.toUpperCase())}
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#FBF9F4;border-top:1.5px solid #E2DDD2;padding:14px 24px;font-size:11px;color:#77786F;text-align:center;">
        Sent automatically to <strong style="color:#111111;">${escapeHtml(recipient)}</strong> from the Vitra CV Studio Support Form.<br>
        Direct replies to this email will be delivered to <a href="mailto:${escapeHtml(inquiry.email)}" style="color:#111111;">${escapeHtml(inquiry.email)}</a>.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildSupportEmailText(inquiry: SupportInquiry, recipient: string): string {
  return `
[VITRA CV STUDIO] New Support Inquiry
--------------------------------------------------
Topic:   ${inquiry.category || "General Inquiry"}
From:    ${inquiry.name} <${inquiry.email}>
Subject: ${inquiry.subject}
Date:    ${new Date().toUTCString()}
Sent To: ${recipient}

CUSTOMER MESSAGE:
--------------------------------------------------
${inquiry.message}

--------------------------------------------------
Click 'Reply' in your email client to respond directly to ${inquiry.email}.
  `.trim();
}

/**
 * Dispatches a support inquiry to Bolajim@gmail.com using the configured email transport:
 * 1. Resend API (if RESEND_API_KEY is present)
 * 2. Nodemailer SMTP (Gmail App Password or SMTP_HOST/SMTP_PASS)
 * 3. Local Dev Persistence (always stores in .vitra-dev-data/support-inquiries.json as backup)
 */
export async function sendSupportInquiryEmail(inquiry: SupportInquiry): Promise<EmailDispatchResult> {
  const recipient = (process.env.SUPPORT_RECIPIENT_EMAIL || DEFAULT_RECIPIENT).trim();
  const subjectLine = `[Vitra Support] [${inquiry.category || "Inquiry"}] ${inquiry.subject}`;
  const htmlBody = buildSupportEmailHtml(inquiry, recipient);
  const textBody = buildSupportEmailText(inquiry, recipient);

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();
  const smtpUser = (process.env.SMTP_USER || recipient).trim();
  const smtpHost = (process.env.SMTP_HOST || (smtpPass ? "smtp.gmail.com" : "")).trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  // 1. Try Resend if configured
  if (resendApiKey) {
    try {
      const fromAddress = process.env.EMAIL_FROM || "Vitra Support <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipient],
          reply_to: `${inquiry.name} <${inquiry.email}>`,
          subject: subjectLine,
          html: htmlBody,
          text: textBody,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Resend API returned status ${res.status}: ${errorData}`);
      }

      persistInquiryLocally(inquiry, "resend", "DELIVERED");
      return {
        success: true,
        provider: "resend",
        recipient,
        savedLocally: true,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[Email] Resend dispatch failed:", errorMessage);
      persistInquiryLocally(inquiry, "resend", "FAILED", errorMessage);
      // Fall through to SMTP or Local dev
    }
  }

  // 2. Try Nodemailer SMTP (e.g. Gmail App Password or custom SMTP) if password provided
  if (smtpPass && smtpHost) {
    try {
      const isGmail = smtpHost.includes("gmail");
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
            service: "gmail",
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          }
          : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          }
      );

      await transporter.sendMail({
        from: `"Vitra CV Studio" <${smtpUser}>`,
        to: recipient,
        replyTo: `"${inquiry.name}" <${inquiry.email}>`,
        subject: subjectLine,
        text: textBody,
        html: htmlBody,
      });

      persistInquiryLocally(inquiry, isGmail ? "gmail" : "smtp", "DELIVERED");
      return {
        success: true,
        provider: isGmail ? "gmail" : "smtp",
        recipient,
        savedLocally: true,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[Email] SMTP dispatch failed:", errorMessage);
      persistInquiryLocally(inquiry, "smtp", "FAILED", errorMessage);
      // Fall through to local dev backup
    }
  }

  // 3. Fallback: Local dev backup
  // In dev / unconfigured mode, persist inquiry safely and log it cleanly
  persistInquiryLocally(
    inquiry,
    "local_dev",
    "PENDING_CONFIGURATION",
    "No SMTP_PASS or RESEND_API_KEY configured yet. Saved to .vitra-dev-data/support-inquiries.json"
  );

  console.log("-----------------------------------------------------------------");
  console.log(`[SUPPORT EMAIL QUEUED] Recipient: ${recipient}`);
  console.log(`From: ${inquiry.name} <${inquiry.email}> | Topic: ${inquiry.category || "General"}`);
  console.log(`Subject: ${inquiry.subject}`);
  console.log(`Message: ${inquiry.message}`);
  console.log("Saved safely to: .vitra-dev-data/support-inquiries.json");
  console.log("To deliver live to Gmail inbox, configure SMTP_PASS in .env.local");
  console.log("-----------------------------------------------------------------");

  return {
    success: true,
    provider: "local_dev",
    recipient,
    savedLocally: true,
  };
}

export interface LoginOtpEmailParams {
  email: string;
  fullName: string;
  code: string;
  expiresMinutes?: number;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  const maskedCount = Math.min(Math.max(local.length - 2, 2), 5);
  return `${first}${"*".repeat(maskedCount)}${last}@${domain}`;
}

function buildLoginOtpEmailHtml(params: LoginOtpEmailParams): string {
  const expires = params.expiresMinutes || 10;
  const greeting = params.fullName ? `Hello ${escapeHtml(params.fullName)},` : "Hello,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Vitra Login Verification Code</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#F4F1EA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;background:#FFFFFF;border:2px solid #111111;box-shadow:4px 4px 0px #111111;border-radius:12px;overflow:hidden;">
    <!-- Yellow Brand Banner -->
    <tr>
      <td style="background:#F8D849;border-bottom:2px solid #111111;padding:18px 24px;">
        <span style="display:inline-block;background:#111111;color:#FFFFFF;font-weight:900;font-size:11px;letter-spacing:1px;padding:3px 8px;border-radius:4px;text-transform:uppercase;">
          VITRA CV STUDIO
        </span>
        <h1 style="margin:8px 0 0;font-size:19px;font-weight:900;color:#111111;letter-spacing:-0.5px;">
          Security Verification Code
        </h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:28px 24px;">
        <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#111111;">
          ${greeting}
        </p>
        <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#55564E;">
          We received a request to log in to your Vitra candidate workspace. Please enter this one-time security code to verify your identity:
        </p>

        <!-- Big 6-digit Code Box -->
        <div style="background:#FBF9F4;border:2px solid #111111;box-shadow:3px 3px 0px #111111;border-radius:10px;padding:22px;text-align:center;margin:24px 0;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#77786F;text-transform:uppercase;margin-bottom:10px;">
            ONE-TIME LOGIN OTP
          </div>
          <div style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:900;letter-spacing:8px;color:#111111;background:#FFFFFF;border:2px solid #111111;border-radius:8px;display:inline-block;padding:10px 24px;">
            ${params.code}
          </div>
          <div style="margin-top:12px;font-size:12px;color:#66665E;font-weight:600;">
            Code expires in <strong>${expires} minutes</strong>
          </div>
        </div>

        <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#77786F;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:12px;">
          <strong style="color:#B91C1C;">Security Alert:</strong> If you did not initiate this login attempt, please disregard this email. Never share this code with anyone. Vitra support staff will never ask for your security code.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#FBF9F4;border-top:1.5px solid #E2DDD2;padding:16px 24px;font-size:11px;color:#77786F;text-align:center;line-height:1.6;">
        <span style="display:inline-block;background:#E5E7EB;color:#374151;font-weight:800;font-size:10px;letter-spacing:0.5px;padding:3px 8px;border-radius:4px;text-transform:uppercase;margin-bottom:8px;">
          ✉ AUTOMATED SYSTEM MESSAGE • DO NOT REPLY
        </span><br>
        This security verification code was generated automatically and sent to <strong style="color:#111111;">${escapeHtml(params.email)}</strong> to protect your Vitra account.<br>
        Replies to this email address (<span style="font-family:monospace;color:#111111;">${escapeHtml(getNoReplyEmail())}</span>) are not monitored and will not receive a response.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildLoginOtpEmailText(params: LoginOtpEmailParams): string {
  const expires = params.expiresMinutes || 10;
  const noReplyEmail = getNoReplyEmail();
  return `
[VITRA CV STUDIO] Your One-Time Login Code
--------------------------------------------------
Your security verification code is:

     ${params.code}

This code will expire in ${expires} minutes.

If you did not request this login, please ignore this email.
Never share your verification code with anyone.

--------------------------------------------------
AUTOMATED NOTIFICATION (NO-REPLY)
This email was generated automatically by Vitra Security.
Replies to this unmonitored address (${noReplyEmail}) cannot be received.
--------------------------------------------------
  `.trim();
}

/**
 * Dispatches a 6-digit login OTP code to the candidate's email.
 */
export async function sendLoginOtpEmail(params: LoginOtpEmailParams): Promise<EmailDispatchResult> {
  const recipient = params.email.trim();
  const noReplyEmail = getNoReplyEmail();
  const subjectLine = `[Vitra] Your Login Verification Code: ${params.code}`;
  const htmlBody = buildLoginOtpEmailHtml(params);
  const textBody = buildLoginOtpEmailText(params);

  // Record OTP code locally for dev reference
  try {
    const dir = getEmailDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "otp-codes.json");
    let codes: Array<any> = [];
    if (fs.existsSync(file)) {
      try {
        codes = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        codes = [];
      }
    }
    codes.unshift({
      email: recipient,
      code: params.code,
      generatedAt: new Date().toISOString(),
      expiresMinutes: params.expiresMinutes || 10,
    });
    if (codes.length > 50) codes = codes.slice(0, 50);
    fs.writeFileSync(file, JSON.stringify(codes, null, 2), "utf8");
  } catch (err) {
    console.error("[Email] Failed to persist OTP code locally:", err);
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();
  const smtpUser = (process.env.SMTP_USER || process.env.SUPPORT_RECIPIENT_EMAIL || DEFAULT_RECIPIENT).trim();
  const smtpHost = (process.env.SMTP_HOST || (smtpPass ? "smtp.gmail.com" : "")).trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  // 1. Resend API
  if (resendApiKey) {
    try {
      const fromAddress = process.env.EMAIL_NO_REPLY_FROM || process.env.EMAIL_FROM || `Vitra Security (No-Reply) <${noReplyEmail}>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipient],
          reply_to: noReplyEmail,
          subject: subjectLine,
          html: htmlBody,
          text: textBody,
          headers: {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Resend returned status ${res.status}: ${await res.text()}`);
      }

      return {
        success: true,
        provider: "resend",
        recipient,
        savedLocally: true,
      };
    } catch (err: unknown) {
      console.error("[Email] Resend OTP dispatch failed:", err);
    }
  }

  // 2. Nodemailer SMTP (Gmail or custom SMTP)
  if (smtpPass && smtpHost) {
    const isGmail = smtpHost.includes("gmail");
    try {
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
            service: "gmail",
            auth: { user: smtpUser, pass: smtpPass },
          }
          : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
          }
      );

      const fromDisplay = isGmail
        ? `"Vitra Security (No-Reply)" <${smtpUser}>`
        : `"Vitra Security (No-Reply)" <${noReplyEmail}>`;

      await transporter.sendMail({
        from: fromDisplay,
        to: recipient,
        replyTo: `"Vitra Security (No-Reply)" <${noReplyEmail}>`,
        subject: subjectLine,
        text: textBody,
        html: htmlBody,
        headers: {
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "All",
          Precedence: "bulk",
        },
      });

      return {
        success: true,
        provider: isGmail ? "gmail" : "smtp",
        recipient,
        savedLocally: true,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[Email] SMTP OTP dispatch failed:", errorMessage);
      return {
        success: false,
        provider: isGmail ? "gmail" : "smtp",
        error: errorMessage,
        recipient,
        savedLocally: true,
      };
    }
  }

  // 3. Local Dev Output
  console.log("=================================================================");
  console.log(`[VITRA LOGIN OTP] Security code for: ${recipient}`);
  console.log(`CODE: >>>  ${params.code}  <<< (Valid for ${params.expiresMinutes || 10} minutes)`);
  console.log("Saved to: .vitra-dev-data/otp-codes.json");
  console.log("=================================================================");

  return {
    success: true,
    provider: "local_dev",
    error: "No SMTP_PASS or RESEND_API_KEY configured in .env.local.",
    recipient,
    savedLocally: true,
  };
}

export interface PaymentReceiptEmailInput {
  email: string;
  fullName?: string;
  planId: string;
  planName: string;
  amountNaira: number;
  maxCvs: number;
  reference: string;
  receiptNumber: string;
  paidAt: string;
  channel?: string;
}

/**
 * Builds an official HTML email receipt for Paystack transactions.
 */
function buildPaymentReceiptEmailHtml(data: PaymentReceiptEmailInput): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const noReplyEmail = getNoReplyEmail();
  const customerName = data.fullName?.trim() || "Vitra Candidate";
  const formattedAmount = `₦${Number(data.amountNaira).toLocaleString()}`;
  const formattedDate = new Date(data.paidAt).toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = new Date(data.paidAt).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${data.receiptNumber}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F4F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111; line-height: 1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border: 2px solid #111111; border-radius: 16px; overflow: hidden; box-shadow: 4px 4px 0px #1845E8;">
          
          <!-- Top Header Strip -->
          <tr>
            <td style="background-color: #111111; color: #FFFFFF; padding: 18px 24px; text-align: left;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #10B981; color: #FFFFFF; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 8px; border-radius: 9999px;">
                      ● OFFICIAL PAYMENT RECEIPT
                    </span>
                    <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 900; letter-spacing: -0.01em; color: #FFFFFF;">
                      VITRA CAREER LABS
                    </h1>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <div style="display: inline-block; border: 2px dashed #10B981; background-color: rgba(16, 185, 129, 0.15); color: #34D399; font-weight: 900; font-size: 11px; padding: 6px 12px; border-radius: 6px; letter-spacing: 0.05em; transform: rotate(-2deg);">
                      ✓ PAID &amp; VERIFIED
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Receipt Details Card -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #55564E;">
                Dear <strong>${customerName}</strong>,<br>
                Thank you for your order! Your payment has been confirmed via Paystack. Your candidate workspace is now upgraded with <strong>up to ${data.maxCvs} tailored CVs</strong>.
              </p>

              <!-- Meta Table -->
              <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 20px; font-size: 12px; background-color: #F9FAFB;">
                <tr>
                  <td style="color: #6B7280; font-weight: 600; width: 40%;">Receipt Number:</td>
                  <td style="color: #111111; font-weight: 800; font-family: monospace;">${data.receiptNumber}</td>
                </tr>
                <tr>
                  <td style="color: #6B7280; font-weight: 600;">Payment Reference:</td>
                  <td style="color: #111111; font-weight: 700; font-family: monospace;">${data.reference}</td>
                </tr>
                <tr>
                  <td style="color: #6B7280; font-weight: 600;">Date &amp; Time:</td>
                  <td style="color: #111111; font-weight: 700;">${formattedDate} at ${formattedTime}</td>
                </tr>
                <tr>
                  <td style="color: #6B7280; font-weight: 600;">Billed To:</td>
                  <td style="color: #111111; font-weight: 700;">${customerName} (${data.email})</td>
                </tr>
                <tr>
                  <td style="color: #6B7280; font-weight: 600;">Payment Gateway:</td>
                  <td style="color: #111111; font-weight: 700;">Paystack • ${data.channel || "Cards / Bank Transfer"}</td>
                </tr>
              </table>

              <!-- Itemized Invoice Table -->
              <table role="presentation" width="100%" cellpadding="10" cellspacing="0" style="border: 2px solid #111111; border-radius: 8px; margin-bottom: 24px; font-size: 13px;">
                <tr style="background-color: #111111; color: #FFFFFF;">
                  <th align="left" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800;">Package Description</th>
                  <th align="center" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; width: 50px;">Qty</th>
                  <th align="right" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; width: 100px;">Amount</th>
                </tr>
                <tr style="border-bottom: 1px solid #E5E7EB;">
                  <td style="padding: 12px 10px;">
                    <strong style="color: #111111; font-size: 14px;">${data.planName}</strong>
                    <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">
                      ● Up to ${data.maxCvs} distinct CVs &amp; versions<br>
                      ● Gemini AI writing engine &amp; ATS keywords<br>
                      ● All 4 professional ATS-conscious templates<br>
                      ● Unlimited PDF &amp; Word (.docx) downloads
                    </div>
                  </td>
                  <td align="center" style="color: #111111; font-weight: 700; vertical-align: top; padding-top: 12px;">1</td>
                  <td align="right" style="color: #111111; font-weight: 800; font-size: 14px; vertical-align: top; padding-top: 12px;">${formattedAmount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E5E7EB; background-color: #FAFAFA;">
                  <td colspan="2" style="font-size: 12px; color: #6B7280; padding: 8px 10px;">Paystack Gateway Processing Fee</td>
                  <td align="right" style="font-size: 12px; color: #10B981; font-weight: 700; padding: 8px 10px;">₦0.00 (Waived)</td>
                </tr>
                <tr style="border-bottom: 1px solid #E5E7EB; background-color: #FAFAFA;">
                  <td colspan="2" style="font-size: 12px; color: #6B7280; padding: 8px 10px;">Value Added Tax (VAT)</td>
                  <td align="right" style="font-size: 12px; color: #6B7280; font-weight: 600; padding: 8px 10px;">Included</td>
                </tr>
                <tr style="background-color: #EEF2FF; border-top: 2px solid #111111;">
                  <td colspan="2" style="font-size: 14px; font-weight: 900; color: #1845E8; padding: 12px 10px; text-transform: uppercase;">Total Paid:</td>
                  <td align="right" style="font-size: 18px; font-weight: 900; color: #1845E8; padding: 12px 10px;">${formattedAmount} NGN</td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #111111; color: #FFFFFF; font-weight: 800; font-size: 13px; text-decoration: none; padding: 14px 28px; border-radius: 10px; border: 2px solid #111111; box-shadow: 3px 3px 0px #1845E8; letter-spacing: 0.05em; text-transform: uppercase;">
                      LAUNCH CV WORKSPACE
                    </a>
                  </td>
                </tr>
              </table>

              <!-- No-Reply Advisory & Support Routing -->
              <div style="margin: 24px 0 0 0; border-top: 1px dashed #D1D5DB; padding-top: 16px; text-align: center;">
                <div style="display: inline-block; background-color: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px 16px; font-size: 11px; color: #4B5563; line-height: 1.5; text-align: left; max-width: 490px;">
                  <strong style="color: #111111; display: block; margin-bottom: 4px;">
                    ✉ AUTOMATED PAYMENT NOTIFICATION (NO-REPLY)
                  </strong>
                  This official payment receipt was automatically generated and sent from an unmonitored mailbox (<span style="font-family: monospace; color: #111111;">${escapeHtml(noReplyEmail)}</span>). Please do <strong>not</strong> reply directly to this email as incoming replies cannot be received or answered.<br><br>
                  If you have billing inquiries or require assistance with your account, please visit our <a href="${appUrl}/contact" style="color: #1845E8; font-weight: 700; text-decoration: underline;">Support Desk</a>.
                </div>
                <p style="margin: 12px 0 0 0; font-size: 10px; color: #9CA3AF;">
                  Vitra Career Studio • Lagos &amp; Global Job Seekers
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends a formal branded payment receipt to the customer's email.
 */
export async function sendPaymentReceiptEmail(data: PaymentReceiptEmailInput): Promise<EmailDispatchResult> {
  const recipient = data.email.trim();
  const noReplyEmail = getNoReplyEmail();
  const subjectLine = `Payment Receipt [${data.receiptNumber}] - ${data.planName} (Vitra)`;
  const htmlBody = buildPaymentReceiptEmailHtml(data);
  const textBody = `VITRA PAYMENT RECEIPT
Receipt #: ${data.receiptNumber}
Plan: ${data.planName}
Amount: ₦${data.amountNaira.toLocaleString()}
Status: PAID & VERIFIED
Reference: ${data.reference}
Billed to: ${data.fullName || "Candidate"} (${recipient})

Access your workspace: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard

--------------------------------------------------
AUTOMATED NOTIFICATION (NO-REPLY):
This receipt was generated automatically. Replies to this address (${noReplyEmail}) are unmonitored and cannot be received.
For billing support or questions, please visit ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contact.
--------------------------------------------------`;

  // Always persist a record locally so no receipt is lost
  try {
    const dir = getEmailDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "receipt-emails.json");
    let history: Array<PaymentReceiptEmailInput & { sentAt: string }> = [];
    if (fs.existsSync(file)) {
      try {
        history = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        history = [];
      }
    }
    history.unshift({ ...data, sentAt: new Date().toISOString() });
    fs.writeFileSync(file, JSON.stringify(history.slice(0, 500), null, 2), "utf8");
  } catch (err) {
    console.error("[Email] Failed to persist receipt email locally:", err);
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER || "Bolajim@gmail.com";

  // 1. Resend API
  if (resendApiKey) {
    try {
      const fromAddress = process.env.EMAIL_BILLING_FROM || process.env.EMAIL_FROM || `Vitra Billing (No-Reply) <${noReplyEmail}>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipient],
          reply_to: noReplyEmail,
          subject: subjectLine,
          html: htmlBody,
          text: textBody,
          headers: {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
          },
        }),
      });

      if (res.ok) {
        return { success: true, provider: "resend", recipient, savedLocally: true };
      }
    } catch (err) {
      console.error("[Email] Resend receipt dispatch failed:", err);
    }
  }

  // 2. Nodemailer SMTP (Gmail or custom SMTP)
  if (smtpPass && smtpHost) {
    const isGmail = smtpHost.includes("gmail");
    try {
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
            service: "gmail",
            auth: { user: smtpUser, pass: smtpPass },
          }
          : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
          }
      );

      const fromDisplay = isGmail
        ? `"Vitra Billing (No-Reply)" <${smtpUser}>`
        : `"Vitra Billing (No-Reply)" <${noReplyEmail}>`;

      await transporter.sendMail({
        from: fromDisplay,
        to: recipient,
        replyTo: `"Vitra Billing (No-Reply)" <${noReplyEmail}>`,
        subject: subjectLine,
        text: textBody,
        html: htmlBody,
        headers: {
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "All",
          Precedence: "bulk",
        },
      });

      return {
        success: true,
        provider: isGmail ? "gmail" : "smtp",
        recipient,
        savedLocally: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[Email] SMTP receipt dispatch failed:", errorMessage);
      return {
        success: false,
        provider: isGmail ? "gmail" : "smtp",
        error: errorMessage,
        recipient,
        savedLocally: true,
      };
    }
  }

  // 3. Local dev fallback
  console.log("=================================================================");
  console.log(`[VITRA RECEIPT EMAIL] Dispatched receipt for ${recipient}`);
  console.log(`Receipt #${data.receiptNumber} · Plan: ${data.planName} · Amount: ₦${data.amountNaira.toLocaleString()}`);
  console.log("Saved to: .vitra-dev-data/receipt-emails.json");
  console.log("=================================================================");

  return {
    success: true,
    provider: "local_dev",
    recipient,
    savedLocally: true,
  };
}

