// Local server: static files from public/ plus the API in app.mjs.
// On Vercel the same API runs from api/*.js and public/ is served as static files.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import handle, { keyMissing } from "./app.mjs";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1"; // set HOST=0.0.0.0 to open the vet page from another device on the same Wi-Fi
const PUBLIC_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

if (keyMissing) {
  console.error("\n  Missing ANTHROPIC_API_KEY. Copy .env.example to .env and paste your key.\n");
  process.exit(1);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) return handle(req, res);
  if (req.method !== "GET") { res.writeHead(405).end(); return; }
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const file = join(PUBLIC_DIR, path === "/" || path === "\\" ? "index.html" : path === "/vet" ? "vet.html" : path);
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(data);
  } catch { res.writeHead(404).end("not found"); }
}).listen(PORT, HOST, () => {
  console.log(`\n  Rafeeq is running.\n  Visitor page: http://localhost:${PORT}\n  Vet dashboard: http://localhost:${PORT}/vet\n`);
});
