import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const candidates = [
  path.join(repoRoot, "server", "node_modules", "exceljs", "package.json"),
  path.join(repoRoot, "node_modules", "exceljs", "package.json"),
];
const manifestPath = candidates.find((candidate) => fs.existsSync(candidate));

if (!manifestPath) {
  throw new Error("exceljs package manifest was not found after install");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.version !== "4.4.0") {
  throw new Error(`Unsupported exceljs version: ${manifest.version}`);
}

const currentRange = manifest.dependencies?.uuid;
if (!["^8.3.0", "^11.1.1"].includes(currentRange)) {
  throw new Error(`Unexpected exceljs uuid range: ${currentRange}`);
}

if (currentRange !== "^11.1.1") {
  manifest.dependencies.uuid = "^11.1.1";
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
