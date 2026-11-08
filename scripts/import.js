#!/usr/bin/env node
/*
 * Drill & practice-plan importer.
 * Turns a link, pasted text, or a PDF/image (e.g. a practice plan) into validated drills + a template.
 *
 *   node scripts/import.js --url https://...            (web page with a drill)
 *   node scripts/import.js --file plan.pdf --src "St. Luke playbook"
 *   node scripts/import.js --text "Two lines at the wings..."
 *   node scripts/import.js --issue-body body.md         (GitHub issue form, used by the Action)
 *
 * Options: --dry-run (don't write files) · --out summary.md (PR description) · --model <id>
 * Env:     ANTHROPIC_API_KEY (required unless IMPORT_MOCK is set)
 *          IMPORT_MOCK=fixtures.json  replays recorded model responses (tests)
 *          GITHUB_TOKEN               used to download issue attachments
 */
const fs = require("fs");
const path = require("path");
const { ROOT, DATA, loadData } = require("./lib");
const { checkDrill, copiedPhrases, ALLOWED } = require("./check");

const MODEL = argVal("--model") || process.env.IMPORT_MODEL || "claude-opus-5-5";
const MAX_ROUNDS = 3;

function argVals(flag) { const out = []; process.argv.forEach((a, i) => { if (a === flag && process.argv[i + 1]) out.push(process.argv[i + 1]); }); return out; }
function argVal(flag) { return argVals(flag)[0]; }
const has = (flag) => process.argv.includes(flag);
const log = (...a) => console.error(...a);

// ---------- inputs ----------
async function gatherInputs() {
  const inp = { urls: argVals("--url"), files: argVals("--file"), texts: argVals("--text"), src: argVal("--src") || "", kind: "" };
  argVals("--text-file").forEach((f) => inp.texts.push(fs.readFileSync(f, "utf8")));
  const body = argVal("--issue-body");
  if (body) Object.assign(inp, await parseIssue(fs.readFileSync(body, "utf8"), inp));
  if (!inp.urls.length && !inp.files.length && !inp.texts.join("").trim()) throw new Error("Nothing to import — give a link, pasted text, or a file.");
  return inp;
}

// GitHub issue forms render as "### Label\n\nvalue". "_No response_" = empty.
async function parseIssue(md, inp) {
  const fields = {};
  md.split(/^### /m).slice(1).forEach((chunk) => {
    const [label, ...rest] = chunk.split("\n");
    const v = rest.join("\n").trim();
    fields[label.trim().toLowerCase()] = v === "_No response_" ? "" : v;
  });
  const get = (key) => Object.entries(fields).find(([k]) => k.includes(key))?.[1] || "";
  const out = { urls: [...inp.urls], files: [...inp.files], texts: [...inp.texts], src: inp.src || get("playbook"), kind: get("what is this") };
  const attachRe = /https:\/\/github\.com\/(?:user-attachments\/(?:assets|files)\/[^\s)\]]+|[^\s)\]]+\/(?:files|assets)\/[^\s)\]]+)/g;
  const all = Object.keys(fields).length ? Object.values(fields).join("\n") : md;
  const attachments = [...new Set(all.match(attachRe) || [])];
  for (const u of attachments) {
    try { out.files.push(await download(u)); } catch (e) { log(`! could not download attachment ${u}: ${e.message}`); out.warnings = (out.warnings || []).concat(`Couldn't read the attachment ${u} — paste its text into the issue instead.`); }
  }
  get("link").split(/\s+/).filter((u) => /^https?:\/\//.test(u) && !attachRe.test(u)).forEach((u) => out.urls.push(u));
  attachRe.lastIndex = 0;
  const pasted = (get("paste") || "").replace(attachRe, "").trim();
  if (pasted) out.texts.push(pasted);
  if (!Object.keys(fields).length && md.trim()) out.texts.push(md.replace(attachRe, "").trim());
  return out;
}

