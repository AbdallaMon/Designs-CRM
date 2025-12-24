import { PDFDocument, rgb } from "pdf-lib";
import prisma from "../../../prisma/prisma.js";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import * as fontkit from "fontkit";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "url";
import reshaper from "arabic-persian-reshaper";
import { uploadToFTPHttpAsBuffer } from "../utility/utility.js";
import {
  sendEmailForStaff,
  sendEmailToClient,
} from "../email/emailTemplates.js";
import sharp from "sharp";
const __filename = fileURLToPath(import.meta.url);
import "dayjs/locale/ar.js";
import "dayjs/locale/en.js";
import { notifyUsersThatAClientHasSubmittedAPdf } from "../../telegram/telegram-functions.js";
import {
  fetchImageBuffer,
  getRTLTextX,
  isArabicText,
  reText,
  splitTextIntoLines,
} from "../../utilityServices.js";
const __dirname = path.dirname(__filename);
const fontPath = path.join(__dirname, "../../fonts/Ya-ModernPro-Bold.otf");
const fontBase64 = fs.readFileSync(fontPath);
const fontBoldPath = path.join(__dirname, "../../fonts/Ya-ModernPro-Bold.otf");
const fontBoldBase64 = fs.readFileSync(fontBoldPath);

const enfontPath = path.join(
  __dirname,
  "../../fonts/NotoSansArabic-Regular.ttf"
);
const enfontBase64 = fs.readFileSync(enfontPath);
const enfontBoldPath = path.join(
  __dirname,
  "../../fonts/NotoSansArabic-Bold.ttf"
);
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

    const publicUrl = `/uploads/${fileName}`;
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
    // const isArabicText = (text) => {
    //   return /[\u0600-\u06FF]/.test(text);
    // };
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
      red: rgb(1, 0, 0),
    };

    // Page dimensions and margins
    const pageWidth = 600;
    const pageHeight = 800;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 75;
    const footerHeight = 55;
    const borderWidth = 2;
    let marginY = 20;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - headerHeight;

    // const reText = (text) => {
    //   const reshaped = reshaper.ArabicShaper.convertArabic(text);
    //   const clean = reshaped
    //     .replace(/\r?\n|\r/g, " ") // Replace line breaks with spaces
    //     .replace(/\u200B/g, "") // Remove zero-width spaces
    //     .replace(/\u200E/g, "") // Remove left-to-right marks
    //     .replace(/\u200F/g, "") // Remove right-to-left marks
    //     .replace(/\u00A0/g, " ") // Replace non-breaking spaces
    //     .replace(/\s{2,}/g, " ")
    //     .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "")
    //     .trim();
    //   return clean;
    // };
    function getLines(textToLine, maxCharsPerLine, maxChars, maxLines) {
      const text = maxChars
        ? textToLine.trim().slice(0, maxChars)
        : textToLine.trim();
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";

      for (const word of words) {
        if ((line + " " + word).trim().length > maxCharsPerLine) {
          lines.push(line.trim());
          line = word;
        } else {
          line += " " + word;
        }
      }

      if (line) lines.push(line.trim());
      return maxLines ? lines.slice(0, maxLines) : lines;
    }
    // Helper function to get text by language
    const getTextByLanguage = (textArray, languageCode) => {
      if (!textArray || !Array.isArray(textArray)) return "";
      const textItem = textArray.find(
        (item) => item.language?.code === languageCode
      );
      return textItem?.text || "";
    };

    // Helper function to calculate RTL text position
    // const getRTLTextX = (
    //   text,
    //   fontSize,
    //   font,
    //   containerStartX = margin,
    //   containerWidth = contentWidth
    // ) => {
    //   const textWidth = font.widthOfTextAtSize(text, fontSize);
    //   return containerStartX + containerWidth - textWidth;
    // };

    // Draw page border and frame
    const drawPageBorder = (isWide = false) => {
      const width = page.getWidth();
      const height = page.getHeight();
      const contentWidth = width - margin * 2;
      const borderTopY = marginY + headerHeight;

      // Outer border frame
      page.drawRectangle({
        x: margin - borderWidth,
        y: marginY - borderWidth,
        width: contentWidth + borderWidth * 2,
        height: height - borderTopY - marginY + borderWidth * 2,
        borderColor: colors.borderColor,
        borderWidth: borderWidth,
        color: undefined,
      });

      // Inner shadow frame
      page.drawRectangle({
        x: margin,
        y: marginY,
        width: contentWidth,
        height: height - borderTopY - marginY,
        borderColor: colors.shadowColor,
        borderWidth: 1,
        color: undefined,
      });
    };

    const drawFixedHeader = async (isWide = false) => {
      const widePageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const headerImageWidth = contentWidth;

      const contentX = (page.getWidth() - headerImageWidth) / 2;
      const headerY = pageHeight - headerHeight;

      try {
        const headerImageBuffer = await fetchImageBuffer(
          "https://dreamstudiio.com/pdf-banner.jpg"
        );
        const headerImage = await pdfDoc.embedJpg(headerImageBuffer);

        // Just stretch the image to fit the border area exactly
        page.drawImage(headerImage, {
          x: contentX,
          y: headerY + 10 - marginY + 2,
          width: contentWidth,
          height: headerHeight + marginY - 20 - 2,
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
      const contentWidth = pageW - margin * 2;

      // Footer background
      page.drawRectangle({
        x: margin,
        y: marginY,
        width: contentWidth,
        height: footerHeight,
        color: colors.accentBg,
        borderColor: colors.borderColor,
        borderWidth: 1,
      });

      // Footer separator line
      page.drawLine({
        start: { x: margin, y: marginY + footerHeight },
        end: { x: margin + contentWidth, y: marginY + footerHeight },
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

      const textY = marginY + (footerHeight - fontSize) / 2;

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
    // function splitTextIntoLines(text, maxWidth, font, fontSize) {
    //   const words = text.split(" ");
    //   const lines = [];
    //   let currentLine = "";

    //   for (const word of words) {
    //     const testLine = currentLine ? currentLine + " " + word : word;
    //     const width = font.widthOfTextAtSize(testLine, fontSize);
    //     if (width <= maxWidth) {
    //       currentLine = testLine;
    //     } else {
    //       if (currentLine) lines.push(currentLine);
    //       currentLine = word;
    //     }
    //   }
    //   if (currentLine) lines.push(currentLine);
    //   return lines;
    // }

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
      const maxTextWidth = pageWidth * 0.4;
      const lineHeight = fontSize + 6;

      // Split text into wrapped lines
      const lines = splitTextIntoLines(
        titleText,
        maxTextWidth,
        isArabic ? arBoldFont : enBoldFont,
        fontSize
      );

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
          color: colors.primary,
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

      const imageMaxWidth = contentWidth - 200;
      const imageMaxHeight = 270;
      const imageY = cardY + 15;
      let imageEmbedded = false;
      let dontdrawTitle = false;

      const imageUrl =
        styleData[0].imageUrl || styleData[0].template.backgroundImage;

      if (imageUrl) {
        try {
          const imgBytes = await fetchImageBuffer(imageUrl);
          let img;
          try {
            img = await pdfDoc.embedPng(imgBytes);
          } catch {
            img = await pdfDoc.embedJpg(imgBytes);
          }

          if (img) {
            const imgDims = img.scale(1);
            const aspectRatio = imgDims.width / imgDims.height;

            // Always use fixed height
            const desiredHeight = imageMaxHeight;
            let desiredWidth = desiredHeight * aspectRatio;

            // Clamp width if needed
            if (desiredWidth > imageMaxWidth) {
              desiredWidth = imageMaxWidth;
            }

            const finalHeight = desiredWidth / aspectRatio;

            const imageX =
              lng === "ar" ? cardX + cardWidth - desiredWidth - 15 : cardX + 15;

            // Draw image background
            page.drawRectangle({
              x: imageX - 2,
              y: imageY - 2,
              width: desiredWidth + 4,
              height: finalHeight + 4,
              color: colors.lightGray,
              xRounded: 12,
              yRounded: 12,
            });

            // Draw image
            page.drawImage(img, {
              x: imageX,
              y: imageY,
              width: desiredWidth,
              height: finalHeight,
            });

            // Draw gradient overlay
            page.drawRectangle({
              x: imageX,
              y: imageY,
              width: desiredWidth,
              height: 35,
              color: rgb(0, 0, 0, 0.6),
              xRounded: 12,
              yRounded: 12,
            });

            // Draw title on image
            const titleSize = 14;
            const titleY = imageY + 10;
            const titleX =
              lng === "ar"
                ? getRTLTextX(
                    styleName,
                    titleSize,
                    boldFont,
                    imageX + 10,
                    desiredWidth - 20
                  )
                : imageX + 10;

            page.drawText(lng === "ar" ? reText(styleName) : styleName, {
              x: titleX,
              y: titleY,
              size: titleSize,
              font: boldFont,
              color: rgb(1, 1, 1),
              maxWidth: desiredWidth - 20,
            });

            imageEmbedded = true;
            dontdrawTitle = true;
          }
        } catch (err) {
          console.warn(`Failed to embed style image: ${err.message}`);
        }
      }

      // Draw fallback title outside image if needed
      if (!dontdrawTitle) {
        const titleSize = 16;
        const titleY = cardY + cardHeight - 30;
        const textStartX =
          lng === "ar"
            ? imageEmbedded
              ? cardX + 15
              : cardX + 20
            : imageEmbedded
            ? cardX + imageMaxWidth + 30
            : cardX + 20;

        const textWidth = cardWidth - (imageEmbedded ? imageMaxWidth + 60 : 40);

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
        y = pageHeight - headerHeight - marginY - 20;
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
    y = pageHeight - headerHeight - marginY - 20;

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
          const startX = margin + 40;
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
    y = pageHeight - headerHeight - marginY - 20;

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
            const frameY = marginY + footerHeight;
            const frameWidth = pageW - margin * 2;

            // 🔻 Handle note and reserve space
            let noteText = "";
            let noteLines = [];
            const noteFontSize = 12;
            const lineSpacing = 18;
            const maxCharsPerLine = 90;
            const maxChars = 360;
            if (image.note?.length > 0 && image.note[0].content) {
              noteText = image.note[0].content.trim().slice(0, maxChars);
              noteLines = getLines(noteText, maxCharsPerLine, maxChars, 4);
            }

            const noteHeight = noteLines.length * lineSpacing + 10;
            const availableImageHeight =
              pageH - headerHeight - footerHeight - marginY * 2 - noteHeight;

            // 🔻 Calculate image scaling
            const imgDims = img.scale(1);
            const imageAspectRatio = imgDims.width / imgDims.height;
            const frameAspectRatio = frameWidth / availableImageHeight;

            let scaledWidth, scaledHeight;

            if (imageAspectRatio > frameAspectRatio) {
              scaledWidth = frameWidth;
              scaledHeight = frameWidth / imageAspectRatio;
            } else {
              scaledHeight = availableImageHeight;
              scaledWidth = availableImageHeight * imageAspectRatio;
            }

            // 🔻 Draw image
            const x = frameX + (frameWidth - scaledWidth) / 2;
            const y =
              frameY + noteHeight + (availableImageHeight - scaledHeight) / 2;

            page.drawImage(img, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });

            if (noteLines.length > 0) {
              const isArabic = isArabicText(noteText);
              const fontUsed = isArabic ? arFont : enFont;
              let textY = frameY + lineSpacing * (noteLines.length - 1) + 5;
              for (let line of noteLines) {
                line = isArabic ? reText(line) : line;
                const textX = isArabic
                  ? getRTLTextX(
                      line,
                      noteFontSize,
                      fontUsed,
                      margin,
                      frameWidth
                    )
                  : margin;

                page.drawText(line, {
                  x: textX - (isArabic ? 5 : -5),
                  y: textY,
                  size: noteFontSize,
                  font: fontUsed,
                  color: colors.red,
                });

                textY -= lineSpacing;
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to embed selected image: ${err.message}`);
        }
      }
    }
    async function generateNotePage() {
      if (!sessionData.note || sessionData.note.length === 0) return;

      const noteObj = sessionData.note[0];
      const noteText = noteObj.content?.trim() || "";

      const maxCharsPerLine = 90;
      const maxChars = 360;
      const noteFontSize = 12;
      const lineSpacing = 18;

      const noteLines = getLines(
        noteText.slice(0, maxChars),
        maxCharsPerLine,
        maxChars,
        20
      );
      const noteHeight = noteLines.length * lineSpacing;

      // 🟦 Header text and height (above everything)
      const headerText =
        lng === "ar" ? "ملاحظة عامة من العميل" : "General Note from the client";
      const headerHeight = lineSpacing;

      // 🔹 Check if there's an attachment
      let img;
      let imgDims = null;
      let metadata = null;

      if (noteObj.attachment) {
        try {
          const imgBytes = await fetchImageBuffer(noteObj.attachment);
          const sharpInstance = sharp(imgBytes);
          metadata = await sharpInstance.metadata();

          try {
            img = await pdfDoc.embedPng(imgBytes);
          } catch {
            img = await pdfDoc.embedJpg(imgBytes);
          }
          if (img) {
            imgDims = img.scale(1);
          }
        } catch (err) {
          console.warn(
            `Failed to fetch or embed attachment image: ${err.message}`
          );
        }
      }

      // 🔹 Set up a new full page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawPageBorder();
      await drawFixedHeader();
      y = pageHeight - headerHeight - marginY - 20;

      const frameX = margin;
      const frameY = marginY + footerHeight;
      const frameWidth = page.getWidth() - margin * 2;

      // total text block height
      const totalTextHeight = headerHeight + noteHeight + 10;
      // 🔹 Draw header and note text FIRST (on top)
      const isArabic = isArabicText(headerText);
      const fontUsed = isArabic ? arFont : enFont;

      let textY = y - 50 - noteFontSize / 2 + 4;

      // 🔹 Header
      const headerFontUsed = isArabic ? arFont : enFont;
      const headerX = isArabic
        ? getRTLTextX(
            headerText,
            noteFontSize,
            headerFontUsed,
            margin,
            frameWidth
          )
        : margin;

      page.drawText(headerText, {
        x: headerX + 5,
        y: textY,
        size: noteFontSize,
        font: headerFontUsed,
        color: colors.textColor,
      });

      textY -= lineSpacing;

      // 🔹 Note lines
      const isArabicNote = isArabicText(noteText);
      const notefontUsed = isArabicNote ? arFont : enFont;
      for (let line of noteLines) {
        line = isArabicNote ? reText(line) : line;
        const textX = isArabicNote
          ? getRTLTextX(line, noteFontSize, notefontUsed, margin, frameWidth)
          : margin;

        page.drawText(line, {
          x: textX - (isArabicNote ? 5 : -5),
          y: textY,
          size: noteFontSize,
          font: notefontUsed,
          color: colors.red,
        });

        textY -= lineSpacing;
      }

      if (img && imgDims) {
        const imageAspectRatio = imgDims.width / imgDims.height;
        const availableImageHeight =
          pageHeight -
          headerHeight -
          footerHeight -
          marginY * 2 -
          totalTextHeight;

        const frameAspectRatio = frameWidth / availableImageHeight;

        let scaledWidth, scaledHeight;
        if (imageAspectRatio > frameAspectRatio) {
          scaledWidth = frameWidth;
          scaledHeight = frameWidth / imageAspectRatio;
        } else {
          scaledHeight = availableImageHeight;
          scaledWidth = availableImageHeight * imageAspectRatio;
        }

        const imageY = frameY + (availableImageHeight - scaledHeight) / 2;

        const imageX = frameX + (frameWidth - scaledWidth) / 2;

        page.drawImage(img, {
          x: imageX,
          y: imageY,
          width: scaledWidth,
          height: scaledHeight,
        });
      }
    }
    await generateNotePage();

    // await generateNotePage();
    if (signatureUrl) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawPageBorder();
      await drawFixedHeader();

      const columnGap = 40;
      const columnWidth = (contentWidth - columnGap) / 2;
      const innerMargin = 20;
      const leftX = margin + innerMargin;
      const rightX = pageWidth - margin - columnWidth - innerMargin;
      const topY = pageHeight - headerHeight - marginY - 30;

      const isArabic = lng === "ar";
      const firstPartyTitle = isArabic ? reText("الطرف الأول") : "First Party";
      const secondPartyTitle = isArabic
        ? reText("الطرف الثاني")
        : "Second Party";
      const directorLabelOnly = isArabic
        ? reText("المدير التنفيذي:")
        : "Executive Director:";
      const directorNameOnly = isArabic
        ? reText("راشد بني عودة")
        : "Rashid Abu Ouda";
      const signatureLabel = isArabic ? reText("التوقيع:") : "Signature:";
      const nameLabel = isArabic ? reText("الاسم:") : "Name:";
      const stampImageUrl = "https://dreamstudiio.com/dream-signature.png";

      const isArabicName = isArabicText(name);
      const clientName = isArabicName ? reText(name) : name;
      const labelFontSize = 12;
      const imageMarginTop = 4;

      const getTextX = (text, size, fontUsed, baseX) =>
        isArabic
          ? getRTLTextX(text, size, fontUsed, baseX, columnWidth)
          : baseX;

      // ==== الطرف الأول (Left Column) ====
      let leftY = topY;

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
      drawLeftText(directorLabelOnly);
      drawLeftText(directorNameOnly);

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
      const rightXWithMargin = rightX;

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

      const nameLabelX = isArabic
        ? getRTLTextX(nameLabel, labelFontSize, font, rightX, columnWidth)
        : rightX;
      drawRightText(nameLabel, nameLabelX, rightY);
      rightY -= labelFontSize + 6;

      const nameFont = isArabicText(clientName) ? arFont : enFont;
      const nameLines = splitTextIntoLines(
        clientName,
        columnWidth - 20,
        nameFont,
        labelFontSize
      );

      for (const line of nameLines) {
        const lineX = isArabic
          ? getRTLTextX(line, labelFontSize, nameFont, rightX, columnWidth)
          : rightX;
        drawRightText(line, lineX, rightY, nameFont);
        rightY -= labelFontSize + 4;
      }
      rightY -= 6;

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

          const sigLabelWidth = font.widthOfTextAtSize(
            signatureLabel,
            labelFontSize
          );
          const sigX = isArabic
            ? rightXWithMargin + columnWidth - sigLabelWidth - sigW - 10
            : rightXWithMargin + sigLabelWidth + 10;
          const sigY = rightY - sigH - imageMarginTop;

          drawRightText(
            signatureLabel,
            isArabic ? sigX + sigW + 5 : rightXWithMargin,
            sigY + sigH / 2 - 6
          );

          page.drawImage(sigImage, {
            x: sigX + 10,
            y: sigY - 50,
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
  await notifyUsersThatAClientHasSubmittedAPdf({ clientLeadId: clientLeadId });
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
