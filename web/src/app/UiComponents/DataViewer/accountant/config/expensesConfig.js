export const inputs = [
  {
    data: { id: "category", label: "Category", type: "text" },
    pattern: { required: { value: true, message: "Payment category" } },
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
    pattern: { required: { value: true, message: "Date is required" } },
  },
  {
    data: { id: "amount", label: "Amount", type: "number" },
    pattern: { required: { value: true, message: "Amount is required" } },
  },
];

export const columns = [
  { name: "category", label: "Category" },
  { name: "description", label: "Description" },
  { name: "amount", label: "Amount" },
  { name: "paymentDate", label: "Payment date", type: "date" },
];