async function download(url) {
  const headers = { "user-agent": "gym-builder-importer" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  const ext = type.includes("pdf") ? ".pdf" : type.includes("png") ? ".png" : type.includes("jpeg") ? ".jpg" : type.includes("text") ? ".txt" : path.extname(new URL(url).pathname) || ".bin";
  const f = path.join(require("os").tmpdir(), "gb-attach-" + Date.now() + ext);
  fs.writeFileSync(f, Buffer.from(await res.arrayBuffer()));
  return f;
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (gym-builder importer)" }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|li|h\d|div|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&[a-z]+;/g, " ")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim()
    .slice(0, 60000);
}

async function buildContent(inp) {
  const blocks = [];
  let sourceText = "";
  for (const u of inp.urls) {
    const t = await fetchPage(u);
    sourceText += "\n" + t;
    blocks.push({ type: "text", text: `SOURCE PAGE (${u}):\n${t}` });
  }
  for (const f of inp.files) {
    const ext = path.extname(f).toLowerCase();
    const data = fs.readFileSync(f);
    if (ext === ".pdf") blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: data.toString("base64") } });
    else if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) blocks.push({ type: "image", source: { type: "base64", media_type: ext === ".jpg" ? "image/jpeg" : "image/" + ext.slice(1), data: data.toString("base64") } });
    else { const t = data.toString("utf8"); sourceText += "\n" + t; blocks.push({ type: "text", text: `SOURCE FILE (${path.basename(f)}):\n${t}` }); }
  }
  for (const t of inp.texts) { sourceText += "\n" + t; blocks.push({ type: "text", text: "PASTED BY THE COACH:\n" + t }); }
  const own = !!inp.src;
  blocks.push({ type: "text", text:
    (own ? `This is the coach's OWN material. Mark every new drill with "src": ${JSON.stringify(inp.src)} and keep the coach's own vocabulary and phrases.\n` :
           `This material is from someone else. Rewrite everything in original, simpler words — do not copy sentences. Set "ref" to the source link if there is one.\n`) +
    (inp.kind ? `The coach says this is: ${inp.kind}.\n` : "") +
    "Extract every distinct drill. If it is a practice plan, also return it as a template (reuse existing catalog drills where they truly match). Then call submit_import." });
  return { blocks, sourceText: own ? "" : sourceText };
}

// ---------- prompt ----------
function systemPrompt(data) {
  const fmt = fs.readFileSync(path.join(ROOT, "docs/DRILL_FORMAT.md"), "utf8");
  const catalog = data.drills.map((d) => `${d.id} | ${d.cat} | ${d.n} | ${d.say}`).join("\n");
  const examples = ["m13", "s15", "o3"].map((id) => data.drills.find((d) => d.id === id)).filter(Boolean).map(({ _file, ...d }) => JSON.stringify(d)).join("\n");
  return `You convert basketball drills and practice plans into Gym Builder's drill format. You are an experienced youth/high school basketball coach and a careful data engineer.

${fmt}

CATEGORIES: ${Object.entries(data.cats).map(([k, v]) => `${k} = ${v.name}`).join(", ")}

RULES
- Coach language: short, concrete, readable on a phone in a loud gym. "say" is ONE sentence a coach says out loud (< 160 chars). "how" = 3-5 short steps. "cue" = 2-4 items of 2-5 words.
- Diagrams must match the drill. Use realistic coordinates from the handy spots list. Every ball movement needs a player who has the ball (use b:ID in setup, "rb" to pick up a loose ball after a shot). One idea per step, 2-6 steps, every step has a caption.
- Use "c":"f" only when the drill truly needs the full court.
- Give each NEW drill a provisional id "new1", "new2", ... (real ids are assigned later).
- Do NOT re-create drills that already exist in the catalog below — reference them by id in templates instead.
- Levels: 1 = beginner (roughly ages 8-11), 2 = intermediate (middle school / JV), 3 = advanced (varsity).
- Templates: name like "<team or source> — <date or focus>"; blocks in order with minutes and a short segment label; use {"water":true,"min":2,"seg":"Water"} for water breaks.
- Put anything you had to guess (unclear rotations, ambiguous terms) in "notes" so the coach can check it.

EXISTING CATALOG (id | cat | name | say):
${catalog}

EXAMPLE DRILLS (exact format):
${examples}`;
}

