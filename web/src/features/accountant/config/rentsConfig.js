import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export const renewInputs = [
  {
    data: {
      id: "startDate",
      label: "Start date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: FORM_ERRORS.DATE_REQUIRED } },
  },
  {
    data: {
      id: "endDate",
      label: "End date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: FORM_ERRORS.DATE_REQUIRED } },
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
export const inputs = [
  {
    data: { id: "name", label: "Name of service", type: "text" },
    pattern: { required: { value: true, message: FORM_ERRORS.PAYMENT_CATEGORY } },
  },
  {
    data: {
      id: "description",
      label: "Description",
      type: "textarea",
    },
  },
  ...renewInputs,
];

export const columns = [
  { name: "name", label: "Name" },
  { name: "description", label: "Description" },
  { name: "rentPeriods.startDate", label: "Start date", type: "date" },
  { name: "rentPeriods.endDate", label: "End date", type: "date" },
  { name: "rentPeriods.amount", label: "Amount" },
];
