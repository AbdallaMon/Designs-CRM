export const renewInputs = [
  {
    data: {
      id: "startDate",
      label: "Start date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: {
      id: "endDate",
      label: "End date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: {
      id: "paymentDate",
      label: "Payment date",
      type: "date",
      defaultValue: new Date(),
    },
    useDefault: true,
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: { id: "amount", label: "Amount", type: "number" },
    pattern: { required: { value: true, message: "Amount is required" } },
  },
];
export const inputs = [
  {
    data: { id: "name", label: "Name of service", type: "text" },
    pattern: { required: { value: true, message: "Payment category" } },
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
