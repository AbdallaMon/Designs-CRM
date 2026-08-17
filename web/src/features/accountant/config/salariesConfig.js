import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

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
        message: FORM_ERRORS.ENTER_BASE_SALARY,
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
        message: FORM_ERRORS.ENTER_BASE_WORK_HOURS,
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
        message: FORM_ERRORS.ENTER_TAX_AMOUNT,
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
