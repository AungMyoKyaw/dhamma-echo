import { readdir, mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const coverage = process.argv.includes("--coverage");
await rm(".test-build", { recursive: true, force: true });
if (coverage) await rm("coverage", { recursive: true, force: true });

const compile = spawnSync("node", ["node_modules/typescript/bin/tsc", "-p", "tsconfig.test.json"], {
  stdio: "inherit"
});
if (compile.status !== 0) process.exit(compile.status ?? 1);

const testFiles = (await readdir("tests"))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => `tests/${name}`);

const args = ["--test"];
if (coverage) {
  args.push(
    "--experimental-test-coverage",
    "--test-coverage-lines=100",
    "--test-coverage-functions=100",
    // Keep line/function coverage strict while allowing defensive short-circuit
    // branches that Node's built-in instrumenter cannot observe reliably.
    "--test-coverage-branches=99",
    "--test-coverage-include=.test-build/src/**/*.js",
    "--test-coverage-exclude=.test-build/src/types.js"
  );
}
args.push(...testFiles);

const result = spawnSync("node", args, { encoding: "utf8" });
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

if (coverage) {
  await mkdir("coverage", { recursive: true });
  const totalMatch = result.stdout?.match(
    /# all files\s+\|\s+([0-9.]+)\s+\|\s+([0-9.]+)\s+\|\s+([0-9.]+)/
  );
  const metrics = totalMatch
    ? {
        lines: Number(totalMatch[1]),
        branches: Number(totalMatch[2]),
        functions: Number(totalMatch[3])
      }
    : null;
  await writeFile(
    "coverage/coverage-summary.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scope:
          "Core TypeScript behavior modules. Svelte component correctness is checked by svelte-check/build/smoke separately.",
        command: `node ${args.join(" ")}`,
        exitCode: result.status,
        metrics,
        statementMetric: "Node built-in coverage does not report statements separately.",
        rawOutput: result.stdout
      },
      null,
      2
    )}\n`
  );
}

process.exit(result.status ?? 1);
