import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src", "tests", "scripts"];
const allowed = new Set([".ts", ".mjs", ".css", ".html", ".json", ".md", ".rs", ".toml", ".svelte"]);
const failures = [];

async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (allowed.has(extname(entry.name))) {
      const content = await readFile(full, "utf8");
      if (!content.endsWith("\n")) failures.push(`${full}: missing final newline`);
      content.split("\n").forEach((line, index) => {
        if (/\s+$/.test(line)) failures.push(`${full}:${index + 1}: trailing whitespace`);
        if (line.includes("\t")) failures.push(`${full}:${index + 1}: tab character`);
      });
    }
  }
}

for (const root of roots) await walk(root);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("offline lint: 0 errors");
