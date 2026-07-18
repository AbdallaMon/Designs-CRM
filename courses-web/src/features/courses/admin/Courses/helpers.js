// Pure role → chip-color map used by the admin course cards.
export const getRoleColor = (role) => {
  const colors = {
    STAFF: "#ff9800",
    THREE_D_DESIGNER: "#4caf50",
    TWO_D_DESIGNER: "#2196f3",
    ACCOUNTANT: "#9c27b0",
    SUPER_ADMIN: "#f44336",
  };
  return colors[role] || "#757575";
};
