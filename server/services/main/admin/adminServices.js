import bcrypt from "bcrypt";
import prisma from "../../../prisma/prisma.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import pkg from "lodash";
import dayjs from "dayjs";
const { groupBy } = pkg;
import XLSX from "xlsx";
import { groupProjects } from "../shared/projectServices.js";
import {
  addUsersToATeleChannelUsingQueue,
  createChannelAndAddUsers,
} from "../../telegram/telegram-functions.js";
import { UserRole } from "@prisma/client";
export async function getUser(searchParams, limit, skip, currentUser) {
  try {
    const filters = searchParams.filters && JSON.parse(searchParams.filters);
    const staffFilter = searchParams.staffId
      ? { userId: Number(searchParams.staffId) }
      : {};
    let where = {
      role: { not: UserRole.ADMIN },
      ...staffFilter,
    };
    if (currentUser) {
      where.id = { not: Number(currentUser.id) };
      where.role = {
        notIn: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      };
    }

    if (filters.status !== undefined) {
      if (filters.status === "active") {
        where.isActive = true;
      } else if (filters.status === "banned") {
        where.isActive = false;
      }
    }
    if (filters && filters.userId) {
      where.id = Number(filters.userId);
    }
    if (
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "SUPER_ADMIN" &&
      currentUser.isSuperSales
    ) {
      where.OR = [
        { role: "STAFF" },
        {
          subRoles: { some: { subRole: "STAFF" } },
        },
      ];
    }
    const users = await prisma.user.findMany({
      where: where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastSeenAt: true,
        role: true,
        subRoles: true,
        isPrimary: true,
        isSuperSales: true,
        telegramUsername: true,
      },
    });
    const total = await prisma.user.count({ where });

    return { users, total };
  } catch (e) {
    throw new Error(e);
  }
}

export async function getAllUsers(
  searchParams,
  currentUser,
  checkIfNotHasRelatedChat = false,
  checkIfHasRelatedChat
) {
  if (!searchParams.role) {
    searchParams.role = "STAFF";
  }
  let where = {};
  if (searchParams.role !== "all") {
    where.OR = [
      { role: searchParams.role },
      { subRoles: { some: { subRole: searchParams.role } } },
    ];
  }
  if (currentUser) {
    const checkIfNotAdmin =
      currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN";
    if (checkIfNotAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: Number(currentUser.id) },
        include: { subRoles: true },
      });
      const groupUserRoleAndSubRoles = [
        user.role,
        ...user.subRoles.map((r) => r.subRole),
      ];
      where.OR = [];
      for (const role of groupUserRoleAndSubRoles) {
        where.OR.push(
          { role: role },
          { subRoles: { some: { subRole: role } } }
        );
      }
    }
  }
  if (checkIfNotHasRelatedChat) {
    where.chatMemberships = {
      none: {
        room: {
          type: "STAFF_TO_STAFF",
          members: {
            some: {
              userId: Number(currentUser.id),
              isDeleted: false,
            },
          },
        },
      },
    };
  }
  if (checkIfHasRelatedChat) {
    where.chatMemberships = {
      some: {
        room: {
          type: "STAFF_TO_STAFF",
          members: {
            some: {
              userId: Number(currentUser.id),
              isDeleted: false,
            },
          },
        },
      },
    };
  }
  // not me
  where.id = { not: Number(currentUser.id) };
  where.isActive = true;

  const users = await prisma.user.findMany({
    where: where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subRoles: true,
      isPrimary: true,
      isSuperSales: true,
      telegramUsername: true,
      profilePicture: true,
    },
  });

  return users;
}

export async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    include: {
      subRoles: true,
    },
  });
}
export async function createStaffUser(user) {
  const hashedPassword = bcrypt.hashSync(user.password, 8);
  const newUser = await prisma.user.create({
    data: {
      email: user.email,
      password: hashedPassword,
      role: user.role,
      name: user.name,
      telegramUsername: user.telegramUsername,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      lastSeenAt: true,
      role: true,
      subRoles: true,
      telegramUsername: true,
      maxLeadsCounts: true,
      maxLeadCountPerDay: true,
    },
  });

  return newUser;
}

export async function editStaffUser(user, userId) {
  let hashedPassword = undefined;
  if (user.password) {
    hashedPassword = bcrypt.hashSync(user.password, 8);
  }
  return await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      email: user.email && user.email,
      password: hashedPassword && hashedPassword,
      name: user.name,
      role: user.role && user.role,
      telegramUsername: user.telegramUsername,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      lastSeenAt: true,
      role: true,
      subRoles: true,
      telegramUsername: true,
    },
  });
}

