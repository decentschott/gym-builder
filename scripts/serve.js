#!/usr/bin/env node
// Tiny static server for local testing: npm run dev  → http://localhost:5173
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PORT = +process.env.PORT || 5173;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };

const build = () => { try { execSync("node scripts/build.js", { cwd: ROOT, stdio: "inherit" }); } catch (e) { /* error already printed */ } };
build();
if (process.argv.includes("--watch")) {
  let t;
  for (const d of ["src", "data", "data/drills", "public"]) fs.watch(path.join(ROOT, d), () => { clearTimeout(t); t = setTimeout(build, 150); });
}
http.createServer((req, res) => {
  const p = path.join(DIST, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(DIST) || !fs.existsSync(p)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log(`Gym Builder → http://localhost:${PORT}`));
