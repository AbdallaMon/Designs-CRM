import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { constants } from "node:fs";

function option(name) {
  const prefix = `--${name}=`;
  const item = process.argv.find((arg) => arg.startsWith(prefix));
  return item ? item.slice(prefix.length) : null;
}

function inside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function lstatOrNull(filename) {
  try {
    return await fs.lstat(filename);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertNoSymlinkComponents(absolutePath, { mustExist = false } = {}) {
  const resolved = path.resolve(absolutePath);
  const parsed = path.parse(resolved);
  const segments = resolved.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let current = parsed.root;

  for (const segment of segments) {
    current = path.join(current, segment);
    const info = await lstatOrNull(current);
    if (!info) {
      if (mustExist) throw new Error(`Required path does not exist: ${current}`);
      break;
    }
    if (info.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${current}`);
    }
  }
}

async function hashFile(filename) {
  const hash = createHash("sha256");
  const handle = await fs.open(filename, "r");
  try {
    for await (const chunk of handle.createReadStream()) hash.update(chunk);
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

async function walk(root, current = root, files = []) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${absolute}`);
    }
    if (entry.isDirectory()) await walk(root, absolute, files);
    else if (entry.isFile()) files.push(path.relative(root, absolute));
  }
  return files;
}

export async function copyUploadStorage({
  source = option("source") || process.env.LEGACY_UPLOAD_DIR,
  target = option("target") || process.env.UPLOAD_DIR,
  apply = process.argv.includes("--apply"),
} = {}) {
  if (!source || !target) {
    throw new Error("Provide --source and --target, or LEGACY_UPLOAD_DIR and UPLOAD_DIR");
  }
  const sourceRoot = path.resolve(source);
  const targetRoot = path.resolve(target);
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (sourceRoot === targetRoot || inside(sourceRoot, targetRoot) || inside(targetRoot, sourceRoot)) {
    throw new Error("Source and target must be separate, non-nested directories");
  }
  if (inside(repositoryRoot, targetRoot)) {
    throw new Error("Target storage must be outside the repository");
  }
  await assertNoSymlinkComponents(sourceRoot, { mustExist: true });
  await assertNoSymlinkComponents(targetRoot);
  const sourceStat = await fs.lstat(sourceRoot);
  if (!sourceStat.isDirectory()) throw new Error("Source is not a directory");

  const targetRootInfo = await lstatOrNull(targetRoot);
  if (targetRootInfo && !targetRootInfo.isDirectory()) {
    throw new Error("Target is not a directory");
  }

  const files = await walk(sourceRoot);
  const summary = {
    mode: apply ? "apply" : "dry-run",
    source: sourceRoot,
    target: targetRoot,
    files: files.length,
    copied: 0,
    pending: 0,
    identical: 0,
    conflicts: [],
    bytes: 0,
  };

  for (const relative of files) {
    const sourceFile = path.join(sourceRoot, relative);
    const targetFile = path.join(targetRoot, relative);
    const sourceInfo = await fs.stat(sourceFile);
    summary.bytes += sourceInfo.size;
    const targetInfo = await lstatOrNull(targetFile);

    if (targetInfo) {
      if (targetInfo.isSymbolicLink()) {
        summary.conflicts.push({ relative, reason: "target is a symbolic link" });
        continue;
      }
      if (!targetInfo.isFile()) {
        summary.conflicts.push({ relative, reason: "target is not a file" });
        continue;
      }
      const [sourceHash, targetHash] = await Promise.all([
        hashFile(sourceFile),
        hashFile(targetFile),
      ]);
      if (sourceHash !== targetHash) {
        summary.conflicts.push({ relative, reason: "different content" });
      } else {
        summary.identical += 1;
      }
      continue;
    }

    if (apply) {
      await fs.mkdir(path.dirname(targetFile), { recursive: true });
      await assertNoSymlinkComponents(path.dirname(targetFile), { mustExist: true });
      await fs.copyFile(sourceFile, targetFile, constants.COPYFILE_EXCL);
      const [sourceHash, targetHash] = await Promise.all([
        hashFile(sourceFile),
        hashFile(targetFile),
      ]);
      if (sourceHash !== targetHash) {
        throw new Error(`Checksum verification failed: ${relative}`);
      }
      await fs.chmod(targetFile, sourceInfo.mode);
      await fs.utimes(targetFile, sourceInfo.atime, sourceInfo.mtime);
    }
    if (apply) summary.copied += 1;
    else summary.pending += 1;
  }

  if (summary.conflicts.length > 0) {
    throw new Error(
      `Found ${summary.conflicts.length} target conflict(s); no conflicting file was overwritten`,
    );
  }
  return summary;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  copyUploadStorage()
    .then((summary) => console.log(JSON.stringify(summary, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