function toolSchema(cats) {
  const str = { type: "string" };
  return {
    name: "submit_import",
    description: "Submit the extracted drills and optional practice-plan templates.",
    input_schema: {
      type: "object",
      required: ["drills", "templates", "notes"],
      properties: {
        drills: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "cat", "n", "lv", "p", "t", "eq", "why", "say", "how", "cue", "e", "h", "d"],
            properties: {
              id: { type: "string", description: "Provisional id: new1, new2, ..." },
              cat: { type: "string", enum: Object.keys(cats) },
              n: str, src: str, ref: str, lv: { type: "string", description: "e.g. \"123\" or \"23\"" },
              p: { type: "array", items: { type: "integer" }, minItems: 2, maxItems: 2 },
              t: { type: "integer" }, eq: str, hoop: { type: "integer" }, one: { type: "integer" }, thumb: { type: "string", enum: ["all"] }, trail: { type: "integer" },
              also: { type: "array", items: { type: "string", enum: Object.keys(cats) } },
              why: str, say: str, how: { type: "array", items: str }, cue: { type: "array", items: str }, e: str, h: str,
              d: { type: "object", required: ["s", "st"], properties: { c: { type: "string", enum: ["f", "h"] }, s: str, st: { type: "array", items: { type: "array", items: str, minItems: 2, maxItems: 2 } } } },
            },
          },
        },
        templates: {
          type: "array",
          items: {
            type: "object", required: ["name", "blocks"],
            properties: { name: str, blocks: { type: "array", items: { type: "object", required: ["min", "seg"], properties: { did: str, water: { type: "boolean" }, min: { type: "integer" }, seg: str } } } },
          },
        },
        notes: { type: "string", description: "Assumptions and anything the coach should double-check." },
      },
    },
  };
}

