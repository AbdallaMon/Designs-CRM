import { uploadFiles } from "../services/utility.js";
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

// router.get("/products", async (req, res) => {
//   try {
//     // const response = await axios.post(
//     //   `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2023-01/graphql.json`,
//     //   {
//     //     query: `
//     //     {
//     //       product(id: "gid://shopify/Product/8739939942638") {
//     //         id
//     //         title
//     //         description
//     //         variants(first: 100) {
//     //           edges {
//     //             node {
//     //               id
//     //               title
//     //               price {
//     //                 amount
//     //                 currencyCode
//     //               }
//     //             }
//     //           }
//     //         }
//     //       }
//     //     }
//     //     `,
//     //   },
//     //   {
//     //     headers: {
//     //       "X-Shopify-Storefront-Access-Token":
//     //         process.env.SHOPIFY_STOREFRONT_TOKEN,
//     //       "Content-Type": "application/json",
//     //     },
//     //   }
//     // );
//     const response = await axios.post(
//       `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2023-01/graphql.json`,
//       {
//         query: `
//         {
//           products(first: 10, sortKey: UPDATED_AT) {
//             edges {
//               node {
//                 id
//                 title
//                 description
//                 variants(first: 100) {
//                   edges {
//                     node {
//                       id
//                       title
//                       price {
//                         amount
//                         currencyCode
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//         `,
//       },
//       {
//         headers: {
//           "X-Shopify-Storefront-Access-Token":
//             process.env.SHOPIFY_STOREFRONT_TOKEN,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     res.json(response.data.data.products.edges);
//     const product = response.data.data?.product;
//     const formattedProduct = {
//       id: product.id,
//       title: product.title,
//       description: product.description,
//       variants: product.variants.edges.map((variant) => ({
//         id: variant.node.id,
//         title: variant.node.title,
//         price: variant.node.price.amount,
//         currency: variant.node.price.currencyCode,
//       })),
//     };

//     res.json(formattedProduct);
//   } catch (error) {
//     console.error(
//       "Error fetching product:",
//       error.response?.data || error.message
//     );
//     res.status(500).send("Internal Server Error");
//   }
// });
// router.post("/checkout", async (req, res) => {
//   try {
//     const { variantId } = req.body;
//     const globalVariantId = `gid://shopify/ProductVariant/${variantId}`;
//     const cartCreateMutation = `
//       mutation {
//         cartCreate(input: {
//           lines: [{ merchandiseId: "${globalVariantId}", quantity: ${1} }]
//         }) {
//           userErrors {
//             message
//             code
//             field
//           }
//           cart {
//             id
//             checkoutUrl
//           }
//         }
//       }
//     `;

//     const response = await axios.post(
//       `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`, // Update API version
//       {
//         query: cartCreateMutation,
//       },
//       {
//         headers: {
//           "X-Shopify-Storefront-Access-Token":
//             process.env.SHOPIFY_STOREFRONT_TOKEN,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     if (response.data.data.cartCreate.userErrors.length > 0) {
//       console.log(response.data.data.cartCreate.userErrors);
//       throw new Error("Something wrong happen try again later");
//     }
//     return res.json({ data: response.data.data.cartCreate.cart });
//   } catch (error) {
//     console.error(
//       "Error creating checkout:",
//       error.response?.data || error.message
//     );
//     res.status(500).send("Internal Server Error");
//   }
// });

// router.get("/confirm", async (req, res) => {
//   try {
//     const { orderId } = req.query; // Extract checkout_id from query string

//     if (!orderId) {
//       return res.status(400).json({ error: "Missing checkout_id" });
//     }

//     const response = await axios.get(
//       `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-01/orders/${orderId}.json`,
//       {
//         headers: {
//           "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_TOKEN,
//         },
//       }
//     );
//     console.log(response, "response");
//     const checkoutData = response.data.data?.node;

//     if (!checkoutData) {
//       return res.status(404).send("Checkout not found");
//     }

//     res.json(checkoutData);
//   } catch (error) {
//     console.error(
//       "Error fetching checkout details:",
//       error.response?.data || error.message
//     );
//     res.status(500).send("Internal Server Error");
//   }
// });

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
            // product_data: {
            //   name:
            //     req.body.lng === "en"
            //       ? "First-Stage Design Analysis with Eng. Ahmed"
            //       : "حجز المرحلة الاولي من استشارة التصميم مع المهندس احمد",
            //   description:
            //     req.body.lng === "en"
            //       ? "[Book now and start your design] $180 - Fully deducted upon contract"
            //       : "[احجز الآن وابدأ تصميمك] 💵 180 دولار – تُخصم بالكامل عند التعاقد",
            // },١٨٠
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

export default router;
