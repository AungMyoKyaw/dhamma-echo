import { access, readFile, stat } from "node:fs/promises";

const required = [
  "dist/index.html",
  "dist/main.js",
  "dist/assets/app.css",
  "dist/logo.svg",
  "dist/empty-library.svg"
];

for (const path of required) await access(path);

const [html, javascript, css] = await Promise.all([
  readFile("dist/index.html", "utf8"),
  readFile("dist/main.js", "utf8"),
  readFile("dist/assets/app.css", "utf8")
]);

const checks = [
  [html.includes('<div id="app"></div>'), "application root"],
  [html.includes('import { bootstrap } from "./main.js"'), "browser bootstrap"],
  [javascript.includes("bootstrap"), "compiled application entry"],
  [css.includes("--color-app-primary"), "design tokens"],
  [css.includes(".bg-app"), "generated Tailwind utilities"],
  [!html.includes("http://") && !html.includes("https://"), "no remote page assets"]
];

for (const [passed, label] of checks) {
  if (!passed) throw new Error(`Web smoke check failed: ${label}`);
}

const totalBytes = (await Promise.all(required.map(async (path) => (await stat(path)).size))).reduce(
  (sum, size) => sum + size,
  0
);
console.log(`web smoke: ${checks.length} checks passed; required assets ${totalBytes} bytes`);
