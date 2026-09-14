#!/usr/bin/env node
// Enforce the negative-space constraints in DESIGN.md across app-facing source
// and generated-asset inputs. The canonical design.md linter validates the
// spec itself; this script catches implementation drift the upstream CLI does
// not inspect: rogue colors, gradients/blur, and retired semantic color roles.

import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const designPath = resolve(repoRoot, "DESIGN.md");
const scanRoots = [resolve(repoRoot, "src"), resolve(repoRoot, "public")];
const explicitFiles = [resolve(repoRoot, "scripts/generate-icons.py")];
const sourceExtensions = new Set([".css", ".py", ".svelte", ".svg", ".ts"]);
const visualExtensions = new Set([".css", ".svelte", ".svg"]);

const prohibitedVisualPatterns = [
  { label: "gradient", pattern: /(?:linear|radial)-gradient\s*\(|<(?:linear|radial)Gradient\b/iu },
  { label: "backdrop blur", pattern: /backdrop-(?:filter|blur)|backdrop-filter\s*:/iu },
  { label: "filter blur", pattern: /filter\s*:\s*blur\s*\(/iu }
];
const retiredRoles = ["app-secondary", "app-tertiary"];
const hexPattern = /#[0-9a-f]{3,8}\b/giu;

function designColors(markdown) {
  const match = /^colors:\s*\n([\s\S]*?)(?=^[a-z][a-z-]*:\s*(?:\n|$))/mu.exec(markdown);
  if (match === null) throw new Error("DESIGN.md colors block not found.");
  return new Set(
    [...match[1].matchAll(/:\s*["']?(#[0-9a-f]{6})["']?\s*$/gimu)].map((entry) =>
      entry[1].toLowerCase()
    )
  );
}

async function sourceFiles(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && sourceExtensions.has(extname(entry.name)))
    .map((entry) => resolve(entry.parentPath, entry.name));
}

try {
  const allowedColors = designColors(await readFile(designPath, "utf8"));
  const nested = await Promise.all(scanRoots.map(sourceFiles));
  const files = [...nested.flat(), ...explicitFiles];
  const failures = [];
  let colorReferences = 0;

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const displayPath = relative(repoRoot, file);
    const colors = [...text.matchAll(hexPattern)].map((match) => match[0].toLowerCase());
    colorReferences += colors.length;
    for (const color of colors) {
      if (!allowedColors.has(color)) {
        failures.push(`${displayPath}: rogue color ${color} is not declared in DESIGN.md`);
      }
    }

    if (visualExtensions.has(extname(file))) {
      for (const { label, pattern } of prohibitedVisualPatterns) {
        if (pattern.test(text)) failures.push(`${displayPath}: prohibited ${label}`);
      }
    }

    for (const role of retiredRoles) {
      if (text.includes(role)) failures.push(`${displayPath}: retired color role ${role}`);
    }
  }

  if (failures.length > 0) {
    console.error(`design:assets:check failed with ${failures.length} finding(s):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log(
    `design:assets:check OK — ${files.length} source file(s), ${colorReferences} color reference(s), 0 rogue colors / gradients / blur / retired roles.`
  );
} catch (error) {
  console.error(`design:assets:check failed: ${error.message}`);
  process.exit(2);
}
