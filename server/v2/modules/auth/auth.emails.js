import { env } from "../../config/env.js";
import { emailShell } from "../../infra/mail/email-shell.js";
import { brandData } from "../../shared/brand.js";

const c = brandData.colors;

export class AuthEmails {
  static resetEmail(resetToken) {
    const resetLink = `${env.DREAMSTUDIIO_DOMAIN}/reset?token=${encodeURIComponent(resetToken)}`;

    const body = `
    <h2 style="color:${c.headingText};margin:0 0 8px 0;">Reset Your Password</h2>
    <p style="margin:0 0 20px 0;color:${c.bodyText};">
      You or someone else has requested a password reset for your Dream Studio account.
      If this was you, click the button below to set a new password.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${resetLink}"
        style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${c.primary} 0%,${c.primaryLight} 100%);
               color:#fff;font-weight:bold;font-size:15px;text-decoration:none;border-radius:6px;">
        Reset Password
      </a>
    </div>

    <div style="background:${c.sectionBg};border-radius:8px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:${c.subtleText};">
        ⏰ This link will expire in <strong>1 hour</strong>.
      </p>
    </div>

    <p style="font-size:13px;color:${c.mutedText};margin:20px 0 0 0;">
      If you did not request a password reset, you can safely ignore this email.
      Your password will not change.
    </p>

    <p style="margin:24px 0 0 0;color:${c.bodyText};">
      Best regards,<br/>
      <strong>Dream Studio</strong>
    </p>`;

    return {
      subject: "Reset Your Password",
      html: emailShell(body),
    };
  }
}
