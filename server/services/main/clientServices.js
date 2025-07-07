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
    const pdfBytes = await generateImageSessionPdf({
      sessionData,
      signatureUrl,
      lng,
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
}) {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Embed fonts
    const font = await pdfDoc.embedFont(fontBase64);
    const boldFont = await pdfDoc.embedFont(fontBoldBase64);

    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

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
    };

    let y = height - 60;
    const margin = 40;
    const contentWidth = width - margin * 2;

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

    // Helper function to draw custom colors as circles
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

    // Helper function to draw a table-like info box
    const drawInfoTable = (items, startY) => {
      if (!items || items.length === 0) return startY;

      const tableWidth = contentWidth;
      const tableX = margin;
      const rowHeight = 35;
      const totalHeight = items.length * rowHeight;

      // Draw table background
      page.drawRectangle({
        x: tableX,
        y: startY - totalHeight,
        width: tableWidth,
        height: totalHeight,
        color: colors.white,
        borderColor: colors.borderColor,
        borderWidth: 1,
        xRounded: 8,
        yRounded: 8,
      });

      let currentY = startY - 10;

      items.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          page.drawRectangle({
            x: tableX + 1,
            y: currentY - rowHeight + 1,
            width: tableWidth - 2,
            height: rowHeight - 2,
            color: colors.lightGray,
            xRounded: 6,
            yRounded: 6,
          });
        }

        // Draw item text
        const itemText =
          getTextByLanguage(item.title, lng) || item.name || item;
        const textY = currentY - rowHeight / 2 - 6;

        drawRTLText(
          itemText,
          textY,
          12,
          font,
          colors.textColor,
          tableX + 15,
          tableWidth - 30
        );

        currentY -= rowHeight;
      });

      return startY - totalHeight - 20;
    };

    const checkNewPage = (requiredSpace = 50) => {
      const footerHeight = signatureUrl ? 150 : 60;
      if (y < margin + requiredSpace + footerHeight) {
        page = pdfDoc.addPage([600, 800]);
        y = height - 60;
        return true;
      }
      return false;
    };

    // --- SIMPLIFIED HEADER ---
    const headerHeight = 100;

    // Clean header background
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width: width,
      height: headerHeight,
      color: colors.primary,
    });

    // Logo positioning
    const logoYOffset = 25;
    try {
      const logoBytes = await fetchImageBuffer(
        "https://dreamstudiio.com/dream-logo.jpg"
      );
      let logoImage;
      let logoEmbedded = false;
      try {
        logoImage = await pdfDoc.embedPng(logoBytes);
        logoEmbedded = true;
      } catch (pngErr) {
        try {
          logoImage = await pdfDoc.embedJpg(logoBytes);
          logoEmbedded = true;
        } catch (jpgErr) {
          console.warn("Logo embedding failed:", { pngErr, jpgErr });
        }
      }

      if (logoEmbedded) {
        const logoScale = 0.08;
        const logoScaled = logoImage.scale(logoScale);
        page.drawImage(logoImage, {
          x: margin,
          y: height - logoScaled.height - logoYOffset,
          width: logoScaled.width,
          height: logoScaled.height,
        });
      }
    } catch (err) {
      console.warn("Logo load error:", err.message);
    }

    // SIMPLIFIED MAIN TITLE
    const mainTitleText =
      lng === "ar" ? "تقرير اختيار التصميم" : "Design Selection Report";
    const mainTitleFontSize = 24;
    const mainTitleY = height - headerHeight / 2 - mainTitleFontSize / 2;

    // Draw title with white color for contrast
    drawRTLText(
      mainTitleText,
      mainTitleY,
      mainTitleFontSize,
      boldFont,
      colors.white
    );

    y = height - headerHeight - 40;

    // --- ENHANCED SECTION DRAWING ---
    const drawSection = async (
      title,
      items,
      itemRenderer,
      isGridSection = false
    ) => {
      checkNewPage(100);

      // Modern section header
      page.drawRectangle({
        x: margin,
        y: y - 35,
        width: contentWidth,
        height: 35,
        color: colors.primaryLight,
        xRounded: 8,
        yRounded: 8,
      });

      // Section title with better positioning
      const titleY = y - 22;
      drawRTLText(title, titleY, 16, boldFont, colors.heading);
      y -= 50;

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
        const noneSelectedText =
          lng === "ar" ? "لا يوجد عناصر محددة" : "No items selected";
        drawRTLText(
          noneSelectedText,
          y,
          12,
          font,
          colors.textColor,
          margin + 20,
          contentWidth - 20
        );
        y -= 25;
      }

      y -= 30;
    };

    // --- Custom Colors section ---
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
          const startX = lng === "ar" ? width - margin - 300 : margin + 20;
          const newY = drawCustomColors(customColors, startX, y);
          y = newY;
        },
        true
      );
    }

    // --- MATERIAL & STYLE IN TABLE FORMAT ---
    const tableItems = [];
    if (sessionData.material) {
      tableItems.push({
        title: sessionData.material.title,
        type: "material",
      });
    }
    if (sessionData.style) {
      tableItems.push({
        title: sessionData.style.title,
        type: "style",
      });
    }

    if (tableItems.length > 0) {
      await drawSection(
        lng === "ar" ? "الخامات و الاستايل" : "Material & Style",
        tableItems,
        async (items) => {
          checkNewPage(100);
          const newY = drawInfoTable(items, y);
          y = newY;
        },
        true
      );
    }

    // --- Color Pattern section ---
    if (sessionData.colorPattern) {
      await drawSection(
        lng === "ar" ? "نمط الألوان" : "Color Pattern",
        [sessionData.colorPattern],
        async (colorPattern) => {
          const patternTitle = getTextByLanguage(colorPattern.title, lng);
          const imageWidth = contentWidth * 0.6;
          const imageHeight = 200;

          checkNewPage(imageHeight + 80);

          if (patternTitle) {
            drawRTLText(patternTitle, y, 14, boldFont, colors.heading);
            y -= 25;
          }

          if (colorPattern.imageUrl) {
            const imageX = lng === "ar" ? width - margin - imageWidth : margin;
            const imageDrawY = y - imageHeight;

            let patternImageEmbedded = false;
            try {
              const imgBytes = await fetchImageBuffer(colorPattern.imageUrl);
              let imageEmbed;
              try {
                imageEmbed = await pdfDoc.embedPng(imgBytes);
                patternImageEmbedded = true;
              } catch (pngErr) {
                try {
                  imageEmbed = await pdfDoc.embedJpg(imgBytes);
                  patternImageEmbedded = true;
                } catch (jpgErr) {
                  console.warn(`Pattern image embedding failed:`, {
                    pngErr,
                    jpgErr,
                  });
                }
              }

              if (patternImageEmbedded) {
                // Modern image border
                page.drawRectangle({
                  x: imageX - 3,
                  y: imageDrawY - 3,
                  width: imageWidth + 6,
                  height: imageHeight + 6,
                  color: colors.white,
                  borderColor: colors.borderColor,
                  borderWidth: 1,
                  xRounded: 10,
                  yRounded: 10,
                });

                page.drawImage(imageEmbed, {
                  x: imageX,
                  y: imageDrawY,
                  width: imageWidth,
                  height: imageHeight,
                });
              }
            } catch (fetchErr) {
              console.warn(
                `Failed to fetch pattern image: ${fetchErr.message}`
              );
            }

            y = imageDrawY - 20;
          }
        }
      );
    }

    // --- Spaces section ---
    if (sessionData.selectedSpaces && sessionData.selectedSpaces.length > 0) {
      await drawSection(
        lng === "ar" ? "المساحات المختارة" : "Selected Spaces",
        sessionData.selectedSpaces,
        async (items) => {
          checkNewPage(100);
          const spaceItems = items.map((spaceRelation) => spaceRelation.space);
          const newY = drawInfoTable(spaceItems, y);
          y = newY;
        },
        true
      );
    }

    // --- ENHANCED IMAGES SECTION ---
    // --- ENHANCED IMAGES SECTION ---
    if (sessionData.selectedImages && sessionData.selectedImages.length > 0) {
      await drawSection(
        lng === "ar" ? "الصور المختارة" : "Selected Images",
        sessionData.selectedImages,
        async (images) => {
          const imagesPerRow = 2;
          const imageGap = 20;
          const imageWidth = (contentWidth - imageGap) / imagesPerRow;
          const maxImageHeight = 200; // Reduced from 250 to allow more rows
          const rowSpacing = 20; // Reduced from 30 to save space

          // Calculate minimum space needed at bottom (more reasonable)
          const minBottomSpace = signatureUrl ? 80 : 40;
          const spaceNeededForOneRow = maxImageHeight + rowSpacing;

          // Process images row by row
          for (
            let rowStart = 0;
            rowStart < images.length;
            rowStart += imagesPerRow
          ) {
            const rowEnd = Math.min(rowStart + imagesPerRow, images.length);
            const imagesInThisRow = rowEnd - rowStart;

            // Check if we need a new page for this row (more accurate check)
            if (y - spaceNeededForOneRow < minBottomSpace) {
              page = pdfDoc.addPage([600, 800]);
              y = height - 60;
            }

            // Calculate the Y position for this row
            const rowY = y - maxImageHeight;

            // Process each image in this row
            for (let i = rowStart; i < rowEnd; i++) {
              const image = images[i];
              const colIndex = i - rowStart; // 0 or 1 for this row

              // Calculate image X position
              const imageX =
                lng === "ar"
                  ? width -
                    margin -
                    (colIndex + 1) * imageWidth -
                    colIndex * imageGap
                  : margin + colIndex * (imageWidth + imageGap);

              let imageEmbedded = false;
              try {
                const imgBytes = await fetchImageBuffer(
                  image.designImage.imageUrl
                );
                let imageEmbed;

                try {
                  imageEmbed = await pdfDoc.embedPng(imgBytes);
                  imageEmbedded = true;
                } catch (pngErr) {
                  try {
                    imageEmbed = await pdfDoc.embedJpg(imgBytes);
                    imageEmbedded = true;
                  } catch (jpgErr) {
                    console.warn(`Image embedding failed:`, { pngErr, jpgErr });
                  }
                }

                if (imageEmbedded) {
                  // Calculate actual image dimensions maintaining aspect ratio
                  const { width: origWidth, height: origHeight } =
                    imageEmbed.size();
                  const aspectRatio = origWidth / origHeight;

                  let finalWidth = imageWidth;
                  let finalHeight = imageWidth / aspectRatio;

                  // Limit height to maxImageHeight
                  if (finalHeight > maxImageHeight) {
                    finalHeight = maxImageHeight;
                    finalWidth = maxImageHeight * aspectRatio;
                  }

                  // Center the image if it's smaller than the allocated space
                  const adjustedX = imageX + (imageWidth - finalWidth) / 2;
                  const adjustedY = rowY + (maxImageHeight - finalHeight) / 2;

                  // Modern image container
                  page.drawRectangle({
                    x: imageX - 2,
                    y: rowY - 2,
                    width: imageWidth + 4,
                    height: maxImageHeight + 4,
                    color: colors.white,
                    borderColor: colors.borderColor,
                    borderWidth: 1,
                    xRounded: 8,
                    yRounded: 8,
                  });

                  page.drawImage(imageEmbed, {
                    x: adjustedX,
                    y: adjustedY,
                    width: finalWidth,
                    height: finalHeight,
                  });
                }
              } catch (fetchErr) {
                console.warn(`Failed to fetch image: ${fetchErr.message}`);
              }

              if (!imageEmbedded) {
                // Enhanced fallback box
                page.drawRectangle({
                  x: imageX,
                  y: rowY,
                  width: imageWidth,
                  height: maxImageHeight,
                  color: colors.lightGray,
                  borderColor: colors.borderColor,
                  borderWidth: 1,
                  xRounded: 8,
                  yRounded: 8,
                });

                const fallbackText =
                  lng === "ar" ? "لا يمكن تحميل الصورة" : "Image unavailable";
                const fallbackFontSize = 12;
                const fallbackTextWidth = font.widthOfTextAtSize(
                  fallbackText,
                  fallbackFontSize
                );
                const fallbackX = imageX + (imageWidth - fallbackTextWidth) / 2;
                const fallbackY = rowY + maxImageHeight / 2;

                page.drawText(fallbackText, {
                  x: fallbackX,
                  y: fallbackY,
                  size: fallbackFontSize,
                  font,
                  color: colors.textColor,
                });
              }
            }

            // Move Y position down after completing this row
            y = rowY - rowSpacing;
          }
        },
        true
      );
    }
    // --- SIGNATURE SECTION ---
    if (signatureUrl) {
      checkNewPage(180);

      // Modern signature section
      page.drawRectangle({
        x: margin,
        y: y - 35,
        width: contentWidth,
        height: 35,
        color: colors.primaryLight,
        xRounded: 8,
        yRounded: 8,
      });

      const signatureTitle = lng === "ar" ? "توقيع العميل" : "Client Signature";
      drawRTLText(signatureTitle, y - 22, 16, boldFont, colors.heading);
      y -= 50;

      let signatureEmbedded = false;
      try {
        const sigBytes = await fetchImageBuffer(signatureUrl);
        let sigImage;
        try {
          sigImage = await pdfDoc.embedPng(sigBytes);
          signatureEmbedded = true;
        } catch (pngErr) {
          try {
            sigImage = await pdfDoc.embedJpg(sigBytes);
            signatureEmbedded = true;
          } catch (jpgErr) {
            console.warn("Signature embedding failed:", { pngErr, jpgErr });
          }
        }

        if (signatureEmbedded) {
          const maxW = 250;
          const maxH = 100;
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

          const sigX = lng === "ar" ? width - margin - sigW - 20 : margin + 20;
          const sigY = y - sigH - 15;

          // Modern signature container
          page.drawRectangle({
            x: sigX - 10,
            y: sigY - 10,
            width: sigW + 20,
            height: sigH + 20,
            color: colors.white,
            borderColor: colors.borderColor,
            borderWidth: 1,
            xRounded: 8,
            yRounded: 8,
          });

          page.drawImage(sigImage, {
            x: sigX,
            y: sigY,
            width: sigW,
            height: sigH,
          });

          y -= sigH + 50;
        }
      } catch (fetchErr) {
        console.warn(`Failed to fetch signature image: ${fetchErr.message}`);
      }

      if (!signatureEmbedded) {
        const signatureErrorText =
          lng === "ar" ? "فشل في تحميل التوقيع" : "Signature unavailable";
        drawRTLText(
          signatureErrorText,
          y,
          12,
          font,
          colors.textColor,
          margin + 20,
          contentWidth - 20
        );
        y -= 30;
      }
    }

    // --- CLEAN FOOTER ---
    const footerStartY = 40;

    // Company branding
    page.drawText("DREAM STUDIO", {
      x: margin,
      y: footerStartY,
      size: 14,
      font: boldFont,
      color: colors.heading,
    });

    page.drawText("Interior Design Solutions", {
      x: margin,
      y: footerStartY - 15,
      size: 10,
      font: font,
      color: colors.textColor,
    });

    // Date stamp
    const currentDate = dayjs().format("MMMM D, YYYY");
    const dateText = `Generated: ${currentDate}`;
    const dateFontSize = 9;
    const dateTextWidth = font.widthOfTextAtSize(dateText, dateFontSize);
    const dateX = width - margin - dateTextWidth;

    page.drawText(dateText, {
      x: dateX,
      y: footerStartY - 5,
      size: dateFontSize,
      font,
      color: colors.textColor,
    });

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
