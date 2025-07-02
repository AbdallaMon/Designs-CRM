import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendEmail } from "../sendMail.js";
import prisma from "../../prisma/prisma.js";

const SECRET_KEY = process.env.SECRET_KEY;

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      password: true,
      isActive: true,
      isPrimary: true,
      isSuperSales: true,
    },
  });

  if (!user) {
    throw new Error("No user found with this email address");
  }

  if (!user.password) {
    throw new Error("You do not have a password, please reset your password");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error("Incorrect password");
  }

  if (!user.isActive) {
    throw new Error("Your account is blocked, you cannot log in");
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      accountStatus: user.isActive,
      isPrimary: user.isPrimary,
      isSuperSales: user.isSuperSales,
    },
    SECRET_KEY,
    { expiresIn: "4h" }
  );

  return { user, token };
}

export function logoutUser() {
  return {
    token: "",
    options: { maxAge: -1, path: "/" },
  };
}

export const createClientWithLead = async (client) => {
  //todo handle create client and lead
  await generateConfirmationToken(client.id, client.email);
};

export async function generateConfirmationToken(id, email) {
  const token = jwt.sign({ id }, SECRET_KEY, { expiresIn: "24h" });

  // Send confirmation email
  const confirmationLink = `${process.env.OLDORIGIN}/confirm?token=${token}`;
  const emailHtml = `
    <p>Please confirm your email by clicking the following link:</p>
    <a href="${confirmationLink}">Confirm Email</a>
`;
  await sendEmail(email, "Email Confirmation", emailHtml);
}

export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("No user found with this email address");
  }

  const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
  const resetLink = `${process.env.OLDORIGIN}/reset?token=${token}`;

  const emailSubject = "Password Reset Request";
  const emailHtml = `
    <p>You or someone else has requested to reset the password for your account.</p>
    <p>Please click the following link to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link will expire in one hour.</p>
`;

  await sendEmail(email, emailSubject, emailHtml);
  return "A password reset link has been sent to your email address";
};

export const resetPassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, SECRET_KEY);
  if (!decoded) {
    throw new Error("The password reset link is invalid or expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 8);

  await prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashedPassword },
  });

  return "Password reset successfully, please log in";
};
