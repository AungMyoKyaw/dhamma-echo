import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stageMsixInputs } from "../scripts/stage-msix.mjs";

test("stageMsixInputs copies the runtime database with the MSIX inputs", async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "dhamma-echo-msix-"));

  try {
    const stagingDir = join(fixtureRoot, "staging");
    const targetDir = join(fixtureRoot, "release");
    const executablePath = join(targetDir, "dhamma-echo.exe");
    const resourceDir = join(fixtureRoot, "resources");
    const manifestPath = join(fixtureRoot, "Package.appxmanifest.xml");
    const assetsDir = join(fixtureRoot, "Assets");

    await mkdir(stagingDir);
    await mkdir(targetDir);
    await mkdir(resourceDir);
    await mkdir(assetsDir);
    await Promise.all([
      writeFile(executablePath, "fixture executable"),
      writeFile(join(targetDir, "WebView2Loader.dll"), "fixture dll"),
      writeFile(join(resourceDir, "dhamma.db"), "fixture runtime database"),
      writeFile(manifestPath, "fixture manifest"),
      writeFile(join(assetsDir, "StoreLogo.png"), "fixture store logo"),
      writeFile(join(assetsDir, "Square44x44Logo.png"), "fixture square logo")
    ]);

    await stageMsixInputs({
      stagingDir,
      executablePath,
      targetDir,
      resourceDir,
      manifestPath,
      assetsDir
    });

    assert.equal(await readFile(join(stagingDir, "dhamma-echo.exe"), "utf8"), "fixture executable");
    assert.equal(await readFile(join(stagingDir, "WebView2Loader.dll"), "utf8"), "fixture dll");
    assert.equal(
      await readFile(join(stagingDir, "resources", "dhamma.db"), "utf8"),
      "fixture runtime database"
    );
    assert.equal(
      await readFile(join(stagingDir, "Package.appxmanifest"), "utf8"),
      "fixture manifest"
    );
    assert.equal(
      await readFile(join(stagingDir, "Assets", "StoreLogo.png"), "utf8"),
      "fixture store logo"
    );
    assert.equal(
      await readFile(join(stagingDir, "Assets", "Square44x44Logo.png"), "utf8"),
      "fixture square logo"
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
