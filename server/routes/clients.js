import { uploadAsHttp, uploadFiles } from "../services/main/utility.js";
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
import contractImageRouter from "./contract/client-contract.js";

import { getLeadsWithOutChannel } from "../services/telegram/telegram-functions.js";
const finalDir = "/home/panel.dreamstudiio.com/public_html/uploads";

import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = path.resolve(__dirname, "tmp/chunks");

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
const chunkUpload = multer({ dest: tmpDir });

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
router.use("/contracts", contractImageRouter);

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
    if (body.discoverySource) {
      data.discoverySource = body.discoverySource;
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
                  ? "$39 - Fully deducted upon contract"
                  : "٣٩ دولار 💵 – تُخصم بالكامل عند التعاقد",
            },

            unit_amount: 0,
            // 3900
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
const first = (...vals) =>
  vals.find((v) => v !== undefined && v !== null && `${v}`.trim() !== "") ?? "";
const asKV = (obj) =>
  Object.entries(obj).map(([key, value]) => ({ key, value: value ?? "" }));

router.get("/payment-status", async (req, res) => {
  const { sessionId, clientLeadId, lng } = req.query;
  if (!sessionId || !clientLeadId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        "customer",
        "payment_intent.payment_method",
        "payment_intent.latest_charge",
        "payment_intent.latest_charge.balance_transaction",
        "payment_intent.latest_charge.payment_method_details",
      ],
    });
    console.log(session.id, "session");
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
      // ---------- Collect details from best sources ----------
      const pi = session.payment_intent || null;
      const charge = pi?.latest_charge || null;
      const pm = pi?.payment_method || null;

      const billing = {
        name: first(
          charge?.billing_details?.name,
          pm?.billing_details?.name,
          session.customer_details?.name
        ),
        email: first(
          charge?.billing_details?.email,
          pm?.billing_details?.email,
          session.customer_details?.email
        ),
        phone: first(
          charge?.billing_details?.phone,
          pm?.billing_details?.phone,
          session.customer_details?.phone
        ),
        address:
          charge?.billing_details?.address ||
          pm?.billing_details?.address ||
          session.customer_details?.address ||
          null,
      };

      const addr = billing.address || {};
      const billingAddress = {
        line1: first(addr.line1),
        line2: first(addr.line2),
        city: first(addr.city),
        state: first(addr.state),
        postal_code: first(addr.postal_code),
        country: first(addr.country),
      };

      let paymentMethod = "";
      const pmd = charge?.payment_method_details;
      if (pmd?.type === "card") {
        const walletType = pmd.card?.wallet?.type; // 'apple_pay' | 'google_pay' | ...
        if (walletType) {
          paymentMethod = walletType
            .split("_")
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(" ");
        } else {
          // plain card brand, e.g. 'visa', 'mastercard'
          const brand = pm?.card?.brand || pmd.card?.brand || "Card";
          paymentMethod = brand[0].toUpperCase() + brand.slice(1);
        }
      } else if (pmd?.type) {
        // e.g. 'link', 'paypal' (if enabled), etc.
        paymentMethod = pmd.type[0].toUpperCase() + pmd.type.slice(1);
      }

      // Final normalized fields (empty strings if missing)
      const normalized = {
        name: first(billing.name),
        email: first(billing.email),
        phone: first(billing.phone),
        billingAddressLine1: billingAddress.line1,
        billingAddressLine2: billingAddress.line2,
        billingCity: billingAddress.city,
        billingState: billingAddress.state,
        billingPostalCode: billingAddress.postal_code,
        billingCountry: billingAddress.country,
        paymentMethod: first(paymentMethod),
      };

      // Build KV array exactly as you asked
      const kv = asKV(normalized);
      await prisma.clientLead.update({
        where: { id: Number(clientLeadId) },
        data: {
          stripieMetadata: kv,
        },
      });
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
        session,
        kv,
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