// ---------- model ----------
let mockQueue = null;
async function callModel(system, messages, tool) {
  if (process.env.IMPORT_MOCK) {
    mockQueue = mockQueue || JSON.parse(fs.readFileSync(process.env.IMPORT_MOCK, "utf8"));
    if (!mockQueue.length) throw new Error("IMPORT_MOCK ran out of responses");
    return { id: "mock_" + mockQueue.length, input: mockQueue.shift() };
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set. Add it as a repository secret (Settings → Secrets and variables → Actions).");
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 32000, system, tools: [tool], tool_choice: { type: "tool", name: tool.name }, messages }),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 4) { await new Promise((r) => setTimeout(r, 4000 * attempt)); continue; }
    const json = await res.json();
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${json.error?.message || JSON.stringify(json)}`);
    const use = json.content.find((c) => c.type === "tool_use");
    if (!use) throw new Error("Model did not return structured output");
    return { id: use.id, input: use.input, raw: json.content };
  }
}

// ---------- checking ----------
function prefixFor(cat, drills) {
  const counts = {};
  drills.filter((d) => d.cat === cat).forEach((d) => { const p = d.id.replace(/\d+$/, ""); counts[p] = (counts[p] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || cat.slice(0, 2);
}
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function review(result, data, sourceText) {
  const problems = [];
  const names = new Map(data.drills.map((d) => [norm(d.n), d.id]));
  const provisional = new Set();
  (result.drills || []).forEach((d, i) => {
    const label = `drill ${i + 1} (${d.id || "?"} "${d.n || ""}")`;
    for (const k of Object.keys(d)) if (!ALLOWED.includes(k)) delete d[k];
    if (typeof d.lv === "number") d.lv = String(d.lv);
    if (d.d && d.d.c === "h") delete d.d.c;
    checkDrill(Object.assign({}, d, { id: d.id || "x" }), data.cats).forEach((e) => problems.push(`${label}: ${e}`));
    if (!/^new\d+$/.test(d.id || "")) problems.push(`${label}: id must be provisional (new1, new2, ...)`);
    if (provisional.has(d.id)) problems.push(`${label}: duplicate provisional id`);
    provisional.add(d.id);
    if (names.has(norm(d.n))) problems.push(`${label}: a drill named "${d.n}" already exists (${names.get(norm(d.n))}) — drop it and reference ${names.get(norm(d.n))} in the template instead`);
    copiedPhrases(d, sourceText).forEach((g) => problems.push(`${label}: copied from the source word-for-word ("${g}…") — rewrite in your own words`));
  });
  const known = new Set(data.drills.map((d) => d.id).concat([...provisional]));
  (result.templates || []).forEach((t, i) => (t.blocks || []).forEach((b, j) => {
    if (!b.water && !known.has(b.did)) problems.push(`template ${i + 1} block ${j + 1}: unknown drill id "${b.did}"`);
  }));
  return problems;
}

function finalize(result, data) {
  const map = {};
  const next = {};
  const drills = (result.drills || []).map((d) => {
    const pre = prefixFor(d.cat, data.drills);
    if (next[pre] == null) next[pre] = Math.max(0, ...data.drills.filter((x) => x.id.startsWith(pre) && /^\d+$/.test(x.id.slice(pre.length))).map((x) => +x.id.slice(pre.length))) + 1;
    const id = pre + next[pre]++;
    map[d.id] = id;
    const ordered = {};
    for (const k of ALLOWED) if (d[k] !== undefined) ordered[k] = d[k];
    ordered.id = id;
    return Object.assign({ id }, ordered);
  });
  const templates = (result.templates || []).map((t) => {
    const blocks = t.blocks.map((b) => b.water ? { water: true, min: b.min, seg: b.seg || "Water" } : { did: map[b.did] || b.did, min: b.min, seg: b.seg });
    return { name: t.name, total: blocks.reduce((a, b) => a + b.min, 0), blocks };
  });
  return { drills, templates, notes: result.notes || "" };
}

// ---------- output ----------
function write(final) {
  const dir = path.join(DATA, "drills");
  const byCat = {};
  final.drills.forEach((d) => (byCat[d.cat] = byCat[d.cat] || []).push(d));
  for (const [cat, list] of Object.entries(byCat)) {
    const f = path.join(dir, cat + ".json");
    const cur = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : [];
    fs.writeFileSync(f, JSON.stringify(cur.concat(list), null, 2) + "\n");
  }
  if (final.templates.length) {
    const f = path.join(DATA, "templates.json");
    const cur = JSON.parse(fs.readFileSync(f, "utf8")).filter((t) => !final.templates.some((n) => n.name === t.name));
    fs.writeFileSync(f, JSON.stringify(cur.concat(final.templates), null, 2) + "\n");
  }
}

function summary(final, data, inp, dropped) {
  const name = (id) => (final.drills.find((d) => d.id === id) || data.drills.find((d) => d.id === id) || {}).n || id;
  let md = `## 🏀 Imported ${final.drills.length} drill${final.drills.length === 1 ? "" : "s"}${final.templates.length ? ` + ${final.templates.length} practice template${final.templates.length > 1 ? "s" : ""}` : ""}\n\n`;
  if (inp.src) md += `Marked as **★ ${inp.src}**.\n\n`;
  for (const d of final.drills) {
    md += `### ${d.n} \`${d.id}\` · ${data.cats[d.cat].name} · ${d.t} min · ${d.p[0]}–${d.p[1]} players\n> ${d.say}\n\n`;
    md += d.how.map((s, i) => `${i + 1}. ${s}`).join("\n") + `\n\n**Cues:** ${d.cue.join(" · ")}  \n**Diagram:** ${d.d.st.map((s, i) => `${i + 1}) ${s[1]}`).join(" → ")}\n\n`;
  }
  for (const t of final.templates) {
    md += `### 📋 Template: ${t.name} (${t.total} min)\n| Time | Block | Drill | Min |\n|---|---|---|---|\n`;
    let m = 0;
    t.blocks.forEach((b) => { md += `| ${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} | ${b.seg} | ${b.water ? "💧 Water" : name(b.did) + (final.drills.some((d) => d.id === b.did) ? " 🆕" : "")} | ${b.min} |\n`; m += b.min; });
    md += "\n";
  }
  if (final.notes) md += `### ⚠️ Please check\n${final.notes}\n\n`;
  if (dropped.length) md += `### Left out (still invalid after ${MAX_ROUNDS} tries)\n${dropped.map((p) => "- " + p).join("\n")}\n\n`;
  (inp.warnings || []).forEach((w) => (md += `> ⚠️ ${w}\n`));
  md += `\n---\n**Review:** check the steps read right in your words, then look at the animations in the preview (Actions run → \`gym-builder-dist\` artifact) or on the site after merging. Edit the JSON in this PR if anything's off.`;
  return md;
}