export async function updateUserRoles(userId, roles) {
  await prisma.UserSubRole.deleteMany({
    where: {
      userId: Number(userId),
      subRole: { in: roles.removed },
    },
  });
  let newRoles = roles.added.map((role) => ({
    userId: Number(userId),
    subRole: role,
  }));
  const superSales = newRoles.find((r) => r.subRole === "SUPER_SALES");
  const primarySales = newRoles.find((r) => r.subRole === "PRIMARY_SALES");
  if (superSales) {
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { isSuperSales: true },
    });
    newRoles = newRoles.filter((r) => r.subRole === "PRIMARY_SALES");
  }
  if (primarySales) {
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { isPrimary: true },
    });
    newRoles = newRoles.filter((r) => r.subRole === "SUPER_SALES");
  }
  if (superSales || primarySales) {
    newRoles.push({
      userId: Number(userId),
      subRole: "STAFF",
    });
  }
  return await prisma.UserSubRole.createMany({
    data: newRoles,
    skipDuplicates: true,
  });
}

export async function changeUserStatus(user, userId) {
  return prisma.user.update({
    where: {
      id: Number(userId),
    },
    data: {
      isActive: !user.isActive,
    },
    select: {
      id: true,
    },
  });
}

export async function toggleExtraStaffField({ userId, data }) {
  return prisma.user.update({
    where: {
      id: Number(userId),
    },
    data,
    select: {
      id: true,
    },
  });
}
const calculateSummary = (leads) => {
  const totalLeads = leads.length;
  const totalValue = leads.reduce(
    (sum, lead) => sum + Number(lead.averagePrice || 0),
    0
  );
  const totalDiscount = leads.reduce(
    (sum, lead) => sum + Number(lead.discount || 0),
    0
  );

  return {
    totalLeads,
    totalValue,
    averageValue: totalLeads > 0 ? totalValue / totalLeads : 0,
    totalDiscount,
    byEmirate: groupBy(leads, "emirate"),
    byStatus: groupBy(leads, "status"),
    byType: groupBy(leads, "type"),
  };
};

const processLeads = (leads) => {
  return leads.map((lead) => ({
    clientName: lead.client.name,
    clientPhone: lead.client.phone,
    status: lead.status,
    emirate: lead.emirate,
    type: lead.type,
    averagePrice: Number(lead.averagePrice || 0),
    discount: Number(lead.discount || 0),
    priceWithOutDiscount: Number(lead.priceWithOutDiscount || 0),
    createdAt: lead.createdAt.toISOString().split("T")[0],
    assignedTo: lead.assignedTo?.name || "Unassigned",
  }));
};

export const generateLeadReport = async (req, res) => {
  try {
    const filters = req.body;

    const where = {
      AND: [
        filters.startDate && filters.endDate
          ? {
              createdAt: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
              },
            }
          : {},
        filters.emirates?.length > 0
          ? {
              emirate: { in: filters.emirates },
            }
          : {},
        filters.statuses?.length > 0
          ? {
              status: { in: filters.statuses },
            }
          : {},
        filters.userIds?.length > 0
          ? {
              userId: { in: filters.userIds },
            }
          : {},
        filters.clientIds?.length > 0
          ? {
              clientId: { in: filters.clientIds },
            }
          : {},
        filters.reportType === "finalized"
          ? {
              status: "FINALIZED",
            }
          : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    const leads = await prisma.clientLead.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
          },
        },
        priceOffers: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            minPrice: true,
            maxPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const processedLeads = processLeads(leads);
    const summary = calculateSummary(leads);

    return res.json({ leads: processedLeads, summary });
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: "Failed to generate report" });
  }
};
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
      0
    ),
    discount: data.leads.reduce((sum, lead) => sum + (lead.discount || 0), 0),
    priceWithOutDiscount: data.leads.reduce(
      (sum, lead) => sum + (lead.priceWithOutDiscount || 0),
      0
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
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=lead-report.xlsx");

  await workbook.xlsx.write(res);
  res.end();
};

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
      "attachment; filename=lead-report.pdf"
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
        0
      ),
      discount: data.leads.reduce((sum, lead) => sum + (lead.discount || 0), 0),
      priceWithOutDiscount: data.leads.reduce(
        (sum, lead) => sum + (lead.priceWithOutDiscount || 0),
        0
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
      (width) => width * availableWidth
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
          }
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
const calculateStaffStats = (staff, dateRange) => {
  return staff.map((user) => {
    const userLeads = user.clientLeads || [];

    const filteredLeads =
      dateRange.startDate && dateRange.endDate
        ? userLeads.filter((lead) => {
            const leadDate = new Date(lead.createdAt);
            return (
              leadDate >= new Date(dateRange.startDate) &&
              leadDate <= new Date(dateRange.endDate)
            );
          })
        : userLeads;

    const totalLeads = filteredLeads.length;
    const finalized = filteredLeads.filter(
      (lead) => lead.status === "FINALIZED"
    ).length;
    const converted = filteredLeads.filter(
      (lead) => lead.status === "CONVERTED"
    ).length;
    const onHold = filteredLeads.filter(
      (lead) => lead.status === "ON_HOLD"
    ).length;
    const rejected = filteredLeads.filter(
      (lead) => lead.status === "REJECTED"
    ).length;
    // Calculate success rate
    const totalClosedLeads = finalized + converted + rejected + onHold;
    const successRate =
      totalClosedLeads > 0
        ? parseFloat(
            (
              ((finalized - (converted + rejected + onHold)) /
                totalClosedLeads) *
              100
            ).toFixed(2)
          )
        : 0.0;

    // Calculate revenue and discount
    const totalRevenue = filteredLeads
      .filter((lead) => lead.status === "FINALIZED")
      .reduce(
        (sum, lead) =>
          sum + parseFloat(Number(lead.averagePrice || 0).toFixed(2)),
        0
      );

    // Calculate discount
    const totalDiscount = filteredLeads
      .filter((lead) => lead.status === "FINALIZED")
      .reduce(
        (sum, lead) => sum + parseFloat(Number(lead.discount || 0).toFixed(2)),
        0
      );

    // Calculate conversion rate
    const conversionRate =
      totalLeads > 0
        ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
        : 0.0;
    const totalCommission = parseFloat((totalRevenue * 0.05).toFixed(2));

    return {
      userId: user.id,
      staffName: user.name,
      email: user.email,
      totalLeads,
      activeLeads: filteredLeads.filter(
        (lead) =>
          !["FINALIZED", "CONVERTED", "REJECTED", "ON_HOLD"].includes(
            lead.status
          )
      ).length,
      finalized,
      converted,
      rejected,
      onHold,
      successRate: Math.round(successRate * 100) / 100,
      totalRevenue,
      totalDiscount,
      averageRevenuePerLead: totalLeads > 0 ? totalRevenue / totalLeads : 0,
      conversionRate,
      totalCommission,
    };
  });
};

