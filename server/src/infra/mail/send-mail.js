import nodemailer from "nodemailer";
import { companyName, engName } from "../config/brand.constants.js";
import { env } from "../../config/env.js";
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.EMAIL_USERNAME,
    pass: env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates if applicable
  },
});

export const sendEmail = async (to, subject, html, isClient = false) => {
  const fromUser = isClient ? env.CLIENT_EMAIL_FROM : env.EMAIL_USERNAME;
  const fromName = isClient ? engName : companyName;

  const mailOptions = {
    from: `${fromName} <${fromUser}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};
