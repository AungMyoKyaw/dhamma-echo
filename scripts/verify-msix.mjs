// Validate MSIX Store assets and the manifest template.
// Run by `bun run icons:msix:check` and the CI workflow.
//
// The manifest is committed with placeholders that the release workflow
// substitutes for the Tauri version and Partner Center publisher. This
// script fails fast if a contributor accidentally commits a manifest
// without the placeholders, or if any of the required Microsoft Store
// PNG tiles is missing or the wrong size.

import { access, readFile } from "node:fs/promises";

const manifestPath = "src-tauri/msix/Package.appxmanifest.xml";
const requiredAssets = [
  ["src-tauri/msix/Assets/StoreLogo.png", 50, 50],
  ["src-tauri/msix/Assets/Square44x44Logo.png", 44, 44],
  ["src-tauri/msix/Assets/Square71x71Logo.png", 71, 71],
  ["src-tauri/msix/Assets/Square150x150Logo.png", 150, 150],
  ["src-tauri/msix/Assets/Square310x310Logo.png", 310, 310],
  ["src-tauri/msix/Assets/Wide310x150Logo.png", 310, 150]
];

function decodePngSize(buffer, path) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) {
    throw new Error(`${path}: not a PNG`);
  }
  if (buffer.length < 24) throw new Error(`${path}: truncated PNG`);
  if (buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${path}: missing IHDR chunk`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25]
  };
}

await access(manifestPath);
const manifest = await readFile(manifestPath, "utf8");
for (const token of ["__APP_VERSION__", "__PUBLISHER__"]) {
  if (!manifest.includes(token)) {
    throw new Error(`${manifestPath}: missing placeholder ${token}`);
  }
}

for (const [path, expectedWidth, expectedHeight] of requiredAssets) {
  await access(path);
  const buffer = await readFile(path);
  const { width, height, colorType } = decodePngSize(buffer, path);
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(`${path}: expected ${expectedWidth}x${expectedHeight}, got ${width}x${height}`);
  }
  if (colorType !== 6) {
    throw new Error(`${path}: expected RGBA PNG (color type 6), got ${colorType}`);
  }
}

console.log(`msix verification: manifest template + ${requiredAssets.length} assets ok`);
