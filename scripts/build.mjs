import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { extname, join } from "node:path";
import { pathToFileURL } from "node:url";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });

const tsc = spawnSync("node", ["node_modules/typescript/bin/tsc", "-p", "tsconfig.app.json"], {
  stdio: "inherit"
});
if (tsc.status !== 0) process.exit(tsc.status ?? 1);

await Promise.all([
  cp("index.html", "dist/index.html"),
  cp("public/logo.svg", "dist/logo.svg"),
  cp("public/empty-library.svg", "dist/empty-library.svg")
]);

const candidates = new Set();
async function scan(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) await scan(full);
    else if ([".ts", ".html"].includes(extname(entry.name))) {
      const content = await readFile(full, "utf8");
      for (const match of content.matchAll(/[A-Za-z0-9_:/[\].%-]+/g)) candidates.add(match[0]);
    }
  }
}
await scan("src");
const html = await readFile("index.html", "utf8");
for (const match of html.matchAll(/[A-Za-z0-9_:/[\].%-]+/g)) candidates.add(match[0]);

let tailwind;
try {
  tailwind = await import("tailwindcss");
} catch {
  tailwind = await import(
    pathToFileURL("/opt/nvm/versions/node/v22.16.0/lib/node_modules/tailwindcss/dist/lib.mjs").href
  );
}
const input = await readFile("src/index.css", "utf8");
const compiler = await tailwind.compile(input, {
  base: process.cwd(),
  loadStylesheet: async (id, base) => {
    if (id === "tailwindcss") {
      const local = join(process.cwd(), "node_modules/tailwindcss/index.css");
      try {
        return { base: process.cwd(), content: await readFile(local, "utf8") };
      } catch {
        const global = "/opt/nvm/versions/node/v22.16.0/lib/node_modules/tailwindcss/index.css";
        return { base: process.cwd(), content: await readFile(global, "utf8") };
      }
    }
    return { base, content: await readFile(join(base, id), "utf8") };
  }
});
await writeFile("dist/assets/app.css", compiler.build([...candidates].sort()));
console.log(`web build complete: ${candidates.size} Tailwind candidates`);
