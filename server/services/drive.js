// app.js (or your main server file)

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";

// --- Google Drive Configuration ---
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load credentials from environment variables
const GOOGLE_SA_CLIENT_EMAIL = process.env.GOOGLE_SA_CLIENT_EMAIL;
const GOOGLE_SA_PRIVATE_KEY = process.env.GOOGLE_SA_PRIVATE_KEY;
const GOOGLE_DRIVE_UPLOAD_FOLDER_ID = process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID; // Optional folder ID

// Define the scopes needed for Google Drive
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

let driveClient; // Will hold our authenticated Google Drive client

async function initializeGoogleDriveClient() {
  try {
    // Only proceed if key is actually set and seems somewhat valid
    if (
      !GOOGLE_SA_PRIVATE_KEY ||
      !GOOGLE_SA_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----")
    ) {
      throw new Error("Private key is not valid or not loaded correctly.");
    }

    const jwtClient = new JWT({
      key: GOOGLE_SA_PRIVATE_KEY,
      email: GOOGLE_SA_CLIENT_EMAIL,
      scopes: SCOPES,
    });

    await jwtClient.authorize();
    console.log("Google Drive Service Account Authenticated!");
    driveClient = google.drive({ version: "v3", auth: jwtClient });
  } catch (error) {
    console.error("Error initializing Google Drive client:", error.message);
    console.error(
      "Ensure GOOGLE_SA_PRIVATE_KEY is correctly formatted (newlines are real newlines, not \\n)."
    );
    process.exit(1); // Re-add this after more specific debugging
  }
}

// Initialize the client once when the server starts
// We'll call this explicitly when starting the server in the example
// Or you can call it here if you prefer a global variable for the client:
// let driveClientPromise = initializeGoogleDriveClient();

// --- Multer Configuration ---
const tmpFolder = path.resolve(__dirname, "tmp");
if (!fs.existsSync(tmpFolder)) {
  fs.mkdirSync(tmpFolder, { recursive: true });
}

// Corrected Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpFolder); // Save files to the tmp directory
  },
  filename: (req, file, cb) => {
    // This is the problematic line!
    const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`; // CORRECTED SYNTAX
    cb(null, uniqueFilename);
  },
});

// Multer limit for temporary storage (e.g., 500MB)
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // Adjust as needed
}).any();

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err.message);
  }
}

// --- Google Drive Upload Function ---
async function uploadToGoogleDrive(filePath, originalFileName, mimeType) {
  if (!driveClient) {
    // This should not happen if initializeGoogleDriveClient is called on startup
    await initializeGoogleDriveClient();
  }

  try {
    const fileMetadata = {
      name: originalFileName,
    };

    // If a specific folder ID is provided in .env, add it to metadata
    if (GOOGLE_DRIVE_UPLOAD_FOLDER_ID) {
      fileMetadata.parents = [GOOGLE_DRIVE_UPLOAD_FOLDER_ID];
    }

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };
    const response = await driveClient.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, mimeType, webViewLink, webContentLink",
    });

    const fileId = response.data.id;

    // Make the file publicly readable and get the shareable link
    await driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone", // Makes it publicly accessible
      },
    });
    // Get updated file info with public link after setting permissions
    const updatedFile = await driveClient.files.get({
      fileId: fileId,
      fields: "webViewLink",
    });

    const shareableLink = updatedFile.data.webViewLink;

    console.log(`Shareable link: ${shareableLink}`);
    return {
      id: fileId,
      name: response.data.name,
      mimeType: response.data.mimeType,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      shareableLink: shareableLink,
    };
  } catch (error) {
    console.error(
      `Failed to upload ${originalFileName} to Google Drive:`,
      error.message
    );
    if (error.code && error.errors) {
      console.error("Google API Error Details:", error.errors);
    }
    throw error;
  }
}

export const uploadFilesFromDrive = async (req, res) => {
  try {
    const fileUrls = {}; // Object to store URLs of uploaded files

    await new Promise((resolve, reject) => {
      upload(req, res, async (err) => {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return reject(
              new Error(
                "File size exceeds the allowed limit for temporary storage."
              )
            );
          }
          return reject(err);
        } else if (!req.files || req.files.length === 0) {
          return reject(new Error("No files uploaded."));
        } else {
          try {
            const uploadPromises = req.files.map(async (file) => {
              const uploadedFileInfo = await uploadToGoogleDrive(
                file.path,
                file.originalname,
                file.mimetype
              );
              const fieldName = file.fieldname;

              if (!fileUrls[fieldName]) fileUrls[fieldName] = [];
              fileUrls[fieldName].push(uploadedFileInfo.shareableLink);

              deleteFile(file.path);
            });
            await Promise.all(uploadPromises);
            resolve();
          } catch (uploadErr) {
            reject(uploadErr);
          }
        }
      });
    });

    res.status(200).json({ message: "Files uploaded successfully.", fileUrls });
  } catch (error) {
    console.error("Error during file upload process:", error.message);
    if (error.message.includes("File size exceeds the allowed limit")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || "Failed to upload files." });
  }
};
