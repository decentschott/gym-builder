// Shared helpers for build + validate. No dependencies.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
// GB_DATA_DIR lets tests run the importer against a scratch copy of the data.
const DATA = process.env.GB_DATA_DIR || path.join(ROOT, "data");

function loadData() {
  const cats = JSON.parse(fs.readFileSync(path.join(DATA, "categories.json"), "utf8"));
  const dir = path.join(DATA, "drills");
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
  const templates = JSON.parse(fs.readFileSync(path.join(DATA, "templates.json"), "utf8"));
  return { cats, drills, templates };
}

module.exports = { ROOT, DATA, loadData };
