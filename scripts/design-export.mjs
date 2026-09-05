#!/usr/bin/env node
// Print the Tailwind v4 `@theme` block generated from DESIGN.md frontmatter.
// Defaults to printing to stdout; pass a path as the first argument to write to a file.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const designPath = resolve(repoRoot, process.argv[2] ?? "DESIGN.md");
const outputPath = process.argv[3] === undefined ? null : resolve(repoRoot, process.argv[3]);

try {
  const designMarkdown = await readFile(designPath, "utf8");
  const moduleUrl = new URL("../.test-build/src/designTokens.js", import.meta.url);
  const tsModule = await import(moduleUrl.href);
  const { parseDesignFrontmatter, formatTailwindTheme } = tsModule;

  const tokens = parseDesignFrontmatter(designMarkdown);
  const css = formatTailwindTheme(tokens);

  if (outputPath === null) {
    process.stdout.write(css);
  } else {
    await writeFile(outputPath, css, "utf8");
    console.error(`design:export wrote ${css.length} bytes to ${outputPath}.`);
  }
  process.exit(0);
} catch (error) {
  console.error(`design:export failed: ${error.message}`);
  process.exit(2);
}