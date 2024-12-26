import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
        user: process.env.EMAIL_USERNAME, // Your Gmail address
        pass: process.env.EMAIL_PASSWORD, // Your Gmail App Password (if 2FA is enabled)
    },
});

export const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME, // Gmail address (no need for display name)
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return {success: true, messageId: info.messageId};
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw new Error(`Failed to send email to ${to}`);
    }
};