export const generateStaffReport = async (req, res) => {
  try {
    const filters = req.body;
    const where = {
      AND: [
        filters.startDate && filters.endDate
          ? {
              createdAt: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
              },
            }
          : {},
        filters.emirates?.length > 0
          ? {
              emirate: { in: filters.emirates },
            }
          : {},
      ],
    };

    // First, get all staff users
    const staffUsers = await prisma.user.findMany({
      where: {
        role: "STAFF",
        isActive: true,
      },
      include: {
        clientLeads: {
          where,
        },
      },
    });

    const staffStats = calculateStaffStats(staffUsers, filters);

    const summary = {
      totalStaff: staffStats.length,
      activeStaff: staffStats.filter((staff) => staff.totalLeads > 0).length,
      totalLeads: staffStats.reduce((sum, staff) => sum + staff.totalLeads, 0),
      averageLeadsPerStaff:
        staffStats.reduce((sum, staff) => sum + staff.totalLeads, 0) /
        (staffStats.length || 1),
      totalRevenue: staffStats.reduce(
        (sum, staff) => sum + staff.totalRevenue,
        0
      ),
      averageSuccessRate:
        staffStats.reduce((sum, staff) => sum + staff.successRate, 0) /
        (staffStats.length || 1),
      conversionRate:
        (staffStats.reduce(
          (sumConverted, staff) => sumConverted + (staff.converted || 0),
          0
        ) /
          (staffStats.reduce(
            (sumLeads, staff) => sumLeads + (staff.totalLeads || 0),
            0
          ) || 1)) *
        100,
      bestPerformer: staffStats.reduce(
        (best, current) =>
          current.successRate > (best?.successRate || 0) ? current : best,
        null
      ),
      topRevenue: staffStats.reduce(
        (best, current) =>
          current.totalRevenue > (best?.totalRevenue || 0) ? current : best,
        null
      ),
      totalCommission: staffStats.reduce(
        (sum, staff) => sum + staff.totalCommission,
        0
      ),
    };

    return res.json({
      staffStats,
      summary,
      dateRange:
        filters.startDate && filters.endDate
          ? {
              start: filters.startDate,
              end: filters.endDate,
            }
          : null,
    });
  } catch (error) {
    console.error("Error generating staff report:", error);
    return res.status(500).json({ error: "Failed to generate staff report" });
  }
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
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=staff-report.xlsx"
  );

  // Write workbook to response
  await workbook.xlsx.write(res);
  res.end();
};

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
      "attachment; filename=staff-report.pdf"
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

