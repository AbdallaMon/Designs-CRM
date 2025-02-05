import { uploadFiles } from "../services/utility.js";
import express from "express";
const router = express.Router();
import prisma from "../prisma/prisma.js";
import { newLeadNotification } from "../services/notification.js";
import axios from "axios";
import dayjs from "dayjs";

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
          phone: body.phone,
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
    const clientLead = await prisma.clientLead.create({
      data,
    });
    if (body.url) {
      await uploadFile(body, clientLead.id);
    }
    await newLeadNotification(clientLead.id, client);
    const message =
      body.lng === "ar"
        ? "تم تسجيل بياناتك بنجاح"
        : "Your data has been successfully submitted";
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

router.get("/products", async (req, res) => {
  try {
    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2023-01/graphql.json`,
      {
        query: `
        {
          product(id: "gid://shopify/Product/8739939942638") {
            id
            title
            description
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
        `,
      },
      {
        headers: {
          "X-Shopify-Storefront-Access-Token":
            process.env.SHOPIFY_STOREFRONT_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const product = response.data.data?.product;
    const formattedProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      variants: product.variants.edges.map((variant) => ({
        id: variant.node.id,
        title: variant.node.title,
        price: variant.node.price.amount,
        currency: variant.node.price.currencyCode,
      })),
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error(
      "Error fetching product:",
      error.response?.data || error.message
    );
    res.status(500).send("Internal Server Error");
  }
});
router.post("/checkout", async (req, res) => {
  try {
    const { variantId } = req.body;
    const globalVariantId = `gid://shopify/ProductVariant/${variantId}`;
    const cartCreateMutation = `
      mutation {
        cartCreate(input: {
          lines: [{ merchandiseId: "${globalVariantId}", quantity: ${1} }]
        }) {
          userErrors {
            message
            code
            field
          }
          cart {
            id
            checkoutUrl
          }
        }
      }
    `;

    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`, // Update API version
      {
        query: cartCreateMutation,
      },
      {
        headers: {
          "X-Shopify-Storefront-Access-Token":
            process.env.SHOPIFY_STOREFRONT_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.data.cartCreate.userErrors.length > 0) {
      console.log(response.data.data.cartCreate.userErrors);
      throw new Error("Something wrong happen try again later");
    }
    return res.json({ data: response.data.data.cartCreate.cart });
  } catch (error) {
    console.error(
      "Error creating checkout:",
      error.response?.data || error.message
    );
    res.status(500).send("Internal Server Error");
  }
});

router.get("/confirm", async (req, res) => {
  try {
    const { orderId } = req.query; // Extract checkout_id from query string

    if (!orderId) {
      return res.status(400).json({ error: "Missing checkout_id" });
    }

    const response = await axios.get(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-01/orders/${orderId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_TOKEN,
        },
      }
    );
    console.log(response, "response");
    const checkoutData = response.data.data?.node;

    if (!checkoutData) {
      return res.status(404).send("Checkout not found");
    }

    res.json(checkoutData);
  } catch (error) {
    console.error(
      "Error fetching checkout details:",
      error.response?.data || error.message
    );
    res.status(500).send("Internal Server Error");
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
