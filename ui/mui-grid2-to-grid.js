// Replace "Grid2 as Grid", bare "Grid2" specifiers, JSX <Grid2>, and path imports.
// Usage (from project root, Windows cmd is fine):  node scripts\replace-grid2.js src
const fs = require("fs");
const path = require("path");

const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ignoreDirs = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
]);

let filesScanned = 0,
  filesChanged = 0,
  replacements = 0;

function shouldIgnoreDir(name) {
  return ignoreDirs.has(name);
}

async function walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!shouldIgnoreDir(e.name)) await walk(full);
    } else if (exts.has(path.extname(e.name))) {
      await processFile(full);
    }
  }
}

function countMatches(str, re) {
  const m = str.match(re);
  return m ? m.length : 0;
}

async function processFile(file) {
  filesScanned++;
  let src = await fs.promises.readFile(file, "utf8");
  let changed = false;
  let localCount = 0;

  // 1) Alias form inside any import: "Grid2 as Grid" or "Unstable_Grid2 as Grid" → "Grid"
  const aliasRe = /\b(?:Unstable_Grid2|Grid2)\s+as\s+Grid\b/g;
  localCount += countMatches(src, aliasRe);
  src = src.replace(aliasRe, "Grid");

  // 2) Barrel imports: change bare specifier names within "@mui/material" only
  //    import { Grid2, ... } from "@mui/material"
  const barrelRe = /import\s*{([^}]*)}\s*from\s*["']@mui\/material["']/g;
  src = src.replace(barrelRe, (full, inside) => {
    let before = inside;
    // Replace bare tokens Grid2 / Unstable_Grid2 (but not stuff like MyGrid2)
    inside = inside.replace(/\b(?:Unstable_Grid2|Grid2)\b/g, (m) => {
      localCount++;
      return "Grid";
    });

    // (Optional) tiny de-dup for multiple "Grid" in the list
    // This keeps order and formatting reasonable.
    const parts = inside.split(",").map((s) => s);
    const seenGrid = { name: false };
    const cleaned = [];
    for (const p of parts) {
      const name = p.trim();
      if (name === "Grid") {
        if (!seenGrid.name) {
          cleaned.push(p);
          seenGrid.name = true;
        } else {
          // drop duplicate Grid; still count as a change
          changed = true;
        }
      } else {
        cleaned.push(p);
      }
    }
    if (inside !== cleaned.join(",")) {
      inside = cleaned.join(",");
      changed = true;
    }

    if (inside !== before) changed = true;
    return `import {${inside}} from "@mui/material"`;
  });

  // 3) Path imports → default Grid from "@mui/material/Grid"
  //    import X from "@mui/material/Grid2" or ".../Unstable_Grid2"
  const pathDefaultRe =
    /import\s+([A-Za-z_$][\w$]*)\s+from\s+["']@mui\/material\/(?:Unstable_Grid2|Grid2)["']/g;
  if (pathDefaultRe.test(src)) {
    src = src.replace(pathDefaultRe, (_full, _local) => {
      localCount++;
      return 'import Grid from "@mui/material/Grid"';
    });
    changed = true;
  }
  //    Named from path (rare): import { Grid2 } from "@mui/material/Grid2"
  const pathNamedRe =
    /import\s*{[^}]*}\s*from\s*["']@mui\/material\/(?:Unstable_Grid2|Grid2)["']/g;
  if (pathNamedRe.test(src)) {
    const cnt = countMatches(src, pathNamedRe);
    localCount += cnt;
    // normalize to default import Grid
    src = src.replace(pathNamedRe, 'import Grid from "@mui/material/Grid"');
    changed = true;
  }

  // 4) JSX tags: <Grid2 ...> </Grid2> → <Grid ...> </Grid>
  const jsxOpenRe = /<\s*Grid2(\s|>|\/)/g;
  const jsxCloseRe = /<\/\s*Grid2\s*>/g;
  localCount += countMatches(src, jsxOpenRe);
  localCount += countMatches(src, jsxCloseRe);
  src = src.replace(jsxOpenRe, (_m, tail) => "<Grid" + tail);
  src = src.replace(jsxCloseRe, "</Grid>");

  if (localCount > 0) {
    await fs.promises.writeFile(file, src, "utf8");
    filesChanged++;
    replacements += localCount;
    changed = true;
    console.log(`Updated ${file} (+${localCount})`);
  }

  return changed;
}

(async () => {
  const root = process.argv[2] || "src";
  try {
    await walk(root);
    console.log(
      `\nDone. Scanned ${filesScanned} files, changed ${filesChanged}, total replacements ${replacements}.`
    );
    console.log("Tip: run your formatter / eslint --fix afterwards.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
