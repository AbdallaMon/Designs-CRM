import express from "express";
const router = express.Router();
import dayjs from "dayjs";
import prisma from "../../prisma/prisma.js";
import {
  newClientLeadNotification,
  newLeadCompletedNotification,
  newLeadNotification,
} from "../../services/notification.js";
import {
  uploadFile,
  generateCodeForNewLead,
} from "../../services/main/client/leads.js";
import { sendEmail } from "../../services/sendMail.js";

const priceRangeValues = {
  "300,000 AED or less": 200000,
  "300,000 to 400,000 AED": 350000,
  "400,000 to 600,000 AED": 500000,
  "600,000 to 800,000 AED": 700000,
  "800,000 AED and above": 900000,
  "25,000 AED or less": 12500,
  "25,000 to 45,000 AED": 35000,
  "45,000 to 65,000 AED": 55000,
  "65,000 to 85,000 AED": 75000,
  "85,000 AED and above": 100000,
};

const consultationLeadPrices = {
  ROOM: "800",
  BLUEPRINT: "1200",
  CITY_VISIT: "1800",
};

router.post("/new-lead", async (req, res) => {
  const body = req.body;

  try {
    let client = await prisma.client.findUnique({
      where: { email: body.email },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: body.name,
          phone: body.phone.replace(/\s+/g, ""),
          email: body.email,
        },
      });
    } else {
      const todayStart = dayjs().startOf("day");
      const todayEnd = dayjs().endOf("day");
      const existingLead = await prisma.clientLead.findFirst({
        where: {
          client: { email: body.email },
          createdAt: { gte: todayStart.toDate(), lte: todayEnd.toDate() },
        },
      });

      if (existingLead) {
        const message =
          body.lng === "ar"
            ? "عذراً ، لقد قمت بالفعل بإنشاء استفسار اليوم. يمكنك المحاولة مرة أخرى غدًا."
            : "Sorry, you have already created a lead today. You can try again tomorrow.";
        return res.status(422).json({ message });
      } else {
        await prisma.client.update({
          where: { id: client.id },
          data: { phone: body.phone },
        });
      }
    }

    const data = {
      client: { connect: { id: client.id } },
      selectedCategory: body.category,
      type: body.item,
      status: "NEW",
      description: `${body.category} ${body.item} ${
        body.category === "DESIGN"
          ? body.emirate
            ? body.emirate
            : "OUTSIDE UAE"
          : ""
      }`,
    };

    data.code = await generateCodeForNewLead(client.id);

    if (body.clientDescription) data.clientDescription = body.clientDescription;
    if (body.emirate) data.emirate = body.emirate;
    if (body.location === "OUTSIDE_UAE") data.emirate = "OUTSIDE";

    if (body.timeToContact) {
      const date = new Date(body.timeToContact);
      if (!isNaN(date)) data.timeToContact = date.toISOString();
    }

    if (body.country) data.country = body.country;

    if (body.priceRange) {
      data.price = `${body.priceRange[0]} - ${body.priceRange[1]}`;
      const averagePrice = (body.priceRange[0] + body.priceRange[1]) / 2;
      data.averagePrice = averagePrice;
      data.priceWithOutDiscount = averagePrice;
    }

    if (body.priceOption) {
      data.price = body.priceOption;
      data.averagePrice = priceRangeValues[body.priceOption];
      data.priceWithOutDiscount = priceRangeValues[body.priceOption];
    }

    if (body.category === "CONSULTATION") {
      data.price = consultationLeadPrices[body.item];
      data.averagePrice = Number(consultationLeadPrices[body.item]);
      data.priceWithOutDiscount = Number(consultationLeadPrices[body.item]);
    }

    data.initialConsult = false;

    const clientLead = await prisma.clientLead.create({ data });
    if (body.url) await uploadFile(body, clientLead.id);

    await newLeadNotification(clientLead.id, client, true);

    const message = body.notClientPage
      ? "Lead added successfully"
      : body.lng === "ar"
        ? "خطوة واحدة تفصلنا عن بدء العمل على مشروعك!، يرجى إتمام الدفع الآن."
        : "You're just one step away from starting your project! Complete the payment now to proceed.";

    res.status(200).json({ data: clientLead, message });
  } catch (error) {
    console.error("Error fetching client form:", error);
    const message =
      body.lng === "ar"
        ? "حدث خطا غير متوقع حاول مره اخره لاحقا"
        : "Some thing wrong happen try again later";
    res.status(500).json({ message });
  }
});

