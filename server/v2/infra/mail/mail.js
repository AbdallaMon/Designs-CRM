import nodemailer from "nodemailer";
import { env } from "../../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: 587,
  secure: false,
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