export async function getNotificationForTodayByStaffId(userId) {
  const where = {};
  where.staffId = Number(userId);
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();
  where.createdAt = {
    gte: startOfToday,
    lte: endOfToday,
  };
  const notifications = await prisma.notification.findMany({
    where: where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      staff: {
        select: {
          name: true,
        },
      },
      clientLead: {
        select: {
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return notifications;
}
export async function createLeadFromExcelData(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const fileData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Header row
    const headers = fileData[0];
    // Rows of data (excluding the header)
    const rows = fileData.slice(1);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Extract client fields
      const phone = row[0] ? String(row[0]) : "unknown";
      const name = row[2] || "unknown";

      // Generate fake email based on last client ID
      const lastClient = await prisma.client.findFirst({
        orderBy: { id: "desc" },
      });
      const newClientId = lastClient ? lastClient.id + 1 : 1;
      const email = `fakeEmail${newClientId}@example.com`;

      // Create client
      const client = await prisma.client.create({
        data: {
          phone,
          name,
          email,
        },
      });
      const price = row[4]?.toString() || "0";
      const priceWithoutDiscount = !isNaN(parseFloat(row[4]))
        ? parseFloat(row[4])
        : 0;
      const averagePrice = !isNaN(parseFloat(row[4])) ? parseFloat(row[4]) : 0;
      const modifiedDate = row[9]
        ? XLSX.SSF.format("yyyy-mm-dd", row[9])
        : new Date().toISOString();

      const clientLead = await prisma.clientLead.create({
        data: {
          clientId: client.id,
          selectedCategory: "OLDLEAD",
          type: "NONE",
          description: row[3] || null,
          price,
          priceWithOutDiscount: priceWithoutDiscount,
          averagePrice,
          createdAt: new Date(modifiedDate),
        },
      });

      // Extract notes
      const notes = [];
      if (row[5] && row[5].toString().trim()) {
        notes.push({
          content: `${headers[5]}: ${row[5]}`,
        });
      }
      if (row[6] && row[6].toString().trim()) {
        notes.push({
          content: `${headers[6]}: ${row[6]}`,
        });
      }
      if (row[8] && row[8].toString().trim()) {
        notes.push({
          content: `${headers[8]}: ${row[8]}`,
        });
      }

      for (const note of notes) {
        await prisma.note.create({
          data: {
            content: note.content,
            clientLeadId: clientLead.id,
            userId: 1, // Default user ID (adjust as needed)
          },
        });
      }
    }

    return res.status(200).json({ message: "Data processed successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the data" });
  }
}

export async function createAFixedData({ data }) {
  return prisma.fixedData.create({
    data: {
      title: data.title,
      description: data.description || null,
    },
  });
}
export async function editAFixedData({ id, data }) {
  return prisma.fixedData.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
}
export async function deleteAFixedData({ id }) {
  return prisma.fixedData.delete({
    where: { id },
  });
}
export async function getUserLogs(userId, month, year) {
  // Default to current month/year if not provided
  const requestedMonth = month ? parseInt(month) - 1 : dayjs().month(); // 0-indexed month
  const requestedYear = year ? parseInt(year) : dayjs().year();

  // Get start and end dates for the requested month
  const startOfMonth = dayjs()
    .year(requestedYear)
    .month(requestedMonth)
    .startOf("month")
    .toDate();
  const endOfMonth = dayjs()
    .year(requestedYear)
    .month(requestedMonth)
    .endOf("month")
    .toDate();

  // Fetch user for last seen info
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      lastSeenAt: true,
    },
  });

  // Fetch all logs for the specified month
  const logs = await prisma.userLog.findMany({
    where: {
      userId: Number(userId),
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      id: true,
      date: true,
      totalMinutes: true,
      description: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate total month hours
  const totalMonthMinutes = logs.reduce(
    (total, log) => total + log.totalMinutes,
    0
  );
  const totalMonthHours = (totalMonthMinutes / 60).toFixed(2);

  // Group logs by date
  const logsByDate = {};
  logs.forEach((log) => {
    const dateStr = dayjs(log.date).format("YYYY-MM-DD");
    if (!logsByDate[dateStr]) {
      logsByDate[dateStr] = {
        date: dateStr,
        formattedDate: dayjs(log.date).format("MMM DD, YYYY"),
        totalMinutes: 0,
        entries: [],
      };
    }

    logsByDate[dateStr].totalMinutes += log.totalMinutes;
    logsByDate[dateStr].entries.push({
      id: log.id,
      time: log.date,
      formattedTime: dayjs(log.date).format("h:mm A"),
      description: log.description || "Activity logged",
      totalHours: log.totalMinutes / 60,
    });
  });

  // Convert to array and calculate hours
  const formattedLogs = Object.values(logsByDate).map((day) => ({
    ...day,
    totalHours: (day.totalMinutes / 60).toFixed(2),
  }));

  // Get today's hours from getUserLastSeen for consistency
  const today = dayjs().startOf("day").toDate();
  const todayLog = await prisma.userLog.findFirst({
    where: {
      userId: Number(userId),
      date: today,
    },
    select: {
      totalMinutes: true,
    },
  });
  const todayHours = todayLog
    ? (todayLog.totalMinutes / 60).toFixed(2)
    : "0.00";

  return {
    lastSeenAt: user?.lastSeenAt || null,
    logs: formattedLogs,
    totalMonthHours,
    totalHours: todayHours,
    month: requestedMonth + 1, // Convert back to 1-indexed for display
    year: requestedYear,
  };
}

export async function getUserMonthlyTotalHours(userId) {
  // Get the first and last day of the current month
  const startOfMonth = dayjs().startOf("month").toDate();
  const endOfMonth = dayjs().endOf("month").toDate();

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      logs: {
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: { totalMinutes: true },
      },
    },
  });

  // Calculate total minutes across all logs for the month
  const totalMinutes =
    user?.logs?.reduce((sum, log) => sum + (log.totalMinutes || 0), 0) || 0;
  const totalMonthHours = (totalMinutes / 60).toFixed(2); // Convert to hours

  return {
    totalMonthHours,
    month: dayjs().format("MMMM YYYY"),
  };
}
export async function updateUserMaxLeads(userId, maxLeadCount) {
  return await prisma.user.update({
    where: { id: Number(userId) },
    data: { maxLeadsCounts: Number(maxLeadCount) },
  });
}
export async function updateUserMaxLeadsPerDay(userId, maxLeadCountPerDay) {
  return await prisma.user.update({
    where: { id: Number(userId) },
    data: { maxLeadCountPerDay: Number(maxLeadCountPerDay) },
  });
}

