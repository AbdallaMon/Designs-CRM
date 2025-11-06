import prisma from "../../../prisma/prisma.js";
import { sendEmail } from "../../sendMail.js";

export async function sendSuccessEmailAfterContractSigned({
  token,
  clientLeadId,
  arPdfUrl,
  enPdfUrl,
  lng = "ar",
}) {
  // 1) Fetch client + assigned staff
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: Number(clientLeadId) },
    select: {
      client: { select: { name: true, email: true } },
      assignedTo: { select: { id: true, email: true } },
    },
  });

  // 2) Get admins (active)
  const adminUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        { subRoles: { some: { subRole: { in: ["ADMIN", "SUPER_ADMIN"] } } } },
      ],
    },
    select: { id: true, email: true },
  });

  // Deduplicate staff emails (assignedTo + admins)
  const staffMap = new Map();
  [...adminUsers, clientLead?.assignedTo].filter(Boolean).forEach((u) => {
    if (u?.email) staffMap.set(u.email.toLowerCase(), u);
  });
  const staffs = [...staffMap.values()];

  try {
    // If you track preferred lng on clientLead/client, you can fetch it; default AR.
    await sendContractEmailToClient({
      clientName: clientLead?.client?.name || "",
      clientEmail: clientLead?.client?.email || "",
      lng,
      arPdfUrl,
      enPdfUrl,
      token,
    });
  } catch (e) {
    console.log(e, "error sending client contract-signed email");
  }

  // 4) Notify staff (EN subject/body; includes both links)
  try {
    await sendContractEmailForStaff({
      staffs,
      clientName: clientLead?.client?.name || "",
      clientLeadId,
      arPdfUrl,
      enPdfUrl,
      token,
    });
  } catch (e) {
    console.log(e, "error sending staff contract-signed email");
  }
}

// ---------- Client Email (BILINGUAL BODY; LINKS FOR BOTH PDFs) ----------
export async function sendContractEmailToClient({
  clientName,
  clientEmail,
  lng = "ar",
  arPdfUrl,
  enPdfUrl,
  token,
}) {
  if (!clientEmail) return;

  // If you have a public contract viewing page, put it here:
  // Adjust this path to your actual route (e.g., /contracts/view, /contract, etc.)
  const contractPageUrl = `${
    process.env.OLDORIGIN
  }/contracts?token=${encodeURIComponent(token)}`;

  const T = getClientEmailText(lng);

  const html = `
  <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden; ${
      lng === "ar"
        ? "direction:rtl; text-align:right;"
        : "direction:ltr; text-align:left;"
    }">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);">
        <tr>
          <td align="center" style="padding:20px;">
            <img src="https://dreamstudiio.com/main-logo.jpg" alt="Dream Studio" width="90" style="display:block; max-width:90px; height:auto; border:0; margin:0 auto;" />
          </td>
        </tr>
      </table>

      <div style="padding: 20px 18px;">
        <h2 style="color: #383028; margin:0 0 6px 0;">${T.title(
          clientName
        )}</h2>
        <p style="margin: 0 0 12px 0;">${T.subtitle}</p>

        <div style="background: #f8f6f3; border-radius: 8px; padding: 14px; margin: 18px 0;">
          <h3 style="color: #383028; margin-top: 0;">${T.actions}</h3>

          <div style="margin: 14px 0; padding: 14px; background: white; border-radius: 6px; border-${
            lng === "ar" ? "right" : "left"
          }: 4px solid #be975c;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #383028;">🔎 ${
              T.viewOnline
            }</p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">${
              T.viewOnlineDesc
            }</p>
            <a href="${contractPageUrl}" style="color: #be975c; font-weight: bold; text-decoration: none; background: #f8f6f3; padding: 8px 16px; border-radius: 4px; display: inline-block;">${
    T.viewBtn
  }</a>
          </div>

          <div style="margin: 14px 0; padding: 14px; background: white; border-radius: 6px; border-${
            lng === "ar" ? "right" : "left"
          }: 4px solid #d3ac71;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #383028;">📄 ${
              T.download
            }</p>
            <p style="margin: 10px 0 8px 0; font-size: 14px; color: #666;">${
              T.downloadDesc
            }</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <a href="${arPdfUrl}" style="color: #d3ac71; font-weight: bold; text-decoration: none; background: #f8f6f3; padding: 8px 16px; border-radius: 4px; display:inline-block;">${
    T.arBtn
  }</a>
              <a href="${enPdfUrl}" style="color: #d3ac71; font-weight: bold; text-decoration: none; background: #f8f6f3; padding: 8px 16px; border-radius: 4px; display:inline-block;">${
    T.enBtn
  }</a>
            </div>
          </div>
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">💡 <em>${
          T.tip
        }</em></p>
        <p style="margin-top: 24px;">${T.footerLine}</p>
        <p style="margin: 6px 0 0 0;">${T.regards}<br/>Dream Studio</p>

        <!-- Optional bilingual footer line -->
        <hr style="border:none; border-top:1px solid #e8e2d9; margin:20px 0;"/>
        <p style="margin:0; font-size:12px; color:#8a7f70;">
          ${
            lng === "ar"
              ? "ملاحظة: تتضمن الروابط أعلاه نسختين من العقد (العربية والإنجليزية)."
              : "Note: The links above include Arabic and English versions of the contract."
          }
        </p>
      </div>
    </div>
  </div>`;

  await sendEmail(
    clientEmail,
    lng === "ar"
      ? "✅ تم توقيع عقدك بنجاح"
      : "✅ Your Contract Has Been Signed",
    html
  );
}

