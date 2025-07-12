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
import { uploadToFTPHttpAsBuffer } from "./utility.js";
import { sendEmailForStaff, sendEmailToClient } from "./emailTemplates.js";
import sharp from "sharp";
const __filename = fileURLToPath(import.meta.url);
import "dayjs/locale/ar.js";
import "dayjs/locale/en.js";
const __dirname = path.dirname(__filename);
const fontPath = path.join(__dirname, "../fonts/Ya-ModernPro-Bold.otf");
const fontBase64 = fs.readFileSync(fontPath);
const fontBoldPath = path.join(__dirname, "../fonts/Ya-ModernPro-Bold.otf");
const fontBoldBase64 = fs.readFileSync(fontBoldPath);

const enfontPath = path.join(__dirname, "../fonts/NotoSansArabic-Regular.ttf");
const enfontBase64 = fs.readFileSync(enfontPath);
const enfontBoldPath = path.join(__dirname, "../fonts/NotoSansArabic-Bold.ttf");
const enfontBoldBase64 = fs.readFileSync(enfontBoldPath);
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

    await uploadToFTPHttpAsBuffer(pdfBytes, remotePath, true);

    const publicUrl = `https://panel.dreamstudiio.com/uploads/${fileName}`;
    await approveSession({
      token: sessionData.token,
      clientLeadId: sessionData.clientLeadId,
      id: Number(sessionData.id),
      pdfUrl: publicUrl,
    });
    // await approveSession({
    //   token: sessionData.token,
    //   clientLeadId: sessionData.clientLeadId,
    //   id: Number(sessionData.id),
    //   pdfUrl: publicUrl,
    // });
  } catch (e) {
    console.log("e in uploadig pdf", e);
    throw new Error(e.message);
  }
}

