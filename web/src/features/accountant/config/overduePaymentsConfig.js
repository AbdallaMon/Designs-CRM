import { PaymentLevels, PaymentStatus } from "@/app/helpers/constants";

export const inputs = [
  {
    data: { id: "amount", label: "Amount to be paid", type: "number" },
    pattern: { required: { value: true, message: "Amount is required" } },
  },
  {
    data: {
      id: "issuedDate",
      label: "Payment date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: { id: "paymentId", key: "id", type: "number" },
    sx: { display: "none" },
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
