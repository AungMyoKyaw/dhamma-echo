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
  [css.includes("--color-error"), "accessible playback error token"],
  [css.includes(".bg-app"), "generated Tailwind utilities"],
  [
    css.includes(
      "grid-template-columns: minmax(180px, 0.9fr) minmax(340px, 1.45fr) minmax(210px, 0.9fr);"
    ),
    "compact three-column player grid"
  ],
  [css.includes(".search-form"), "responsive search styling"],
  [css.includes(".transport-button"), "transport control styling"],
  [css.includes(".transport-button-primary"), "primary transport styling"],
  [css.includes(".player-controls"), "player control grouping"],
  [css.includes(".player-volume-control"), "volume control grouping"],
  [css.includes("@media (max-width: 980px)"), "compact player breakpoint"],
  [css.includes(".pb-40"), "player content clearance"],
  [!html.includes("http://") && !html.includes("https://"), "no remote page assets"]
];

for (const [passed, label] of checks) {
  if (!passed) throw new Error(`Web smoke check failed: ${label}`);
}

const totalBytes = (
  await Promise.all(required.map(async (path) => (await stat(path)).size))
).reduce((sum, size) => sum + size, 0);
console.log(`web smoke: ${checks.length} checks passed; required assets ${totalBytes} bytes`);
