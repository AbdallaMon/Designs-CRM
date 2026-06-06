import { env } from "../../../config/env.js";
import { emailShell } from "../../../infra/mail/email-shell.js";
import { brandData } from "../../../shared/brand.js";

const c = brandData.colors;

export class TelegramAuthEmails {
  static reAuthAlert() {
    const reAuthLink = `${env.DREAMSTUDIIO_DOMAIN}/dashboard?profileOpen=true`;

    const body = `
    <h2 style="color:${c.headingText};margin:0 0 8px 0;">Telegram Session Expired</h2>
    <p style="margin:0 0 20px 0;color:${c.bodyText};">
      Your Telegram connection has been disconnected or requires re-authentication.
      The system is unable to send or receive Telegram messages until you reconnect.
    </p>

    <div style="background:${c.sectionBg};border-left:4px solid ${c.primary};border-radius:6px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:${c.bodyText};">
        Please re-authenticate your Telegram account as soon as possible to avoid
        interruptions in client communication.
      </p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${reAuthLink}"
        style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${c.primary} 0%,${c.primaryLight} 100%);
               color:#fff;font-weight:bold;font-size:15px;text-decoration:none;border-radius:6px;">
        Reconnect Telegram
      </a>
    </div>

    <p style="font-size:13px;color:${c.mutedText};margin:20px 0 0 0;">
      If you believe this is a mistake or you did not disconnect Telegram,
      please contact your system administrator.
    </p>

    <p style="margin:24px 0 0 0;color:${c.bodyText};">
      Best regards,<br/>
      <strong>Dream Studio</strong>
    </p>`;

    return {
      subject: "Action Required: Telegram Re-Authentication Needed",
      html: emailShell(body),
    };
  }
}
