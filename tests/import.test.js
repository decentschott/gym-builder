// Importer tests — replay recorded model responses (no API key needed). Run: npm run test:import
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const FIX = path.join(__dirname, "fixtures");

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gb-data-"));
  fs.cpSync(path.join(ROOT, "data"), dir, { recursive: true });
  return dir;
}
function run(args, env) {
  return spawnSync("node", [path.join(ROOT, "scripts/import.js"), ...args], { env: { ...process.env, ANTHROPIC_API_KEY: "", ...env }, encoding: "utf8" });
}
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

test("repair loop fixes a broken diagram, copied text, and a duplicate drill", () => {
  const data = scratch();
  const out = path.join(data, "summary.md");
  const r = run(["--text-file", path.join(FIX, "source-page.txt"), "--out", out], { GB_DATA_DIR: data, IMPORT_MOCK: path.join(FIX, "mock-repair.json") });
  assert.strictEqual(r.status, 0, r.stderr);
  // round 1 problems were reported back to the model
  assert.match(r.stderr, /3 passes without a ball/);
  assert.match(r.stderr, /copied from the source word-for-word/);
  assert.match(r.stderr, /already exists \(o1\)/);
  assert.match(r.stderr, /round 2: 1 drill\(s\), 1 template\(s\), 0 problem/);
  // written with a real id in the right file
  const mot = readJson(path.join(data, "drills/mot.json"));
  const added = mot[mot.length - 1];
  assert.strictEqual(added.n, "Pass, Cut & Replace");
  assert.match(added.id, /^m\d+$/);
  assert.ok(!mot.slice(0, -1).some((d) => d.id === added.id), "id is unique");
  // template remapped new1 → real id, totals computed
  const tpl = readJson(path.join(data, "templates.json")).find((t) => t.name === "Test Team — Motion day");
  assert.deepStrictEqual(tpl.blocks.map((b) => b.did || "water"), ["w1", added.id, "water", "o1"]);
  assert.strictEqual(tpl.total, 25);
  // PR summary
  const md = fs.readFileSync(out, "utf8");
  assert.match(md, /Imported 1 drill \+ 1 practice template/);
  assert.match(md, /Please check/);
  // the whole catalog still validates
  execFileSync("node", [path.join(ROOT, "scripts/validate.js")], { env: { ...process.env, GB_DATA_DIR: data } });
});

test("drills still broken after 3 rounds are dropped, valid ones are kept", () => {
  const data = scratch();
  const good = readJson(path.join(FIX, "mock-repair.json"))[1].drills[0];
  const bad = { ...good, id: "new2", n: "Broken Drill", d: { s: "1 25,30", st: [["1 p 9", "pass to nobody"]] } };
  const resp = { drills: [{ ...good }, bad], templates: [], notes: "" };
  const mock = path.join(data, "mock.json");
  fs.writeFileSync(mock, JSON.stringify([resp, resp, resp]));
  const out = path.join(data, "summary.md");
  const r = run(["--text", "two drills", "--out", out], { GB_DATA_DIR: data, IMPORT_MOCK: mock });
  assert.strictEqual(r.status, 0, r.stderr);
  const md = fs.readFileSync(out, "utf8");
  assert.match(md, /Left out/);
  assert.match(md, /Broken Drill/);
  assert.ok(readJson(path.join(data, "drills/mot.json")).some((d) => d.n === good.n));
  assert.ok(!readJson(path.join(data, "drills/mot.json")).some((d) => d.n === "Broken Drill"));
});

test("GitHub issue form: playbook name marks drills as the coach's own and skips the copy check", () => {
  const data = scratch();
  const body = [
    "### What is this?", "", "A practice plan", "",
    "### Link(s)", "", "_No response_", "",
    "### Paste the drill or practice plan", "", fs.readFileSync(path.join(FIX, "source-page.txt"), "utf8"), "",
    "### Playbook name (if these are your own drills)", "", "St. Luke playbook", "",
  ].join("\n");
  const bodyFile = path.join(data, "body.md");
  fs.writeFileSync(bodyFile, body);
  // Round-1 response copies source text, which is fine for the coach's own material.
  const resp = readJson(path.join(FIX, "mock-repair.json"))[0];
  resp.drills = [resp.drills[0]];
  resp.drills[0].d = readJson(path.join(FIX, "mock-repair.json"))[1].drills[0].d;
  resp.drills[0].src = "St. Luke playbook";
  resp.templates[0].blocks = resp.templates[0].blocks.filter((b) => b.did !== "new2");
  const mock = path.join(data, "mock.json");
  fs.writeFileSync(mock, JSON.stringify([resp]));
  const r = run(["--issue-body", bodyFile, "--dry-run"], { GB_DATA_DIR: data, IMPORT_MOCK: mock });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stderr, /as "St\. Luke playbook"/);
  assert.match(r.stderr, /round 1: 1 drill\(s\), 1 template\(s\), 0 problem/);
  const final = JSON.parse(r.stdout);
  assert.strictEqual(final.drills[0].src, "St. Luke playbook");
});

test("fails clearly with nothing to import or no API key", () => {
  const data = scratch();
  let r = run([], { GB_DATA_DIR: data });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /Nothing to import/);
  r = run(["--text", "a drill"], { GB_DATA_DIR: data });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /ANTHROPIC_API_KEY is not set/);
});
