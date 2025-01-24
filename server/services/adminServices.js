import bcrypt from "bcrypt";
import prisma from "../prisma/prisma.js";
import ExcelJS from 'exceljs';
import PDFDocument from "pdfkit";
import pkg from 'lodash';
import dayjs from "dayjs";
const { groupBy } = pkg;
import  XLSX from "xlsx"
export async function getUser(searchParams, limit, skip) {
    const filters =searchParams.filters && JSON.parse(searchParams.filters);
    const staffFilter = searchParams.staffId ? {userId: Number(searchParams.staffId)} : {};
    let where = {
        role:"STAFF",
        ...staffFilter,
    };
    if (filters.status !== undefined) {
        if (filters.status === "active") {
            where.isActive = true;
        } else if (filters.status === "banned") {
            where.isActive = false
        }
    }
    const users = await prisma.user.findMany({
        where: where,
        skip,
        take: limit,
        select: {
            id: true,
            name:true,
            email: true,
            isActive: true,
        },
    });
    const total = await prisma.user.count({where: where});

    return {users, total};
}

export async function getUserById(userId){
    return await prisma.user.findUnique({where:{
        id:Number(userId)
        }})
}
export async function createStaffUser(user) {
    const hashedPassword = bcrypt.hashSync(user.password, 8);
    const newUser = await prisma.user.create({
        data: {
            email: user.email,
            password: hashedPassword,
            role: "STAFF",
            name: user.name,
        },
        select: {
            id:true,
            email: true,
            isActive: true,
            name: true
        },
    });

    return newUser;
}

export async function editStaffUser(user, userId) {
    let hashedPassword = undefined
    if (user.password) {
        hashedPassword = bcrypt.hashSync(user.password, 8);
    }
    return await prisma.user.update({
        where: {id: Number(userId)},
        data: {
            email: user.email && user.email,
            password: hashedPassword && hashedPassword,
            name: user.name
        },
        select: {
            id: true,
            email: true,
            isActive: true,
            name: true
        },
    });
}

export async function changeUserStatus(user, studentId) {
    return prisma.user.update({
        where: {
            id: Number(studentId)
        },
        data: {
            isActive: !user.isActive
        }
        , select: {
            id: true
        }
    })
}

const calculateSummary = (leads) => {
    const totalLeads = leads.length;
    const totalValue = leads.reduce((sum, lead) => sum + Number(lead.averagePrice || 0), 0);
    const totalDiscount = leads.reduce((sum, lead) => sum + Number(lead.discount || 0), 0);

    return {
        totalLeads,
        totalValue,
        averageValue: totalLeads > 0 ? totalValue / totalLeads : 0,
        totalDiscount,
        byEmirate: groupBy(leads, 'emirate'),
        byStatus: groupBy(leads, 'status'),
        byType: groupBy(leads, 'type')
    };
};

const processLeads = (leads) => {
    return leads.map(lead => ({
        clientName: lead.client.name,
        clientPhone: lead.client.phone,
        status: lead.status,
        emirate: lead.emirate,
        type: lead.type,
        averagePrice: Number(lead.averagePrice || 0),
        discount: Number(lead.discount || 0),
        priceWithOutDiscount: Number(lead.priceWithOutDiscount || 0),
        createdAt: lead.createdAt.toISOString().split('T')[0],
        assignedTo: lead.assignedTo?.name || 'Unassigned'
    }));
};