async function compressImageBuffer(buffer) {
  const sharpImage = sharp(buffer);
  const metadata = await sharpImage.metadata();

  // Resize logic
  sharpImage.resize({ width: 1000 });

  // Handle format appropriately
  if (metadata.format === "jpeg" || metadata.format === "jpg") {
    return await sharpImage.jpeg({ quality: 90 }).toBuffer();
  } else if (metadata.format === "png") {
    return await sharpImage.png({ compressionLevel: 6 }).toBuffer();
  } else {
    return await sharpImage.jpeg({ quality: 90 }).toBuffer();
  }
}

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

      return await compressImageBuffer(await res.arrayBuffer());
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

    const arFont = await pdfDoc.embedFont(fontBase64);
    const arBoldFont = await pdfDoc.embedFont(fontBoldBase64);
    const enFont = await pdfDoc.embedFont(enfontBase64);
    const enBoldFont = await pdfDoc.embedFont(enfontBoldBase64);
    function mainFont() {
      return lng === "ar" ? arFont : enFont;
    }
    function mainBoldFont() {
      return lng === "ar" ? arBoldFont : enBoldFont;
    }

    const font = mainFont();
    const boldFont = mainBoldFont();
    const isArabicText = (text) => {
      return /[\u0600-\u06FF]/.test(text);
    };
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
    const footerHeight = 60;
    const borderWidth = 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - headerHeight - margin;

    const reText = (text) => {
      const reshaped = reshaper.ArabicShaper.convertArabic(text);
      const clean = reshaped
        .replace(/\r?\n|\r/g, " ") // Replace line breaks with spaces
        .replace(/\u200B/g, "") // Remove zero-width spaces
        .replace(/\u200E/g, "") // Remove left-to-right marks
        .replace(/\u200F/g, "") // Remove right-to-left marks
        .replace(/\u00A0/g, " ") // Replace non-breaking spaces
        .replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
        .trim();
      return clean;
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

    // Draw page border and frame
    const drawPageBorder = (isWide = false) => {
      const width = page.getWidth();
      const height = page.getHeight();
      const contentWidth = width - margin * 2;
      const borderTopY = margin + headerHeight;

      // Outer border frame
      page.drawRectangle({
        x: margin - borderWidth,
        y: margin - borderWidth,
        width: contentWidth + borderWidth * 2,
        height: height - borderTopY - margin + borderWidth * 2,
        borderColor: colors.borderColor,
        borderWidth: borderWidth,
        color: undefined,
      });

      // Inner shadow frame
      page.drawRectangle({
        x: margin,
        y: margin,
        width: contentWidth,
        height: height - borderTopY - margin,
        borderColor: colors.shadowColor,
        borderWidth: 1,
        color: undefined,
      });
    };

    const drawFixedHeader = async (isWide = false) => {
      const width = page.getWidth();

      try {
        const headerImageBuffer = await fetchImageBuffer(
          "https://dreamstudiio.com/pdf-banner.jpg"
        );
        const headerImage = await pdfDoc.embedJpg(headerImageBuffer);
        const metadata = await sharp(headerImageBuffer).metadata();

        const imageAspectRatio = (metadata.width || 1) / (metadata.height || 1);

        const maxHeaderWidth = width - margin * 2;
        const maxHeaderHeight = headerHeight;

        let scaledWidth, scaledHeight;

        if (imageAspectRatio > maxHeaderWidth / maxHeaderHeight) {
          scaledWidth = maxHeaderWidth;
          scaledHeight = scaledWidth / imageAspectRatio;
        } else {
          scaledHeight = maxHeaderHeight;
          scaledWidth = scaledHeight * imageAspectRatio;
        }

        const x = (width - scaledWidth) / 2;
        const y = page.getHeight() - scaledHeight - 10;

        page.drawImage(headerImage, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      } catch (err) {
        console.warn("Header image load error:", err.message);
      }
    };

    // Draw fixed footerf
    const drawFixedFooter = (
      isWide = false,
      currentPageIndex = 0,
      totalPages = 1
    ) => {
      const pageW = page.getWidth();
      const pageH = page.getHeight();
      const contentWidth = pageW - margin * 2;

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

      // Footer separator line
      page.drawLine({
        start: { x: margin, y: margin + footerHeight },
        end: { x: margin + contentWidth, y: margin + footerHeight },
        thickness: 2,
        color: colors.primary,
      });

      // Prepare footer texts
      const generatedLabel = "Generated:";
      dayjs.locale("en");
      const currentDate = dayjs().locale("en").format("MMMM D, YYYY");
      const dateText = `${generatedLabel} ${currentDate}`;

      const pageNumberTextRaw =
        lng === "ar"
          ? `الصفحة ${currentPageIndex + 1} من ${totalPages}`
          : `Page ${currentPageIndex + 1} of ${totalPages}`;

      const pageNumberText =
        lng === "ar" ? reText(pageNumberTextRaw) : pageNumberTextRaw;

      const fontSize = 10;
      const dateTextWidth = enFont.widthOfTextAtSize(dateText, fontSize);
      const pageNumberWidth = font.widthOfTextAtSize(pageNumberText, fontSize);

      const textY = margin + (footerHeight - fontSize) / 2;

      if (lng === "ar") {
        // Arabic: Date on right, Page number on left
        page.drawText(dateText, {
          x: margin + contentWidth - dateTextWidth - 10,
          y: textY,
          size: fontSize,
          font: enFont,
          color: colors.textColor,
        });

        page.drawText(pageNumberText, {
          x: margin + 10,
          y: textY,
          size: fontSize,
          font,
          color: colors.textColor,
        });
      } else {
        // English: Date on left, Page number on right
        page.drawText(dateText, {
          x: margin + 10,
          y: textY,
          size: fontSize,
          font,
          color: colors.textColor,
        });

        page.drawText(pageNumberText, {
          x: margin + contentWidth - pageNumberWidth - 10,
          y: textY,
          size: fontSize,
          font,
          color: colors.textColor,
        });
      }
    };

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
      const isArabic = isArabicText(titleText);

      const fontSize = 20;
      const maxTextWidth = pageWidth * 0.8;
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
      let textY = pageHeight * 0.6 + totalTextHeight / 2; // a little above middle

      // Draw each line centered
      for (const line of lines) {
        const lineWidth = isArabic
          ? arBoldFont.widthOfTextAtSize(line, fontSize)
          : enBoldFont.widthOfTextAtSize(line, fontSize);
        const textX = (pageWidth - lineWidth) / 2;

        const renderedLine = isArabic ? reText(line) : line;

        page.drawText(renderedLine, {
          x: textX,
          y: textY,
          size: fontSize,
          font: isArabic ? arBoldFont : enBoldFont,
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
      circleSize = 32
    ) => {
      if (!customColors || !Array.isArray(customColors)) return startY;

      const spacing = 50;
      let currentX = startX;
      let currentY = startY;
      const maxWidth = contentWidth - 40;

      customColors.forEach((color, index) => {
        if (currentX + circleSize > startX + maxWidth) {
          currentX = startX;
          currentY -= spacing + 20;
        }

        const { r, g, b } = hexToRgbNormalized(color);

        // Draw shadow
        page.drawCircle({
          x: currentX + circleSize / 2 + 3,
          y: currentY - circleSize / 2 - 3,
          size: circleSize / 2 + 2,
          color: rgb(0.8, 0.8, 0.8),
        });

        // Draw white background circle for better contrast
        page.drawCircle({
          x: currentX + circleSize / 2,
          y: currentY - circleSize / 2,
          size: circleSize / 2 + 3,
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

      return currentY - circleSize - 20;
    };

    // Enhanced material renderer with image and overlay
    const drawMaterialItem = async (
      materialRelation,
      index,
      totalMaterials,
      { x, y, width, height }
    ) => {
      const materialData = materialRelation.material;
      const materialName =
        getTextByLanguage(materialData.title, lng) ||
        materialData.name ||
        "Material";

      const cardX = x;
      const cardY = y;
      const cardWidth = width;
      const cardHeight = height;

      // Draw shadow
      page.drawRectangle({
        x: cardX + 4,
        y: cardY - 4,
        width: cardWidth,
        height: cardHeight,
        color: colors.shadowColor,
        xRounded: 15,
        yRounded: 15,
      });

      // Draw card background
      page.drawRectangle({
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        color: colors.white,
        borderColor: colors.borderColor,
        borderWidth: 2,
        xRounded: 15,
        yRounded: 15,
      });

      // Try to draw material image
      const imageWidth = width * 0.9;
      const imageHeight = height * 0.8;
      const imageX = x + (width - imageWidth) / 2;
      const imageY = y + (height - imageHeight) / 2;

      let imageEmbedded = false;
      let dontdrawTitle = false;
      const image =
        materialData.imageUrl || materialData.template.backgroundImage;
      if (image) {
        try {
          const imgBytes = await fetchImageBuffer(image);
          let img;
          try {
            img = await pdfDoc.embedPng(imgBytes);
            imageEmbedded = true;
          } catch {
            img = await pdfDoc.embedJpg(imgBytes);
            imageEmbedded = true;
          }

          if (imageEmbedded) {
            // Draw image background

            page.drawRectangle({
              x: imageX - 2,
              y: imageY - 2,
              width: imageWidth + 4,
              height: imageHeight + 4,
              color: colors.lightGray,
              xRounded: 10,
              yRounded: 10,
            });

            page.drawImage(img, {
              x: imageX,
              y: imageY,
              width: imageWidth,
              height: imageHeight,
            });

            // Draw overlay gradient effect
            page.drawRectangle({
              x: imageX,
              y: imageY,
              width: imageWidth,
              height: 30,
              color: rgb(0, 0, 0, 0.6),
              xRounded: 10,
              yRounded: 10,
            });
            const titleSize = 14;
            const paddingFromBottom = 10; // adjust if needed
            const titleY = imageY + paddingFromBottom; // ⬅️ from bottom
            const titleX =
              lng === "ar"
                ? getRTLTextX(
                    materialName,
                    titleSize,
                    boldFont,
                    imageX + 10,
                    imageWidth - 20
                  )
                : imageX + 10;

            page.drawText(lng === "ar" ? reText(materialName) : materialName, {
              x: titleX,
              y: titleY,
              size: titleSize,
              font: boldFont,
              color: rgb(1, 1, 1),
              maxWidth: imageWidth - 20,
            });
            dontdrawTitle = true;
          }
        } catch (err) {
          console.warn(`Failed to embed material image: ${err.message}`);
        }
      }
      // Draw material title
      if (!dontdrawTitle) {
        const titleSize = 14;
        const titleY = cardY + cardHeight - 30;
        const textStartX =
          lng === "ar"
            ? imageEmbedded
              ? cardX + 15
              : cardX + 20
            : imageEmbedded
            ? cardX + imageWidth + 30
            : cardX + 20;
        const textWidth = cardWidth - (imageEmbedded ? imageWidth + 60 : 40);

        const titleX =
          lng === "ar"
            ? getRTLTextX(
                materialName,
                titleSize,
                boldFont,
                textStartX,
                textWidth
              )
            : textStartX;

        page.drawText(lng === "ar" ? reText(materialName) : materialName, {
          x: titleX,
          y: titleY,
          size: titleSize,
          font: boldFont,
          color: colors.heading,
        });
      }
    };

    // Enhanced style renderer with image and overlay
    const drawStyleItem = async (styleData) => {
      const styleName = getTextByLanguage(styleData[0].title, lng) || "Style";

      const cardHeight = 300;
      const cardWidth = contentWidth - 40;
      const cardX = margin + 20;
      const cardY = y - cardHeight;

      // Draw shadow
      page.drawRectangle({
        x: cardX + 4,
        y: cardY - 4,
        width: cardWidth,
        height: cardHeight,
        color: colors.shadowColor,
        xRounded: 15,
        yRounded: 15,
      });

      // Draw card background
      page.drawRectangle({
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        color: colors.white,
        borderColor: colors.primary,
        borderWidth: 2,
        xRounded: 15,
        yRounded: 15,
      });

      // Try to draw style image
      const imageWidth = contentWidth - 200;
      const imageHeight = 270;
      const imageX =
        lng === "ar" ? cardX + cardWidth - imageWidth - 15 : cardX + 15;
      const imageY = cardY + 15;
      let imageEmbedded = false;
      let dontdrawTitle = false;
      const image =
        styleData[0].imageUrl || styleData[0].template.backgroundImage;
      if (image) {
        try {
          const imgBytes = await fetchImageBuffer(image);
          let img;
          try {
            img = await pdfDoc.embedPng(imgBytes);
            imageEmbedded = true;
          } catch {
            img = await pdfDoc.embedJpg(imgBytes);
            imageEmbedded = true;
          }

          if (imageEmbedded) {
            // Draw image background
            page.drawRectangle({
              x: imageX - 2,
              y: imageY - 2,
              width: imageWidth + 4,
              height: imageHeight + 4,
              color: colors.lightGray,
              xRounded: 12,
              yRounded: 12,
            });

            page.drawImage(img, {
              x: imageX,
              y: imageY,
              width: imageWidth,
              height: imageHeight,
            });

            // Draw overlay gradient effect
            page.drawRectangle({
              x: imageX,
              y: imageY,
              width: imageWidth,
              height: 35,
              color: rgb(0, 0, 0, 0.6),
              xRounded: 12,
              yRounded: 12,
            });
            const titleSize = 14;
            const paddingFromBottom = 10; // adjust if needed
            const titleY = imageY + paddingFromBottom; // ⬅️ from bottom
            const titleX =
              lng === "ar"
                ? getRTLTextX(
                    styleName,
                    titleSize,
                    boldFont,
                    imageX + 10,
                    imageWidth - 20
                  )
                : imageX + 10;

            page.drawText(lng === "ar" ? reText(styleName) : styleName, {
              x: titleX,
              y: titleY,
              size: titleSize,
              font: boldFont,
              color: rgb(1, 1, 1), // white text
              maxWidth: imageWidth - 20,
            });
            dontdrawTitle = true;
          }
        } catch (err) {
          console.warn(`Failed to embed style image: ${err.message}`);
        }
      }

      // Draw style title
      if (!dontdrawTitle) {
        const titleSize = 16;
        const titleY = cardY + cardHeight - 30;
        const textStartX =
          lng === "ar"
            ? imageEmbedded
              ? cardX + 15
              : cardX + 20
            : imageEmbedded
            ? cardX + imageWidth + 30
            : cardX + 20;
        const textWidth = cardWidth - (imageEmbedded ? imageWidth + 60 : 40);

        const titleX =
          lng === "ar"
            ? getRTLTextX(styleName, titleSize, boldFont, textStartX, textWidth)
            : textStartX;

        page.drawText(lng === "ar" ? reText(styleName) : styleName, {
          x: titleX,
          y: titleY,
          size: titleSize,
          font: boldFont,
          color: colors.heading,
        });
      }
      y -= cardHeight - 15;
    };

    const checkNewPage = async (requiredSpace = 50) => {
      const availableSpace = y - margin - footerHeight;
      if (availableSpace < requiredSpace) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageBorder();
        await drawFixedHeader();
        // drawFixedFooter();
        y = pageHeight - headerHeight - margin - 20;
        return true;
      }
      return false;
    };
    const drawMaterialGridItems = async (materials, columns = 2) => {
      const itemSpacing = 10;
      const itemWidth =
        (contentWidth - itemSpacing * (columns - 1)) / columns - 20;
      const itemHeight = 200;
      const itemsPerRow = columns;

      const rowHeight = itemHeight + itemSpacing;
      let itemsDrawn = 0;

      while (itemsDrawn < materials.length) {
        // Count how many rows can fit on the current page
        const availableRows = Math.floor(
          (y - margin - footerHeight - 40) / rowHeight
        );
        const rowsThisPage = Math.min(
          availableRows,
          Math.ceil((materials.length - itemsDrawn) / itemsPerRow)
        );

        const itemsThisPage = rowsThisPage * itemsPerRow;
        const gridHeight = rowsThisPage * rowHeight - itemSpacing;

        const gridX = margin + 20;
        const gridY = y - gridHeight;

        // Draw outer grid frame
        page.drawRectangle({
          x: gridX - 10,
          y: gridY - 10,
          width: contentWidth - 20,
          height: gridHeight + 20,
          borderColor: colors.borderColor,
          color: colors.white,
          xRounded: 12,
          yRounded: 12,
        });

        for (
          let i = 0;
          i < itemsThisPage && itemsDrawn < materials.length;
          i++
        ) {
          const index = itemsDrawn;
          const col = i % itemsPerRow;
          const row = Math.floor(i / itemsPerRow);

          const itemX = gridX + col * (itemWidth + itemSpacing);
          const itemY = y - row * rowHeight;

          await drawMaterialItem(materials[index], index, materials.length, {
            x: itemX,
            y: itemY - itemHeight,
            width: itemWidth,
            height: itemHeight,
          });

          itemsDrawn++;
        }

        y -= gridHeight + 40;

        if (itemsDrawn < materials.length) {
          await checkNewPage(200); // force new page for next chunk
        }
      }
    };

    // Enhanced section drawing with modern design
    const drawSection = async (
      title,
      items,
      itemRenderer,
      isGridSection = false
    ) => {
      await checkNewPage(100);

      const sectionHeight = 50;
      const borderRadius = 15;

      // Section Header with modern gradient-like effect
      page.drawRectangle({
        x: margin + 20 + 3,
        y: y - sectionHeight - 3,
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
        borderColor: colors.primary,
        borderWidth: 2,
        xRounded: borderRadius,
        yRounded: borderRadius,
      });

      // Draw accent line
      page.drawRectangle({
        x: margin + 25,
        y: y - sectionHeight + 5,
        width: 4,
        height: sectionHeight - 10,
        color: colors.primary,
        xRounded: 2,
        yRounded: 2,
      });

      const fontSize = 18;
      const titleY = y - sectionHeight / 2 - fontSize / 2 + 4;
      const textStartX = margin + 40;
      const textWidth = contentWidth - 80;

      const textX =
        lng === "ar"
          ? getRTLTextX(title, fontSize, boldFont, textStartX, textWidth)
          : textStartX;

      const processedTitle = lng === "ar" ? reText(title) : title;

      page.drawText(processedTitle, {
        x: textX,
        y: titleY,
        size: fontSize,
        font: boldFont,
        color: colors.heading,
      });

      y -= sectionHeight + 25;

      if (items && items.length > 0) {
        if (isGridSection) {
          await itemRenderer(items);
        } else {
          for (let i = 0; i < items.length; i++) {
            await checkNewPage(150);
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
    await drawFixedHeader();
    // drawFixedFooter();
    y = pageHeight - headerHeight - margin - 20;

    // Draw style
    if (sessionData.style) {
      await drawSection(
        lng === "ar" ? reText("نمط التصميم") : "Design Style",
        [sessionData.style],
        async (style) => {
          await checkNewPage(160);
          await drawStyleItem(style);
        },
        true
      );
    }
    if (
      sessionData.customColors &&
      Array.isArray(sessionData.customColors) &&
      sessionData.customColors.length > 0
    ) {
      await drawSection(
        lng === "ar" ? reText("الألوان المخصصة") : "Custom Colors",
        sessionData.customColors,
        async (customColors) => {
          await checkNewPage(80);
          const startX = lng === "ar" ? margin + 40 : margin + 40;
          const newY = drawCustomColors(customColors, startX, y + 10);
          y = newY;
        },
        true
      );
    }

    page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageBorder();
    await drawFixedHeader();
    // drawFixedFooter();
    y = pageHeight - headerHeight - margin - 20;

    // Draw materials
    if (sessionData.materials && sessionData.materials.length > 0) {
      await drawSection(
        lng === "ar" ? reText("الخامات المحددة") : "Selected Materials",
        sessionData.materials,
        drawMaterialGridItems,
        true
      );
    }

    // Keep selectedImages section unchanged
    if (sessionData.selectedImages && sessionData.selectedImages.length > 0) {
      for (const image of sessionData.selectedImages) {
        const imageUrl = image.designImage?.imageUrl;
        if (!imageUrl) continue;

        try {
          const imgBytes = await fetchImageBuffer(imageUrl);
          const sharpInstance = sharp(imgBytes);
          const metadata = await sharpInstance.metadata();

          const imgWidth = metadata.width || 1;
          const imgHeight = metadata.height || 1;
          const aspectRatio = imgWidth / imgHeight;

          const isWide = aspectRatio > 1.3;
          const pageSize = isWide
            ? [pageHeight, pageWidth]
            : [pageWidth, pageHeight];

          page = pdfDoc.addPage(pageSize);

          drawPageBorder(isWide);
          await drawFixedHeader(isWide);
          // drawFixedFooter(isWide); // if needed, update drawFixedFooter too
          let img;
          try {
            img = await pdfDoc.embedPng(imgBytes);
          } catch {
            img = await pdfDoc.embedJpg(imgBytes);
          }

          if (img) {
            const pageW = page.getWidth();
            const pageH = page.getHeight();

            const frameX = margin;
            const frameY = margin + footerHeight;
            const frameWidth = pageW - margin * 2;
            const frameHeight =
              pageH - headerHeight - footerHeight - margin * 2;
            // Calculate scale to fit within frame while preserving aspect ratio
            const imgDims = img.scale(1); // get original size
            const imageAspectRatio = imgDims.width / imgDims.height;
            const frameAspectRatio = frameWidth / frameHeight;

            let scaledWidth, scaledHeight;

            if (imageAspectRatio > frameAspectRatio) {
              // Image is wider than frame — limit by width
              scaledWidth = frameWidth;
              scaledHeight = frameWidth / imageAspectRatio;
            } else {
              // Image is taller — limit by height
              scaledHeight = frameHeight;
              scaledWidth = frameHeight * imageAspectRatio;
            }

            // Center the image inside the frame
            const x = frameX + (frameWidth - scaledWidth) / 2;
            const y = frameY + (frameHeight - scaledHeight) / 2;

            page.drawImage(img, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });
          }
        } catch (err) {
          console.warn(`Failed to embed selected image: ${err.message}`);
        }
      }
    }

    if (signatureUrl) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawPageBorder();
      await drawFixedHeader();
      // drawFixedFooter();

      const columnGap = 40;
      const columnWidth = (contentWidth - columnGap) / 2;
      const leftX = margin;
      const rightX = margin + columnWidth + columnGap;
      const topY = pageHeight - headerHeight - margin - 30;

      const isArabic = lng === "ar";
      const firstPartyTitle = isArabic ? reText("الطرف الأول") : "First Party";
      const secondPartyTitle = isArabic
        ? reText("الطرف الثاني")
        : "Second Party";
      const directorLabel = isArabic
        ? reText("المدير التنفيذي: راشد ابو عوده")
        : "Executive Director: Rashid Abu Ouda";
      const signatureLabel = isArabic ? reText("التوقيع:") : "Signature:";
      const nameLabel = isArabic ? reText("الاسم:") : "Name:";
      const stampImageUrl = "https://dreamstudiio.com/dream-signature.jpg";
      const isArabicName = isArabicText(name);

      const clientName = isArabicName ? reText(name) : name;
      const labelFontSize = 12;
      const imageMarginTop = 4;

      // ==== الطرف الأول (Left Column) ====
      let leftY = topY;

      const getTextX = (text, size, fontUsed, baseX) =>
        isArabic
          ? getRTLTextX(text, size, fontUsed, baseX, columnWidth)
          : baseX;

      const drawLeftText = (text, size = labelFontSize, bold = false) => {
        const fontUsed = bold ? boldFont : font;
        const tx = getTextX(text, size, fontUsed, leftX);
        page.drawText(text, {
          x: tx,
          y: leftY,
          size,
          font: fontUsed,
          color: colors.textColor,
        });
        leftY -= size + 6;
      };

      drawLeftText(firstPartyTitle, 14, true);
      drawLeftText(directorLabel);

      // ختم
      try {
        const stampBytes = await fetchImageBuffer(stampImageUrl);
        let stampImage;
        try {
          stampImage = await pdfDoc.embedPng(stampBytes);
        } catch {
          stampImage = await pdfDoc.embedJpg(stampBytes);
        }

        if (stampImage) {
          const stampScale = 0.2;
          const { width: sw0, height: sh0 } = stampImage.size();
          const sw = sw0 * stampScale;
          const sh = sh0 * stampScale;
          const stampX = isArabic ? leftX + columnWidth - sw : leftX;
          const stampY = leftY - sh - 10;
          page.drawImage(stampImage, {
            x: stampX,
            y: stampY,
            width: sw,
            height: sh,
          });
          leftY = stampY - 20;
        }
      } catch (err) {
        console.warn("Failed to load stamp image:", err.message);
      }

      // ==== الطرف الثاني (Right Column) ====
      let rightY = topY;

      const drawRightText = (
        text,
        x,
        y,
        fontUsed = font,
        size = labelFontSize
      ) => {
        page.drawText(text, {
          x,
          y,
          size,
          font: fontUsed,
          color: colors.textColor,
        });
      };

      const secondTitleX = isArabic
        ? getRTLTextX(secondPartyTitle, 14, boldFont, rightX, columnWidth)
        : rightX;

      drawRightText(secondPartyTitle, secondTitleX, rightY, boldFont, 14);
      rightY -= 14 + 8;

      // الاسم + اسم العميل

      const nameText = `${nameLabel} ${clientName}`;
      const nameTextX = isArabic
        ? getRTLTextX(nameText, labelFontSize, font, rightX, columnWidth)
        : rightX;
      page.drawText(nameText, {
        x: nameTextX,
        y: rightY,
        size: labelFontSize,
        font,
        color: colors.textColor,
      });
      rightY -= labelFontSize + 10;

      const sigLabelWidth = font.widthOfTextAtSize(
        signatureLabel,
        labelFontSize
      );

      try {
        const sigBytes = await fetchImageBuffer(signatureUrl);
        let sigImage;
        try {
          sigImage = await pdfDoc.embedPng(sigBytes);
        } catch {
          sigImage = await pdfDoc.embedJpg(sigBytes);
        }

        if (sigImage) {
          const maxW = 200;
          const maxH = 150;
          let { width: sw, height: sh } = sigImage.size();
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

          const sigX = isArabic
            ? rightX + columnWidth - sigLabelWidth - sigW - 10
            : rightX + sigLabelWidth + 10;

          const sigY = rightY - sigH - imageMarginTop;

          // Draw label
          drawRightText(
            signatureLabel,
            isArabic ? sigX + sigW + 5 : rightX,
            sigY + sigH / 2 - 6
          );

          // Draw image
          page.drawImage(sigImage, {
            x: sigX,
            y: sigY,
            width: sigW,
            height: sigH,
          });

          rightY = sigY - 10;
        }
      } catch (err) {
        console.warn("Failed to load client signature:", err.message);
      }
    }

    const totalPages = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();

    for (let i = 0; i < totalPages; i++) {
      if (i === 0) continue;
      page = pages[i]; // update `page` reference
      const isWide = page.getWidth() > page.getHeight();
      drawFixedFooter(isWide, i, totalPages);
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