// ---------- Staff Email (EN body; both links) ----------
export async function sendContractEmailForStaff({
  staffs,
  clientName,
  clientLeadId,
  arPdfUrl,
  enPdfUrl,
  token,
}) {
  if (!staffs?.length) return;

  const leadUrl = `${process.env.OLDORIGIN}/dashboard/deals/${clientLeadId}`;

  const staffHtml = `
  <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);">
        <tr>
          <td align="center" style="padding:20px;">
            <img src="https://dreamstudiio.com/main-logo.jpg" alt="Dream Studio" width="90" style="display:block; max-width:90px; height:auto; border:0; margin:0 auto;" />
          </td>
        </tr>
      </table>

      <div style="padding: 30px;">
        <h2 style="color: #383028; margin-top:0;">Client Contract Signed</h2>
        <p>Client <strong>${clientName}</strong> (Lead ID: <strong>${clientLeadId}</strong>) has signed the contract.</p>
        <p><strong>Token:</strong> ${token}</p>

        <p style="margin: 14px 0 8px 0;">Quick links:</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="margin: 10px 0;"><a href="${arPdfUrl}" style="color: #d3ac71; font-weight: bold;">📄 Download AR PDF</a></li>
          <li style="margin: 10px 0;"><a href="${enPdfUrl}" style="color: #d3ac71; font-weight: bold;">📄 Download EN PDF</a></li>
          <li style="margin: 10px 0;"><a href="${leadUrl}" style="color: #d3ac71; font-weight: bold;">👤 Open Lead in Dashboard</a></li>
        </ul>

        <p style="margin-top: 20px;">— Dream Studio System Notification</p>
      </div>
    </div>
  </div>`;

  for (const staff of staffs) {
    if (!staff?.email) continue;
    await sendEmail(
      staff.email,
      `📢 Signed Contract — ${clientName}`,
      staffHtml
    );
  }
}

function getClientEmailText(lng) {
  if (lng === "ar") {
    return {
      title: (name) => `شكرًا لك ${name}!`,
      subtitle:
        "تم توقيع عقدك بنجاح. يمكنك استعراض العقد عبر الإنترنت أو تنزيل نسخة PDF.",
      actions: "ماذا تريد أن تفعل الآن؟",
      viewOnline: "استعراض العقد عبر الإنترنت",
      viewOnlineDesc:
        "راجع تفاصيل العقد واطّلع على النسخة العربية والإنجليزية في صفحة العرض.",
      viewBtn: "عرض العقد",
      download: "تحميل عقد PDF (لغتان)",
      downloadDesc: "يمكنك تنزيل النسخة العربية أو الإنجليزية لعقدك مباشرة:",
      arBtn: "تحميل النسخة العربية",
      enBtn: "Download English Version",
      tip: "يمكنك الرجوع إلى صفحة العقد في أي وقت لاستعراضه أو تنزيله.",
      footerLine: "نقدّر ثقتك بـ Dream Studio ❤️",
      regards: "أطيب التحيات،",
    };
  }
  // EN
  return {
    title: (name) => `Thank you, ${name}!`,
    subtitle:
      "Your contract has been successfully signed. You can view it online or download a PDF.",
    actions: "What would you like to do next?",
    viewOnline: "View the Contract Online",
    viewOnlineDesc:
      "Review your contract details; both Arabic and English versions are available.",
    viewBtn: "View Contract",
    download: "Download Contract (PDF)",
    downloadDesc:
      "You can download either the Arabic or English version right away:",
    arBtn: "تحميل النسخة العربية",
    enBtn: "Download English Version",
    tip: "You can return to the contract page anytime to view or download it.",
    footerLine: "We appreciate your trust in Dream Studio ❤️",
    regards: "Best regards,",
  };
}
