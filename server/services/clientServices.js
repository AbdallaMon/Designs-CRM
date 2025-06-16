import { error, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import prisma from "../prisma/prisma.js";
import fetch from "node-fetch";
import { sendEmail } from "./sendMail.js";
import { uploadToFTPAsBuffer } from "./utility.js";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

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
    let page = pdfDoc.addPage([600, 800]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    const colors = {
      primary: rgb(0.827, 0.675, 0.443),
      primaryDark: rgb(0.745, 0.592, 0.361),
      heading: rgb(0.22, 0.188, 0.157),
      textColor: rgb(0.345, 0.302, 0.247),
      bgPrimary: rgb(0.918, 0.906, 0.886),
      success: rgb(0.518, 0.569, 0.471),
    };

    let y = height - 60; // Initial Y position for content
    const margin = 40;
    const contentWidth = width - margin * 2;

    /**
     * Checks if a new page is needed based on the remaining vertical space.
     * If not enough space, a new page is added and y is reset.
     * @param {number} requiredSpace - The minimum space needed below the current y position.
     * @returns {boolean} True if a new page was added, false otherwise.
     */
    const checkNewPage = (requiredSpace = 50) => {
      if (y < requiredSpace) {
        page = pdfDoc.addPage([600, 800]);
        y = height - 60; // Reset y for new page
        return true;
      }
      return false;
    };

    // Draw header background rectangle
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: colors.bgPrimary,
    });

    // Try to embed and draw the logo with enhanced loading
    try {
      const logoBytes = await fetchImageBuffer(
        "https://dreamstudiio.com/main-logo.jpg"
      );
      let logoImage;
      let logoEmbedded = false;
      try {
        logoImage = await pdfDoc.embedPng(logoBytes); // Try as PNG first
        logoEmbedded = true;
      } catch (pngErr) {
        try {
          logoImage = await pdfDoc.embedJpg(logoBytes); // Then try as JPG
          logoEmbedded = true;
        } catch (jpgErr) {
          console.warn("Logo embedding failed:", { pngErr, jpgErr });
        }
      }

      if (logoEmbedded) {
        const logoScale = 0.08;
        const logoScaled = logoImage.scale(logoScale);

        page.drawImage(logoImage, {
          x: width - logoScaled.width - margin,
          y: height - logoScaled.height - 30,
          width: logoScaled.width,
          height: logoScaled.height,
        });
      } else {
        console.warn("Could not embed logo image after all attempts.");
      }
    } catch (err) {
      console.warn("Logo load error:", err.message);
    }

    // Draw main title
    page.drawText("Image Session Summary", {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: colors.heading,
    });
    y -= 50; // Move y down after the title

    /**
     * Draws a section with a title and a list of items.
     * @param {string} title - The title of the section.
     * @param {Array} items - The array of items to render.
     * @param {Function} itemRenderer - Async function to render each item.
     * For image section, it will receive the entire items array.
     * @param {boolean} [isImageSection=false] - Flag to indicate if this is the image section,
     * which requires special page break handling.
     */
    const drawSection = async (
      title,
      items,
      itemRenderer,
      isImageSection = false
    ) => {
      checkNewPage(80); // Check for page break before drawing section title

      // Draw accent rectangle for section title
      page.drawRectangle({
        x: margin - 5,
        y: y - 2,
        width: 4,
        height: 20,
        color: colors.primary,
      });

      // Draw section title
      page.drawText(title, {
        x: margin + 10,
        y,
        size: 16,
        font: boldFont,
        color: colors.heading,
      });

      y -= 35; // Space after section title

      if (items && items.length > 0) {
        if (isImageSection) {
          // For image section, pass the entire items array to the renderer
          // so it can manage its own grid layout and page breaks.
          await itemRenderer(items);
        } else {
          // For other sections, render items one by one, checking for page breaks for each.
          for (let i = 0; i < items.length; i++) {
            checkNewPage(30); // Ensure enough space for the next item
            await itemRenderer(items[i], i, items.length);
          }
        }
      } else {
        // If no items, draw "None selected" text.
        page.drawText("None selected", {
          x: margin + 20,
          y,
          size: 11,
          font,
          color: colors.textColor,
        });
        y -= 25; // Move y down
      }

      y -= 15; // Space after the section content
    };

    // Draw 'Selected Color Patterns' section
    await drawSection(
      "Selected Color Patterns",
      sessionData.preferredPatterns,
      async (pattern) => {
        const imageSize = 20;
        let imageOffsetX = margin + 20;

        if (pattern.avatarUrl) {
          let patternImageEmbedded = false;
          try {
            const imgBytes = await fetchImageBuffer(pattern.avatarUrl);
            let imageEmbed;
            try {
              imageEmbed = await pdfDoc.embedPng(imgBytes); // Try as PNG
              patternImageEmbedded = true;
            } catch (pngErr) {
              try {
                imageEmbed = await pdfDoc.embedJpg(imgBytes); // Then try as JPG
                patternImageEmbedded = true;
              } catch (jpgErr) {
                console.warn(
                  `Pattern avatar embedding failed for ${pattern.avatarUrl}:`,
                  { pngErr, jpgErr }
                );
              }
            }

            if (patternImageEmbedded) {
              page.drawImage(imageEmbed, {
                x: imageOffsetX,
                y: y - imageSize + 5,
                width: imageSize,
                height: imageSize,
              });
              imageOffsetX += imageSize + 10;
            } else {
              console.warn(
                `Could not embed pattern avatar image ${pattern.avatarUrl}`
              );
            }
          } catch (fetchErr) {
            console.warn(
              `Failed to fetch pattern avatar ${pattern.avatarUrl}: ${fetchErr.message}`
            );
          }

          if (!patternImageEmbedded) {
            page.drawText("Image", {
              x: imageOffsetX,
              y,
              size: 10,
              font,
              color: colors.textColor,
            });
            page.drawText(`(${pattern.avatarUrl})`, {
              x: imageOffsetX + 25,
              y,
              size: 8,
              font,
              color: colors.textColor,
            });
          }
        }

        page.drawText(`• ${pattern.name}`, {
          x: imageOffsetX,
          y,
          size: 12,
          font,
          color: colors.textColor,
        });
        y -= 25; // Move y down after each pattern item
      }
    );

    // Draw 'Selected Spaces' section
    await drawSection(
      "Selected Spaces",
      sessionData.selectedSpaces,
      async (space) => {
        page.drawText(`• ${space.space.name}`, {
          x: margin + 20,
          y,
          size: 12,
          font,
          color: colors.textColor,
        });
        y -= 22; // Move y down after each space item
      }
    );

    // Draw 'Selected Images' section - now with 4 images per row
    await drawSection(
      "Selected Images",
      sessionData.selectedImages,
      async (images) => {
        // This renderer receives the full array of images
        const imagesPerRow = 4; // Display 4 images per row
        const padding = 10; // Padding between images and rows
        const imgSize = 115; // Calculated to fit 4 images within the content width (520) with padding

        const rowHeight = imgSize + padding;

        // `currentY` tracks the top Y position of the row being drawn *on the current page*.
        let currentY = y;

        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const colIndex = i % imagesPerRow; // Column index for the current image (0 to 3)

          // Check for a new page only when starting a new row (or it's the very first image)
          if (colIndex === 0) {
            // If this is not the very first image in the entire section, decrement currentY for the new row
            if (i > 0) {
              currentY -= rowHeight;
            }

            // Determine the required space at the bottom of the page.
            const requiredSpaceAtBottom = signatureUrl ? 150 : 60;

            // Check if drawing this row would push content below the required bottom space.
            // `currentY - imgSize` is the calculated bottom of the image.
            if (currentY - imgSize < requiredSpaceAtBottom) {
              page = pdfDoc.addPage([600, 800]);
              currentY = height - 60; // Reset currentY to the top of the new page
            }
          }

          // Calculate the X position for the current image
          const imageX = margin + colIndex * (imgSize + padding);
          // Calculate the Y position for the current image (bottom-left corner)
          const imageDrawY = currentY - imgSize;

          let imageEmbedded = false;
          try {
            const imgBytes = await fetchImageBuffer(image.image.url);
            let imageEmbed;
            try {
              imageEmbed = await pdfDoc.embedPng(imgBytes); // Try as PNG
              imageEmbedded = true;
            } catch (pngErr) {
              try {
                imageEmbed = await pdfDoc.embedJpg(imgBytes); // Then try as JPG
                imageEmbedded = true;
              } catch (jpgErr) {
                console.warn(`Image embedding failed for ${image.image.url}:`, {
                  pngErr,
                  jpgErr,
                });
              }
            }

            if (imageEmbedded) {
              // Draw a primary colored rectangle border around the image
              page.drawRectangle({
                x: imageX - 2,
                y: imageDrawY - 2,
                width: imgSize + 4,
                height: imgSize + 4,
                color: colors.primary,
              });

              // Draw the image
              page.drawImage(imageEmbed, {
                x: imageX,
                y: imageDrawY,
                width: imgSize,
                height: imgSize,
              });
            } else {
              // Fallback if image could not be embedded (after successful fetch)
              console.warn(
                `Could not embed image ${image.image.url} after all embed attempts.`
              );
            }
          } catch (fetchErr) {
            // Fallback if image could not be fetched at all
            console.warn(
              `Failed to fetch image ${image.image.url}: ${fetchErr.message}`
            );
          }

          if (!imageEmbedded) {
            // Draw fallback message
            page.drawText("Could not load image", {
              x: imageX,
              y: imageDrawY + imgSize / 2,
              size: 9,
              font,
              color: colors.textColor,
            });

            // Draw the clickable text
            const fallbackText = "Click to open image link";
            const fontSize = 9;
            const textWidth = font.widthOfTextAtSize(fallbackText, fontSize);
            const textHeight = fontSize;
            const linkY = imageDrawY + imgSize / 2 - 10;

            page.drawText(fallbackText, {
              x: imageX,
              y: linkY,
              size: fontSize,
              font,
              color: colors.primaryDark,
            });

            // Create and register the link annotation
            const linkAnnotation = pdfDoc.context.obj({
              Type: "Annot",
              Subtype: "Link",
              Rect: [imageX, linkY, imageX + textWidth, linkY + textHeight],
              Border: [0, 0, 0],
              A: {
                Type: "Action",
                S: "URI",
                URI: pdfDoc.context.obj(image.image.url),
              },
            });

            const linkRef = pdfDoc.context.register(linkAnnotation);

            // Attach annotation to page
            const existingAnnots = page.node.Annots();
            if (existingAnnots) {
              existingAnnots.push(linkRef);
            } else {
              page.node.set("Annots", pdfDoc.context.obj([linkRef]));
            }
          }
        }

        if (images.length > 0) {
          // Calculate the Y coordinate for the bottom of the last complete or partial row
          const lastRowIndex = Math.floor((images.length - 1) / imagesPerRow);
          const effectiveLastRowTopY = currentY - lastRowIndex * rowHeight; // Use currentY here for consistent calculation
          const finalImageDrawY = effectiveLastRowTopY - imgSize;
          y = finalImageDrawY - padding;
        }
      },
      true // Mark this as an image section for specific handling in drawSection
    );

    // Draw 'Client Signature' section if signatureUrl is provided
    if (signatureUrl) {
      checkNewPage(150); // Ensure enough space for the signature block

      // Draw accent rectangle for signature title
      page.drawRectangle({
        x: margin - 5,
        y: y - 2,
        width: 4,
        height: 20,
        color: colors.primary,
      });

      // Draw signature section title
      page.drawText("Client Signature", {
        x: margin + 10,
        y,
        size: 16,
        font: boldFont,
        color: colors.heading,
      });

      y -= 40; // Space after signature title

      let signatureEmbedded = false;
      try {
        const sigBytes = await fetchImageBuffer(signatureUrl);
        let sigImage;
        try {
          sigImage = await pdfDoc.embedPng(sigBytes); // Try as PNG
          signatureEmbedded = true;
        } catch (pngErr) {
          try {
            sigImage = await pdfDoc.embedJpg(sigBytes); // Then try as JPG
            signatureEmbedded = true;
          } catch (jpgErr) {
            console.warn("Signature embedding failed:", { pngErr, jpgErr });
          }
        }

        if (signatureEmbedded) {
          // Scale signature image to fit within defined max dimensions
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

          page.drawRectangle({
            x: margin + 15,
            y: y - sigH - 5,
            width: sigW + 10,
            height: sigH + 10,
            color: colors.bgPrimary,
          });

          // Draw the signature image
          page.drawImage(sigImage, {
            x: margin + 20,
            y: y - sigH,
            width: sigW,
            height: sigH,
          });

          y -= sigH + 30; // Move y down after signature
        } else {
          console.warn(`Could not embed signature image ${signatureUrl}`);
        }
      } catch (fetchErr) {
        console.warn(
          `Failed to fetch signature image ${signatureUrl}: ${fetchErr.message}`
        );
      }

      if (!signatureEmbedded) {
        // Fallback text if signature fails to load or embed
        page.drawText(" Signature failed to load", {
          x: margin + 20,
          y,
          size: 12,
          font,
          color: colors.textColor,
        });
        page.drawText(`(${signatureUrl})`, {
          x: margin + 20,
          y: y - 15,
          size: 8,
          font,
          color: colors.textColor,
        });
        y -= 30; // Move y down
      }
    }

    checkNewPage(60);

    page.drawText("GENERATED BY DREAM STUDIO", {
      x: margin,
      y: 25,
      size: 10,
      font: boldFont,
      color: colors.heading,
    });

    page.drawText("Professional Interior Design Solutions", {
      x: margin,
      y: 10,
      size: 9,
      font: font,
      color: colors.textLight,
    });

    // Date stamp
    const currentDate = dayjs().format("MMMM D, YYYY");

    page.drawText(`Report Generated: ${currentDate}`, {
      x: width - margin - 150,
      y: 15,
      size: 8,
      font,
      color: colors.textLight,
    });

    // Save the PDF document and return bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (e) {
    await prisma.clientImageSession.update({
      where: { id: Number(sessionData.id) },
      data: { error: true },
    });
    console.log(e, "error in pdf generator");
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
          <img src="https://dreamstudiio.com/main-logo.jpg" alt="Dream Studio" style="max-height: 60px;" />
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #383028;">Thank you, ${clientName}!</h2>
          <p>Your image session has been approved!</p>
          
          <div style="background: #f8f6f3; border-radius: 8px; padding: 20px; margin: 20px 0;">
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
          <img src="https://dreamstudiio.com/main-logo.jpg" alt="Dream Studio" style="max-height: 60px;" />
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