export async function getNotAllowedCountries(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      notAllowedCountries: true,
    },
  });
  return user.notAllowedCountries || [];
}

export async function updateNotAllowedCountries(userId, countries) {
  const user = await prisma.user.update({
    where: {
      id: Number(userId),
    },
    data: {
      notAllowedCountries: countries,
    },
  });
}

export async function getAdminClientLeadDetails(clientLeadId, searchParams) {
  const where = { id: Number(clientLeadId) };
  if (searchParams.checkConsult) {
    where.initialConsult = true;
  }
  const clientLead = await prisma.clientLead.findUnique({
    where,
    include: {
      client: true,
      assignedTo: true,
      priceOffers: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
        },
      },

      payments: {
        include: {
          invoices: true,
        },
      },
      contracts: {
        where: {
          status: "IN_PROGRESS",
        },
        orderBy: { id: "desc" },
        take: 1,
        select: {
          id: true,
          stages: {
            select: {
              title: true,
              stageStatus: true,
            },
          },
        },
      },
      extraServices: true,
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
        },
      },
      callReminders: {
        orderBy: { time: "desc" },
        include: {
          user: { select: { name: true } },
        },
      },
      meetingReminders: {
        include: {
          user: { select: { name: true } },
          admin: { select: { name: true } },
        },
        orderBy: { time: "desc" },
      },
      files: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });
  if (clientLead.contracts?.length > 0) {
    const currentStage = clientLead.contracts[0].stages?.find(
      (stage) => stage.stageStatus === "IN_PROGRESS"
    );
    clientLead.contracts[0].stage = currentStage;
    clientLead.contracts[0].contractLevel = currentStage?.title;
  }
  return clientLead;
}

export async function updateLeadField({ data, leadId }) {
  const type = data.inputType;
  delete data.inputType;
  const field = data.field;
  delete data.field;
  if (type === "date") {
    data[field] = new Date(data[field]);
  }
  console.log(data, "data");
  // if(field==="email"){

  // }
  try {
    const updatedLead = await prisma.clientLead.update({
      where: {
        id: Number(leadId),
      },
      data,
    });
    return updatedLead;
  } catch (e) {
    console.log(e, "e");

    throw new Error(e);
  }
}

export async function updateClientField({ data, clientId }) {
  if (data.field === "email") {
    throw new Error("Cannot update email field");
  }
  if (data.inputType) {
    delete data.inputType;
  }
  if (data.field) {
    delete data.field;
  }
  try {
    const updatedClient = await prisma.client.update({
      where: {
        id: Number(clientId),
      },
      data,
    });
    return updatedClient;
  } catch (e) {
    throw new Error(e);
  }
} // utils/checkLeadFKs.js

