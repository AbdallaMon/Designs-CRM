import {
  uploadAsHttp,
  uploadFiles,
} from "../services/main/utility.js";
import express from "express";
const router = express.Router();
import prisma from "../prisma/prisma.js";
import {
  leadPaymentSuccessed,
  newClientLeadNotification,
  newLeadCompletedNotification,
  newLeadNotification,
  sendPaymentReminderEmail,
  sendPaymentSuccessEmail,
} from "../services/notification.js";
import dayjs from "dayjs";
import Stripe from "stripe";
import {
  changeSessionStatus,
  getLanguages,
  submitSelectedImages,
  submitSelectedPatterns,
} from "../services/main/clientServices.js";
import {
  addNote,
  getImages,
  getImageSesssionModel,
  getNotes,
} from "../services/main/sharedServices.js";
import calendarRoutes from "./calendar/client-calendar.js";
import imageSessionRouter from "./image-session/client-image-session.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
router.use("/calendar", calendarRoutes);

router.use("/image-session", imageSessionRouter);

router.post("/new-lead", async (req, res) => {
  const body = req.body;

  try {
    let client = await prisma.client.findUnique({
      where: {
        email: body.email,
      },
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
          createdAt: {
            gte: todayStart.toDate(),
            lte: todayEnd.toDate(),
          },
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
          where: {
            id: client.id,
          },
          data: {
            phone: body.phone,
          },
        });
      }
    }
    const data = {
      client: {
        connect: { id: client.id },
      },
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
    if (body.clientDescription) {
      data.clientDescription = body.clientDescription;
    }
    if (body.emirate) {
      data.emirate = body.emirate;
    }
    if (body.location === "OUTSIDE_UAE") {
      data.emirate = "OUTSIDE";
    }
    if (body.timeToContact) {
      const date = new Date(body.timeToContact);
      if (!isNaN(date)) {
        data.timeToContact = date.toISOString(); // Convert to ISO-8601 format
      }
    }

    if (body.country) {
      data.country = body.country;
    }
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
    const clientLead = await prisma.clientLead.create({
      data,
    });
    if (body.url) {
      await uploadFile(body, clientLead.id);
    }
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
      where: {
        email: body.email,
      },
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
          createdAt: {
            gte: todayStart.toDate(),
            lte: todayEnd.toDate(),
          },
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
          where: {
            id: client.id,
          },
          data: {
            phone: body.phone,
          },
        });
      }
    }
    const data = {
      client: {
        connect: { id: client.id },
      },
      selectedCategory: "DESIGN",
      status: "NEW",
      description: `Didn't complete register yet`,
    };
    data.initialConsult = false;
    const clientLead = await prisma.clientLead.create({
      data,
    });
    await newClientLeadNotification(clientLead.id, client, true);
    const message =
      body.lng === "ar"
        ? " .يرجى إتمام الدفع الآن."
        : "Complete the payment now to proceed.";
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
      where: {
        id: Number(leadId),
      },
    });
    if (lead.description !== "Didn't complete register yet") {
      // Check if price and averagePrice are set (non-null)
      if (lead.price && lead.averagePrice) {
        const message =
          body.lng === "ar"
            ? "لقد قمت بإكمال التسجيل بالفعل ولا يمكنك إعادة تقديم نفس النموذج."
            : "You have already completed the registration and cannot resubmit the same form.";
        return res.status(400).json({ message });
      }
    }
    if (body.clientDescription) {
      data.clientDescription = body.clientDescription;
    }
    if (body.emirate) {
      data.emirate = body.emirate;
    }
    if (body.location === "OUTSIDE_UAE") {
      data.emirate = "OUTSIDE";
    }
    if (body.timeToContact) {
      const date = new Date(body.timeToContact);
      if (!isNaN(date)) {
        data.timeToContact = date.toISOString(); // Convert to ISO-8601 format
      }
    }

    if (body.country) {
      data.country = body.country;
    }
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
    const clientLead = await prisma.clientLead.update({
      where: {
        id: Number(leadId),
      },
      data,
    });
    if (body.url) {
      await uploadFile(body, clientLead.id);
    }

    const client = await prisma.client.findUnique({
      where: {
        id: lead.clientId,
      },
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

router.post("/pay", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        clientId: req.body.clientId,
        clientLeadId: req.body.clientLeadId,
        lng: req.body.lng,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                req.body.lng === "en"
                  ? "[Book now and start your design]"
                  : "[احجز الآن وابدأ تصميمك]",
              description:
                req.body.lng === "en"
                  ? "$29 - Fully deducted upon contract"
                  : "٢٩ دولار 💵 – تُخصم بالكامل عند التعاقد",
            },

            unit_amount: 2900, // 18000 // 2900
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${req.body.clientId}&clientLeadId=${req.body.clientLeadId}&lng=${req.body.lng}`,
      cancel_url: `${process.env.ORIGIN}/cancel?session_id={CHECKOUT_SESSION_ID}&clientId=${req.body.clientId}&clientLeadId=${req.body.clientLeadId}&lng=${req.body.lng}`,
    });
    const clientLead = await prisma.clientLead.findUnique({
      where: { id: Number(req.body.clientLeadId) },
      select: {
        id: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    await sendPaymentReminderEmail(
      clientLead.client.email,
      clientLead.client.name,
      session.url,
      req.body.lng
    );

    return res.json({ url: session.url });
  } catch (error) {
    console.error(
      "Error creating checkout:",
      error.response?.data || error.message
    );
    res.status(500).send("Internal Server Error");
  }
});

router.get("/payment-status", async (req, res) => {
  const { sessionId, clientLeadId, lng } = req.query;
  if (!sessionId || !clientLeadId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const oldLead = await prisma.clientLead.findUnique({
        where: {
          id: Number(clientLeadId),
        },
        select: {
          paymentStatus: true,
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      if (oldLead.paymentStatus !== "FULLY_PAID") {
        const lead = await prisma.clientLead.update({
          where: {
            id: Number(clientLeadId),
          },
          data: {
            paymentStatus: "FULLY_PAID",
            paymentSessionId: session.id,
          },
        });
        await leadPaymentSuccessed(clientLeadId);
      }
      await sendPaymentSuccessEmail(
        oldLead.client.email,
        oldLead.client.name,
        clientLeadId,
        lng
      );
      return res.status(200).json({
        paymentStatus: "PAID",
        success: true,
        message: "Payment verified",
      });
    } else {
      return res.status(402).json({
        status: "ERROR",
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
});
async function uploadFile(body, clientLeadId) {
  const data = {
    name: "Client File",
    clientLeadId: Number(clientLeadId),
    url: body.url,
    isUserFile: false,
  };
  const file = await prisma.file.create({
    data,
    select: {
      id: true,
    },
  });
  return file;
}
router.post("/upload", async (req, res) => {
  await uploadFiles(req, res);
});

router.post("/api/upload", upload.single("file"), uploadAsHttp);

// client image session

router.get(`/image-session/data`, async (req, res) => {
  try {
    const colors = await getImageSesssionModel({ model: req.query.model });
    res.status(200).json({ data: colors });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});
router.get(`/image-session/images`, async (req, res) => {
  try {
    const images = await getImages({
      patternIds: req.query.patterns,
      spaceIds: req.query.spaces,
    });
    res.status(200).json({ data: images });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});
router.post(`/image-session/save-patterns`, async (req, res) => {
  try {
    const session = await submitSelectedPatterns({
      token: req.body.token,
      patternIds: req.body.patterns,
    });
    res.status(200).json({ data: session, message: "Colors pattern selected" });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

router.post(`/image-session/save-images`, async (req, res) => {
  try {
    const session = await submitSelectedImages({
      token: req.body.token,
      imageIds: req.body.imageIds,
    });
    res
      .status(200)
      .json({ data: session, message: "Image selections saved succsfully" });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

router.post(`/image-session/save-images`, async (req, res) => {
  try {
    const session = await changeSessionStatus({
      token: req.body.token,
      status: "APPROVING",
    });
    res.status(200).json({
      data: session,
      message: "Success now just signature and approve your data",
    });
  } catch (e) {
    console.log(e, "e");
    return res.status(500).json({ error: "Some thing wrong happened" });
  }
});

// router.post("/image-session/generate-pdf", async (req, res) => {
//   const { sessionData, signatureUrl } = req.body;

//   try {
//     const pdfBytes = await generateImageSessionPdf({
//       sessionData,
//       signatureUrl,
//     });

//     const fileName = `session-${sessionData.id}-${uuidv4()}.pdf`;
//     const remotePath = `public_html/uploads/${fileName}`;

//     await uploadToFTPAsBuffer(pdfBytes, remotePath, true);

//     const publicUrl = `https://panel.dreamstudiio.com/uploads/${fileName}`;

//     await approveSession({
//       token: sessionData.token,
//       clientLeadId: sessionData.clientLeadId,
//       id: Number(sessionData.id),
//       pdfUrl: publicUrl,
//     });
//     return res
//       .status(200)
//       .json({ message: "Response saved succussfully", url: publicUrl });
//   } catch (err) {
//     console.error("PDF generation error:", err);
//     return res
//       .status(500)
//       .json({ success: false, error: "Failed to generate PDF" });
//   }
// });

router.get("/notes", async (req, res) => {
  try {
    const searchParams = req.query;
    const notes = await getNotes(searchParams);
    res.status(200).json({ data: notes });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ message: error.message });
  }
});
router.post("/notes", async (req, res) => {
  try {
    const newNote = await addNote({
      ...req.body,
      client: true,
    });
    res.status(200).json(newNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/languages", async (req, res) => {
  try {
    const languages = await getLanguages({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data: languages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
