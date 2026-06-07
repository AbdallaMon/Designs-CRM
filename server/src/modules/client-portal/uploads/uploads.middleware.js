// client-portal/uploads middleware — multer wiring for the PUBLIC client upload surface.
// 🔒 FROZEN MECHANISM: the legacy `routes/client/uploads.js` used multer with a disk `dest`
// for the chunk endpoint and in-memory storage for the single HTTP upload, then handed the
// request to the frozen `uploadAsChunk(req, res, tmpDir)` / `uploadAsHttp(req, res)` handlers.
// This wiring is reproduced VERBATIM (same tmp dir resolution, same multer config) so the
// chunk mechanism is unchanged — we only relocate it. The frozen handlers write the response
// themselves; nothing about their behavior is touched.
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Same on-disk tmp location as legacy: `<server-root>/routes/tmp/chunks`. Legacy resolved it
// from `routes/client/uploads.js` as `../tmp/chunks`; resolve to the identical absolute path
// here so chunks land in the SAME directory the frozen finalizer reads from.
export const chunkTmpDir = path.resolve(
  __dirname,
  "../../../../routes/tmp/chunks",
);
if (!fs.existsSync(chunkTmpDir)) fs.mkdirSync(chunkTmpDir, { recursive: true });

// disk storage for chunk parts (matches legacy `multer({ dest: tmpDir })`)
export const chunkUpload = multer({ dest: chunkTmpDir });

// in-memory storage for the single HTTP upload (matches legacy `multer.memoryStorage()`)
export const memoryUpload = multer({ storage: multer.memoryStorage() });
