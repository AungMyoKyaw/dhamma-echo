import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const TEST_ROOT = "tests";
const TEST_FILE = /\.test\.(?:[cm]?[jt]s)$/u;
const FORBIDDEN = [
  { name: "focused test", pattern: /\b(?:test|it|describe)\.only\s*\(/u },
  { name: "skipped test", pattern: /\b(?:test|it|describe)\.skip\s*\(/u },
  { name: "focused test option", pattern: /\bonly\s*:\s*true\b/u },
  { name: "skipped test option", pattern: /\bskip\s*:\s*true\b/u },
  { name: "disabled suite", pattern: /\bxdescribe\s*\(/u },
  { name: "disabled test", pattern: /\b(?:xit|xtest)\s*\(/u }
];

async function testFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await testFiles(path)));
    else if (entry.isFile() && TEST_FILE.test(entry.name) && extname(entry.name) !== "")
      files.push(path);
  }
  return files;
}

const violations = [];
for (const file of await testFiles(TEST_ROOT)) {
  const source = await readFile(file, "utf8");
  const lines = source.split(/\r?\n/u);
  for (const [index, line] of lines.entries()) {
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(line))
        violations.push(`${file}:${index + 1}: ${rule.name}: ${line.trim()}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Required tests contain focused or skipped markers:\n");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Test policy OK: no focused or skipped required tests found.");
