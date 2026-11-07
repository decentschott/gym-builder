// Shared helpers for build + validate. No dependencies.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

function loadData() {
  const cats = JSON.parse(fs.readFileSync(path.join(ROOT, "data/categories.json"), "utf8"));
  const dir = path.join(ROOT, "data/drills");
  const drills = [];
  // Keep catalog order = categories.json order
  for (const cat of Object.keys(cats)) {
    const f = path.join(dir, cat + ".json");
    if (!fs.existsSync(f)) continue;
    for (const d of JSON.parse(fs.readFileSync(f, "utf8"))) drills.push(Object.assign({ _file: cat + ".json" }, d));
  }
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".json") && !cats[f.replace(/\.json$/, "")]) throw new Error(`data/drills/${f} has no matching entry in data/categories.json`);
  }
  const templates = JSON.parse(fs.readFileSync(path.join(ROOT, "data/templates.json"), "utf8"));
  return { cats, drills, templates };
}

module.exports = { ROOT, loadData };
