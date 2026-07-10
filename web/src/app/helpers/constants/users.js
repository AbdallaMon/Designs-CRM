export const UserRole = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

export const userRoles = [
  { value: "STAFF", label: "Sales" },
  { value: "SUPER_SALES", label: "Super sales" },
  { value: "CONTACT_INITIATOR", label: "Contact initiator" },
  { value: "THREE_D_DESIGNER", label: "3D Designer" },
  { value: "TWO_D_DESIGNER", label: "2D Designer" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "SUPER_ADMIN", label: "Admin" },
];
export const superSalesUserRoles = [
  {
    value: "STAFF",
    label: "Sales",
  },
  { value: "SUPER_SALES", label: "Super sales" },
];

export const userRolesEnum = {
  STAFF: "Staff",
  THREE_D_DESIGNER: "3D Designer",
  TWO_D_DESIGNER: "2D Designer",
  ACCOUNTANT: "Accountant",
  SUPER_ADMIN: "Admin",
  SUPER_SALES: "Super sales",
  CONTACT_INITIATOR: "Contact initiator",
};

export const superSalesUserRolesEnum = {
  STAFF: "Staff",
  SUPER_SALES: "Super sales",
};

export const usersHexColors = {
  SUPER_ADMIN: "#FF4B4B", // bright red
  SUPER_SALES: "#26C6DA", // vibrant amber
  STAFF: "#4C8DFF", // strong blue
  isPrimary: "#b1975bff", // very light soft amber (lighter than TWO_D_EXECUTOR)
  isSuperSales: "#26C6DA", // teal (different from ACCOUNTANT green)
  THREE_D_DESIGNER: "#B35CFF", // vivid violet
  TWO_D_DESIGNER: "#FF7B5A", // warm coral
  banned: "#B00020", // deep dark red (much darker than SUPER_ADMIN)
  ACCOUNTANT: "#3ECF7A", // fresh green
};

export const usersColors = Object.fromEntries(
  Object.entries(usersHexColors).map(([key, value]) => [value, key])
);

export const usersColorsArray = [...Object.values(usersHexColors)];

export const roleIcons = {
  STAFF: "👷",
  THREE_D_DESIGNER: "🎨",
  TWO_D_DESIGNER: "🖌",
  ACCOUNTANT: "💰",
  SUPER_ADMIN: "🛡",
  SUPER_SALES: "🚀",
  PRIMARY_SALES: "⭐",
};