export async function deleteALead(leadId) {
  const clientLeadId = Number(leadId);
  return await prisma.$transaction(async (prisma) => {
    try {
      // Find all associated records

      const clientLead = await prisma.clientLead.findUnique({
        where: { id: clientLeadId },
        include: {
          payments: true,
        },
      });

      if (!clientLead) {
        throw new Error(`Client Lead with ID ${clientLeadId} not found`);
      }

      // Step 1: Handle Invoice dependencies first
      // Get all payments associated with this client lead
      const paymentIds = clientLead.payments.map((p) => p.id);

      if (paymentIds.length > 0) {
        // Find all invoices related to these payments
        const invoices = await prisma.invoice.findMany({
          where: { paymentId: { in: paymentIds } },
          include: { notes: true },
        });

        // Delete notes associated with invoices first
        for (const invoice of invoices) {
          if (invoice.notes && invoice.notes.length > 0) {
            await prisma.note.deleteMany({
              where: {
                id: { in: invoice.notes.map((note) => note.id) },
              },
            });
          }
        }

        // Now delete all invoices
        await prisma.invoice.deleteMany({
          where: { paymentId: { in: paymentIds } },
        });
      }

      // Step 2: Delete all other related records

      // Delete notes related to various entities
      await prisma.note.deleteMany({
        where: { clientLeadId },
      });

      await prisma.task.deleteMany({ where: { clientLeadId } });
      await prisma.file.deleteMany({ where: { clientLeadId } });
      await prisma.notification.deleteMany({ where: { clientLeadId } });
      await prisma.callReminder.deleteMany({ where: { clientLeadId } });
      await prisma.extraService.deleteMany({ where: { clientLeadId } });
      await prisma.priceOffers.deleteMany({ where: { clientLeadId } });
      await prisma.availableSlot.updateMany({
        where: { meetingReminder: { clientLeadId } },
        data: { meetingReminderId: null },
      });
      await prisma.deliverySchedule.deleteMany({
        where: { project: { clientLeadId } },
      });
      await prisma.assignment.deleteMany({
        where: { project: { clientLeadId } },
      });
      await prisma.telegramChannel.deleteMany({
        where: { clientLeadId },
      });
      await prisma.meetingReminder.deleteMany({ where: { clientLeadId } });
      await prisma.contract.deleteMany({ where: { clientLeadId } });
      await prisma.note.deleteMany({
        where: {
          clientImageSession: {
            clientLeadId,
          },
        },
      });
      await prisma.note.deleteMany({
        where: {
          clientSelectedImage: {
            imageSession: {
              clientLeadId,
            },
          },
        },
      });
      await prisma.clientSelectedImage.deleteMany({
        where: {
          imageSession: {
            clientLeadId,
          },
        },
      });
      await prisma.clientImageSession.deleteMany({ where: { clientLeadId } });
      await prisma.versaModel.deleteMany({ where: { clientLeadId } });
      await prisma.sessionQuestion.deleteMany({ where: { clientLeadId } });
      await prisma.note.deleteMany({
        where: {
          salesStage: {
            clientLeadId,
          },
        },
      });
      await prisma.salesStage.deleteMany({ where: { clientLeadId } });
      await prisma.note.deleteMany({
        where: {
          update: {
            clientLeadId,
          },
        },
      });
      await prisma.note.deleteMany({
        where: {
          sharedUpdate: {
            update: {
              clientLeadId,
            },
          },
        },
      });
      await prisma.sharedUpdate.deleteMany({
        where: {
          update: { clientLeadId },
        },
      });
      await prisma.clientLeadUpdate.deleteMany({ where: { clientLeadId } });
      await prisma.note.deleteMany({
        where: {
          commission: {
            leadId: clientLeadId,
          },
        },
      });
      await prisma.commission.deleteMany({ where: { leadId: clientLeadId } });
      // Delete projects
      await prisma.project.deleteMany({ where: { clientLeadId } });

      // Now it's safe to delete payments
      await prisma.payment.deleteMany({ where: { clientLeadId } });
      await prisma.fetchedTelegramMessage.deleteMany({
        where: { clientLeadId },
      });

      // Finally, delete the ClientLead
      return await prisma.clientLead.delete({
        where: { id: clientLeadId },
      });
    } catch (error) {
      console.error("Error in transaction:", error);
      throw error; // Re-throw to let the transaction fail
    }
  });
}

