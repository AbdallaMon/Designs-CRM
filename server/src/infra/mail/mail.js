import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_SECURE || false, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_USERNAME,
    pass: env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends an email.
 * @param {{ to: string, subject: string, html: string, from?: string }} options
 */
export async function sendEmail({ to, subject, html, from }) {
  const sender = from ?? env.EMAIL_USERNAME;

  await transporter.sendMail({
    from: sender,
    to,
    subject,
    html,
  });
}
