// Drill rules shared by the validator (build) and the importer (repair loop).
const path = require("path");
const GB = require(path.join(__dirname, "..", "src/engine.js"));

const REQUIRED = { id: "string", cat: "string", n: "string", lv: "string", p: "object", t: "number", eq: "string", why: "string", say: "string", how: "object", cue: "object", e: "string", h: "string", d: "object" };
const ALLOWED = ["id", "cat", "n", "src", "ref", "lv", "p", "t", "eq", "hoop", "one", "also", "why", "say", "how", "cue", "e", "h", "d"];

/** Returns a list of human-readable problems for one drill (empty = valid). */
function checkDrill(d, cats) {
  const errs = [];
  for (const [k, type] of Object.entries(REQUIRED)) if (typeof d[k] !== type || d[k] === null) errs.push(`field "${k}" must be ${type}`);
  for (const k of Object.keys(d)) if (!ALLOWED.includes(k) && k[0] !== "_") errs.push(`unknown field "${k}"`);
  if (!cats[d.cat]) errs.push(`unknown category "${d.cat}"`);
  if (!/^[123]+$/.test(d.lv || "")) errs.push(`lv must use digits 1-3, got "${d.lv}"`);
  if (!Array.isArray(d.p) || d.p.length !== 2 || !(d.p[0] <= d.p[1])) errs.push("p must be [min, max] players");
  if (!Array.isArray(d.how) || d.how.length < 2) errs.push("how needs at least 2 steps");
  if (!Array.isArray(d.cue) || !d.cue.length) errs.push("cue needs at least 1 entry");
  (d.also || []).forEach((c) => { if (!cats[c]) errs.push(`also has unknown category "${c}"`); });
  if (typeof d.say === "string" && d.say.length > 160) errs.push(`"say" is ${d.say.length} chars — keep it under 160 so players actually hear it`);
  if (d.d && typeof d.d === "object") {
    if (typeof d.d.s !== "string" || !Array.isArray(d.d.st) || !d.d.st.length) errs.push("diagram needs s (setup) and st (steps)");
    else {
      try {
        GB.parse(d.d).warn.forEach((w) => errs.push("diagram: " + w));
      } catch (e) {
        errs.push("diagram could not be parsed: " + e.message);
      }
      d.d.st.forEach((s, i) => { if (!Array.isArray(s) || !s[1]) errs.push(`diagram step ${i + 1} needs [ops, caption]`); });
    }
  }
  return errs;
}

/** Finds runs of 8+ words copied verbatim from a source text (case/punctuation-insensitive). */
function copiedPhrases(drill, sourceText, n = 8) {
  if (!sourceText) return [];
  const words = (s) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
  const src = words(sourceText);
  const grams = new Set();
  for (let i = 0; i + n <= src.length; i++) grams.add(src.slice(i, i + n).join(" "));
  const text = [drill.why, drill.say, drill.e, drill.h].concat(drill.how || [], drill.cue || []).filter(Boolean).join(" . ");
  const out = words(text);
  const hits = [];
  for (let i = 0; i + n <= out.length; i++) {
    const g = out.slice(i, i + n).join(" ");
    if (grams.has(g) && !hits.some((h) => h.includes(out.slice(i, i + 3).join(" ")))) hits.push(g);
  }
  return hits;
}

module.exports = { checkDrill, copiedPhrases, ALLOWED };
