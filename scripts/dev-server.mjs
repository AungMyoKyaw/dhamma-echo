import { createServer } from "node:http";
import { open } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { spawn } from "node:child_process";

const port = 1420;
const build = spawn("node", ["scripts/build.mjs"], { stdio: "inherit" });
await new Promise((resolve, reject) => {
  build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))));
});

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);
createServer(async (request, response) => {
  try {
    const raw = request.url === "/" ? "/index.html" : (request.url ?? "/index.html");
    const safe = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, "");
    let path = join("dist", safe);
    let file;
    try {
      file = await open(path);
      if ((await file.stat()).isDirectory()) {
        await file.close();
        file = undefined;
        path = join(path, "index.html");
        file = await open(path);
      }
    } catch {
      await file?.close();
      path = "dist/index.html";
      file = await open(path);
    }
    try {
      const body = await file.readFile();
      response.writeHead(200, {
        "content-type": types.get(extname(path)) ?? "application/octet-stream"
      });
      response.end(body);
    } finally {
      await file.close();
    }
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain" });
    response.end(error instanceof Error ? error.message : "Unknown server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Dhamma Echo web preview: http://127.0.0.1:${port}`);
});
