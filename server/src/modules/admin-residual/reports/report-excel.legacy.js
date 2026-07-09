// admin-residual/reports — 🔒 FROZEN ExcelJS report generators (lead-report.xlsx /
// staff-report.xlsx). Moved VERBATIM from the legacy `admin-services.js` god-file: bodies
// are byte-for-byte identical. They read `req.body` and WRITE the HTTP response themselves
// (streamed xlsx). Do NOT change their logic — only their file location moved.
import ExcelJS from "exceljs";

// reportUtils.js
export const generateExcelReport = async (req, res) => {
  const { data } = req.body;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Lead Report");

  // Configure columns - kept the same as before
  worksheet.columns = [
    { header: "Client Name", key: "clientName", width: 25 },
    { header: "Phone", key: "clientPhone", width: 20 },
    { header: "Assigned To", key: "assignedTo", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Emirate", key: "emirate", width: 15 },
    { header: "Type", key: "type", width: 20 },
    {
      header: "AveragePrice",
      key: "averagePrice",
      width: 15,
      style: { numFmt: '#,##0.00 "AED"' },
    },
    {
      header: "Discount",
      key: "discount",
      width: 15,
      style: { numFmt: '#,##0.00 "%"' },
    },
    {
      header: "Price without discount",
      key: "priceWithOutDiscount",
      width: 15,
      style: { numFmt: '#,##0.00 "AED"' },
    },
    { header: "Created At", key: "createdAt", width: 15 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4B5563" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).height = 30;

  // Add data
  worksheet.addRows(data.leads);

  // Style data rows
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    row.height = 25;
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: i % 2 === 0 ? "FFF3F4F6" : "FFFFFFFF" },
    };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
  }

  // Add totals row
  const totalRow = worksheet.addRow({
    clientName: "TOTALS",
    averagePrice: data.leads.reduce(
      (sum, lead) => sum + (lead.averagePrice || 0),
      0,
    ),
    discount: data.leads.reduce((sum, lead) => sum + (lead.discount || 0), 0),
    priceWithOutDiscount: data.leads.reduce(
      (sum, lead) => sum + (lead.priceWithOutDiscount || 0),
      0,
    ),
  });

  // Style totals row
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4B5563" },
  };
  totalRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  totalRow.height = 30;
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "medium" },
      bottom: { style: "medium" },
      left: { style: "medium" },
      right: { style: "medium" },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  // Add summary sheet with improved styling (kept as before)
  const summarySheet = workbook.addWorksheet("Summary");
  // ... (rest of the summary sheet code remains the same)

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", "attachment; filename=lead-report.xlsx");

  await workbook.xlsx.write(res);
  res.end();
};

export const generateStaffExcelReport = async (req, res) => {
  const { data } = req.body;
  const workbook = new ExcelJS.Workbook();

  // Staff Performance Sheet
  const worksheet = workbook.addWorksheet("Staff Performance");

  worksheet.columns = [
    { header: "Staff Name", key: "staffName", width: 25 },
    { header: "Total Leads", key: "totalLeads", width: 15 },
    { header: "Active Leads", key: "activeLeads", width: 15 },
    { header: "Finalized", key: "finalized", width: 15 },
    { header: "Converted", key: "converted", width: 15 },
    {
      header: "Success Rate",
      key: "successRate",
      width: 15,
      style: { numFmt: '0.00"%"' },
    },
    {
      header: "Total Revenue",
      key: "totalRevenue",
      width: 20,
      style: { numFmt: '#,##0.00 "AED"' },
    },
    {
      header: "Total commission",
      key: "totalCommission",
      width: 20,
      style: { numFmt: '#,##0.00 "AED"' },
    },
    { header: "Conversion rate", key: "conversionRate", width: 15 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4B5563" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.height = 30;

  // Add data rows
  const rows = data.staffStats.map((staff) => ({
    staffName: staff.staffName,
    totalLeads: staff.totalLeads,
    activeLeads: staff.activeLeads,
    finalized: staff.finalized,
    converted: staff.converted,
    successRate: staff.successRate,
    totalRevenue: staff.totalRevenue,
    totalCommission: staff.totalCommission,
    conversionRate: staff.conversionRate,
  }));

  worksheet.addRows(rows);

  // Style data rows
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    row.height = 25;
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: i % 2 === 0 ? "FFF3F4F6" : "FFFFFFFF" },
    };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
  }

  // Add an empty row for spacing before the summary
  worksheet.addRow({});

  // Add summary header
  const summaryHeaderRow = worksheet.addRow(["Summary"]);
  summaryHeaderRow.font = { bold: true, size: 12 };
  summaryHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4B5563" },
  };
  summaryHeaderRow.font = { color: { argb: "FFFFFFFF" } };
  summaryHeaderRow.height = 25;

  // Add summary rows
  const summaryRows = [
    { metric: "Total Staff Members", value: data.summary.totalStaff || 0 },
    { metric: "Total Leads", value: data.summary.totalLeads || 0 },
    {
      metric: "Average Leads per Staff",
      value: data.summary.averageLeadsPerStaff || 0,
    },
    { metric: "Total Revenue", value: `AED ${data.summary.totalRevenue || 0}` },
    {
      metric: "Total Commission",
      value: `AED ${data.summary.totalCommission || 0}`,
    },
    {
      metric: "Average Success Rate",
      value: `${Math.max(data.summary.averageSuccessRate, 0).toFixed(2)}%`,
    },
    {
      metric: "Conversion rate",
      value: `${Math.max(data.summary.conversionRate, 0)}%`,
    },
  ];

  summaryRows.forEach(({ metric, value }) => {
    const row = worksheet.addRow([metric, value]); // Add summary metric and value
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 ? "left" : "right",
      };
    });
    row.height = 20;
  });

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=staff-report.xlsx",
  );

  // Write workbook to response
  await workbook.xlsx.write(res);
  res.end();
};
