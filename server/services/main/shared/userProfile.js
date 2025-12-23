import prisma from "../../../prisma/prisma.js";

export async function getUserProfileById(userId) {
  const userProfile = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });
  return userProfile;
}

export async function updateUserProfileById(userId, updates) {
  const updatedProfile = await prisma.user.update({
    where: { id: Number(userId) },
    data: updates,
  });
  return updatedProfile;
}
