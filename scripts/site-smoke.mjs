import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(root, "docs");
const htmlPath = path.join(docsRoot, "index.html");
const screenshotPath = path.join(docsRoot, "images", "explore.png");
const textAssetLimit = 100 * 1024;

function isIgnoredReference(value) {
  return (
    value.startsWith("#") ||
    value.startsWith("data:") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("javascript:")
  );
}

function assertInsideDocs(filePath, reference) {
  const relative = path.relative(docsRoot, filePath);
  assert.ok(
    relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    `Reference escapes docs/: ${reference}`
  );
}

function localReferences(html) {
  const references = [];
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const value = match[1];
    if (isIgnoredReference(value) || /^https?:\/\//i.test(value)) {
      continue;
    }
    references.push(value.split(/[?#]/, 1)[0]);
  }
  return [...new Set(references)];
}

function duplicateIds(html) {
  const counts = new Map();
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1);
}

function remoteRuntimeAssets(html) {
  const matches = [];
  for (const match of html.matchAll(
    /<(script|link|img|iframe)\b[^>]*(?:src|href)="(https?:\/\/[^"]+)"[^>]*>/gi
  )) {
    matches.push(`${match[1]}:${match[2]}`);
  }
  return matches;
}

async function main() {
  const html = await readFile(htmlPath, "utf8");

  assert.doesNotMatch(
    html,
    /(?:file:\/\/|\/Users\/|\/home\/|\/mnt\/|\{\{[^}]+\}\})/,
    "Product site contains a local path or unresolved template value"
  );
  assert.deepEqual(duplicateIds(html), [], "Product site contains duplicate IDs");
  assert.deepEqual(remoteRuntimeAssets(html), [], "Product site contains remote runtime assets");

  const references = localReferences(html);
  let totalBytes = 0;
  for (const reference of references) {
    let resolved = path.resolve(docsRoot, reference);
    assertInsideDocs(resolved, reference);
    let info = await stat(resolved);
    if (info.isDirectory()) {
      resolved = path.join(resolved, "index.html");
      assertInsideDocs(resolved, reference);
      info = await stat(resolved);
    }
    assert.ok(info.isFile(), `Referenced asset is not a file: ${reference}`);
    totalBytes += info.size;
  }

  const screenshot = await stat(screenshotPath);
  assert.ok(screenshot.isFile(), "Supplied Dhamma Echo screenshot is missing");
  assert.ok(screenshot.size > 100 * 1024, "Supplied Dhamma Echo screenshot is unexpectedly small");
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const screenshotHead = await readFile(screenshotPath, { flag: "r" });
  assert.ok(
    screenshotHead.subarray(0, 8).equals(pngSignature),
    "Supplied Dhamma Echo screenshot is not a valid PNG"
  );
  const width = screenshotHead.readUInt32BE(16);
  const height = screenshotHead.readUInt32BE(20);
  assert.ok(width >= 1920 && height >= 1080, `Supplied Dhamma Echo screenshot must be at least 1920x1080, got ${width}x${height}`);
  for (const filename of [
    "home.png",
    "explore.png",
    "collections.png",
    "teachers.png",
    "library.png",
    "settings.png"
  ]) {
    const info = await stat(path.join(docsRoot, "images", filename));
    assert.ok(info.isFile(), `${filename} is missing from docs/images`);
    assert.ok(info.size > 50 * 1024, `${filename} is too small`);
  }

  for (const relative of ["index.html", "assets/site.css", "assets/site.js", "assets/logo.svg"]) {
    const info = await stat(path.join(docsRoot, relative));
    assert.ok(info.size < textAssetLimit, `${relative} exceeds the 100 KiB static asset budget`);
  }

  console.log(
    `Product site smoke checks passed: ${references.length} local assets, ${totalBytes.toLocaleString("en-US")} bytes referenced.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