// commissions
export async function getCommissionByUserId(userId) {
  const userIdNumber = parseInt(userId, 10);
  const eligibleLeads = await prisma.clientLead.findMany({
    where: {
      userId: userIdNumber,
      status: { in: ["FINALIZED", "ARCHIVED"] },
      commissionCleared: false,
      averagePrice: {
        not: null,
      },
    },
  });
  for (const lead of eligibleLeads) {
    const existingCommission = await prisma.commission.findFirst({
      where: {
        leadId: lead.id,
        userId: userIdNumber,
      },
    });

    if (!existingCommission && lead.averagePrice) {
      const commissionAmount = parseFloat(lead.averagePrice) * 0.05;

      await prisma.commission.create({
        data: {
          userId: userIdNumber,
          leadId: lead.id,
          amount: commissionAmount,
          amountPaid: 0,
          isCleared: false,
        },
      });

      await prisma.clientLead.update({
        where: { id: lead.id },
        data: { commissionCleared: true },
      });
    }
  }
  const commissions = await prisma.commission.findMany({
    where: {
      userId: userIdNumber,
    },
    select: {
      id: true,
      amount: true,
      amountPaid: true,
      isCleared: true,
      createdAt: true,
      leadId: true,
      userId: true,
      commissionReason: true,
      lead: {
        select: {
          id: true,
          client: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });
  return commissions;
}
export async function reverseCommissions() {
  await prisma.commission.deleteMany({
    where: {
      lead: {
        status: {
          notIn: ["FINALIZED", "ARCHIVED"],
        },
      },
    },
  });
  await prisma.clientLead.updateMany({
    where: {
      status: { in: ["FINALIZED", "ARCHIVED"] },
      commissionCleared: { not: false },
      commissions: {
        none: {},
      },
    },
    data: {
      commissionCleared: false,
    },
  });
}

export async function updateCommission({ commissionId, amount }) {
  const commissionIdNumber = parseInt(commissionId, 10);
  const paymentAmount = parseFloat(amount);
  if (isNaN(commissionIdNumber) || isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error("Invalid commission ID or payment amount");
  }

  const commission = await prisma.commission.findUnique({
    where: { id: commissionIdNumber },
  });
  const remainingAmount =
    parseFloat(commission.amount) - parseFloat(commission.amountPaid);

  if (paymentAmount > remainingAmount) {
    throw new Error("Payment amount exceeds remaining balance");
  }
  const newAmountPaid = parseFloat(commission.amountPaid) + paymentAmount;

  const isCleared = newAmountPaid >= parseFloat(commission.amount);
  await prisma.commission.update({
    where: { id: commissionIdNumber },
    data: {
      amountPaid: newAmountPaid,
      isCleared: isCleared,
    },
  });
  return await prisma.commission.findUnique({
    where: {
      id: commissionIdNumber,
    },
  });
}
export async function createCommissionByAdmin({
  userId,
  leadId,
  amount,
  commissionReason,
}) {
  const userIdNumber = parseInt(userId, 10);
  const clientLeadIdNumber = parseInt(leadId, 10);
  const commissionAmount = parseFloat(amount);
  if (
    isNaN(userIdNumber) ||
    isNaN(clientLeadIdNumber) ||
    isNaN(commissionAmount) ||
    commissionAmount <= 0 ||
    !commissionReason ||
    commissionReason.trim() === ""
  ) {
    throw new Error("Invalid user ID, lead ID, or commission amount");
  }
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: clientLeadIdNumber, userId: userIdNumber },
  });

  if (!clientLead) {
    throw new Error("Client lead not found or does not belong to the user");
  }
  return await prisma.commission.create({
    data: {
      userId: userIdNumber,
      leadId: clientLeadIdNumber,
      amount: commissionAmount,
      amountPaid: 0,
      isCleared: false,
      commissionReason: commissionReason,
    },
  });
}

