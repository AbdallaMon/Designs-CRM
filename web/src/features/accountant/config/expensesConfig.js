import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export const inputs = [
  {
    data: { id: "category", label: "Category", type: "text" },
    pattern: { required: { value: true, message: FORM_ERRORS.PAYMENT_CATEGORY } },
  },
  {
    data: {
      id: "description",
      label: "Description",
      type: "textarea",
    },
  },
  {
    data: {
      id: "paymentDate",
      label: "Payment date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: FORM_ERRORS.DATE_REQUIRED } },
  },
  {
    data: { id: "amount", label: "Amount", type: "number" },
    pattern: { required: { value: true, message: FORM_ERRORS.AMOUNT_REQUIRED } },
  },
];

export const columns = [
  { name: "category", label: "Category" },
  { name: "description", label: "Description" },
  { name: "amount", label: "Amount" },
  { name: "paymentDate", label: "Payment date", type: "date" },
];