export const generateLeadReport = async (req, res) => {
    try {
        const filters = req.body;

        const where = {
            AND: [
                filters.startDate && filters.endDate ? {
                    createdAt: {
                        gte: new Date(filters.startDate),
                        lte: new Date(filters.endDate)
                    }
                } : {},
                filters.emirates?.length > 0 ? {
                    emirate: { in: filters.emirates }
                } : {},
                filters.statuses?.length > 0 ? {
                    status: { in: filters.statuses }
                } : {},
                filters.userIds?.length > 0 ? {
                    userId: { in: filters.userIds }
                } : {},
                filters.clientIds?.length > 0 ? {
                    clientId: { in: filters.clientIds }
                } : {},
                filters.reportType === 'finalized' ? {
                    status: 'FINALIZED'
                } : {}
            ].filter(condition => Object.keys(condition).length > 0)
        };

        const leads = await prisma.clientLead.findMany({
            where,
            include: {
                client: {
                    select: {
                        name: true,
                        phone: true
                    }
                },
                assignedTo: {
                    select: {
                        name: true
                    }
                },
                priceOffers: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    select: {
                        minPrice: true,
                        maxPrice: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const processedLeads = processLeads(leads);
        const summary = calculateSummary(leads);

        return res.json({ leads: processedLeads, summary });
    } catch (error) {
        console.error('Error generating report:', error);
        return res.status(500).json({ error: 'Failed to generate report' });
    }
};
// reportUtils.js
export const generateExcelReport = async (req, res) => {
    const { data } = req.body;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lead Report');

    // Configure columns - kept the same as before
    worksheet.columns = [
        { header: 'Client Name', key: 'clientName', width: 25 },
        { header: 'Phone', key: 'clientPhone', width: 20 },
        { header: 'Assigned To', key: 'assignedTo', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Emirate', key: 'emirate', width: 15 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'AveragePrice', key: 'averagePrice', width: 15, style: { numFmt: '#,##0.00 "AED"' } },
        { header: 'Discount', key: 'discount', width: 15, style: { numFmt: '#,##0.00 "%"' } },
        { header: 'Price without discount', key: 'priceWithOutDiscount', width: 15, style: { numFmt: '#,##0.00 "AED"' } },
        { header: 'Created At', key: 'createdAt', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).height = 30;

    // Add data
    worksheet.addRows(data.leads);

    // Style data rows
    for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.height = 25;
        row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: i % 2 === 0 ? 'FFF3F4F6' : 'FFFFFFFF' }
        };
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    }

    // Add totals row
    const totalRow = worksheet.addRow({
        clientName: 'TOTALS',
        averagePrice: data.leads.reduce((sum, lead) => sum + (lead.averagePrice || 0), 0),
        discount: data.leads.reduce((sum, lead) => sum + (lead.discount || 0), 0),
        priceWithOutDiscount: data.leads.reduce((sum, lead) => sum + (lead.priceWithOutDiscount || 0), 0)
    });

    // Style totals row
    totalRow.font = { bold: true };
    totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' }
    };
    totalRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    totalRow.height = 30;
    totalRow.eachCell(cell => {
        cell.border = {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'medium' },
            right: { style: 'medium' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Add summary sheet with improved styling (kept as before)
    const summarySheet = workbook.addWorksheet('Summary');
    // ... (rest of the summary sheet code remains the same)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=lead-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
};

export const generatePDFReport = (req, res) => {
    try {
        const { data } = req.body;
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 10
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=lead-report.pdf');
        doc.pipe(res);

        // Title
        doc.fontSize(24)
              .font('Helvetica-Bold')
              .text('Lead Report', { align: 'center' })
              .moveDown();

        const formatValue = (value) => {
            if (value === null || value === undefined) return 'N/A';
            if (typeof value === 'number') return value.toLocaleString();
            return value.toString();
        };

        // Summary table remains the same
        const summaryTable = {
            headers: ['Metric', 'Value'],
            rows: [
                ['Total Leads', formatValue(data.summary.totalLeads)],
                ['Total Value', `${formatValue(data.summary.totalValue)} AED`],
                ['Average Value', `${formatValue(data.summary.averageValue)} AED`],
                ['Total Discount', `${formatValue(data.summary.totalDiscount)} %`]
            ],
            columnWidths: [0.4, 0.6]
        };

        drawTable(doc, summaryTable, 100);
        doc.moveDown(2);

        // Leads Section
        doc.fontSize(16)
              .font('Helvetica-Bold')
              .text('Lead Details', { underline: true })
              .moveDown();

        const leadsTable = {
            headers: ['Client Name', 'Phone', 'Assigned To', 'Status', 'Emirate', 'Type', "Price", 'Discount',  'Created At'],
            rows: data.leads.map(lead => [
                formatValue(lead.clientName),
                formatValue(lead.clientPhone),
                formatValue(lead.assignedTo),
                formatValue(lead.status),
                formatValue(lead.emirate),
                formatValue(lead.type),
                `${formatValue(lead.averagePrice)} AED`,
                `${formatValue(lead.discount)} %`,
                formatValue(lead.createdAt)
            ]),
            columnWidths: [0.15, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
        };

        // Calculate totals
        const totals = {
            price: data.leads.reduce((sum, lead) => sum + (lead.averagePrice || 0), 0),
            discount: data.leads.reduce((sum, lead) => sum + (lead.discount || 0), 0),
            priceWithOutDiscount: data.leads.reduce((sum, lead) => sum + (lead.priceWithOutDiscount || 0), 0)
        };

        // Add totals row
        leadsTable.rows.push([
            'TOTALS',
            '',
            '',
            '',
            '',
            '',
            `${formatValue(totals.price)} AED`,
            ``,
            `${formatValue(totals.priceWithOutDiscount)} AED`,
        ]);

        drawTable(doc, leadsTable, 220);

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF report' });
        }
    }
};

// Updated drawTable function to handle totals row
function drawTable(doc, table, startY) {
    try {
        const cellPadding = 8;
        const availableWidth = doc.page.width - 100;
        const columnWidths = table.columnWidths.map(width => width * availableWidth);
        let currentY = startY;

        // Draw headers
        doc.font('Helvetica-Bold').fontSize(12);
        doc.fillColor('#4B5563')
              .rect(50, currentY, availableWidth, 30)
              .fill();

        doc.fillColor('white');
        let currentX = 50;
        table.headers.forEach((header, i) => {
            doc.text(
                  header,
                  currentX + cellPadding,
                  currentY + cellPadding,
                  {
                      width: columnWidths[i] - (cellPadding * 2),
                      align: 'left',
                      ellipsis: true
                  }
            );
            currentX += columnWidths[i];
        });

        currentY += 30;
        doc.fillColor('black');

        // Draw rows
        doc.font('Helvetica').fontSize(10);

        table.rows.forEach((row, rowIndex) => {
            const isLastRow = rowIndex === table.rows.length - 1;
            const rowHeight = 25;

            // Special styling for totals row
            if (isLastRow) {
                doc.fillColor('#4B5563')
                      .rect(50, currentY, availableWidth, rowHeight)
                      .fill();
                doc.fillColor('white');
                doc.font('Helvetica-Bold');
            } else {
                doc.fillColor(rowIndex % 2 === 0 ? '#F3F4F6' : 'white')
                      .rect(50, currentY, availableWidth, rowHeight)
                      .fill();
                doc.fillColor('black');
                doc.font('Helvetica');
            }

            currentX = 50;
            row.forEach((cell, i) => {
                doc.rect(currentX, currentY, columnWidths[i], rowHeight)
                      .stroke();

                doc.text(
                      cell === null || cell === undefined ? 'N/A' : cell.toString(),
                      currentX + cellPadding,
                      currentY + cellPadding,
                      {
                          width: columnWidths[i] - (cellPadding * 2),
                          align: 'left',
                          ellipsis: true
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
                doc.font('Helvetica-Bold')
                      .fontSize(12)
                      .fillColor('#4B5563')
                      .rect(50, currentY, availableWidth, 30)
                      .fill();

                currentX = 50;
                doc.fillColor('white');
                table.headers.forEach((header, i) => {
                    doc.text(
                          header,
                          currentX + cellPadding,
                          currentY + cellPadding,
                          {
                              width: columnWidths[i] - (cellPadding * 2),
                              align: 'left',
                              ellipsis: true
                          }
                    );
                    currentX += columnWidths[i];
                });
                currentY += 30;
                doc.fillColor('black');
            }
        });
    } catch (error) {
        console.error('Error drawing table:', error);
        throw error;
    }
}
const calculateStaffStats = (staff, dateRange) => {
    return staff.map(user => {
        const userLeads = user.clientLeads || [];

        const filteredLeads = dateRange.startDate && dateRange.endDate
              ? userLeads.filter(lead => {
                  const leadDate = new Date(lead.createdAt);
                  return leadDate >= new Date(dateRange.startDate) &&
                        leadDate <= new Date(dateRange.endDate);
              })
              : userLeads;

        const totalLeads = filteredLeads.length;
        const finalized = filteredLeads.filter(lead => lead.status === 'FINALIZED').length;
        const converted = filteredLeads.filter(lead => lead.status === 'CONVERTED').length;
        const onHold = filteredLeads.filter(lead => lead.status === 'ON_HOLD').length;
        const rejected = filteredLeads.filter(lead => lead.status === 'REJECTED').length;
        // Calculate success rate
        const totalClosedLeads = finalized + converted + rejected + onHold;
        const successRate = totalClosedLeads > 0
              ? parseFloat(((finalized - (converted + rejected + onHold)) / totalClosedLeads * 100).toFixed(2))
              : 0.00;

        // Calculate revenue and discount
        const totalRevenue = filteredLeads
              .filter(lead => lead.status === 'FINALIZED')
              .reduce((sum, lead) => sum + parseFloat(Number(lead.averagePrice || 0).toFixed(2)), 0);

// Calculate discount
        const totalDiscount = filteredLeads
              .filter(lead => lead.status === 'FINALIZED')
              .reduce((sum, lead) => sum + parseFloat(Number(lead.discount || 0).toFixed(2)), 0);

// Calculate conversion rate
        const conversionRate = totalLeads > 0
              ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
              : 0.00;
        const totalCommission = parseFloat((totalRevenue * 0.05).toFixed(2));

        return {
            userId: user.id,
            staffName: user.name,
            email: user.email,
            totalLeads,
            activeLeads: filteredLeads.filter(lead =>
                  !['FINALIZED', 'CONVERTED', 'REJECTED', 'ON_HOLD'].includes(lead.status)
            ).length,
            finalized,
            converted,
            rejected,
            onHold,
            successRate: Math.round(successRate * 100) / 100,
            totalRevenue,
            totalDiscount,
            averageRevenuePerLead: totalLeads > 0 ? totalRevenue / totalLeads : 0,conversionRate,totalCommission
        };
    });
};

export const generateStaffReport = async (req, res) => {
    try {
        const filters = req.body;
        const where = {

            AND: [
                filters.startDate && filters.endDate ? {
                    createdAt: {
                        gte: new Date(filters.startDate),
                        lte: new Date(filters.endDate)
                    }
                } : {},
                filters.emirates?.length > 0 ? {
                    emirate: {in: filters.emirates}
                } : {},
            ]
        }

        // First, get all staff users
        const staffUsers = await prisma.user.findMany({
            where: {
                role: 'STAFF',
                isActive: true
            },
            include: {
                clientLeads: {
                    where
                }
            }
        });

        const staffStats = calculateStaffStats(staffUsers, filters);

        const summary = {
            totalStaff: staffStats.length,
            activeStaff: staffStats.filter(staff => staff.totalLeads > 0).length,
            totalLeads: staffStats.reduce((sum, staff) => sum + staff.totalLeads, 0),
            averageLeadsPerStaff: staffStats.reduce((sum, staff) => sum + staff.totalLeads, 0) /
                  (staffStats.length || 1),
            totalRevenue: staffStats.reduce((sum, staff) => sum + staff.totalRevenue, 0),
            averageSuccessRate: staffStats.reduce((sum, staff) => sum + staff.successRate, 0) /
                  (staffStats.length || 1),
            conversionRate: staffStats.reduce((sumConverted, staff) => sumConverted + (staff.converted || 0), 0) /
                  (staffStats.reduce((sumLeads, staff) => sumLeads + (staff.totalLeads || 0), 0) || 1) * 100,
            bestPerformer: staffStats.reduce((best, current) =>
                  (current.successRate > (best?.successRate || 0)) ? current : best, null),
            topRevenue: staffStats.reduce((best, current) =>
                  (current.totalRevenue > (best?.totalRevenue || 0)) ? current : best, null),
            totalCommission:staffStats.reduce((sum, staff) => sum + staff.totalCommission, 0),
        };

        return res.json({
            staffStats,
            summary,
            dateRange: filters.startDate && filters.endDate ? {
                start: filters.startDate,
                end: filters.endDate
            } : null
        });
    } catch (error) {
        console.error('Error generating staff report:', error);
        return res.status(500).json({ error: 'Failed to generate staff report' });
    }
};
export const generateStaffExcelReport = async (req, res) => {
    const { data } = req.body;
    const workbook = new ExcelJS.Workbook();

    // Staff Performance Sheet
    const worksheet = workbook.addWorksheet('Staff Performance');

    worksheet.columns = [
        { header: 'Staff Name', key: 'staffName', width: 25 },
        { header: 'Total Leads', key: 'totalLeads', width: 15 },
        { header: 'Active Leads', key: 'activeLeads', width: 15 },
        { header: 'Finalized', key: 'finalized', width: 15 },
        { header: 'Converted', key: 'converted', width: 15 },
        { header: 'Success Rate', key: 'successRate', width: 15, style: { numFmt: '0.00"%"' } },
        { header: 'Total Revenue', key: 'totalRevenue', width: 20, style: { numFmt: '#,##0.00 "AED"' } },
        { header: 'Total commission', key: 'totalCommission', width: 20, style: { numFmt: '#,##0.00 "AED"' } },
        { header: 'Conversion rate', key: 'conversionRate', width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.height = 30;

    // Add data rows
    const rows = data.staffStats.map(staff => ({
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
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: i % 2 === 0 ? 'FFF3F4F6' : 'FFFFFFFF' },
        };
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    }

    // Add an empty row for spacing before the summary
    worksheet.addRow({});

    // Add summary header
    const summaryHeaderRow = worksheet.addRow(['Summary']);
    summaryHeaderRow.font = { bold: true, size: 12 };
    summaryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' },
    };
    summaryHeaderRow.font = { color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.height = 25;

    // Add summary rows
    const summaryRows = [
        { metric: 'Total Staff Members', value: data.summary.totalStaff || 0 },
        { metric: 'Total Leads', value: data.summary.totalLeads || 0 },
        { metric: 'Average Leads per Staff', value: data.summary.averageLeadsPerStaff || 0 },
        { metric: 'Total Revenue', value: `AED ${data.summary.totalRevenue || 0}` },
        { metric: 'Total Commission', value: `AED ${data.summary.totalCommission || 0}` },
        { metric: 'Average Success Rate', value: `${Math.max(data.summary.averageSuccessRate, 0).toFixed(2)}%` },
        { metric: 'Conversion rate', value: `${Math.max(data.summary.conversionRate, 0)}%` },
    ];

    summaryRows.forEach(({ metric, value }) => {
        const row = worksheet.addRow([metric, value]); // Add summary metric and value
        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right' };
        });
        row.height = 20;
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=staff-report.xlsx');

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
};

export const generateStaffPDFReport = (req, res) => {
    try {
        const { data } = req.body;
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 50
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=staff-report.pdf');
        doc.pipe(res);

        // Title
        doc.fontSize(24)
              .font('Helvetica-Bold')
              .text('Staff Performance Report', { align: 'center' })
              .moveDown();

        // Summary Section
        doc.fontSize(18)
              .font('Helvetica-Bold')
              .text('Summary', { underline: true })
              .moveDown();

        const summaryTable = {
            headers: ['Metric', 'Value'],
            rows: [
                ['Total Staff Members', data.summary.totalStaff],
                ['Total Leads', data.summary.totalLeads],
                ['Average Leads per Staff', data.summary.averageLeadsPerStaff.toFixed(2)],
                ['Total Revenue', `${data.summary.totalRevenue.toLocaleString()} AED`],
                ['Total Commission', `${data.summary.totalCommission.toLocaleString()} AED`],
                ['Average Success Rate', `${data.summary.averageSuccessRate.toFixed(2)}%`],
                ['Conversion rate', data.summary.conversionRate]
            ],
            columnWidths: [0.4, 0.6]
        };

        drawTable(doc, summaryTable, 100);
        doc.moveDown(2);

        // Staff Details Section
        doc.fontSize(18)
              .font('Helvetica-Bold')
              .text('Staff Details', { underline: true })
              .moveDown();

        const staffTable = {
            headers: [
                'Staff Name',
                'Total Leads',
                'Active',
                'Success Rate',
                'Revenue',
                'Conversion rate'
            ],
            rows: data.staffStats.map(staff => [
                staff.staffName,
                staff.totalLeads,
                staff.activeLeads,
                `${staff.successRate.toFixed(2)}%`,
                `${staff.totalRevenue.toLocaleString()} AED`,
                staff.conversionRate
            ]),
            columnWidths: [0.2, 0.1, 0.1, 0.15, 0.2, 0.1, 0.15]
        };

        drawTable(doc, staffTable, 200);

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF report' });
        }
    }
};

export async function getNotificationForTodayByStaffId(userId){
    const where = {};
    where.staffId = Number(userId);
    const startOfToday = dayjs().startOf('day').toDate();
    const endOfToday = dayjs().endOf('day').toDate();
    where.createdAt = {
        gte: startOfToday,
        lte: endOfToday,
    };
    const notifications = await prisma.notification.findMany({
        where: where,
        orderBy: {
            createdAt: 'desc',
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


return notifications
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
            const price = row[4]?.toString() ||"0"
            const priceWithoutDiscount = !isNaN(parseFloat(row[4])) ? parseFloat(row[4]) : 0;
            const averagePrice = !isNaN(parseFloat(row[4])) ? parseFloat(row[4]) : 0;
            const modifiedDate = row[9] ? XLSX.SSF.format("yyyy-mm-dd", row[9]) : new Date().toISOString();

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
        return res.status(500).json({ error: "An error occurred while processing the data" });
    }
}


export async function  createAFixedData({data}) {
    return prisma.fixedData.create({
        data: {
            title: data.title,
            description: data.description || null
        }
    })
}
export async function editAFixedData({id,data}){
    return prisma.fixedData.update({
        where: { id },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description })
        }
    })
}
export async function deleteAFixedData({id}){
    return prisma.fixedData.delete({
        where: { id }
    })
}