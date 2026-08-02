
export const inputs = [
  {
    data: {
      id: "baseSalary",
      type: "number",
      label: "Base salary",
      key: "baseSalary.baseSalary",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a Base salary",
      },
    },
  },
  {
    data: {
      id: "baseWorkHours",
      type: "number",
      label: "Base work hours",
      key: "baseSalary.baseWorkHours",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a Base work hours",
      },
    },
  },
  {
    data: {
      id: "taxAmount",
      type: "number",
      label: "Tax amount",
      key: "baseSalary.taxAmount",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a tax amount",
      },
    },
  },
];
export const columns = [
  { name: "name", label: "User Name" },
  { name: "email", label: "Email" },
  {
    name: "currentProfile",
    label: "Profile",
    type: "function",
    render: (item) => item.currentProfile?.label || "—",
  },
  {
    name: "isActive",
    label: "Account status",
    type: "boolean",
    enum: { TRUE: "Active", FALSE: "Banned" },
  },
];
