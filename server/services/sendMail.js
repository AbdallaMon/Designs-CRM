import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Your iRedMail server's hostname or IP
  port: 587, // Port for STARTTLS
  secure: false, // Use STARTTLS instead of SSL
  auth: {
    user: process.env.EMAIL_USERNAME, // Full email address (e.g., admin@example.com)
    pass: process.env.EMAIL_PASSWORD, // Email account's password
  },
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates if applicable
  },
});

export const sendEmail = async (to, subject, html, isClient = false) => {
  const fromUser = isClient
    ? process.env.AHMED_EMAIL
    : process.env.EMAIL_USERNAME;
  const fromName = isClient ? "Eng.Ahmed elmobayd" : fromUser;

  const mailOptions = {
    from: `${fromName} <${fromUser}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw new Error(`Failed to send email to ${to}`);
  }
};
