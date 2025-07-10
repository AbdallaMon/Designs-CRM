import { PDFDocument, rgb } from "pdf-lib";
import prisma from "../../prisma/prisma.js";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import * as fontkit from "fontkit";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "url";
import reshaper from "arabic-persian-reshaper";
import { uploadToFTPAsBuffer } from "./utility.js";
import { sendEmailForStaff, sendEmailToClient } from "./emailTemplates.js";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
const fontPath = path.join(__dirname, "../fonts/NotoSansArabic-Regular.ttf");
const fontBuffer = fs.readFileSync(fontPath);
const fontBase64 = fontBuffer.toString("base64");
const fontBoldPath = path.join(__dirname, "../fonts/NotoSansArabic-Bold.ttf");
const fontBoldBuffer = fs.readFileSync(fontBoldPath);
const fontBoldBase64 = fontBoldBuffer.toString("base64");

export async function getSessionByToken(token) {
  const session = await prisma.clientImageSession.findUnique({
    where: { token },
    include: {
      preferredPatterns: true,
      selectedSpaces: { include: { space: true } },
      selectedImages: {
        include: {
          image: {
            include: {
              spaces: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found or expired");
  }

  return session;
}

export async function submitSelectedPatterns({ token, patternIds }) {
  await prisma.clientImageSession.update({
    where: { token },
    data: {
      preferredPatterns: {
        set: [],
        connect: patternIds.map((id) => ({ id })),
      },
    },
  });

  return await getSessionByToken(token);
}

export async function submitSelectedImages({ token, imageIds }) {
  // Clear previous selected images and add new ones
  await prisma.clientImageSession.update({
    where: { token },
    data: {
      selectedImages: {
        deleteMany: {},
        create: imageIds.map((id) => ({
          image: { connect: { id } },
        })),
      },
    },
  });

  return await getSessionByToken(token);
}
export async function changeSessionStatus({ token, status, extra }) {
  // Clear previous selected images and add new ones
  let data = {
    sessionStatus: status,
  };
  if (extra) {
    data = { ...data, ...extra };
  }
  await prisma.clientImageSession.update({
    where: { token },
    data,
  });

  return await getSessionByToken(token);
}

export async function uploadPdfAndApproveSession({
  sessionData,
  signatureUrl,
  lng = "ar",
}) {
  try {
    const client = await prisma.clientImageSession.findUnique({
      where: {
        id: Number(sessionData.id),
      },
      select: {
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
    const pdfBytes = await generateImageSessionPdf({
      sessionData,
      signatureUrl,
      lng,
      name: client.clientLead.client.name,
    });
    const fileName = `session-${sessionData.id}-${uuidv4()}.pdf`;
    const remotePath = `public_html/uploads/${fileName}`;

    await uploadToFTPAsBuffer(pdfBytes, remotePath, true);

    const publicUrl = `https://panel.dreamstudiio.com/uploads/${fileName}`;

    await approveSession({
      token: sessionData.token,
      clientLeadId: sessionData.clientLeadId,
      id: Number(sessionData.id),
      pdfUrl: publicUrl,
    });
  } catch (e) {
    console.log("e in uploadig pdf", e);
    throw new Error(e.message);
  }
}

/**
 * Fetches an image buffer with retries and timeout.
 * This function is designed to be more robust against transient network issues
 * or slow server responses.
 * @param {string} url - The URL of the image.
 * @param {object} [options] - Optional configuration.
 * @param {number} [options.retries=3] - Number of times to retry fetching the image.
 * @param {number} [options.retryDelayMs=1000] - Delay in milliseconds between retries.
 * @param {number} [options.timeoutMs=15000] - Timeout for each fetch attempt in milliseconds.
 * @returns {Promise<ArrayBuffer>} The image data as an ArrayBuffer.
 * @throws {Error} If the image cannot be fetched after all retries and attempts.
 */
async function fetchImageBuffer(url, options = {}) {
  const {
    retries = 3,
    retryDelayMs = 1000,
    timeoutMs = 15000, // Default timeout for each fetch attempt
  } = options;

  const errors = [];

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      // Set a timeout for the fetch request
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id); // Clear the timeout if the fetch completes

      if (!res.ok) {
        throw new Error(
          `HTTP Error ${res.status}: ${res.statusText} for URL: ${url}`
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      // Store specific error messages for debugging
      let errorMessage = `Attempt ${i + 1} failed: ${error.message}`;
      if (error.name === "AbortError") {
        errorMessage = `Attempt ${i + 1} timed out after ${timeoutMs}ms: ${
          error.message
        }`;
      } else if (
        error instanceof TypeError &&
        error.message.includes("network error")
      ) {
        errorMessage = `Attempt ${
          i + 1
        } network error (possibly CORS or connectivity): ${error.message}`;
      }
      errors.push(errorMessage);

      // Only retry if it's not the last attempt
      if (i < retries - 1) {
        console.warn(
          `Retrying fetch for ${url} in ${retryDelayMs}ms... (Error: ${errorMessage})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  // If all retries fail, throw a comprehensive error message
  const detailedErrorMessage = `Failed to fetch image from ${url} after ${retries} attempts.\nDetailed Errors:\n${errors.join(
    "\n"
  )}`;
  console.error(detailedErrorMessage);
  throw new Error(`Could not load image: ${url}. See console for details.`);
}

export async function generateImageSessionPdf({
  sessionData,
  signatureUrl,
  lng = "ar",
  name,
}) {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Embed fonts
    const font = await pdfDoc.embedFont(fontBase64);
    const boldFont = await pdfDoc.embedFont(fontBoldBase64);

    // Enhanced Color Palette
    const colors = {
      primary: rgb(0.827, 0.675, 0.443),
      primaryDark: rgb(0.745, 0.592, 0.361),
      primaryLight: rgb(0.95, 0.92, 0.88),
      heading: rgb(0.22, 0.188, 0.157),
      textColor: rgb(0.345, 0.302, 0.247),
      bgPrimary: rgb(0.918, 0.906, 0.886),
      accentBg: rgb(0.98, 0.97, 0.95),
      success: rgb(0.518, 0.569, 0.471),
      borderColor: rgb(0.7, 0.7, 0.7),
      white: rgb(1, 1, 1),
      lightGray: rgb(0.95, 0.95, 0.95),
      shadowColor: rgb(0.85, 0.85, 0.85),
    };

    // Page dimensions and margins
    const pageWidth = 600;
    const pageHeight = 800;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 60;
    const footerHeight = 80;
    const borderWidth = 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - headerHeight - margin;

    // Arabic text reshaping function
    const reText = (text) => {
      const reshape = reshaper.ArabicShaper.convertArabic;
      let reshaped = reshape(text);
      return reshaped;
    };

    // Helper function to get text by language
    const getTextByLanguage = (textArray, languageCode) => {
      if (!textArray || !Array.isArray(textArray)) return "";
      const textItem = textArray.find(
        (item) => item.language?.code === languageCode
      );
      return textItem?.text || "";
    };

    // Helper function to calculate RTL text position
    const getRTLTextX = (
      text,
      fontSize,
      font,
      containerStartX = margin,
      containerWidth = contentWidth
    ) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      return containerStartX + containerWidth - textWidth;
    };

    // Helper function to draw RTL text
    const drawRTLText = (
      text,
      yPos,
      size,
      fontToUse,
      colorToUse,
      containerStartX = margin,
      containerWidth = contentWidth,
      customX = null
    ) => {
      const processedText = lng === "ar" ? reText(text) : text;
      const rtlX =
        customX !== null
          ? customX
          : lng === "ar"
          ? getRTLTextX(
              processedText,
              size,
              fontToUse,
              containerStartX,
              containerWidth
            )
          : containerStartX;

      page.drawText(processedText, {
        x: rtlX,
        y: yPos,
        size,
        font: fontToUse,
        color: colorToUse,
      });

      return {
        processedText,
        actualX: rtlX,
        textWidth: fontToUse.widthOfTextAtSize(processedText, size),
      };
    };

    // Draw page border and frame
    const drawPageBorder = () => {
      const borderTopY = margin + headerHeight;

      // Outer border frame
      page.drawRectangle({
        x: margin - borderWidth,
        y: margin - borderWidth,
        width: contentWidth + borderWidth * 2,
        height: pageHeight - borderTopY - margin + borderWidth * 2,
        borderColor: colors.borderColor,
        borderWidth: borderWidth,
        color: undefined,
      });

      // Inner shadow effect
      page.drawRectangle({
        x: margin,
        y: margin,
        width: contentWidth,
        height: pageHeight - borderTopY - margin,
        borderColor: colors.shadowColor,
        borderWidth: 1,
        color: undefined,
      });
    };

    // Draw fixed header for each page
    const drawFixedHeader = () => {
      // Header background
      page.drawRectangle({
        x: margin,
        y: pageHeight - headerHeight,
        width: contentWidth,
        height: headerHeight,
        color: colors.primaryLight,
        borderColor: colors.borderColor,
        borderWidth: 1,
      });

      // Header title
      const headerTitle =
        lng === "ar" ? "جلسة التصميم الداخلي" : "Interior Design Session";
      const headerFontSize = 18;
      const headerY = pageHeight - headerHeight / 2 - headerFontSize / 2 + 4;

      page.drawText(lng === "ar" ? reText(headerTitle) : headerTitle, {
        x:
          lng === "ar"
            ? getRTLTextX(
                headerTitle,
                headerFontSize,
                boldFont,
                margin + 20,
                contentWidth - 40
              )
            : margin + 20,
        y: headerY,
        size: headerFontSize,
        font: boldFont,
        color: colors.heading,
      });

      // Header separator line
      page.drawLine({
        start: { x: margin, y: pageHeight - headerHeight },
        end: { x: margin + contentWidth, y: pageHeight - headerHeight },
        thickness: 2,
        color: colors.primary,
      });
    };

    // Draw fixed footer
    const drawFixedFooter = () => {
      // Footer background
      page.drawRectangle({
        x: margin,
        y: margin,
        width: contentWidth,
        height: footerHeight,
        color: colors.accentBg,
        borderColor: colors.borderColor,
        borderWidth: 1,
      });

      // Company branding
      page.drawText("DREAM STUDIO", {
        x: margin + 20,
        y: margin + footerHeight - 25,
        size: 14,
        font: boldFont,
        color: colors.heading,
      });

      page.drawText("Interior Design Solutions", {
        x: margin + 20,
        y: margin + footerHeight - 45,
        size: 10,
        font: font,
        color: colors.textColor,
      });

      // Date stamp
      const currentDate = dayjs().format("MMMM D, YYYY");
      const dateText = `Generated: ${currentDate}`;
      const dateFontSize = 9;
      const dateTextWidth = font.widthOfTextAtSize(dateText, dateFontSize);
      const dateX = margin + contentWidth - dateTextWidth - 20;

      page.drawText(dateText, {
        x: dateX,
        y: margin + footerHeight - 35,
        size: dateFontSize,
        font,
        color: colors.textColor,
      });

      // Footer separator line
      page.drawLine({
        start: { x: margin, y: margin + footerHeight },
        end: { x: margin + contentWidth, y: margin + footerHeight },
        thickness: 2,
        color: colors.primary,
      });
    };

    // Function to create intro page
    const drawIntroPage = async () => {
      try {
        // Load and draw full-page image
        const imageBuffer = await fetchImageBuffer(
          "https://dreamstudiio.com/Pdf-intro.png"
        );
        const embeddedImage = await pdfDoc.embedPng(imageBuffer);

        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } catch (err) {
        console.warn("Intro image load error:", err.message);
      }

      // Title text logic
      const titleText = name || "Dream Interior Report";
      const fontSize = 20;
      const maxTextWidth = pageWidth * 0.8; // max 80% of page width
      const lineHeight = fontSize + 6;

      // Split text into wrapped lines
      const words = titleText.split(" ");
      const lines = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        const testWidth = boldFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= maxTextWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Starting Y based on number of lines
      const totalTextHeight = lines.length * lineHeight;
      let textY = pageHeight * 0.75 + totalTextHeight / 2; // a little above middle

      // Draw each line centered
      for (const line of lines) {
        const lineWidth = boldFont.widthOfTextAtSize(line, fontSize);
        const textX = (pageWidth - lineWidth) / 2;
        page.drawText(line, {
          x: textX,
          y: textY,
          size: fontSize,
          font: boldFont,
          color: rgb(1, 1, 1), // white
        });
        textY -= lineHeight;
      }
    };

    function hexToRgbNormalized(hex) {
      if (/^#([0-9A-F]{3})$/i.test(hex)) {
        hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }

      if (!/^#([0-9A-F]{6})$/i.test(hex)) {
        throw new Error(`Invalid HEX color: ${hex}`);
      }

      return {
        r: parseInt(hex.slice(1, 3), 16) / 255,
        g: parseInt(hex.slice(3, 5), 16) / 255,
        b: parseInt(hex.slice(5, 7), 16) / 255,
      };
    }

    const drawCustomColors = (
      customColors,
      startX,
      startY,
      circleSize = 25
    ) => {
      if (!customColors || !Array.isArray(customColors)) return startY;

      const spacing = 35;
      let currentX = startX;
      let currentY = startY;
      const maxWidth = contentWidth - 40;

      customColors.forEach((color, index) => {
        if (currentX + circleSize > startX + maxWidth) {
          currentX = startX;
          currentY -= spacing + 15;
        }

        const { r, g, b } = hexToRgbNormalized(color);

        // Draw white background circle for better contrast
        page.drawCircle({
          x: currentX + circleSize / 2,
          y: currentY - circleSize / 2,
          size: circleSize / 2 + 2,
          color: colors.white,
          borderColor: colors.borderColor,
          borderWidth: 1,
        });

        // Draw color circle
        page.drawCircle({
          x: currentX + circleSize / 2,
          y: currentY - circleSize / 2,
          size: circleSize / 2,
          color: rgb(r, g, b),
          borderColor: colors.borderColor,
          borderWidth: 1,
        });

        currentX += spacing;
      });

      return currentY - circleSize - 15;
    };

    const drawEnhancementTable = (items, startY) => {
      if (!items || items.length === 0) return startY;

      const tableX = margin + 20;
      const rowHeight = 50;
      const paddingX = 20;
      const borderRadius = 12;
      const tableWidth = contentWidth - 40;
      const totalHeight = items.length * rowHeight + 20;

      // Draw outer container with shadow
      page.drawRectangle({
        x: tableX + 2,
        y: startY - totalHeight + 2,
        width: tableWidth,
        height: totalHeight,
        color: colors.shadowColor,
        xRounded: borderRadius,
        yRounded: borderRadius,
      });

      // Draw main container
      page.drawRectangle({
        x: tableX,
        y: startY - totalHeight,
        width: tableWidth,
        height: totalHeight,
        color: colors.white,
        borderColor: colors.borderColor,
        borderWidth: 2,
        xRounded: borderRadius,
        yRounded: borderRadius,
      });

      // Draw header row
      page.drawRectangle({
        x: tableX + 2,
        y: startY - 22,
        width: tableWidth - 4,
        height: 20,
        color: colors.primaryLight,
        xRounded: 8,
        yRounded: 8,
      });

      const headerText = lng === "ar" ? "العناصر المختارة" : "Selected Items";
      page.drawText(lng === "ar" ? reText(headerText) : headerText, {
        x:
          lng === "ar"
            ? getRTLTextX(
                headerText,
                12,
                boldFont,
                tableX + paddingX,
                tableWidth - paddingX * 2
              )
            : tableX + paddingX,
        y: startY - 18,
        size: 12,
        font: boldFont,
        color: colors.heading,
      });

      let currentY = startY - 42;

      items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        const backgroundColor = isEven ? colors.lightGray : colors.white;

        // Draw row background
        page.drawRectangle({
          x: tableX + 2,
          y: currentY - rowHeight + 2,
          width: tableWidth - 4,
          height: rowHeight - 4,
          color: backgroundColor,
          borderColor: colors.borderColor,
          borderWidth: 0.5,
          xRounded: 8,
          yRounded: 8,
        });

        let itemText = "";
        let itemType = "";

        if (item.type === "space") {
          itemText =
            getTextByLanguage(item.data.title, lng) ||
            item.data.name ||
            "Space";
          itemType = lng === "ar" ? "مساحة" : "Space";
        } else if (item.type === "style") {
          itemText =
            getTextByLanguage(item.data.title, lng) ||
            item.data.name ||
            "Style";
          itemType = lng === "ar" ? "نمط" : "Style";
        } else if (item.type === "material") {
          itemText =
            getTextByLanguage(item.data.title, lng) ||
            item.data.name ||
            "Material";
          itemType = lng === "ar" ? "خامة" : "Material";
        } else if (item.type === "customColors") {
          itemText = lng === "ar" ? "الألوان المخصصة" : "Custom Colors";
          itemType = lng === "ar" ? "ألوان" : "Colors";
        }

        const fontSize = 14;
        const typeSize = 11;
        const textY = currentY - rowHeight / 2 + 5;
        const typeY = currentY - rowHeight / 2 - 10;

        // Draw item text
        page.drawText(lng === "ar" ? reText(itemText) : itemText, {
          x:
            lng === "ar"
              ? getRTLTextX(
                  itemText,
                  fontSize,
                  font,
                  tableX + paddingX,
                  tableWidth - paddingX * 2
                )
              : tableX + paddingX,
          y: textY,
          size: fontSize,
          font: font,
          color: colors.textColor,
        });

        // Draw item type
        page.drawText(lng === "ar" ? reText(itemType) : itemType, {
          x:
            lng === "ar"
              ? getRTLTextX(
                  itemType,
                  typeSize,
                  font,
                  tableX + paddingX,
                  tableWidth - paddingX * 2
                )
              : tableX + paddingX,
          y: typeY,
          size: typeSize,
          font: font,
          color: colors.primary,
        });

        currentY -= rowHeight;
      });

      return startY - totalHeight - 20;
    };

    const checkNewPage = (requiredSpace = 50) => {
      const availableSpace = y - margin - footerHeight;
      if (availableSpace < requiredSpace) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageBorder();
        drawFixedHeader();
        drawFixedFooter();
        y = pageHeight - headerHeight - margin - 20;
        return true;
      }
      return false;
    };

    // Enhanced section drawing with fixed headers
    const drawSection = async (
      title,
      items,
      itemRenderer,
      isGridSection = false
    ) => {
      checkNewPage(100);

      const sectionHeight = 50;
      const borderRadius = 12;

      // Section Header with gradient-like effect
      page.drawRectangle({
        x: margin + 20 + 2,
        y: y - sectionHeight + 2,
        width: contentWidth - 40,
        height: sectionHeight,
        color: colors.shadowColor,
        xRounded: borderRadius,
        yRounded: borderRadius,
      });

      page.drawRectangle({
        x: margin + 20,
        y: y - sectionHeight,
        width: contentWidth - 40,
        height: sectionHeight,
        color: colors.primaryLight,
        borderColor: colors.borderColor,
        borderWidth: 2,
        xRounded: borderRadius,
        yRounded: borderRadius,
      });

      const fontSize = 16;
      const titleY = y - sectionHeight / 2 - fontSize / 2 + 4;
      const textX =
        lng === "ar"
          ? getRTLTextX(
              title,
              fontSize,
              boldFont,
              margin + 40,
              contentWidth - 80
            )
          : margin + 40;

      const processedTitle = lng === "ar" ? reText(title) : title;

      page.drawText(processedTitle, {
        x: textX,
        y: titleY,
        size: fontSize,
        font: boldFont,
        color: colors.heading,
      });

      y -= sectionHeight + 20;

      if (items && items.length > 0) {
        if (isGridSection) {
          await itemRenderer(items);
        } else {
          for (let i = 0; i < items.length; i++) {
            checkNewPage(40);
            await itemRenderer(items[i], i, items.length);
          }
        }
      } else {
        const noItemsText =
          lng === "ar" ? "لا يوجد عناصر محددة" : "No items selected";
        const fallbackFontSize = 13;

        const textX =
          lng === "ar"
            ? getRTLTextX(
                noItemsText,
                fallbackFontSize,
                font,
                margin + 40,
                contentWidth - 80
              )
            : margin + 40;

        page.drawText(lng === "ar" ? reText(noItemsText) : noItemsText, {
          x: textX,
          y: y,
          size: fallbackFontSize,
          font,
          color: colors.textColor,
        });

        y -= 30;
      }

      y -= 30;
    };

    // Create intro page
    await drawIntroPage();

    // Create second page for content
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageBorder();
    drawFixedHeader();
    drawFixedFooter();
    y = pageHeight - headerHeight - margin - 20;

    // Prepare enhancement table items
    const enhancementItems = [];

    // Add selected spaces
    if (sessionData.selectedSpaces && sessionData.selectedSpaces.length > 0) {
      sessionData.selectedSpaces.forEach((spaceRelation) => {
        enhancementItems.push({
          type: "space",
          data: spaceRelation.space,
        });
      });
    }

    // Add style
    if (sessionData.style) {
      enhancementItems.push({
        type: "style",
        data: sessionData.style,
      });
    }

    // Add materials
    if (sessionData.materials && sessionData.materials.length > 0) {
      sessionData.materials.forEach((materialRelation) => {
        enhancementItems.push({
          type: "material",
          data: materialRelation.material,
        });
      });
    }

    // Draw enhancement table if there are items
    if (enhancementItems.length > 0) {
      await drawSection(
        lng === "ar" ? "ملخص الاختيارات" : "Selection Summary",
        enhancementItems,
        async (items) => {
          checkNewPage(150);
          const newY = drawEnhancementTable(items, y);
          y = newY;
        },
        true
      );
    }

    // Draw custom colors section separately for visual display
    if (
      sessionData.customColors &&
      Array.isArray(sessionData.customColors) &&
      sessionData.customColors.length > 0
    ) {
      await drawSection(
        lng === "ar" ? "الألوان المخصصة" : "Custom Colors",
        sessionData.customColors,
        async (customColors) => {
          checkNewPage(100);
          const startX = lng === "ar" ? pageWidth - margin - 300 : margin + 40;
          const newY = drawCustomColors(customColors, startX, y);
          y = newY;
        },
        true
      );
    }

    // Keep selectedImages section unchanged
    if (sessionData.selectedImages && sessionData.selectedImages.length > 0) {
      for (const image of sessionData.selectedImages) {
        page = pdfDoc.addPage([600, 800]); // standard page size
        const pageWidth = 600;
        const pageHeight = 800;

        const imageUrl = image.designImage?.imageUrl;
        if (!imageUrl) continue;

        try {
          const imgBytes = await fetchImageBuffer(imageUrl);
          let img;
          try {
            img = await pdfDoc.embedPng(imgBytes);
          } catch {
            img = await pdfDoc.embedJpg(imgBytes);
          }

          if (img) {
            const { width: imgW, height: imgH } = img.size();
            const aspectRatio = imgW / imgH;

            // Scale image to full page height
            const targetHeight = pageHeight;
            const targetWidth = targetHeight * aspectRatio;

            // Center horizontally
            const x = (pageWidth - targetWidth) / 2;
            const y = 0;

            page.drawImage(img, {
              x,
              y,
              width: targetWidth,
              height: targetHeight,
            });
          }
        } catch (err) {
          console.warn(`Failed to embed selected image: ${err.message}`);
        }
      }
    }

    // Signature section
    if (signatureUrl) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawPageBorder();
      drawFixedHeader();
      drawFixedFooter();
      y = pageHeight - headerHeight - margin - 20;

      checkNewPage(200);

      // Section header
      page.drawRectangle({
        x: margin + 20,
        y: y - 40,
        width: contentWidth - 40,
        height: 40,
        color: colors.primaryLight,
        borderColor: colors.borderColor,
        borderWidth: 2,
        xRounded: 10,
        yRounded: 10,
      });

      const signatureTitle = lng === "ar" ? "توقيع العميل" : "Client Signature";
      page.drawText(lng === "ar" ? reText(signatureTitle) : signatureTitle, {
        x:
          lng === "ar"
            ? getRTLTextX(
                signatureTitle,
                16,
                boldFont,
                margin + 40,
                contentWidth - 80
              )
            : margin + 40,
        y: y - 25,
        size: 16,
        font: boldFont,
        color: colors.heading,
      });

      y -= 60;

      let signatureEmbedded = false;
      try {
        const sigBytes = await fetchImageBuffer(signatureUrl);
        let sigImage;
        try {
          sigImage = await pdfDoc.embedPng(sigBytes);
          signatureEmbedded = true;
        } catch {
          sigImage = await pdfDoc.embedJpg(sigBytes);
          signatureEmbedded = true;
        }

        if (signatureEmbedded) {
          const maxW = 300;
          const maxH = 120;
          const { width: sw, height: sh } = sigImage.size();
          let sigW = sw,
            sigH = sh;

          if (sigW > maxW) {
            const ratio = maxW / sigW;
            sigW = maxW;
            sigH *= ratio;
          }
          if (sigH > maxH) {
            const ratio = maxH / sigH;
            sigH = maxH;
            sigW *= ratio;
          }

          const sigX = margin + 40;
          const sigY = y - sigH - 20;

          // Signature container
          page.drawRectangle({
            x: sigX - 15,
            y: sigY - 15,
            width: sigW + 30,
            height: sigH + 30,
            color: colors.white,
            borderColor: colors.borderColor,
            borderWidth: 2,
            xRounded: 12,
            yRounded: 12,
          });

          page.drawImage(sigImage, {
            x: sigX,
            y: sigY,
            width: sigW,
            height: sigH,
          });

          y -= sigH + 60;
        }
      } catch (fetchErr) {
        console.warn(`Failed to fetch signature image: ${fetchErr.message}`);
      }

      if (!signatureEmbedded) {
        const fallbackText =
          lng === "ar" ? "فشل في تحميل التوقيع" : "Signature unavailable";
        page.drawText(lng === "ar" ? reText(fallbackText) : fallbackText, {
          x: margin + 40,
          y: y,
          size: 12,
          font,
          color: colors.textColor,
        });
        y -= 30;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (e) {
    console.log(e, "error in pdf generator");
    throw new Error(e.message);
  }
}
export async function approveSession({ token, clientLeadId, id, pdfUrl }) {
  // Clear previous selected images and add new ones
  await prisma.clientImageSession.update({
    where: { id: Number(id) },
    data: {
      sessionStatus: "SUBMITTED",
      pdfUrl: pdfUrl,
    },
  });
  await sendSuccessEmailAfterSessionDone({ token, clientLeadId, pdfUrl });
  return true;
}

export async function sendSuccessEmailAfterSessionDone({
  token,
  clientLeadId,
  pdfUrl,
}) {
  const clientLead = await prisma.clientLead.findUnique({
    where: {
      id: Number(clientLeadId),
    },
    select: {
      client: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
  const adminUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        {
          role: {
            in: ["ADMIN", "SUPER_ADMIN"],
          },
        },
        {
          subRoles: {
            some: {
              subRole: {
                in: ["ADMIN", "SUPER_ADMIN"],
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      email: true,
    },
  });
  const staffs = [...adminUsers, clientLead.assignedTo];
  try {
    await sendEmailToClient({
      clientName: clientLead.client.name,
      clientEmail: clientLead.client.email,
      pdfUrl,
      token,
    });
  } catch (e) {
    console.log(e, "error in generating email for client");
  }
  try {
    await sendEmailForStaff({
      clientLeadId: clientLeadId,
      clientName: clientLead.client.name,
      pdfDownloadUrl: pdfUrl,
      staffs,
      token: token,
    });
  } catch (e) {
    console.log(e, "error in generating email for staff");
  }
}

export async function ensureLanguagesExist() {
  const existingLanguages = await prisma.language.findMany();

  if (existingLanguages.length === 0) {
    await prisma.language.createMany({
      data: [
        { code: "en", name: "English" },
        { code: "ar", name: "العربية" },
      ],
    });
  }
}

export async function getLanguages({ notArchived }) {
  await ensureLanguagesExist();
  const where = {};
  if (notArchived) {
    where.isArchived = false;
  }

  return await prisma.language.findMany({
    where,
  });
}
