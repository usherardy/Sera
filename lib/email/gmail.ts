import "server-only";
import nodemailer from "nodemailer";

/**
 * Sending change requests through Gmail.
 *
 * For the hackathon this uses ONE Gmail account set on the server
 * (GMAIL_USER + a Gmail App Password), not a per-user Google sign-in
 * (OAuth, planned). Because the shared demo account is public, recipients
 * can be limited with SEND_ALLOWLIST and each user is rate-limited.
 */
const USER = process.env.GMAIL_USER?.trim() ?? "";
const PASS = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
// Overridable for testing against a sandbox SMTP server; defaults to Gmail.
const HOST = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
// 587 + STARTTLS: works where 465 is blocked.
const PORT = Number(process.env.SMTP_PORT || 587);

export const GMAIL_SENDING_ENABLED = USER.length > 0 && PASS.length > 0;

/** Comma-separated addresses or @domains; empty = any recipient. */
const ALLOWLIST = (process.env.SEND_ALLOWLIST ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function recipientAllowed(to: string): boolean {
  if (ALLOWLIST.length === 0) return true;
  const addr = to.trim().toLowerCase();
  return ALLOWLIST.some((rule) => (rule.startsWith("@") ? addr.endsWith(rule) : addr === rule));
}

// Best-effort, per server instance: 10 emails an hour per user.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const sends = new Map<string, number[]>();
export function overSendLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (sends.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    sends.set(userId, recent);
    return true;
  }
  recent.push(now);
  sends.set(userId, recent);
  return false;
}

export class SendError extends Error {}

export async function sendWithGmail(args: { to: string; subject: string; text: string; fromName: string }): Promise<string> {
  if (!GMAIL_SENDING_ENABLED) throw new SendError("Sending through Gmail isn't set up on this server yet.");
  const transport = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    requireTLS: PORT !== 465,
    auth: { user: USER, pass: PASS },
  });
  try {
    const info = await transport.sendMail({
      from: { name: args.fromName, address: USER },
      to: args.to,
      subject: args.subject,
      text: args.text,
    });
    return info.messageId;
  } catch (e) {
    const code = (e as { code?: string; responseCode?: number }).code;
    console.error("Gmail send failed:", code ?? "", e instanceof Error ? e.message : e);
    if (code === "EAUTH") throw new SendError("Gmail didn't accept the login. Check GMAIL_USER and GMAIL_APP_PASSWORD.");
    throw new SendError("Gmail couldn't send the email. Try again, or use Open in Gmail.");
  }
}
