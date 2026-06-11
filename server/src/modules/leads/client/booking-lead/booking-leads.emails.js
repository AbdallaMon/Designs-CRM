// Booking-lead transactional emails. Ported from master 03ca4d3 ("send thanks email
// after booking"). Pure HTML builders — no I/O. The submit usecase calls leadThanksEmail()
// and hands the result to the frozen mailer. Colors come from the shared brand tokens and
// the body is wrapped in the standard email shell, identical to the legacy template.
import { env } from "../../../../config/env.js";
import { emailShell } from "../../../../infra/mail/email-shell.js";
import { brandData } from "../../../../shared/brand.js";

const c = brandData.colors;

class BookingLeadsEmails {
  leadThanksEmail({ email, clientName }) {
    const body = `
      <div style="margin-bottom:24px;">
        <div style="display:inline-block;background:${c.sectionBg};border-left:3px solid ${c.primary};padding:10px 16px;border-radius:0 6px 6px 0;margin-bottom:20px;">
          <span style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${c.primary};font-weight:600;">Booking Confirmed</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${c.headingText};line-height:1.3;">Thank you for your interest, ${clientName || "there"}!</h2>
        <p style="margin:0;font-size:13px;color:${c.mutedText};">We'll be in touch within 24 hours</p>
      </div>

      <div style="background:${c.sectionBg};border-radius:8px;padding:20px;margin-bottom:24px;border:1px solid ${c.divider};">
        <p style="margin:0 0 10px;font-size:15px;color:${c.bodyText};line-height:1.7;">We have received your booking request and will be in touch shortly to discuss the next steps.</p>
        <p style="margin:0;font-size:15px;color:${c.bodyText};line-height:1.7;">In the meantime, feel free to explore our website and see some of our past projects.</p>
      </div>

      <div style="display:flex; gap:12px ;flex-wrap:wrap ;margin-bottom:8px;">
        <a href="${env.PORTFOLIO_DOMAIN}" style="display:inline-flex;margin-right:8px;align-items:center;gap:8px;padding:12px 22px;background:${c.primary};color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.3px;">
          Visit Our Website
        </a>
        <a href="${env.PORTFOLIO_DOMAIN}/projects" style="display:inline-flex;margin-right:8px;align-items:center;gap:8px;padding:12px 22px;background:transparent;color:${c.primary};text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.3px;border:1.5px solid ${c.primary};">
          View Latest Projects
        </a>
      </div>
    `;

    return {
      subject: "Thank you for your booking request!",
      html: emailShell(body),
    };
  }
}

export const bookingLeadsEmails = new BookingLeadsEmails();
