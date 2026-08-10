import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const fixed = ["dist/index.html", "dist/logo.svg", "dist/empty-library.svg"];
for (const path of fixed) await access(path);
const assets = (await readdir("dist/assets")).map((name) => join("dist/assets", name));
const javascriptPath = assets.find((path) => path.endsWith(".js"));
const cssPath = assets.find((path) => path.endsWith(".css"));
if (javascriptPath === undefined || cssPath === undefined)
  throw new Error("Web smoke check failed: Vite assets");
const [html, javascript, css] = await Promise.all([
  readFile("dist/index.html", "utf8"),
  readFile(javascriptPath, "utf8"),
  readFile(cssPath, "utf8")
]);
const checks = [
  [html.includes('<div id="app"></div>'), "application root"],
  [/<script[^>]+type="module"[^>]+src="\.\/assets\/[^"]+\.js"/.test(html), "Vite module entry"],
  [javascript.length > 1000, "compiled Svelte application"],
  [css.includes("--color-app-primary"), "design tokens"],
  [css.includes(".search-form"), "responsive search styling"],
  [css.includes(".transport-button"), "transport control styling"],
  [css.includes(".player-controls"), "player control grouping"],
  [!html.includes("http://") && !html.includes("https://"), "no remote page assets"]
];
for (const [passed, label] of checks)
  if (!passed) throw new Error(`Web smoke check failed: ${label}`);
const required = [...fixed, javascriptPath, cssPath];
const totalBytes = (
  await Promise.all(required.map(async (path) => (await stat(path)).size))
).reduce((sum, size) => sum + size, 0);
console.log(`web smoke: ${checks.length} checks passed; required assets ${totalBytes} bytes`);