export async function getAdminProjects(searchParams, limit, skip) {
  const where = {
    projects: {
      some: {}, // Means at least one related project exists
    },
  };
  const filters = JSON.parse(searchParams.filters);
  if (filters && filters !== "undefined" && filters.id) {
    where.id = Number(filters.id);
  }
  if (searchParams.id) {
    where.id = Number(searchParams.id);
  }
  where.status = {
    notIn: ["ARCHIVED", "NEW"],
  };
  const clientLeads = await prisma.clientLead.findMany({
    where,
    skip,
    take: limit,
    include: {
      projects: {
        include: {
          assignments: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
  clientLeads.forEach((lead) => {
    const groupedProjects = groupProjects(lead.projects);
    lead.groupedProjects = groupedProjects;
  });

  const total = await prisma.clientLead.count({ where });
  return { data: clientLeads, total };
}

/// image - sessions ///
export async function createNewImage(data) {
  const { url, patterns, spaces } = data;

  if (!url || !patterns?.length || !spaces?.length) {
    throw new Error("Missing fields");
  }
  const image = await prisma.image.create({
    data: {
      url,
      patterns: {
        connect: patterns.map((id) => ({ id: Number(id) })),
      },
      spaces: {
        connect: spaces.map((id) => ({ id: Number(id) })),
      },
    },
  });

  return image;
}

export async function editAnImage({ data, id }) {
  const { url, patterns, spaces } = data;

  if (!url || !patterns?.length || !spaces?.length) {
    throw new Error("Missing fields");
  }
  const image = await prisma.image.update({
    where: { id: Number(id) },
    data: {
      url,
      patterns: {
        set: patterns.map((id) => ({ id: Number(id) })),
      },
      spaces: {
        set: spaces.map((id) => ({ id: Number(id) })),
      },
    },
  });
  return image;
}
export async function deleteAnImage(id) {
  const image = await prisma.image.update({
    where: { id: Number(id) },
    data: {
      isArchived: true,
    },
  });
  return image;
}

export async function createSesssionItem({ model, data }) {
  if (!data.avatarUrl || !data.name) {
    throw new Error("Please fill all fields");
  }
  const sumbitData = {
    name: data.name,
    avatarUrl: data.avatarUrl,
  };
  const item = await prisma[model].create({
    data: sumbitData,
  });
  return item;
}

export async function editSessionItem({ model, data, id }) {
  const sumbitData = {
    name: data.name,
    avatarUrl: data.avatarUrl,
  };
  if (!data.avatarUrl || data.avatarUrl.length === 0) {
    delete sumbitData.avatarUrl;
  }

  const item = await prisma[model].update({
    where: { id: Number(id) },
    data: sumbitData,
  });
  return item;
}

export async function deleteSessionItem({ model, data, id }) {
  const item = await prisma[model].delete({
    where: { id: Number(id) },
  });
  return item;
}

// end of old image session
export async function toggleArchiveAModel({ model, isArchived, id }) {
  return await prisma[model].update({
    where: {
      id: Number(id),
    },
    data: {
      isArchived,
    },
  });
}

export async function getModelIds({ searchParams, model }) {
  let queryWhere =
    searchParams?.where && searchParams.where !== "undefined"
      ? JSON.parse(searchParams.where)
      : {};
  const where = {};

  const select = {};
  const include = {};
  if (searchParams.select) {
    const selectFields = searchParams.select.split(",");
    selectFields.forEach((field) => {
      if (!select.select) {
        select.select = {};
      }
      select.select = {
        ...select.select,
        [field]: true,
      };
    });
  }
  if (searchParams.isLanguage && searchParams.isLanguage === "true") {
    if (!select.select) {
      select.select = {};
    }
    select.select.title = {
      select: {
        id: true,
        text: true,
        language: {
          select: {
            code: true,
          },
        },
      },
    };
    if (!select.select.id) {
      select.select.id = true;
    }
  }
  if (searchParams.include) {
    const includeFields = searchParams.include.split(",");
    includeFields.forEach((field) => {
      if (!include.include) {
        include.include = {};
      }
      include.include = {
        ...select.include,
        [field]: true,
      };
    });
  }
  if (searchParams) {
    Object.keys(queryWhere).forEach((key) => {
      where[key] = queryWhere[key];
    });
  }
  return await prisma[model].findMany({
    where: {
      ...where,
    },
    ...(select && select),
    ...(include && include),
  });
}

export async function createNewTelegramLink({ leadId }) {
  const newChannel = await createChannelAndAddUsers({
    clientLeadId: Number(leadId),
  });
  return newChannel.inviteLink;
}

export async function addAllProjectUsersToChannel({ clientLeadId }) {
  clientLeadId = Number(clientLeadId);
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: clientLeadId },
    include: {
      assignedTo: true,
      projects: {
        include: {
          assignments: {
            include: {
              user: true,
            },
          },
        },
      },
      telegramChannel: true,
    },
  });

  if (!clientLead) {
    console.warn("? ClientLead not found");
    return;
  }

  const usersSet = new Map();

  if (clientLead.assignedTo?.telegramUsername) {
    usersSet.set(clientLead.assignedTo.telegramUsername, clientLead.assignedTo);
  }

  for (const project of clientLead.projects) {
    for (const assignment of project.assignments) {
      const user = assignment.user;
      if (user?.telegramUsername) {
        usersSet.set(user.telegramUsername, user);
      }
    }
  }

  if (!clientLead.telegramChannel) {
    throw new Error("?? No Telegram channel linked to this lead");
  }

  return await addUsersToATeleChannelUsingQueue({
    clientLeadId,
    usersList: Array.from(usersSet.values()),
  });
}
// auto assigments
export async function getAutoAssignmentsForAUser({ userId }) {
  const assigments = await prisma.autoAssignment.findMany({
    where: {
      userId: Number(userId),
    },
  });
  return assigments.map((assigment) => assigment.type);
}

export async function updateUserAutoAssignment(userId, assigments) {
  await prisma.autoAssignment.deleteMany({
    where: {
      userId: Number(userId),
      type: { in: assigments.removed },
    },
  });
  let newAssignMents = assigments.added.map((assigment) => ({
    userId: Number(userId),
    type: assigment,
  }));

  return await prisma.autoAssignment.createMany({
    data: newAssignMents,
    skipDuplicates: true,
  });
}