router.get("/stripe/backfill", async (req, res) => {
  try {
    if (req.query.pass !== process.env.SECRET_KEY)
      throw new Error("Not allowed");
    return null;
    const sinceEpoch = Number(req.body.sinceEpoch || 0);
    const result = await backfillStripeSessions({ sinceEpoch });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
});
async function backfillStripeSessions({
  sinceEpoch = 0,
  limitPerPage = 1000,
  maxPages = 1000,
}) {
  let starting_after = undefined;
  let processed = 0;

  for (let page = 0; page < maxPages; page++) {
    const list = await stripe.checkout.sessions.list({
      limit: limitPerPage,
      ...(starting_after ? { starting_after } : {}),
      ...(sinceEpoch ? { created: { gte: sinceEpoch } } : {}),
    }); // Paginated list of past sessions. :contentReference[oaicite:2]{index=2}
    if (!list.data.length) break;

    for (const session of list.data) {
      starting_after = session.id;
      // Only handle paid one-time payments
      if (session.mode !== "payment" || session.payment_status !== "paid")
        continue;
      // Get leadId from metadata (primary) or success_url (fallback)
      const leadId =
        first(session.metadata?.clientLeadId) ||
        first(getLeadIdFromUrl(session.success_url));
      if (!leadId) continue;

      // Normalize payer data from the expanded objects
      const { normalized, piId } = await normalizeFromSession(session);
      const kv = asKV(normalized);

      // Update your DB only if the lead exists
      const lead = await prisma.clientLead.findUnique({
        where: { id: Number(leadId) },
        select: { id: true },
      });
      if (!lead) continue;

      await prisma.clientLead.update({
        where: { id: Number(leadId) },
        data: { stripieMetadata: kv },
      });

      processed++;
    }

    if (!list.has_more) break;
  }

  return { processed };
}
function getLeadIdFromUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.searchParams.get("clientLeadId") || "";
  } catch {
    return "";
  }
}

async function normalizeFromSession(session) {
  if (!session?.id) return { normalized: {}, piId: null };

  // Expand PI/Charge/PM to read wallet/brand + billing details
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: [
      "payment_intent.payment_method",
      "payment_intent.latest_charge",
      "payment_intent.latest_charge.payment_method_details",
    ],
  });
  console.log(full, "full");

  const pi = full.payment_intent || null;
  const charge = pi?.latest_charge || null;
  const pm = pi?.payment_method || null;

  const billing = {
    name: first(
      charge?.billing_details?.name,
      pm?.billing_details?.name,
      full.customer_details?.name
    ),
    email: first(
      charge?.billing_details?.email,
      pm?.billing_details?.email,
      full.customer_details?.email
    ),
    phone: first(
      charge?.billing_details?.phone,
      pm?.billing_details?.phone,
      full.customer_details?.phone
    ),
    address:
      charge?.billing_details?.address ||
      pm?.billing_details?.address ||
      full.customer_details?.address ||
      null,
  };

  const addr = billing.address || {};
  const pmd = charge?.payment_method_details;

  let paymentMethod = "";
  if (pmd?.type === "card") {
    const walletType = pmd.card?.wallet?.type; // 'apple_pay' | 'google_pay' | ...
    if (walletType) {
      paymentMethod = walletType
        .split("_")
        .map((s) => s[0].toUpperCase() + s.slice(1))
        .join(" ");
    } else {
      const brand = pm?.card?.brand || pmd.card?.brand || "Card";
      paymentMethod = brand[0].toUpperCase() + brand.slice(1);
    }
  } else if (pmd?.type) {
    paymentMethod = pmd.type[0].toUpperCase() + pmd.type.slice(1); // e.g. Link
  }

  const normalized = {
    name: first(billing.name),
    email: first(billing.email),
    phone: first(billing.phone),
    billingAddressLine1: first(addr.line1),
    billingAddressLine2: first(addr.line2),
    billingCity: first(addr.city),
    billingState: first(addr.state),
    billingPostalCode: first(addr.postal_code),
    billingCountry: first(addr.country),
    paymentMethod: first(paymentMethod),
  };

  return { normalized, piId: pi?.id || null };
}

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
router.post("/upload", chunkUpload.single("chunk"), async (req, res) => {
  const { filename, chunkIndex, totalChunks } = req.body;
  const originalName = path.basename(filename);
  const chunkNumber = parseInt(chunkIndex);
  const chunkFilePath = path.join(tmpDir, `${originalName}.part${chunkNumber}`);

  fs.renameSync(req.file.path, chunkFilePath);

  // If last chunk, merge all
  if (chunkNumber + 1 === parseInt(totalChunks)) {
    const uniqueFilename = `${uuidv4()}${path.extname(originalName)}`;
    const finalPath = path.join(finalDir, uniqueFilename);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.join(tmpDir, `${originalName}.part${i}`);
      const data = fs.readFileSync(partPath);
      writeStream.write(data);
      fs.unlinkSync(partPath); // clean up chunk
    }

    const fileUrl = process.env.ISLOCAL
      ? `${process.env.SERVER}/uploads/${uniqueFilename}`
      : `http://panel.dreamstudiio.com/uploads/${uniqueFilename}`;

    writeStream.end();
    writeStream.on("finish", () => {
      console.log(fileUrl, "fileUrl");
      return res.json({ message: "✅ Upload complete", url: fileUrl });
    });
  } else {
    res.json({ message: `✅ Chunk ${chunkNumber + 1} received` });
  }
});

// router.post("/upload", async (req, res) => {
//   await uploadFiles(req, res);
// });

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
router.get("/telegram", async (req, res) => {
  try {
    const data = await getLeadsWithOutChannel();
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