// ---------- main ----------
async function main() {
  const data = loadData();
  const inp = await gatherInputs();
  log(`Importing: ${inp.urls.length} link(s), ${inp.files.length} file(s), ${inp.texts.length} text block(s)${inp.src ? ` as "${inp.src}"` : ""} · model ${process.env.IMPORT_MOCK ? "MOCK" : MODEL}`);
  const { blocks, sourceText } = await buildContent(inp);
  const system = systemPrompt(data);
  const tool = toolSchema(data.cats);
  const messages = [{ role: "user", content: blocks }];

  let result, problems = [];
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const resp = await callModel(system, messages, tool);
    result = resp.input;
    problems = review(result, data, sourceText);
    log(`round ${round}: ${result.drills?.length || 0} drill(s), ${result.templates?.length || 0} template(s), ${problems.length} problem(s)`);
    if (!problems.length) break;
    problems.forEach((p) => log("  - " + p));
    if (round === MAX_ROUNDS) break;
    messages.push({ role: "assistant", content: resp.raw || [{ type: "tool_use", id: resp.id, name: tool.name, input: result }] });
    messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: resp.id, is_error: true, content: "Fix these problems and call submit_import again with the COMPLETE corrected result:\n- " + problems.join("\n- ") }] });
  }

  // Drop anything still broken rather than fail the whole import.
  const dropped = [];
  if (problems.length) {
    const bad = new Set(problems.map((p) => (p.match(/^drill \d+ \((new\d+)/) || [])[1]).filter(Boolean));
    result.drills = (result.drills || []).filter((d) => { if (bad.has(d.id)) { dropped.push(`${d.n}: ${problems.filter((p) => p.includes(`(${d.id} `)).join("; ")}`); return false; } return true; });
    const ids = new Set(data.drills.map((d) => d.id).concat(result.drills.map((d) => d.id)));
    result.templates = (result.templates || []).filter((t) => { const ok = t.blocks.every((b) => b.water || ids.has(b.did)); if (!ok) dropped.push(`Template "${t.name}" referenced a drill that was left out`); return ok; });
  }
  const final = finalize(result, data);
  if (!final.drills.length && !final.templates.length) throw new Error("No valid drills came out of this import.\n" + dropped.join("\n"));
  const md = summary(final, data, inp, dropped);
  if (argVal("--out")) fs.writeFileSync(argVal("--out"), md);
  if (has("--dry-run")) console.log(JSON.stringify(final, null, 2));
  else { write(final); log(`✓ wrote ${final.drills.length} drill(s) and ${final.templates.length} template(s)`); }
  if (!argVal("--out") && !has("--dry-run")) console.log(md);
}

main().catch((e) => { log("✗ " + e.message); process.exit(1); });
