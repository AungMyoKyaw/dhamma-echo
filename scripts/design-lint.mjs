#!/usr/bin/env node
// Lint DESIGN.md against the @google/design.md schema.
// Exits 0 on a clean spec, 1 on any errors or warnings, 2 if the CLI itself fails.

import { spawnSync } from "node:child_process";

const target = process.argv[2] ?? "DESIGN.md";
const proc = spawnSync("bunx", ["--bun", "@google/design.md", "lint", target], {
  encoding: "utf8"
});

if (proc.error !== undefined) {
  console.error(`design:lint could not run @google/design.md: ${proc.error.message}`);
  process.exit(2);
}

const stdout = proc.stdout ?? "";
const stderr = proc.stderr ?? "";

if ((proc.status ?? 0) !== 0) {
  console.error(`design:lint: @google/design.md exited with status ${proc.status}.`);
  if (stderr.length > 0) console.error(stderr.trim());
  if (stdout.length > 0) console.error(stdout.trim());
  process.exit(proc.status ?? 1);
}

let parsed;
try {
  parsed = stdout.trim().length === 0 ? null : JSON.parse(stdout);
} catch (error) {
  console.error(`design:lint could not parse CLI output: ${error.message}`);
  console.error(stdout);
  process.exit(2);
}

if (parsed === null) {
  console.error(`design:lint produced no JSON output.`);
  if (stderr.length > 0) console.error(stderr);
  process.exit(2);
}

const errors = parsed.findings.filter((finding) => finding.severity === "error");
const warnings = parsed.findings.filter((finding) => finding.severity === "warning");

if (errors.length > 0) {
  console.error(`DESIGN.md has ${errors.length} error(s):`);
  for (const finding of errors) {
    const path = finding.path ? ` [${finding.path}]` : "";
    console.error(`  -${path} ${finding.message}`);
  }
}
if (warnings.length > 0) {
  console.error(`DESIGN.md has ${warnings.length} warning(s):`);
  for (const finding of warnings) {
    const path = finding.path ? ` [${finding.path}]` : "";
    console.error(`  -${path} ${finding.message}`);
  }
}

const total = errors.length + warnings.length;
const tokenSummary = parsed.findings.find((finding) => finding.rule === "token-summary");
if (tokenSummary !== undefined && total === 0) {
  console.log(`design:lint OK —${tokenSummary.message.replace(/^Design system /u, "")}`);
}

process.exit(total === 0 ? 0 : 1);
