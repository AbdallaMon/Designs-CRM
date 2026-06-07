// leads/client/public-lead email — the cooperation-request HTML template, lifted VERBATIM
// from legacy `routes/client/leads.js` (`/cooperation-requests`). Pure string building, no
// I/O. The sending goes through the frozen `services/sendMail.js` via a lazy adapter.

// quick safe fallback (so "undefined" doesn't show) — verbatim from legacy.
const safe = (v) => (v ?? "").toString().trim() || "-";

export function buildCooperationRequestEmail(body) {
  return `
  <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px 15px;">
    <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden; direction:ltr; text-align:left;">

      <!-- Header -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);">
        <tr>
          <td style="padding: 18px 16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:10px; background: rgba(255,255,255,0.22); display:flex; align-items:center; justify-content:center; font-size:18px;">
                🤝
              </div>
              <div>
                <div style="color:#ffffff; font-weight:700; font-size:16px; line-height:1.2;">New Cooperation Request</div>
                <div style="color:rgba(255,255,255,0.9); font-size:12px; margin-top:4px;">
                  A new lead submitted the cooperation form.
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Body -->
      <div style="padding: 20px 16px;">
        <h2 style="color: #383028; margin:0 0 10px 0; font-size:18px;">Lead details</h2>
        <p style="margin:0 0 14px 0; color:#6b6156; font-size:14px;">
          Below is the information submitted by the client:
        </p>

        <!-- Info Card -->
        <div style="background: #f8f6f3; border-radius: 10px; padding: 12px; margin: 18px 0;">

          <div style="margin: 10px 0; padding: 12px; background: #ffffff; border-radius: 8px; border-left: 4px solid #be975c;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#383028;">
              <tr>
                <td style="padding:6px 0; width:120px; color:#8a7f70;">Name</td>
                <td style="padding:6px 0; font-weight:700;">${safe(body.name)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; width:120px; color:#8a7f70;">Email</td>
                <td style="padding:6px 0;">
                  <a href="mailto:${encodeURIComponent(safe(body.email))}" style="color:#be975c; font-weight:700; text-decoration:none;">
                    ${safe(body.email)}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0; width:120px; color:#8a7f70;">Phone</td>
                <td style="padding:6px 0; font-weight:700;">${safe(body.phone)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; width:120px; color:#8a7f70;">Website</td>
                <td style="padding:6px 0;">
                  ${
                    safe(body.website) === "-"
                      ? "-"
                      : `<a href="${safe(body.website)}" style="color:#d3ac71; font-weight:700; text-decoration:none;">${safe(body.website)}</a>`
                  }
                </td>
              </tr>
            </table>
          </div>


        </div>

        <!-- Footer -->
        <p style="margin-top: 18px; font-size: 12px; color: #8a7f70;">
          💡 Tip: Reply fast increases conversion rate.
        </p>

        <hr style="border:none; border-top:1px solid #e8e2d9; margin:18px 0;"/>
        <p style="margin:0; font-size:12px; color:#8a7f70;">
          This email was generated automatically from your website contact form.
        </p>
      </div>
    </div>
  </div>
  `;
}
