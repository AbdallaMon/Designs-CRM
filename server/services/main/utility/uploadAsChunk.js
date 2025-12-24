import fs from "fs";
import path from "path";
import sharp from "sharp";
import mime from "mime-types";
import { v4 as uuidv4 } from "uuid";

const finalDir = "/home/dreamstudiio.com/public_html/uploads";
const thumbsDir = "/home/dreamstudiio.com/public_html/uploads/thumb";

if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

export async function uploadAsChunk(req, res, tmpDir) {
  try {
    const { filename, chunkIndex, totalChunks } = req.body;

    const originalName = path.basename(filename);
    const chunkNumber = Number.parseInt(chunkIndex, 10);
    const total = Number.parseInt(totalChunks, 10);

    if (!req.file?.path) {
      return res
        .status(400)
        .json({ error: "No chunk uploaded (req.file missing)" });
    }
    if (Number.isNaN(chunkNumber) || Number.isNaN(total)) {
      return res.status(400).json({ error: "Invalid chunkIndex/totalChunks" });
    }

    const chunkFilePath = path.join(
      tmpDir,
      `${originalName}.part${chunkNumber}`
    );
    fs.renameSync(req.file.path, chunkFilePath);

    // Not last chunk
    if (chunkNumber + 1 !== total) {
      return res.json({ message: `✅ Chunk ${chunkNumber + 1} received` });
    }

    // Last chunk => merge
    const uniqueFilename = `${uuidv4()}${path.extname(originalName)}`;
    const finalPath = path.join(finalDir, uniqueFilename);

    await mergeChunksToFile({
      tmpDir,
      originalName,
      totalChunks: total,
      finalPath,
    });

    const fileUrl = `/uploads/${uniqueFilename}`;
    const stat = fs.statSync(finalPath);
    const fileSize = stat.size;
    const fileMimeType = mime.lookup(uniqueFilename) || null;

    const thumbnailUrl = await tryMakeThumbnail({
      finalPath,
      uniqueFilename,
    });

    return res.json({
      message: "✅ Upload complete",
      url: fileUrl,
      thumbnailUrl, // ✅ will be /uploads/thumb/<thumbName>
      fileName: uniqueFilename,
      fileSize,
      fileMimeType,
    });
  } catch (e) {
    console.log("uploadAsChunk error:", e);
    return res.status(500).json({ error: "Upload failed" });
  }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function waitStreamFinish(stream) {
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function mergeChunksToFile({
  tmpDir,
  originalName,
  totalChunks,
  finalPath,
}) {
  ensureDir(path.dirname(finalPath));

  const writeStream = fs.createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const partPath = path.join(tmpDir, `${originalName}.part${i}`);
    if (!fs.existsSync(partPath)) {
      writeStream.destroy();
      throw new Error(`Missing chunk part: ${partPath}`);
    }
    const data = fs.readFileSync(partPath);
    writeStream.write(data);
    fs.unlinkSync(partPath);
  }

  writeStream.end();
  await waitStreamFinish(writeStream);
}

async function tryMakeThumbnail({ finalPath, uniqueFilename }) {
  ensureDir(thumbsDir);

  const ext = path.extname(uniqueFilename).toLowerCase();
  const supported = [".png", ".jpg", ".jpeg", ".webp"];
  if (!supported.includes(ext)) return null;

  const thumbName = `thumb_${path.parse(uniqueFilename).name}.webp`;
  const thumbPath = path.join(thumbsDir, thumbName);

  try {
    await sharp(finalPath)
      .rotate()
      .resize({ width: 420, withoutEnlargement: true })
      .webp({ quality: 50 })
      .toFile(thumbPath);

    // ✅ MATCHES thumbsDir = .../uploads/thumb
    return `/uploads/thumb/${thumbName}`;
  } catch (e) {
    console.log("thumbnail error:", e?.message || e);
    return null;
  }
}
