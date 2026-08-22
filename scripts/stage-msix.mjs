import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, dirname, extname, join, resolve } from "node:path";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const defaultInputs = {
  executablePath: join(repositoryRoot, "src-tauri", "target", "release", "dhamma-echo.exe"),
  targetDir: join(repositoryRoot, "src-tauri", "target", "release"),
  resourceDir: join(repositoryRoot, "src-tauri", "resources"),
  manifestPath:
    process.env.MSIX_MANIFEST_PATH ??
    join(repositoryRoot, "src-tauri", "msix", "Package.appxmanifest.xml"),
  assetsDir: join(repositoryRoot, "src-tauri", "msix", "Assets"),
  stagingDir: join(repositoryRoot, "msix-staging")
};

async function assertFile(path, description) {
  try {
    const details = await stat(path);
    if (!details.isFile()) {
      throw new Error(`${description} is not a file: ${path}`);
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${description} is missing: ${path}`, { cause: error });
    }
    throw error;
  }
}

export async function stageMsixInputs({
  stagingDir,
  executablePath,
  targetDir,
  resourceDir,
  manifestPath,
  assetsDir
}) {
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  const sourceDatabase = join(resourceDir, "dhamma.db");
  await assertFile(sourceDatabase, "Required MSIX runtime resource");
  await assertFile(executablePath, "MSIX executable");

  await cp(executablePath, join(stagingDir, basename(executablePath)));
  for (const entry of await readdir(targetDir, { withFileTypes: true })) {
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".dll") {
      await cp(join(targetDir, entry.name), join(stagingDir, entry.name));
    }
  }

  await cp(resourceDir, join(stagingDir, "resources"), { recursive: true });
  await cp(manifestPath, join(stagingDir, "Package.appxmanifest"));
  await cp(assetsDir, join(stagingDir, "Assets"), { recursive: true });

  const stagedDatabase = join(stagingDir, "resources", "dhamma.db");
  await assertFile(stagedDatabase, "Staged MSIX runtime resource");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await stageMsixInputs(defaultInputs);
  console.log(`Staged MSIX inputs in ${defaultInputs.stagingDir}`);
}
