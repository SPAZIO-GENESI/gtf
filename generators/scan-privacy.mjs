import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/registry.mjs";

const SNAPSHOTS_DIR = join(ROOT, "snapshots");
const MAP_FILE = join(ROOT, "generators", "lib", "privacy-map.json");
const IMGAUTH_REPO = "SPAZIO-GENESI/imgauth";

// Alto recall deliberato (P32/ADR-GTF-012): qualunque colonna SQL il cui
// nome somigli a un dato personale finisce nel mapping, dove si dichiara
// coperta, falso positivo o non coperta — mai filtrata prima.
const SENSITIVE_COLUMN = /email|owner|member|name|user|phone|address|customer/i;

// Prefissi R2 noti (letti a mano dal codice, non generati dinamicamente):
// scritture personali (pdf/ots/meta/cert/integrations) e non personali
// (status/meta-counters, dichiarate falso positivo nel mapping).
const R2_PREFIXES = [
  { id: "r2:pdf", pattern: /`pdf\// },
  { id: "r2:ots", pattern: /`ots\// },
  { id: "r2:meta/cert", pattern: /`meta\/cert\// },
  { id: "r2:integrations", pattern: /`integrations\// },
  { id: "r2:status", pattern: /["'`]status\// },
  { id: "r2:meta-counters", pattern: /["'`]meta\/(agent-403-count|cert-count)["'`]/ },
];

// Stesso pattern di latestWeek()/readJsonSnapshot() in score.mjs: legge solo
// snapshot già committati, mai stato in memoria tra script diversi.
function latestWeek() {
  if (!existsSync(SNAPSHOTS_DIR)) return null;
  const weeks = readdirSync(SNAPSHOTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "anchors")
    .map((d) => d.name)
    .sort();
  return weeks.length > 0 ? weeks[weeks.length - 1] : null;
}

function readJsonSnapshot(week, filename) {
  const file = join(SNAPSHOTS_DIR, week, filename);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

async function fetchText(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, status: res.status, url };
    return { ok: true, text: await res.text(), url };
  } catch (e) {
    return { ok: false, error: e.message, url };
  }
}

async function listSchemaFiles(tag, headers) {
  const url = `https://api.github.com/repos/${IMGAUTH_REPO}/contents/schema?ref=${tag}`;
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, status: res.status, url };
    const data = await res.json();
    if (!Array.isArray(data)) return { ok: false, error: "risposta non è una lista", url };
    return { ok: true, files: data.filter((f) => f.type === "file" && f.name.endsWith(".sql")).map((f) => f.name) };
  } catch (e) {
    return { ok: false, error: e.message, url };
  }
}

// Estrae, per tabella, l'unione delle colonne da CREATE TABLE e ALTER TABLE
// ADD COLUMN (regex deliberatamente semplice, non un parser SQL) — poi
// filtra alle sole tabelle con almeno una colonna dal nome sensibile.
function extractSqlFlows(schemaTexts) {
  const columnsByTable = new Map();
  for (const text of schemaTexts) {
    for (const m of text.matchAll(/ALTER TABLE\s+(\w+)\s+ADD COLUMN\s+(\w+)/gi)) {
      const [, table, column] = m;
      if (!columnsByTable.has(table)) columnsByTable.set(table, new Set());
      columnsByTable.get(table).add(column);
    }
    for (const m of text.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
      const [, table, body] = m;
      if (!columnsByTable.has(table)) columnsByTable.set(table, new Set());
      for (const line of body.split("\n")) {
        const cm = line.trim().match(/^(\w+)\s+(TEXT|INTEGER|REAL|BLOB)/i);
        if (cm) columnsByTable.get(table).add(cm[1]);
      }
    }
  }
  const hits = [];
  for (const [table, columns] of columnsByTable) {
    const sensitive = [...columns].filter((c) => SENSITIVE_COLUMN.test(c));
    if (sensitive.length > 0) hits.push({ id: `sql:${table}`, columns: sensitive });
  }
  return hits.sort((a, b) => a.id.localeCompare(b.id));
}

function extractR2Flows(workerText) {
  return R2_PREFIXES.filter((p) => p.pattern.test(workerText)).map((p) => ({ id: p.id }));
}

function writeSnapshot(week, result) {
  if (!week) return;
  const dir = join(SNAPSHOTS_DIR, week);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "privacy-scan.json"), JSON.stringify(result, null, 2) + "\n");
}

async function main() {
  const ghHeaders = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
    : { Accept: "application/vnd.github+json" };

  const week = latestWeek();
  // Riusa il tag già raccolto da collect-evidence.mjs nello stesso giro
  // settimanale (deve girare dopo, nello stesso job): zero fetch API in più
  // solo per sapere qual è l'ultimo tag.
  const tagsSnap = week ? readJsonSnapshot(week, "tags-imgauth.json") : null;
  const tag = tagsSnap?.ok && Array.isArray(tagsSnap.data) && tagsSnap.data.length > 0 ? tagsSnap.data[0].name : null;

  if (!tag) {
    writeSnapshot(week, { week, tag: null, ok: false, error: "nessun tag imgauth nello snapshot della settimana" });
    console.log("scan-privacy: nessun tag imgauth disponibile, indicatore resterà null.");
    return;
  }

  const listing = await listSchemaFiles(tag, ghHeaders);
  if (!listing.ok) {
    writeSnapshot(week, { week, tag, ok: false, error: `listing schema fallito (status ${listing.status ?? listing.error})` });
    console.log(`scan-privacy: listing schema fallito per tag ${tag}, indicatore resterà null.`);
    return;
  }

  const schemaTexts = [];
  for (const file of listing.files) {
    const r = await fetchText(`https://raw.githubusercontent.com/${IMGAUTH_REPO}/${tag}/schema/${file}`);
    if (r.ok) schemaTexts.push(r.text);
  }
  const workerRes = await fetchText(`https://raw.githubusercontent.com/${IMGAUTH_REPO}/${tag}/worker.js`);

  const detected = [...extractSqlFlows(schemaTexts), ...(workerRes.ok ? extractR2Flows(workerRes.text) : [])];

  const map = JSON.parse(readFileSync(MAP_FILE, "utf8")).flows;
  const flows = detected.map((h) => {
    const entry = map[h.id];
    if (!entry) {
      return { id: h.id, status: "not_covered", reason: "rilevato ma assente dal mapping — richiede una decisione", columns: h.columns ?? null };
    }
    return { id: h.id, status: entry.status, dat: entry.dat ?? null, reason: entry.reason ?? null, columns: h.columns ?? null };
  });

  const result = {
    week,
    tag,
    ok: true,
    schema_files: listing.files,
    worker_fetched: workerRes.ok,
    flows,
  };
  writeSnapshot(week, result);

  const covered = flows.filter((f) => f.status === "covered").length;
  const falsePos = flows.filter((f) => f.status === "false_positive").length;
  const notCovered = flows.filter((f) => f.status === "not_covered").length;
  console.log(
    `scan-privacy: imgauth@${tag}, ${detected.length} flussi rilevati — ${covered} coperti, ${falsePos} falsi positivi, ${notCovered} non coperti.`
  );
}

main();
