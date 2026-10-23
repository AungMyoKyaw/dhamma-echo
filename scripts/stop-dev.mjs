import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const config = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const devUrl = new URL(config.build.devUrl);
const port = devUrl.port;

function getListeners() {
  const result = spawnSync("lsof", ["-nP", `-tiTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });

  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(result.stderr.trim() || `lsof exited with status ${result.status}`);
  }

  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(Number);
}

const pids = getListeners();
if (pids.length === 0) {
  console.log(`No dev server is listening on port ${port}.`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

for (let attempt = 0; attempt < 30; attempt += 1) {
  await delay(100);
  const remaining = getListeners().filter((pid) => pids.includes(pid));
  if (remaining.length === 0) {
    console.log(`Stopped dev server on port ${port} (PID(s): ${pids.join(", ")}).`);
    process.exit(0);
  }
}

const remaining = getListeners().filter((pid) => pids.includes(pid));
for (const pid of remaining) {
  try {
    process.kill(pid, "SIGKILL");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

console.log(`Stopped dev server on port ${port} (PID(s): ${pids.join(", ")}).`);
