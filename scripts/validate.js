#!/usr/bin/env node
// Validates every drill: required fields, types, and that each diagram simulates cleanly.
const path = require("path");
const { ROOT, loadData } = require("./lib");
const GB = require(path.join(ROOT, "src/engine.js"));

const REQUIRED = { id: "string", cat: "string", n: "string", lv: "string", p: "object", t: "number", eq: "string", why: "string", say: "string", how: "object", cue: "object", e: "string", h: "string", d: "object" };
const { cats, drills, templates } = loadData();
const errors = [];
const ids = new Set();
const err = (d, msg) => errors.push(`${d._file} › ${d.id || "(no id)"}: ${msg}`);

for (const d of drills) {
  for (const [k, type] of Object.entries(REQUIRED)) if (typeof d[k] !== type) err(d, `field "${k}" must be ${type}`);
  if (ids.has(d.id)) err(d, "duplicate id");
  ids.add(d.id);
  if (!cats[d.cat]) err(d, `unknown category "${d.cat}"`);
  if (d._file !== d.cat + ".json") err(d, `lives in ${d._file} but cat is "${d.cat}"`);
  if (!/^[123]+$/.test(d.lv || "")) err(d, `lv must use digits 1-3, got "${d.lv}"`);
  if (!Array.isArray(d.p) || d.p.length !== 2 || d.p[0] > d.p[1]) err(d, "p must be [min, max] players");
  if (!Array.isArray(d.how) || d.how.length < 2) err(d, "how needs at least 2 steps");
  if (!Array.isArray(d.cue) || !d.cue.length) err(d, "cue needs at least 1 entry");
  (d.also || []).forEach((c) => { if (!cats[c]) err(d, `also has unknown category "${c}"`); });
  if (d.say && d.say.length > 160) err(d, `"say" is ${d.say.length} chars — keep it under 160 so players actually hear it`);
  if (d.d) {
    if (typeof d.d.s !== "string" || !Array.isArray(d.d.st) || !d.d.st.length) err(d, "diagram needs s (setup) and st (steps)");
    else {
      const r = GB.parse(d.d);
      r.warn.forEach((w) => err(d, "diagram: " + w));
      d.d.st.forEach((s, i) => { if (!s[1]) err(d, `diagram step ${i + 1} has no caption`); });
    }
  }
}
for (const t of templates) for (const b of t.blocks) if (!b.water && !ids.has(b.did)) errors.push(`templates.json › ${t.name}: unknown drill "${b.did}"`);

const byCat = {};
drills.forEach((d) => (byCat[d.cat] = (byCat[d.cat] || 0) + 1));
console.log(`${drills.length} drills · ${Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log("✓ all drills and diagrams valid");