router.post("/new-lead/register", async (req, res) => {
  const body = req.body;
  console.log("Received new lead registration:", body);
  try {
    let client = await prisma.client.findUnique({
      where: { email: body.email },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: body.name,
          phone: body.phone.replace(/\s+/g, ""),
          email: body.email,
        },
      });
    } else {
      const todayStart = dayjs().startOf("day");
      const todayEnd = dayjs().endOf("day");
      const existingLead = await prisma.clientLead.findFirst({
        where: {
          client: { email: body.email },
          createdAt: { gte: todayStart.toDate(), lte: todayEnd.toDate() },
        },
      });
      if (existingLead) {
        const message =
          body.lng === "ar"
            ? "عذراً ، لقد قمت بالفعل بإنشاء استفسار اليوم. يمكنك المحاولة مرة أخرى غدًا."
            : "Sorry, you have already created a lead today. You can try again tomorrow.";
        return res.status(422).json({ message });
      } else {
        await prisma.client.update({
          where: { id: client.id },
          data: { phone: body.phone },
        });
      }
    }

    const data = {
      client: { connect: { id: client.id } },
      selectedCategory: "DESIGN",
      status: "NEW",
      description: `Didn't complete register yet`,
    };
    data.code = await generateCodeForNewLead(client.id);
    data.initialConsult = false;

    const clientLead = await prisma.clientLead.create({ data });
    await newClientLeadNotification(clientLead.id, client, true);

    // const message =
    //   body.lng === "ar"
    //     ? " .يرجى إتمام الدفع الآن."
    //     : "Complete the payment now to proceed.";
    const message =
      body.lng === "ar"
        ? "تم استلام استفسارك بنجاح! سنقوم بالتواصل معك في أقرب وقت ممكن."
        : "Your inquiry has been received successfully! We will get back to you as soon as possible.";

    res.status(200).json({ data: clientLead, message });
  } catch (error) {
    console.error("Error fetching client form:", error);
    const message =
      body.lng === "ar"
        ? "حدث خطا غير متوقع حاول مره اخره لاحقا"
        : "Some thing wrong happen try again later";
    res.status(500).json({ message });
  }
});

router.post("/new-lead/complete-register/:leadId", async (req, res) => {
  const body = req.body;
  const { leadId } = req.params;
  try {
    const data = {
      type: body.item,
      status: "NEW",
      description: `${body.category} ${body.item} ${
        body.category === "DESIGN"
          ? body.emirate
            ? body.emirate
            : "OUTSIDE UAE"
          : ""
      }`,
    };
    const lead = await prisma.clientLead.findUnique({
      where: { id: Number(leadId) },
    });
    if (lead.description !== "Didn't complete register yet") {
      if (lead.price && lead.averagePrice) {
        const message =
          body.lng === "ar"
            ? "لقد قمت بإكمال التسجيل بالفعل ولا يمكنك إعادة تقديم نفس النموذج."
            : "You have already completed the registration and cannot resubmit the same form.";
        return res.status(400).json({ message });
      }
    }

    if (body.clientDescription) data.clientDescription = body.clientDescription;
    if (body.emirate) data.emirate = body.emirate;
    if (body.location === "OUTSIDE_UAE") data.emirate = "OUTSIDE";

    if (body.timeToContact) {
      const date = new Date(body.timeToContact);
      if (!isNaN(date)) data.timeToContact = date.toISOString();
    }

    if (body.country) data.country = body.country;

    if (body.priceRange) {
      data.price = `${body.priceRange[0]} - ${body.priceRange[1]}`;
      const averagePrice = (body.priceRange[0] + body.priceRange[1]) / 2;
      data.averagePrice = averagePrice;
      data.priceWithOutDiscount = averagePrice;
    }
    if (body.priceOption) {
      data.price = body.priceOption;
      data.averagePrice = priceRangeValues[body.priceOption];
      data.priceWithOutDiscount = priceRangeValues[body.priceOption];
    }
    if (body.discoverySource) data.discoverySource = body.discoverySource;

    const clientLead = await prisma.clientLead.update({
      where: { id: Number(leadId) },
      data,
    });

    if (body.url) await uploadFile(body, clientLead.id);

    const client = await prisma.client.findUnique({
      where: { id: lead.clientId },
    });
    await newLeadCompletedNotification(clientLead.id, client, true);

    const message =
      body.lng === "ar"
        ? "تم تسجيل بياناتك بنجاح وسنقوم بالتواصل معك في اقرب وقت"
        : "Your information has been successfully recorded, and we will contact you as soon as possible.";
    res.status(200).json({ data: clientLead, message });
  } catch (error) {
    console.error("Error fetching client form:", error);
    const message =
      body.lng === "ar"
        ? "حدث خطا غير متوقع حاول مره اخره لاحقا"
        : "Some thing wrong happen try again later";
    res.status(500).json({ message });
  }
});

router.post("/cooperation-requests", async (req, res) => {
  const body = req.body;
  try {
    const to =
      process.env.ISLOCAL === "true"
        ? "info@abdallaabdelsabour.com"
        : "info@ahmadmobayed.com";

    // quick safe fallback (so "undefined" doesn't show)
    const safe = (v) => (v ?? "").toString().trim() || "-";

    const html = `
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

    await sendEmail(to, "New Cooperation Request", html);
    const message =
      body.lng === "ar"
        ? "تم إرسال طلب التعاون الخاص بك بنجاح! سنقوم بالتواصل معك في أقرب وقت ممكن."
        : "Your cooperation request has been sent successfully! We will get back to you as soon as possible.";
    res.status(200).json({ message });
  } catch (error) {
    console.error("Error fetching client form:", error);
    const message =
      body.lng === "ar"
        ? "حدث خطا غير متوقع حاول مره اخره لاحقا"
        : "Some thing wrong happen try again later";
    res.status(500).json({ message });
  }
});
export default router;
