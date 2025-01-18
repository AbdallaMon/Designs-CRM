import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from "dayjs";

export function generatePDF(clientLead) {
    const doc = new jsPDF();

    // Helper functions
    const formatField = (field) => (field ? field.toString() : 'This field is empty');
    const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : 'Date not specified';
    const formatCurrency = (value) => value ? `AED ${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Not specified';

    // Set document properties
    doc.setProperties({
        title: `Client Lead Details - ${clientLead.id}`,
        subject: 'Client Lead Report',
        author: 'System Generated',
        keywords: 'client lead, report',
        creator: 'PDF Generator'
    });

    // Initialize tracking variables
    let currentPage = 1;
    let y = 20;
    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;

    // Add header to each page
    const addHeader = () => {
        doc.setFillColor(51, 122, 183);
        doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(`Client Lead Details - ID: ${clientLead.id}`, margin, 10);
        doc.setTextColor(0, 0, 0);
        y = 25;
    };

    // Check page break
    const checkPageBreak = (height = 10) => {
        if (y + height >= pageHeight - margin) {
            doc.addPage();
            currentPage++;
            addHeader();
            return true;
        }
        return false;
    };

    // Add section title
    const addSectionTitle = (title) => {
        checkPageBreak(15);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 5, doc.internal.pageSize.width - (margin * 2), 8, 'F');
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(title, margin, y);
        doc.setFont(undefined, 'normal');
        y += 10;
    };

    // Add field
    const addField = (label, value, indent = 0) => {
        const textWidth = doc.internal.pageSize.width - (margin * 2) - indent;
        const wrappedText = doc.splitTextToSize(`${label}: ${formatField(value)}`, textWidth);

        checkPageBreak(wrappedText.length * 7);
        wrappedText.forEach(line => {
            doc.text(line, margin + indent, y);
            y += 7;
        });
    };

    // Start PDF generation
    addHeader();

    // Client Information
    addSectionTitle('Client Information');
    addField('Name', clientLead.client?.name);
    addField('Phone', clientLead.client?.phone);

    // Assigned To
    if (clientLead.assignedTo) {
        addSectionTitle('Assigned To');
        addField('Name', clientLead.assignedTo.name);
        addField('Email', clientLead.assignedTo.email);
    }

    // Lead Details
    addSectionTitle('Lead Details');
    addField('Category', clientLead.selectedCategory);
    addField('Type', clientLead.type);
    addField('Emirate', clientLead.emirate);
    addField('Status', clientLead.status);

    if (clientLead.description) {
        addSectionTitle('Description');
        const wrappedDesc = doc.splitTextToSize(clientLead.description, doc.internal.pageSize.width - (margin * 2));
        checkPageBreak(wrappedDesc.length * 7);
        doc.text(wrappedDesc, margin, y);
        y += wrappedDesc.length * 7 + 5;
    }

    // Price Information
    addSectionTitle('Price Information');
    addField('Price', formatCurrency(clientLead.price));
    addField('Average Price', formatCurrency(clientLead.averagePrice));
    addField('Price Without Discount', formatCurrency(clientLead.priceWithOutDiscount));
    addField('Discount', clientLead.discount ? `${clientLead.discount}%` : 'No discount');

    // Files
    if (clientLead.files?.length > 0) {
        addSectionTitle('Files');
        clientLead.files.forEach((file, index) => {
            checkPageBreak(25);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y - 3, doc.internal.pageSize.width - (margin * 2), 35, 'F');
            addField('Name', file.name, 5);
            addField('URL', file.url, 5);
            addField('Description', file.description || 'No description', 5);
            addField('Added by', file.user?.name || 'Unknown', 5);
            addField('Date', formatDate(file.createdAt), 5);
            y += 5;
        });
    }

    // Price Offers
    if (clientLead.priceOffers?.length > 0) {
        addSectionTitle('Price Offers');

        const offerColumns = ['Date', 'By', 'Min Price', 'Max Price'];
        const offerRows = clientLead.priceOffers.map(offer => [
            formatDate(offer.createdAt),
            offer.user?.name || 'Unknown',
            formatCurrency(offer.minPrice),
            formatCurrency(offer.maxPrice)
        ]);

        doc.autoTable({
            head: [offerColumns],
            body: offerRows,
            startY: y,
            margin: { left: margin },
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [51, 122, 183] }
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    // Notes
    if (clientLead.notes?.length > 0) {
        addSectionTitle('Notes');
        clientLead.notes.forEach((note, index) => {
            checkPageBreak(30);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y - 3, doc.internal.pageSize.width - (margin * 2), 20, 'F');

            const noteHeader = `${formatDate(note.createdAt)} - ${note.user?.name || 'Unknown'}`;
            doc.setFont(undefined, 'bold');
            doc.text(noteHeader, margin + 5, y);
            doc.setFont(undefined, 'normal');
            y += 7;

            const wrappedContent = doc.splitTextToSize(note.content, doc.internal.pageSize.width - (margin * 2) - 10);
            doc.text(wrappedContent, margin + 5, y);
            y += wrappedContent.length * 7 + 5;
        });
    }

    // Call Reminders
    if (clientLead.callReminders?.length > 0) {
        addSectionTitle('Call Reminders');

        const reminderColumns = ['Time', 'Status', 'User', 'Reason', 'Result'];
        const reminderRows = clientLead.callReminders.map(reminder => [
            formatDate(reminder.time),
            reminder.status,
            reminder.user?.name || 'Unknown',
            reminder.reminderReason || '-',
            reminder.callResult || '-'
        ]);

        doc.autoTable({
            head: [reminderColumns],
            body: reminderRows,
            startY: y,
            margin: { left: margin },
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [51, 122, 183] }
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    // Add footer to each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, pageHeight - 10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
    }

    // Save the PDF
    doc.save(`ClientLead_${clientLead.id}_${new Date().toISOString().split('T')[0]}.pdf`);
}