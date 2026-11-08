#!/usr/bin/env node
// Builds dist/: a single self-contained index.html (works offline, opens from a file, or hosts anywhere)
// plus PWA files for installable/offline use on GitHub Pages.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ROOT, loadData } = require("./lib");

const { cats, drills, templates } = loadData();
const clean = drills.map(({ _file, ...d }) => d);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const js = [
  "var GB_CATS=" + JSON.stringify(cats) + ";",
  "var DR=" + JSON.stringify(clean) + ";",
  "var TEMPLATES=" + JSON.stringify(templates) + ";",
  read("src/engine.js"),
  read("src/draw.js"),
  read("src/app.js"),
].join("\n");

// Inline the bundled font files so the single-file build works offline.
const css = read("src/styles.css").replace(/url\(fonts\/([^)]+\.woff2)\)/g, (_, f) =>
  "url(data:font/woff2;base64," + fs.readFileSync(path.join(ROOT, "src/fonts", f)).toString("base64") + ")");
const html = read("src/index.html")
  .replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => js.replace(/<\/script/gi, "<\\/script"));

const out = path.join(ROOT, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), html);

const version = crypto.createHash("sha1").update(html).digest("hex").slice(0, 10);
for (const f of fs.readdirSync(path.join(ROOT, "public"))) {
  let buf = fs.readFileSync(path.join(ROOT, "public", f));
  if (f === "sw.js") buf = Buffer.from(buf.toString().replace("__VERSION__", version));
  fs.writeFileSync(path.join(out, f), buf);
}
console.log(`built dist/index.html (${(html.length / 1024).toFixed(0)} KB, ${clean.length} drills, version ${version})`);
