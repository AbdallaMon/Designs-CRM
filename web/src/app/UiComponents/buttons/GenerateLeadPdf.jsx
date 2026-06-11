import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";
import arabicFontBase64 from "@/app/fonts/arabicFont.js";
import { checkIfADesigner } from "@/app/helpers/functions/utility";
import { PaymentLevels } from "@/app/helpers/constants";

export function generatePDF(clientLead, user) {
  const doc = new jsPDF();
  doc.addFileToVFS("Amiri-Regular.ttf", arabicFontBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");
  doc.autoTableSetDefaults({
    styles: {
      font: "Amiri",
      fontStyle: "normal",
      halign: "left",
      cellPadding: 3,
    },
  });

  const formatField = (field) =>
    field ? field.toString() : "This field is empty";
  const formatDate = (date) =>
    date ? dayjs(date).format("YYYY-MM-DD HH:mm:ss") : "Date not specified";
  const formatCurrency = (value) =>
    value
      ? `AED ${parseFloat(value).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}`
      : "Not specified";

  doc.setProperties({
    title: `Client Lead Details - ${clientLead.id}`,
    subject: "Client Lead Report",
    author: "System Generated",
    keywords: "client lead, report",
    creator: "PDF Generator",
  });

  let currentPage = 1;
  let y = 20;
  const margin = 10;
  const pageHeight = doc.internal.pageSize.height;

  const addHeader = () => {
    doc.setFillColor(51, 122, 183);
    doc.rect(0, 0, doc.internal.pageSize.width, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`Client Lead Details - ID: ${clientLead.id}`, margin, 10);
    doc.setTextColor(0, 0, 0);
    y = 25;
  };

  const checkPageBreak = (height = 10) => {
    if (y + height >= pageHeight - margin) {
      doc.addPage();
      currentPage++;
      addHeader();
      return true;
    }
    return false;
  };

  const addSectionTitle = (title) => {
    checkPageBreak(15);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, doc.internal.pageSize.width - margin * 2, 8, "F");
    doc.setFontSize(11);
    doc.setFont("Amiri", "bold");
    doc.text(title, margin, y);
    doc.setFont("Amiri", "normal");
    y += 10;
  };

  const addField = (label, value, indent = 0) => {
    const textWidth = doc.internal.pageSize.width - margin * 2 - indent;
    const wrappedText = doc.splitTextToSize(
      `${label}: ${formatField(value)}`,
      textWidth
    );
    checkPageBreak(wrappedText.length * 7);
    wrappedText.forEach((line) => {
      doc.text(line, margin + indent, y);
      y += 7;
    });
  };

  addHeader();

  if (clientLead.status !== "NEW") {
    addSectionTitle("Client Information");
    addField("Name", clientLead.client?.name);
    addField("Phone", clientLead.client?.phone);
    addField("Email", clientLead.client?.email);
    addField("Country", clientLead.country);
    addField("Time To Contact", formatDate(clientLead.timeToContact));
  }

  addSectionTitle("Lead Details");
  addField("Category", clientLead.selectedCategory);
  addField("Type", clientLead.type);
  addField("Emirate", clientLead.emirate);
  addField("Status", clientLead.status);

  if (clientLead.description) {
    addSectionTitle("Description");
    const wrappedDesc = doc.splitTextToSize(
      clientLead.description,
      doc.internal.pageSize.width - margin * 2
    );
    checkPageBreak(wrappedDesc.length * 7);
    doc.text(wrappedDesc, margin, y);
    y += wrappedDesc.length * 7 + 5;
  }

  if (!checkIfADesigner(user)) {
    addSectionTitle("Price Information");
    if (clientLead.status === "FINALIZED") {
      addField("Final Price", formatCurrency(clientLead.averagePrice));
      addField("Price Note", clientLead.priceNote);
      addField("Discount", `${clientLead.discount || 0}%`);
    } else {
      addField("Suggested Price", formatCurrency(clientLead.price));
    }
    addField(
      "Price Without Discount",
      formatCurrency(clientLead.priceWithOutDiscount)
    );
  }

  // Admin-specific
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    addSectionTitle("Assigned Staff");
    addField("Lead staff", clientLead.assignedTo.name);

    if (clientLead.threeDDesigner)
      addField("3D Designer", clientLead.threeDDesigner.name);
    if (clientLead.twoDDesigner)
      addField("2D Designer", clientLead.twoDDesigner.name);
    if (clientLead.twoDExacuter)
      addField("2D Executer", clientLead.twoDExacuter.name);

    addSectionTitle("Work Stages");
    if (clientLead.threeDWorkStage) {
      addField("3D Stage", clientLead.threeDWorkStage);
    }
    if (clientLead.twoDWorkStage) {
      addField("2D Stage", clientLead.twoDWorkStage);
    }
    if (clientLead.twoDExacuterStage) {
      addField("2D Executer Stage", clientLead.twoDExacuterStage);
    }

    if (clientLead.payments?.length) {
      addSectionTitle("Payments");
      clientLead.payments.forEach((p, i) => {
        addField(`Payment #${i + 1} - Status`, p.status);
        addField("Amount", formatCurrency(p.amount), 5);
        addField("Paid", formatCurrency(p.amountPaid), 5);
        addField("Left", formatCurrency(p.amountLeft), 5);
        addField("Reason", p.paymentReason, 5);
        addField("Payment level", PaymentLevels[p.paymentLevel], 5);

        if (p.invoices?.length) {
          p.invoices.forEach((inv, idx) => {
            const issuedDate = formatDate(inv.issuedDate || inv.createdAt); // fallback to createdAt if issuedDate is missing
            addField(
              `  Invoice #${idx + 1}`,
              `Amount: ${formatCurrency(inv.amount)} - Issued: ${issuedDate}`,
              10
            );
          });
        }
      });
    }

    if (clientLead.extraServices?.length) {
      addSectionTitle("Extra Services");
      clientLead.extraServices.forEach((s, i) => {
        addField(`Extra Service #${i + 1}`, s.note);
        addField("Price", formatCurrency(s.price), 5);
      });
    }
  }

  // Files
  if (clientLead.files?.length > 0) {
    addSectionTitle("Files");
    clientLead.files.forEach((file) => {
      checkPageBreak(25);
      doc.setFillColor(245, 245, 245);
      doc.rect(
        margin,
        y - 3,
        doc.internal.pageSize.width - margin * 2,
        35,
        "F"
      );
      addField("Name", file.name, 5);
      addField("URL", file.url, 5);
      addField("Description", file.description || "No description", 5);
      addField("Added by", file.user?.name || "Unknown", 5);
      addField("Date", formatDate(file.createdAt), 5);
      y += 5;
    });
  }
  console.log(clientLead.priceOffers);

  if (!checkIfADesigner(user) && clientLead.priceOffers?.length > 0) {
    addSectionTitle("Price Offers");
    const offerColumns = ["Date", "By", "Note", "Attachment", "Is Accepted"];
    const offerRows = clientLead.priceOffers.map((offer) => [
      formatDate(offer.createdAt),
      offer.user?.name || "Unknown",
      offer.note || "-",
      offer.url || "No Attachment",
      offer.isAccetped ? "Accepted" : "Not accepted",
    ]);
    doc.autoTable({
      head: [offerColumns],
      body: offerRows,
      startY: y,
      margin: { left: margin },
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [51, 122, 183] },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Notes
  if (clientLead.notes?.length > 0) {
    addSectionTitle("Notes");
    clientLead.notes.forEach((note) => {
      checkPageBreak(30);
      doc.setFillColor(245, 245, 245);
      doc.rect(
        margin,
        y - 3,
        doc.internal.pageSize.width - margin * 2,
        20,
        "F"
      );
      const noteHeader = `${formatDate(note.createdAt)} - ${
        note.user?.name || "Unknown"
      }`;
      doc.setFont("Amiri", "bold");
      doc.text(noteHeader, margin + 5, y);
      doc.setFont("Amiri", "normal");
      y += 7;
      const wrappedContent = doc.splitTextToSize(
        note.content,
        doc.internal.pageSize.width - margin * 2 - 10
      );
      doc.text(wrappedContent, margin + 5, y);
      y += wrappedContent.length * 7 + 5;
    });
  }

  // Call Reminders
  if (clientLead.callReminders?.length > 0) {
    addSectionTitle("Call Reminders");
    const reminderColumns = ["Time", "Status", "User", "Reason", "Result"];
    const reminderRows = clientLead.callReminders.map((reminder) => [
      formatDate(reminder.time),
      reminder.status,
      reminder.user?.name || "Unknown",
      reminder.reminderReason || "-",
      reminder.callResult || "-",
    ]);
    doc.autoTable({
      head: [reminderColumns],
      body: reminderRows,
      startY: y,
      margin: { left: margin },
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [51, 122, 183] },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 25,
      pageHeight - 10
    );
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10
    );
  }

  // Save
  doc.save(
    `ClientLead_${clientLead.id}_${new Date().toISOString().split("T")[0]}.pdf`
  );
}
