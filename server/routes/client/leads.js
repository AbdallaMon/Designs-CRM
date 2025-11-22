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
} from "../../services/client/leads.js";

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

export default router;
