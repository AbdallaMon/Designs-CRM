// admin-residual/reports — 🔒 FROZEN pdfkit report generators (lead-report.pdf /
// staff-report.pdf). Moved VERBATIM from the legacy `admin-services.js` god-file: bodies
// are byte-for-byte identical (pdfkit built-in Helvetica — NO __dirname font loading).
// They read `req.body` and WRITE the HTTP response themselves (streamed pdf). Do NOT
// change their logic — only their file location moved. `drawTable` is the private helper
// kept alongside its two PDF callers.
import PDFDocument from "pdfkit";

export const generatePDFReport = (req, res) => {
  try {
    const { data } = req.body;
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 10,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=lead-report.pdf",
    );
    doc.pipe(res);

    // Title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Lead Report", { align: "center" })
      .moveDown();

    const formatValue = (value) => {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === "number") return value.toLocaleString();
      return value.toString();
    };

    // Summary table remains the same
    const summaryTable = {
      headers: ["Metric", "Value"],
      rows: [
        ["Total Leads", formatValue(data.summary.totalLeads)],
        ["Total Value", `${formatValue(data.summary.totalValue)} AED`],
        ["Average Value", `${formatValue(data.summary.averageValue)} AED`],
        ["Total Discount", `${formatValue(data.summary.totalDiscount)} %`],
      ],
      columnWidths: [0.4, 0.6],
    };

    drawTable(doc, summaryTable, 100);
    doc.moveDown(2);

    // Leads Section
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Lead Details", { underline: true })
      .moveDown();

    const leadsTable = {
      headers: [
        "Client Name",
        "Phone",
        "Assigned To",
        "Status",
        "Emirate",
        "Type",
        "Price",
        "Discount",
        "Created At",
      ],
      rows: data.leads.map((lead) => [
        formatValue(lead.clientName),
        formatValue(lead.clientPhone),
        formatValue(lead.assignedTo),
        formatValue(lead.status),
        formatValue(lead.emirate),
        formatValue(lead.type),
        `${formatValue(lead.averagePrice)} AED`,
        `${formatValue(lead.discount)} %`,
        formatValue(lead.createdAt),
      ]),
      columnWidths: [0.15, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    };

    // Calculate totals
    const totals = {
      price: data.leads.reduce(
        (sum, lead) => sum + (lead.averagePrice || 0),
        0,
      ),
      discount: data.leads.reduce((sum, lead) => sum + (lead.discount || 0), 0),
      priceWithOutDiscount: data.leads.reduce(
        (sum, lead) => sum + (lead.priceWithOutDiscount || 0),
        0,
      ),
    };

    // Add totals row
    leadsTable.rows.push([
      "TOTALS",
      "",
      "",
      "",
      "",
      "",
      `${formatValue(totals.price)} AED`,
      ``,
      `${formatValue(totals.priceWithOutDiscount)} AED`,
    ]);

    drawTable(doc, leadsTable, 220);

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  }
};

// Updated drawTable function to handle totals row
function drawTable(doc, table, startY) {
  try {
    const cellPadding = 8;
    const availableWidth = doc.page.width - 100;
    const columnWidths = table.columnWidths.map(
      (width) => width * availableWidth,
    );
    let currentY = startY;

    // Draw headers
    doc.font("Helvetica-Bold").fontSize(12);
    doc.fillColor("#4B5563").rect(50, currentY, availableWidth, 30).fill();

    doc.fillColor("white");
    let currentX = 50;
    table.headers.forEach((header, i) => {
      doc.text(header, currentX + cellPadding, currentY + cellPadding, {
        width: columnWidths[i] - cellPadding * 2,
        align: "left",
        ellipsis: true,
      });
      currentX += columnWidths[i];
    });

    currentY += 30;
    doc.fillColor("black");

    // Draw rows
    doc.font("Helvetica").fontSize(10);

    table.rows.forEach((row, rowIndex) => {
      const isLastRow = rowIndex === table.rows.length - 1;
      const rowHeight = 25;

      // Special styling for totals row
      if (isLastRow) {
        doc
          .fillColor("#4B5563")
          .rect(50, currentY, availableWidth, rowHeight)
          .fill();
        doc.fillColor("white");
        doc.font("Helvetica-Bold");
      } else {
        doc
          .fillColor(rowIndex % 2 === 0 ? "#F3F4F6" : "white")
          .rect(50, currentY, availableWidth, rowHeight)
          .fill();
        doc.fillColor("black");
        doc.font("Helvetica");
      }

      currentX = 50;
      row.forEach((cell, i) => {
        doc.rect(currentX, currentY, columnWidths[i], rowHeight).stroke();

        doc.text(
          cell === null || cell === undefined ? "N/A" : cell.toString(),
          currentX + cellPadding,
          currentY + cellPadding,
          {
            width: columnWidths[i] - cellPadding * 2,
            align: "left",
            ellipsis: true,
          },
        );
        currentX += columnWidths[i];
      });

      currentY += rowHeight;

      // Handle page breaks
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
        // Redraw headers on new page
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor("#4B5563")
          .rect(50, currentY, availableWidth, 30)
          .fill();

        currentX = 50;
        doc.fillColor("white");
        table.headers.forEach((header, i) => {
          doc.text(header, currentX + cellPadding, currentY + cellPadding, {
            width: columnWidths[i] - cellPadding * 2,
            align: "left",
            ellipsis: true,
          });
          currentX += columnWidths[i];
        });
        currentY += 30;
        doc.fillColor("black");
      }
    });
  } catch (error) {
    console.error("Error drawing table:", error);
    throw error;
  }
}

export const generateStaffPDFReport = (req, res) => {
  try {
    const { data } = req.body;
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=staff-report.pdf",
    );
    doc.pipe(res);

    // Title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Staff Performance Report", { align: "center" })
      .moveDown();

    // Summary Section
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true })
      .moveDown();

    const summaryTable = {
      headers: ["Metric", "Value"],
      rows: [
        ["Total Staff Members", data.summary.totalStaff],
        ["Total Leads", data.summary.totalLeads],
        [
          "Average Leads per Staff",
          data.summary.averageLeadsPerStaff.toFixed(2),
        ],
        ["Total Revenue", `${data.summary.totalRevenue.toLocaleString()} AED`],
        [
          "Total Commission",
          `${data.summary.totalCommission.toLocaleString()} AED`,
        ],
        [
          "Average Success Rate",
          `${data.summary.averageSuccessRate.toFixed(2)}%`,
        ],
        ["Conversion rate", data.summary.conversionRate],
      ],
      columnWidths: [0.4, 0.6],
    };

    drawTable(doc, summaryTable, 100);
    doc.moveDown(2);

    // Staff Details Section
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Staff Details", { underline: true })
      .moveDown();

    const staffTable = {
      headers: [
        "Staff Name",
        "Total Leads",
        "Active",
        "Success Rate",
        "Revenue",
        "Conversion rate",
      ],
      rows: data.staffStats.map((staff) => [
        staff.staffName,
        staff.totalLeads,
        staff.activeLeads,
        `${staff.successRate.toFixed(2)}%`,
        `${staff.totalRevenue.toLocaleString()} AED`,
        staff.conversionRate,
      ]),
      columnWidths: [0.2, 0.1, 0.1, 0.15, 0.2, 0.1, 0.15],
    };

    drawTable(doc, staffTable, 200);

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  }
};
