export const usersHexColors = {
  ADMIN: "#FF4B4B",
  SUPER_ADMIN: "#D53F3F",
  NORMAL_SALES: "#4C8DFF",
  PRIMARY_SALES: "#B1975B",
  SUPER_SALES: "#26C6DA",
  DESIGNER_3D: "#B35CFF",
  DESIGNER_2D: "#FF7B5A",
  EXECUTOR_2D: "#D97706",
  ACCOUNTANT: "#3ECF7A",
  CONTACT_INITIATOR: "#0EA5A4",
  banned: "#B00020",
  default: "#6B7280",
};

export const usersColors = Object.fromEntries(
  Object.entries(usersHexColors).map(([key, value]) => [value, key]),
);

export const usersColorsArray = [...Object.values(usersHexColors)];
