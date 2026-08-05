import { access, readFile, stat } from "node:fs/promises";
import { inflateSync } from "node:zlib";

const required = [
  "src-tauri/icons/app-icon.png",
  "src-tauri/icons/32x32.png",
  "src-tauri/icons/128x128.png",
  "src-tauri/icons/128x128@2x.png",
  "src-tauri/icons/icon.icns",
  "src-tauri/icons/icon.ico"
];

const expectedPngSizes = new Map([
  ["src-tauri/icons/app-icon.png", [1024, 1024]],
  ["src-tauri/icons/32x32.png", [32, 32]],
  ["src-tauri/icons/128x128.png", [128, 128]],
  ["src-tauri/icons/128x128@2x.png", [256, 256]]
]);

function paeth(left, above, upperLeft) {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodeRgbaPng(buffer, path) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error(`${path}: invalid PNG signature`);

  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const [bitDepth, colorType, compression, filter, interlace] = data.subarray(8, 13);
      if (
        bitDepth !== 8 ||
        colorType !== 6 ||
        compression !== 0 ||
        filter !== 0 ||
        interlace !== 0
      ) {
        throw new Error(`${path}: expected non-interlaced 8-bit RGBA PNG`);
      }
    }
    if (type === "IDAT") idat.push(data);
    if (type === "IEND") break;
    offset += length + 12;
  }

  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (rowLength + 1);
    const filterType = raw[sourceOffset];
    for (let x = 0; x < rowLength; x += 1) {
      const value = raw[sourceOffset + 1 + x];
      const left = x >= bytesPerPixel ? pixels[y * rowLength + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[(y - 1) * rowLength + x] : 0;
      const upperLeft =
        y > 0 && x >= bytesPerPixel ? pixels[(y - 1) * rowLength + x - bytesPerPixel] : 0;
      const decoded =
        filterType === 0
          ? value
          : filterType === 1
            ? value + left
            : filterType === 2
              ? value + above
              : filterType === 3
                ? value + Math.floor((left + above) / 2)
                : filterType === 4
                  ? value + paeth(left, above, upperLeft)
                  : Number.NaN;
      if (!Number.isFinite(decoded))
        throw new Error(`${path}: unsupported PNG filter ${filterType}`);
      pixels[y * rowLength + x] = decoded & 0xff;
    }
  }
  return { width, height, pixels, rowLength };
}

function alphaBounds(png) {
  let left = png.width;
  let top = png.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.pixels[y * png.rowLength + x * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : [left, top, right + 1, bottom + 1];
}

for (const path of required) await access(path);

for (const [path, expected] of expectedPngSizes) {
  const png = decodeRgbaPng(await readFile(path), path);
  if (png.width !== expected[0] || png.height !== expected[1]) {
    throw new Error(`${path}: expected ${expected.join("x")}, got ${png.width}x${png.height}`);
  }
  if (path.endsWith("app-icon.png")) {
    const bounds = alphaBounds(png);
    if (
      bounds === null ||
      bounds[0] < 88 ||
      bounds[0] > 104 ||
      bounds[1] < 88 ||
      bounds[1] > 104 ||
      bounds[2] < 920 ||
      bounds[2] > 936 ||
      bounds[3] < 920 ||
      bounds[3] > 936
    ) {
      throw new Error(`${path}: unexpected artwork bounds ${JSON.stringify(bounds)}`);
    }
    const cornerAlpha = [
      png.pixels[3],
      png.pixels[(png.width - 1) * 4 + 3],
      png.pixels[(png.height - 1) * png.rowLength + 3],
      png.pixels[(png.height - 1) * png.rowLength + (png.width - 1) * 4 + 3]
    ];
    if (cornerAlpha.some((alpha) => alpha !== 0))
      throw new Error(`${path}: corners must be transparent`);
    console.log(`icon geometry: ${png.width}x${png.height}; artwork bounds ${bounds.join(",")}`);
  }
}

const config = JSON.parse(await readFile("src-tauri/tauri.conf.json", "utf8"));
for (const path of required.slice(1)) {
  const configuredPath = path.replace("src-tauri/", "");
  if (!config.bundle.icon.includes(configuredPath)) {
    throw new Error(`Tauri icon config is missing ${configuredPath}`);
  }
}

const icns = await readFile("src-tauri/icons/icon.icns");
if (!icns.subarray(0, 4).equals(Buffer.from("icns"))) throw new Error("icon.icns: invalid header");
const ico = await readFile("src-tauri/icons/icon.ico");
if (!ico.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0])))
  throw new Error("icon.ico: invalid header");

const totalBytes = (
  await Promise.all(required.map(async (path) => (await stat(path)).size))
).reduce((sum, size) => sum + size, 0);
console.log(`icon verification: ${required.length} assets; ${totalBytes} bytes`);
