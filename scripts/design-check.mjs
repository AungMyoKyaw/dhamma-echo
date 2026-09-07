#!/usr/bin/env node
// Compare DESIGN.md frontmatter tokens against `src/index.css` custom properties.
// Exits 0 when the design and implementation agree, 1 on drift, 2 on a script error.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const designPath = resolve(repoRoot, process.argv[2] ?? "DESIGN.md");
const cssPath = resolve(repoRoot, process.argv[3] ?? "src/index.css");

try {
  const [designMarkdown, css] = await Promise.all([
    readFile(designPath, "utf8"),
    readFile(cssPath, "utf8")
  ]);

  const moduleUrl = new URL("../.test-build/src/designTokens.js", import.meta.url);
  const tsModule = await import(moduleUrl.href);
  const { parseDesignFrontmatter, loadCssTokens, compareTokens } = tsModule;

  const design = parseDesignFrontmatter(designMarkdown);
  const cssTokens = loadCssTokens(css);
  const drift = compareTokens(design, cssTokens);

  if (
    drift.missingFromCss.length === 0 &&
    drift.missingFromDesign.length === 0 &&
    drift.valueMismatches.length === 0
  ) {
    const tokenCount = Object.values(design).reduce(
      (sum, group) => sum + Object.keys(group).length,
      0
    );
    console.log(
      `design:check OK —${tokenCount} token(s) match between DESIGN.md and src/index.css.`
    );
    process.exit(0);
  }

  if (drift.missingFromCss.length > 0) {
    console.error(
      `design:check: ${drift.missingFromCss.length} token(s) defined in DESIGN.md missing from src/index.css:`
    );
    for (const path of drift.missingFromCss) console.error(`  - ${path}`);
  }
  if (drift.missingFromDesign.length > 0) {
    console.error(
      `design:check: ${drift.missingFromDesign.length} css-only token(s) not declared in DESIGN.md:`
    );
    for (const path of drift.missingFromDesign) console.error(`  - ${path}`);
  }
  if (drift.valueMismatches.length > 0) {
    console.error(
      `design:check: ${drift.valueMismatches.length} value mismatch(es) between DESIGN.md and src/index.css:`
    );
    for (const mismatch of drift.valueMismatches) {
      console.error(`  - ${mismatch.path}: design=${mismatch.design} css=${mismatch.css}`);
    }
  }
  process.exit(1);
} catch (error) {
  console.error(`design:check failed: ${error.message}`);
  process.exit(2);
}
