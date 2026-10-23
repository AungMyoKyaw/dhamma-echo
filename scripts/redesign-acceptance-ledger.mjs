#!/usr/bin/env node
// Reproducible, conservative Q01–Q80 acceptance checkpoint. A passing build
// is not evidence of every interaction, native window, or visual criterion.
import { readFile, writeFile } from "node:fs/promises";
import prettier from "prettier";

const matrix = await readFile("docs/redesign/ACCEPTANCE.md", "utf8");
const rows = matrix
  .split("## 12. Result log template")[0]
  .split(/\r?\n/)
  .filter((line) => /^\| AC-\d\d \|/.test(line));
if (rows.length !== 80) throw new Error(`Expected 80 acceptance criteria, found ${rows.length}`);

const automated = {
  "AC-05": ["docs/redesign/CONCEPT_DECISION.md"],
  "AC-11": ["docs/redesign/CONCEPT_DECISION.md", "DESIGN.md"],
  "AC-14": ["bun run icons:check", "bun run design:assets:check"],
  "AC-16": ["bun run design:check", "bun run design:assets:check"],
  "AC-27": ["scripts/redesign-ui-check.mjs"],
  "AC-32": ["scripts/redesign-ui-check.mjs", "scripts/redesign-interactions-check.mjs"],
  "AC-33": ["scripts/redesign-directory-check.mjs"],
  "AC-41": ["scripts/redesign-interactions-check.mjs"],
  "AC-48": ["scripts/redesign-directory-check.mjs"],
  "AC-52": ["tests/app.test.mjs", "tests/store.test.mjs"],
  "AC-54": ["scripts/redesign-offline-check.mjs"],
  "AC-59": ["scripts/redesign-interactions-check.mjs"],
  "AC-61": ["scripts/redesign-interactions-check.mjs"],
  "AC-63": ["tests/persistence.test.mjs", "tests/store.test.mjs"],
  "AC-64": ["tests/ui.test.mjs", "tests/site.test.mjs"],
  "AC-67": ["tests/runtime.test.mjs", "scripts/redesign-interactions-check.mjs"],
  "AC-69": ["bun run design:assets:check", "tests/site.test.mjs"],
  "AC-71": ["bun run design:lint", "bun run design:check"],
  "AC-74": ["tests/persistence.test.mjs", "tests/app.test.mjs"],
  "AC-76": ["docs/redesign/CONCEPT_DECISION.md"]
};

const nativeLimitations = {
  "AC-09": "Windows/Linux native testing and accessibility tools unavailable on this macOS host",
  "AC-29": "Native traffic light positioning requires real window-level rendered inspection",
  "AC-35": "Native operating-system fullscreen behavior not covered by web-browser tests",
  "AC-66":
    "WCAG AA rendered contrast and assistive-technology walkthrough lack complete measured evidence",
  "AC-78":
    "Full cross-platform native and assistive-technology matrix cannot run on this macOS host"
};

const sourcesFor = (n) =>
  n <= 10
    ? ["src/App.svelte", "src/app.ts", "docs/redesign/REDESIGN_PRD.md"]
    : n <= 24
      ? ["DESIGN.md", "src/index.css", "docs/redesign/CONCEPT_DECISION.md"]
      : n <= 35
        ? ["src/App.svelte", "src/components/Sidebar.svelte", "src/components/Header.svelte"]
        : n <= 39
          ? ["src/views/HomeView.svelte", "src/app.ts"]
          : n <= 47
            ? ["src/views/ExploreView.svelte", "src/components/TrackRow.svelte", "src/app.ts"]
            : n <= 50
              ? [
                  "src/views/TeachersView.svelte",
                  "src/views/CollectionsView.svelte",
                  "src/views/TeacherDetailView.svelte",
                  "src/views/CollectionDetailView.svelte"
                ]
              : n <= 54
                ? ["src/views/LibraryView.svelte", "src/persistence.ts", "src/app.ts"]
                : n <= 61
                  ? [
                      "src/components/Player.svelte",
                      "src/components/QueuePanel.svelte",
                      "src/components/VideoPlayer.svelte",
                      "src/player.ts"
                    ]
                  : n <= 70
                    ? ["src/i18n.ts", "src/App.svelte", "src/index.css"]
                    : [
                        "src-tauri/src/lib.rs",
                        "src-tauri/tauri.conf.json",
                        "docs/redesign/IMPLEMENTATION_REPORT.md"
                      ];

const items = rows.map((line, index) => {
  const [, id, decision, phase, priority, method, criterion] = line
    .split("|")
    .map((value) => value.trim());
  const number = Number(id.slice(3));
  if (number !== index + 1 || decision !== `Q${String(number).padStart(2, "0")}`) {
    throw new Error(`Out-of-order criterion ${id}`);
  }
  const verificationLimitation = nativeLimitations[id] ?? null;
  const evidence = automated[id] ?? [];
  const status = verificationLimitation ? "BLOCKED" : evidence.length ? "VERIFIED" : "IN_PROGRESS";
  return {
    id,
    decision,
    phase,
    priority,
    method,
    criterion,
    status,
    implementation:
      "Relevant source identified; untested behavior must not be counted as completed",
    verifiedScope: evidence.length
      ? "Named automated/document evidence only; broader combined criteria may need further checks"
      : null,
    sourcePaths: sourcesFor(number),
    evidence,
    verificationLimitation
  };
});

const counts = Object.fromEntries(
  ["NOT_STARTED", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED", "BLOCKED"].map((s) => [
    s,
    items.filter((item) => item.status === s).length
  ])
);
const report = {
  schemaVersion: 1,
  generated: "2026-10-23",
  baselineCommit: "d70f761",
  version: "0.6.1",
  meaning:
    "VERIFIED means the cited aspect has passing reproducible evidence, not that every subcondition of a compound AC was exhaustively tested. IN_PROGRESS means relevant source exists but no item-specific validation is recorded. BLOCKED denotes verification limitations, not necessarily missing implementation.",
  checkpoint: "After phase implementation, before release publication",
  testCommands: [
    "bun run format:check",
    "bun run lint",
    "bun run typecheck",
    "bun run test:coverage",
    "bun run design:lint",
    "bun run design:check",
    "bun run design:assets:check",
    "bun run build:web",
    "bun run smoke:web",
    "bun run site:verify",
    "bun run verify",
    "bun run package",
    "node scripts/redesign-interactions-check.mjs",
    "node scripts/redesign-directory-check.mjs",
    "node scripts/redesign-offline-check.mjs",
    "node scripts/redesign-ui-check.mjs"
  ],
  counts,
  items
};
const outputPath = "docs/redesign/ACCEPTANCE_RESULTS.json";
const prettierConfig = (await prettier.resolveConfig(outputPath)) ?? {};
await writeFile(
  outputPath,
  await prettier.format(JSON.stringify(report), { ...prettierConfig, filepath: outputPath })
);
console.log(`Acceptance checkpoint: ${items.length} requirements; ${JSON.stringify(counts)}`);
