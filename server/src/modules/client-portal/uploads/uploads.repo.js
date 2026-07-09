// client-portal/uploads repo — 🔒 FROZEN filesystem I/O for the chunked upload finalizer.
// Every helper here is relocated VERBATIM from the legacy `services/main/utility/uploadAsChunk.js`
// (via `client-portal/uploads/legacy/upload-as-chunk.js`); no logic, path, or timing change.
//
// ⚠️ HARDCODED PROD PATHS (kept verbatim — flagged for a later config pass, NOT changed here):
// the final upload dir and thumbnail dir are absolute prod paths. ⚠️ IMPORT-TIME SIDE EFFECT:
// the `mkdirSync` calls below run when this module is first LOADED (which the usecase triggers
// lazily on the first upload request via the controller's dynamic import) — that timing is
// preserved exactly; do not import this module eagerly at boot.
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const finalDir = "/home/dreamstudiio.com/public_html/uploads";
export const thumbsDir = "/home/dreamstudiio.com/public_html/uploads/thumb";

if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function waitStreamFinish(stream) {
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

export class UploadsRepository {
  // Move the received chunk part into the tmp dir under its part name (fs.renameSync verbatim).
  renameChunk(fromPath, toPath) {
    return fs.renameSync(fromPath, toPath);
  }

  // Stat the finalized file (fs.statSync verbatim) — the caller reads `.size`.
  statFile(p) {
    return fs.statSync(p);
  }

  async mergeChunksToFile({ tmpDir, originalName, totalChunks, finalPath }) {
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

  async tryMakeThumbnail({ finalPath, uniqueFilename }) {
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
}

export const uploadsRepository = new UploadsRepository();
