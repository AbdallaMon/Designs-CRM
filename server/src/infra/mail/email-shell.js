import { brandData } from "../../shared/brand.js";

const { colors: c, logoUrl, companyName } = brandData;

/**
 * Wraps email body content with the standard Dream Studio shell.
 * @param {string} bodyHtml  Inner content
 * @returns {string}
 */
export function emailShell(bodyHtml) {
  return `
<div style="font-family:Arial,sans-serif;color:${c.bodyText};background-color:${c.pageBg};padding:30px 15px;">
  <div style="max-width:600px;margin:auto;background:${c.cardBg};border-radius:12px;box-shadow:0 0 10px rgba(0,0,0,0.03);overflow:hidden;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:linear-gradient(135deg,${c.primary} 0%,${c.primaryLight} 100%);">
      <tr>
        <td align="center" style="padding:16px;">
          <img src="${logoUrl}" alt="${companyName}" width="90"
            style="display:block;max-width:90px;height:auto;border:0;margin:0 auto;" />
        </td>
      </tr>
    </table>

    <div style="padding:28px 24px;">
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid ${c.divider};margin:24px 0;"/>
      <p style="margin:0;font-size:12px;color:${c.mutedText};">
        ${companyName} — Automated notification, please do not reply.
      </p>
    </div>

  </div>
</div>`;
}
