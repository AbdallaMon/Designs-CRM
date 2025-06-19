import { PDFDocument, rgb } from "pdf-lib";
import prisma from "../../prisma/prisma.js";
import fetch from "node-fetch";
import { sendEmail } from "../sendMail.js";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import * as fontkit from "fontkit";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "url";
import reshaper from "arabic-persian-reshaper";
import { uploadToFTPAsBuffer } from "./utility.js";
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
}) {
  try {
    const pdfBytes = await generateImageSessionPdf({
      sessionData,
      signatureUrl,
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

export async function generateImageSessionPdf({ sessionData, signatureUrl }) {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Embed fonts
    const font = await pdfDoc.embedFont(fontBase64);
    const boldFont = await pdfDoc.embedFont(fontBoldBase64);

    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    // Enhanced Color Palette - slightly adjusted for better contrast and aesthetics
    const colors = {
      primary: rgb(0.827, 0.675, 0.443), // Original primary: Warm gold/bronze
      primaryDark: rgb(0.745, 0.592, 0.361), // Slightly darker primary for accents/links
      primaryLight: rgb(0.95, 0.92, 0.88), // Lighter primary for subtle backgrounds
      heading: rgb(0.22, 0.188, 0.157), // Original heading: Dark brown/charcoal
      textColor: rgb(0.345, 0.302, 0.247), // Original text color: Medium brown/gray
      bgPrimary: rgb(0.918, 0.906, 0.886), // Original background primary: Light beige
      accentBg: rgb(0.98, 0.97, 0.95), // Even lighter background for subtle section separation
      success: rgb(0.518, 0.569, 0.471), // Original success: Greenish-brown (kept as is)
      borderColor: rgb(0.7, 0.7, 0.7), // Neutral border for card elements
    };

    let y = height - 60; // Initial Y position for content
    const margin = 40;
    const contentWidth = width - margin * 2;

    // Arabic text reshaping function
    const reText = (text) => {
      const reshape = reshaper.ArabicShaper.convertArabic;
      let reshaped = reshape(text);
      return reshaped;
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
      customX = null // Added for absolute positioning if needed
    ) => {
      const processedText = reText(text);
      const rtlX =
        customX !== null
          ? customX
          : getRTLTextX(
              processedText,
              size,
              fontToUse,
              containerStartX,
              containerWidth
            );

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

    /**
     * Checks if a new page is needed based on the remaining vertical space.
     */
    const checkNewPage = (requiredSpace = 50) => {
      // Add a buffer to requiredSpace to prevent content from touching the bottom
      const footerHeight = signatureUrl ? 150 : 60; // Approximate height for footer including signature
      if (y < margin + requiredSpace + footerHeight) {
        page = pdfDoc.addPage([600, 800]);
        y = height - 60; // Reset y for new page, considering top margin
        return true;
      }
      return false;
    };

    // --- Header Section ---
    const headerHeight = 150; // Increased header height
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width: width,
      height: headerHeight,
      color: colors.bgPrimary,
    });

    // Logo positioning (keep on left for branding)
    const logoYOffset = 30; // Offset from top of header background
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
        const logoScale = 0.1; // Slightly increased logo size
        const logoScaled = logoImage.scale(logoScale);
        page.drawImage(logoImage, {
          x: margin,
          y: height - logoScaled.height - logoYOffset, // Position within the new header height
          width: logoScaled.width,
          height: logoScaled.height,
        });
      }
    } catch (err) {
      console.warn("Logo load error:", err.message);
    }

    // Main title (RTL aligned and centered vertically within the header)
    const mainTitleText = "جلسة اختيار الصور";
    const mainTitleFontSize = 32; // Increased font size

    const mainTitleY = height - headerHeight / 2 - mainTitleFontSize / 2; // Center vertically in header

    drawRTLText(
      mainTitleText,
      mainTitleY,
      mainTitleFontSize,
      boldFont,
      colors.heading
    );

    // Adjust starting Y for content below the header
    y = height - headerHeight - 30; // Leave some space below the header

    /**
     * Draws a section with RTL layout
     */
    const drawSection = async (
      title,
      items,
      itemRenderer,
      isGridSection = false // Renamed from isImageSection for clarity
    ) => {
      checkNewPage(80); // Check for new page before drawing section title

      // Draw accent rectangle for section title (on the right side for RTL)
      page.drawRectangle({
        x: width - margin - 6, // Slightly wider accent
        y: y - 2,
        width: 6,
        height: 24, // Taller accent
        color: colors.primary,
      });

      // Draw section title (RTL aligned)
      drawRTLText(title, y, 18, boldFont, colors.heading); // Slightly larger section titles
      y -= 40; // More space after section title

      if (items && items.length > 0) {
        if (isGridSection) {
          // For grid sections, pass all items to the renderer at once
          await itemRenderer(items);
        } else {
          for (let i = 0; i < items.length; i++) {
            checkNewPage(40); // Check more frequently for smaller items
            await itemRenderer(items[i], i, items.length);
          }
        }
      } else {
        // "None selected" in Arabic, RTL aligned with padding
        drawRTLText(
          "لا يوجد عناصر محددة",
          y,
          12,
          font,
          colors.textColor,
          margin + 20,
          contentWidth - 20
        );
        y -= 25;
      }

      y -= 20; // More space between sections
    };

    // --- Patterns section (Colors) - Now as a two-column image grid ---
    await drawSection(
      reText("الألوان المختارة"),
      sessionData.preferredPatterns,
      async (patterns) => {
        // Now accepts the array of patterns
        const imagesPerRow = 2;
        const padding = 20; // Padding between images
        const imageWidth = (contentWidth - padding) / imagesPerRow; // Calculate width for 2 images
        const imageHeight = imageWidth - 100; // Keep aspect ratio 1:1 for palette items
        const rowHeight = imageHeight + padding;
        let currentY = y;

        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const colIndex = i % imagesPerRow;

          if (colIndex === 0) {
            // New row
            if (i > 0) {
              currentY -= rowHeight;
            }
            // Check for new page before drawing a new row
            if (
              currentY - imageHeight <
              margin + (signatureUrl ? 150 : 60) + 20
            ) {
              // Add a buffer for safety
              page = pdfDoc.addPage([600, 800]);
              currentY = height - 60; // Reset y for new page
            }
          }

          // Calculate X position for RTL layout (right to left)
          const imageX =
            width - margin - (colIndex + 1) * imageWidth - colIndex * padding;
          const imageDrawY = currentY - imageHeight;

          let patternImageEmbedded = false;
          if (pattern.avatarUrl) {
            try {
              const imgBytes = await fetchImageBuffer(pattern.avatarUrl);
              let imageEmbed;
              try {
                imageEmbed = await pdfDoc.embedPng(imgBytes);
                patternImageEmbedded = true;
              } catch (pngErr) {
                try {
                  imageEmbed = await pdfDoc.embedJpg(imgBytes);
                  patternImageEmbedded = true;
                } catch (jpgErr) {
                  console.warn(
                    `Pattern avatar embedding failed for ${pattern.avatarUrl}:`,
                    { pngErr, jpgErr }
                  );
                }
              }

              if (patternImageEmbedded) {
                // Draw border for the image
                page.drawRectangle({
                  x: imageX - 4, // Slightly thicker border
                  y: imageDrawY - 4,
                  width: imageWidth + 8,
                  height: imageHeight + 8,
                  color: colors.primaryDark, // Darker primary for image borders
                  xRounded: 8, // Rounded corners
                  yRounded: 8,
                });
                // Draw image
                page.drawImage(imageEmbed, {
                  x: imageX,
                  y: imageDrawY,
                  width: imageWidth,
                  height: imageHeight,
                });
              }
            } catch (fetchErr) {
              console.warn(
                `Failed to fetch pattern avatar ${pattern.avatarUrl}: ${fetchErr.message}`
              );
            }
          }

          if (!patternImageEmbedded) {
            // Fallback box for missing image
            page.drawRectangle({
              x: imageX,
              y: imageDrawY,
              width: imageWidth,
              height: imageHeight,
              color: colors.accentBg, // Light background for fallback box
              borderColor: colors.borderColor,
              borderWidth: 1,
              xRounded: 8,
              yRounded: 8,
            });

            // Fallback text in Arabic, centered in image area
            const fallbackText = reText("لا توجد صورة");
            const fallbackFontSize = 10;
            const fallbackTextWidth = font.widthOfTextAtSize(
              reText(fallbackText),
              fallbackFontSize
            );
            const fallbackX = imageX + (imageWidth - fallbackTextWidth) / 2;
            const fallbackY =
              imageDrawY + imageHeight / 2 - fallbackFontSize / 2;

            page.drawText(fallbackText, {
              x: fallbackX,
              y: fallbackY,
              size: fallbackFontSize,
              font,
              color: colors.textColor,
            });
          }
        }

        // Adjust Y after the patterns grid
        if (patterns.length > 0) {
          const lastRowIndex = Math.floor((patterns.length - 1) / imagesPerRow);
          const effectiveLastRowTopY = currentY - lastRowIndex * rowHeight;
          const finalImageDrawY = effectiveLastRowTopY - imageHeight;
          y = finalImageDrawY - padding;
        }
      },
      true // Mark as a grid section
    );

    // --- Spaces section ---
    await drawSection(
      reText("المساحات المختارة"),
      sessionData.selectedSpaces,
      async (spaceItem) => {
        const spaceName = spaceItem.space.name;
        const spaceDescription = spaceItem.space.description || ""; // Assuming description might exist
        const spaceHeight = 40 + (spaceDescription ? 20 : 0); // Dynamic height for space card

        // Check for new page if next item won't fit
        if (y < spaceHeight + 30) {
          checkNewPage(spaceHeight + 30);
        }

        const cardWidth = contentWidth;
        const cardX = margin;
        const cardY = y - spaceHeight;

        // Draw background for the space item (card-like UI)
        page.drawRectangle({
          x: cardX,
          y: cardY,
          width: cardWidth,
          height: spaceHeight,
          color: colors.primaryLight, // Lighter primary for space cards
          borderColor: colors.primary, // Primary color border
          borderWidth: 1,
          xRounded: 8,
          yRounded: 8,
        });

        // Draw space name (RTL aligned, within the card)
        const nameFontSize = 16;
        const nameProcessed = reText(spaceName);
        const nameX = getRTLTextX(
          nameProcessed,
          nameFontSize,
          boldFont,
          cardX + 15,
          cardWidth - 30
        );
        page.drawText(nameProcessed, {
          x: nameX,
          y: cardY + spaceHeight - 30, // Position towards top of card
          size: nameFontSize,
          font: boldFont,
          color: colors.heading,
        });

        // Draw space description if available (RTL aligned, smaller text)
        if (spaceDescription) {
          const descFontSize = 10;
          const descProcessed = reText(spaceDescription);
          const descX = getRTLTextX(
            descProcessed,
            descFontSize,
            font,
            cardX + 15,
            cardWidth - 30
          );
          page.drawText(descProcessed, {
            x: descX,
            y: cardY + spaceHeight - 50, // Below name
            size: descFontSize,
            font: font,
            color: colors.textColor,
          });
        }

        y -= spaceHeight + 15; // Move Y down by card height + padding
      }
    );

    // --- Images section (RTL layout for images grid) ---
    await drawSection(
      reText("الصور المختارة"),
      sessionData.selectedImages,
      async (images) => {
        const imagesPerRow = 2;
        const padding = 20; // Increased padding between images
        const imgSize = (contentWidth - padding) / imagesPerRow; // Calculate image size to fit
        const rowHeight = imgSize + padding;
        let currentY = y;

        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const colIndex = i % imagesPerRow;

          if (colIndex === 0) {
            if (i > 0) {
              currentY -= rowHeight;
            }

            // Check for new page before drawing a new row
            const requiredSpaceAtBottom = signatureUrl ? 180 : 80; // More space for footer
            if (currentY - imgSize < requiredSpaceAtBottom) {
              page = pdfDoc.addPage([600, 800]);
              currentY = height - 60; // Reset y for new page
            }
          }

          // Calculate X position for RTL layout (right to left)
          // First image starts from the rightmost position
          // Second image is to its left
          const imageX =
            width - margin - (colIndex + 1) * imgSize - colIndex * padding;
          const imageDrawY = currentY - imgSize;

          let imageEmbedded = false;
          try {
            const imgBytes = await fetchImageBuffer(image.image.url);
            let imageEmbed;
            try {
              imageEmbed = await pdfDoc.embedPng(imgBytes);
              imageEmbedded = true;
            } catch (pngErr) {
              try {
                imageEmbed = await pdfDoc.embedJpg(imgBytes);
                imageEmbedded = true;
              } catch (jpgErr) {
                console.warn(`Image embedding failed for ${image.image.url}:`, {
                  pngErr,
                  jpgErr,
                });
              }
            }

            if (imageEmbedded) {
              // Draw border with primary color
              page.drawRectangle({
                x: imageX - 4, // Slightly thicker border
                y: imageDrawY - 4,
                width: imgSize + 8,
                height: imgSize + 8,
                color: colors.primaryDark, // Darker primary for image borders
                xRounded: 5, // Rounded corners for image frames
                yRounded: 5,
              });

              // Draw image
              page.drawImage(imageEmbed, {
                x: imageX,
                y: imageDrawY,
                width: imgSize,
                height: imgSize,
              });
            }
          } catch (fetchErr) {
            console.warn(
              `Failed to fetch image ${image.image.url}: ${fetchErr.message}`
            );
          }

          if (!imageEmbedded) {
            // Fallback box for missing image
            page.drawRectangle({
              x: imageX,
              y: imageDrawY,
              width: imgSize,
              height: imgSize,
              color: colors.accentBg, // Light background for fallback box
              borderColor: colors.borderColor,
              borderWidth: 1,
              xRounded: 5,
              yRounded: 5,
            });

            // Fallback message in Arabic, centered in image area
            const fallbackText = reText("لا يمكن تحميل الصورة");
            const fallbackFontSize = 10;
            const fallbackTextWidth = font.widthOfTextAtSize(
              fallbackText,
              fallbackFontSize
            );
            const fallbackX = imageX + (imgSize - fallbackTextWidth) / 2;
            const fallbackY = imageDrawY + imgSize / 2 + 5;

            page.drawText(fallbackText, {
              x: fallbackX,
              y: fallbackY,
              size: fallbackFontSize,
              font,
              color: colors.textColor,
            });

            // Clickable link text in Arabic below fallback message
            const linkText = reText("اضغط لفتح الرابط");
            const linkFontSize = 10;
            const linkTextWidth = font.widthOfTextAtSize(
              linkText,
              linkFontSize
            );
            const linkX = imageX + (imgSize - linkTextWidth) / 2;
            const linkY = imageDrawY + imgSize / 2 - 15; // Adjusted Y for link

            page.drawText(linkText, {
              x: linkX,
              y: linkY,
              size: linkFontSize,
              font,
              color: colors.primaryDark, // Use primaryDark for link
            });

            // Create link annotation
            const linkAnnotation = pdfDoc.context.obj({
              Type: "Annot",
              Subtype: "Link",
              Rect: [
                linkX,
                linkY,
                linkX + font.widthOfTextAtSize(linkText, linkFontSize),
                linkY + linkFontSize,
              ],
              Border: [0, 0, 0],
              A: {
                Type: "Action",
                S: "URI",
                URI: pdfDoc.context.obj(image.image.url),
              },
            });

            const linkRef = pdfDoc.context.register(linkAnnotation);
            const existingAnnots = page.node.Annots();
            if (existingAnnots) {
              existingAnnots.push(linkRef);
            } else {
              page.node.set("Annots", pdfDoc.context.obj([linkRef]));
            }
          }
        }

        if (images.length > 0) {
          const lastRowIndex = Math.floor((images.length - 1) / imagesPerRow);
          const effectiveLastRowTopY = currentY - lastRowIndex * rowHeight;
          const finalImageDrawY = effectiveLastRowTopY - imgSize;
          y = finalImageDrawY - padding;
        }
      },
      true
    );

    // --- Signature section ---
    if (signatureUrl) {
      checkNewPage(180); // Ensure enough space for signature and footer

      // Accent rectangle on the right for RTL
      page.drawRectangle({
        x: width - margin - 6,
        y: y - 2,
        width: 6,
        height: 24,
        color: colors.primary,
      });

      // Signature title (RTL aligned)
      drawRTLText("توقيع العميل", y, 16, boldFont, colors.heading);
      y -= 40;

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
          const maxW = 200;
          const maxH = 80;
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

          // Position signature on the right side for RTL, with a subtle border
          const sigX = width - margin - sigW - 15; // Padding from right margin
          const sigY = y - sigH - 10; // Padding below title

          page.drawRectangle({
            x: sigX - 8, // Wider border
            y: sigY - 8,
            width: sigW + 16,
            height: sigH + 16,
            color: colors.primaryLight, // Use primaryLight for signature box background
            borderColor: colors.borderColor,
            borderWidth: 1,
            xRounded: 5,
            yRounded: 5,
          });

          page.drawImage(sigImage, {
            x: sigX,
            y: sigY,
            width: sigW,
            height: sigH,
          });

          y -= sigH + 40; // More space after signature
        }
      } catch (fetchErr) {
        console.warn(
          `Failed to fetch signature image ${signatureUrl}: ${fetchErr.message}`
        );
      }

      if (!signatureEmbedded) {
        // Fallback text in Arabic, RTL aligned
        drawRTLText(
          "فشل في تحميل التوقيع",
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

    // --- Footer ---
    // Ensure footer elements are within a safe bottom margin
    const footerStartY = 40; // Start drawing footer content from this Y position

    // Left-aligned English text
    page.drawText("GENERATED BY DREAM STUDIO", {
      x: margin,
      y: footerStartY,
      size: 11,
      font: boldFont,
      color: colors.heading,
    });

    page.drawText("Professional Interior Design Solutions", {
      x: margin,
      y: footerStartY - 15,
      size: 10,
      font: font,
      color: colors.textColor,
    });

    // Date stamp (RTL-friendly positioning on the right)
    const currentDate = dayjs().format("MMMM D,YYYY");
    const dateText = `Report Generated: ${currentDate}`;
    const dateFontSize = 9;
    const dateTextWidth = font.widthOfTextAtSize(dateText, dateFontSize);
    const dateX = width - margin - dateTextWidth; // Align to right margin
    page.drawText(dateText, {
      x: dateX,
      y: footerStartY - 5, // Slightly higher than second line of English text
      size: dateFontSize,
      font,
      color: colors.textColor,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (e) {
    console.log(e, "error in pdf generator");

    // Assuming prisma and sessionData.id are available in this scope for error logging
    // await prisma.clientImageSession.update({
    //   where: { id: Number(sessionData.id) },
    //   data: { error: true },
    // });
    throw e; // Re-throw to propagate the error if necessary
  }
}

export async function approveSession({ token, clientLeadId, id, pdfUrl }) {
  // Clear previous selected images and add new ones
  await prisma.clientImageSession.update({
    where: { id: Number(id) },
    data: {
      sessionStatus: "APPROVED",
      pdfUrl: pdfUrl,
      error: false,
    },
  });
  await sendSuccessEmailAfterSessionDone({ token, clientLeadId, pdfUrl });
  return await getSessionByToken(token);
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
async function sendEmailToClient({ clientName, clientEmail, pdfUrl, token }) {
  const sessionPageUrl = `${process.env.ORIGIN}/image-session?token=${token}`;
  const pdfDownloadUrl = pdfUrl;

  const clientHtml = `
    <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%); padding: 20px; text-align: center;">
          <img src="https://dreamstudiio.com/dream-logo.jpg" alt="Dream Studio" style="max-height: 60px;" />
        </div>
        <div style="padding: 12px;">
          <h2 style="color: #383028;">Thank you, ${clientName}!</h2>
          <p>Your image session has been approved!</p>
          
          <div style="background: #f8f6f3; border-radius: 8px; padding: 12px; margin: 20px 0;">
            <h3 style="color: #383028; margin-top: 0;">What would you like to do next?</h3>
            <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #be975c;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #383028;">🖼️ Preview Your Session</p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Review your image selection and make any final changes before downloading</p>
              <a href="${sessionPageUrl}" style="color: #be975c; font-weight: bold; text-decoration: none; background: #f8f6f3; padding: 8px 16px; border-radius: 4px; display: inline-block;">View Session</a>
            </div>
            <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #d3ac71;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #383028;">📄 Download Your PDF Summary</p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Get instant access to your finalized image collection</p>
              <a href="${pdfDownloadUrl}" style="color: #d3ac71; font-weight: bold; text-decoration: none; background: #f8f6f3; padding: 8px 16px; border-radius: 4px; display: inline-block;">Download PDF</a>
            </div>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            💡 <em>Tip: You can always return to your session page to preview your images or downloading the PDF.</em>
          </p>
          
          <p style="margin-top: 30px;">We appreciate your trust in <strong>Dream Studio</strong> ❤️</p>
          <p>Best regards,<br/>Dream Studio Team</p>
        </div>
      </div>
    </div>
  `;
  await sendEmail(
    clientEmail,
    "✅ Your Image Session is Approved",
    clientHtml,
    true
  );
}

async function sendEmailForStaff({
  staffs,
  clientName,
  clientLeadId,
  pdfDownloadUrl,
  token,
}) {
  const staffHtml = `
    <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%); padding: 20px; text-align: center;">
          <img src="https://dreamstudiio.com/dream-logo.jpg" alt="Dream Studio" style="max-height: 60px;" />
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #383028;">Client Image Session Approved</h2>
          <p>
            Client <strong>${clientName}</strong> (ClientLead ID: <strong>${clientLeadId}</strong>) has approved a new image session.
          </p>
                  <p>
         Session token : ${token}
          </p>
          <p>Useful links:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><a href="${pdfDownloadUrl}" style="color: #d3ac71; font-weight: bold;">📄 Download Session PDF</a></li>
            <li style="margin: 10px 0;"><a href="${process.env.ORIGIN}/dashboard/deals/${clientLeadId}" style="color: #d3ac71; font-weight: bold;">👤 Open lead page for more data</a></li>
          </ul>
          <p style="margin-top: 20px;">Please review the session or take follow-up actions as needed.</p>
          <p style="margin-top: 20px;">— Dream Studio System Notification</p>
        </div>
      </div>
    </div>
  `;

  for (const staff of staffs) {
    await sendEmail(
      staff.email,
      `📢 Approved Image Session for ${clientName}`,
      staffHtml
    );
  }
}
