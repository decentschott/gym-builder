#!/usr/bin/env node
// Validates every drill: required fields, types, and that each diagram simulates cleanly.
const { loadData } = require("./lib");
const { checkDrill } = require("./check");

const { cats, drills, templates } = loadData();
const errors = [];
const ids = new Set();

for (const d of drills) {
  const where = `${d._file} › ${d.id || "(no id)"}`;
  checkDrill(d, cats).forEach((e) => errors.push(`${where}: ${e}`));
  if (ids.has(d.id)) errors.push(`${where}: duplicate id`);
  ids.add(d.id);
  if (d._file !== d.cat + ".json") errors.push(`${where}: lives in ${d._file} but cat is "${d.cat}"`);
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
