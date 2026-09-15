#!/usr/bin/env node
// Capture the six README/launch-site screenshots from the deterministic Vite
// preview at 2x retina. Requires a running `bun run dev:web` instance at
// 127.0.0.1:51729. Idempotent: overwrites the existing files in place.

import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(repoRoot, "docs", "images");
await mkdir(outputDir, { recursive: true });

const routes = ["Home", "Explore", "Collections", "Teachers", "My library", "Settings"];
const filenames = ["home", "explore", "collections", "teachers", "library", "settings"];
const url = "http://127.0.0.1:51729/";

function cli(...args) {
  return execFileSync("playwright-cli", args, { stdio: "inherit", encoding: "utf8" });
}

try {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  await fetch(url, { signal: controller.signal });
  clearTimeout(timer);
} catch {
  console.error(`Vite preview not reachable at ${url}.`);
  console.error("Start it with `bun run dev:web` before running this script.");
  process.exit(1);
}

try {
  cli("-s=dhamma-screens", "open", url, "--browser=chrome", "--persistent");
} catch {
  console.error(`Failed to open ${url}.`);
  process.exit(1);
}

cli("-s=dhamma-screens", "resize", "1920", "1080");
cli(
  "-s=dhamma-screens",
  "run-code",
  "async page => { await page.emulateMedia({ deviceScaleFactor: 2 }); }"
);

for (let index = 0; index < routes.length; index += 1) {
  const route = routes[index];
  const filename = `${filenames[index]}.png`;
  const target = resolve(outputDir, filename);
  console.log(`Capturing ${route} -> docs/images/${filename}`);
  cli(
    "-s=dhamma-screens",
    "run-code",
    `async page => { const button = page.getByRole('button', { name: ${JSON.stringify(route)}, exact: true }); await button.click(); await page.waitForTimeout(220); }`
  );
  cli("-s=dhamma-screens", "screenshot", `--filename=${target}`);
}

cli("-s=dhamma-screens", "close");

for (const filename of filenames.map((name) => `${name}.png`)) {
  const info = await stat(resolve(outputDir, filename));
  console.log(`  ${filename}: ${(info.size / 1024).toFixed(1)} KiB`);
}

console.log(`Captured ${routes.length} screenshots into docs/images/.`);
