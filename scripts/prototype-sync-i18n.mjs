import { readFile, writeFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Keep the static browser prototype's product strings aligned with the app.
// Only literal dictionaries are evaluated; no app runtime or native bridge is loaded.
const source = await readFile(new URL("../src/i18n.ts", import.meta.url), "utf8");
const english = source.slice(
  source.indexOf("const en ="),
  source.indexOf("export type MessageKey")
);
const myanmar = source.slice(source.indexOf("const my:"), source.indexOf("const dictionaries:"));
const compiled = ts.transpileModule(`${english}\n${myanmar}\n({ en, my });`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 }
}).outputText;
const messages = runInNewContext(compiled, {}, { timeout: 1000 });
await writeFile(
  new URL("../prototype/messages.js", import.meta.url),
  `// Generated from src/i18n.ts by scripts/prototype-sync-i18n.mjs.\nglobalThis.PROTOTYPE_MESSAGES = ${JSON.stringify(messages, null, 2)};\n`
);
