// HTTP-based upload helpers, ported VERBATIM from the former utilities/legacy/utility.js.
//  - uploadAsHttp: writes a single in-memory file to the public uploads dir (handler owns
//    its own HTTP response — the FROZEN client-portal chunk/http upload contract).
//  - uploadToFTPHttpAsBuffer: POSTs a buffer to the CRM upload endpoint (used by the
//    contract + image-session PDF paths). Behavior, logs, and quirks preserved 1:1.
import * as fs from "node:fs";
import * as path from "node:path";
import axios from "axios";
import FormData from "form-data";

// used
export async function uploadAsHttp(req, res) {
  try {
    const filename = req.file.originalname;
    const fileBuffer = req.file.buffer;

    const uploadDir = "/home/dreamstudiio.com/public_html/uploads";
    console.log(uploadDir, "uploadDir in uploadAsHttp");
    console.log(filename, "filename in uploadAsHttp");
    console.log(req.file, "req.file.size in uploadAsHttp");
    console.log(fileBuffer.length, "fileBuffer length in uploadAsHttp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const savePath = path.join(uploadDir, filename);
    console.log(savePath, "savePath in uploadAsHttp");
    fs.writeFileSync(savePath, fileBuffer);

    res.status(200).json({ message: "? Upload successful." });
  } catch (err) {
    console.error("? Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
function buildPublicUrl(remoteFilename, server = process.env.CRM_DOMAIN) {
  if (!remoteFilename) return "";

  // Grab everything starting from "/uploads"
  const i = remoteFilename.indexOf("/uploads");
  const uploadsPath = i >= 0 ? remoteFilename.slice(i) : remoteFilename;

  // Safe join: avoid double slashes
  const base = (server || "").replace(/\/+$/, "");
  const path = uploadsPath.startsWith("/") ? uploadsPath : `/${uploadsPath}`;

  return `${base}${path}`;
}
// used
export async function uploadToFTPHttpAsBuffer(
  source,
  remoteFilename,
  isBuffer = false,
) {
  console.log("Uploading to FTP via HTTP as buffer:", remoteFilename);
  console.log(source.length, "Buffer size in bytes");
  try {
    let buffer;

    if (isBuffer) {
      if (Buffer.isBuffer(source)) {
        buffer = source;
      } else if (source instanceof Uint8Array) {
        buffer = Buffer.from(source.buffer);
      } else {
        throw new Error("Invalid buffer source type.");
      }
    } else {
      throw new Error("HTTP upload expects a buffer.");
    }

    const form = new FormData();
    form.append("file", buffer, remoteFilename);

    await axios.post(`${process.env.SERVER_URL}/client/api/upload`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 10 * 60 * 1000,
    });
    const url = buildPublicUrl(remoteFilename);

    console.log(`? Uploaded via HTTP: ${url}`);
  } catch (err) {
    console.error(`? Failed to upload ${remoteFilename}:`, err.message);
    throw err;
  }
}
