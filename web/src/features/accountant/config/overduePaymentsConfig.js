import { PaymentLevels, PaymentStatus } from "@/app/helpers/constants";
import { FORM_VALIDATION_MESSAGES as FORM_ERRORS } from "@dms/shared";

export const inputs = [
  {
    data: { id: "amount", label: "Amount to be paid", type: "number" },
    pattern: { required: { value: true, message: FORM_ERRORS.AMOUNT_REQUIRED } },
  },
  {
    data: {
      id: "issuedDate",
      label: "Payment date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: FORM_ERRORS.DATE_REQUIRED } },
  },
  {
    data: {
      id: "file",
      label: "Attachment",
      type: "file",
    },
    pattern: { required: { value: true, message: FORM_ERRORS.ATTACHMENT_REQUIRED } },
  },
];

export const columns = [
  { name: "id", label: "Payment number" },
  { name: "clientLead.client.name", label: "Client name" },
  { name: "clientLead.client.phone", label: "Client phone" },
  { name: "clientLead.description", label: "Description" },
  { name: "clientLead.averagePrice", label: "Price" },
  { name: "paymentReason", label: "Payment reason" },

  { name: "amount", label: "Amount" },
  { name: "amountPaid", label: "Amount paid" },

  {
    name: "paymentLevel",
    label: "Payment level",
    type: "enum",
    enum: PaymentLevels,
  },
  {
    name: "status",
    label: "Payment status",
    type: "enum",
    enum: PaymentStatus,
  },
];
