import { rm } from "node:fs/promises";

await Promise.all(
  ["dist", ".test-build", "coverage"].map((path) => rm(path, { recursive: true, force: true }))
);
