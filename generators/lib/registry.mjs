import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export const ROOT = join(fileURLToPath(import.meta.url), "..", "..", "..");
export const REGISTRY_DIR = join(ROOT, "registry");
export const SCHEMAS_DIR = join(ROOT, "schemas");

export const FOLDER_SCHEMA = {
  principles: "principle.schema.json",
  requirements: "requirement.schema.json",
  controls: "control.schema.json",
  implementations: "implementation.schema.json",
  evidence: "evidence.schema.json",
  processes: "process.schema.json",
  decisions: "decision.schema.json",
  risks: "risk.schema.json",
  incidents: "incident.schema.json",
  actions: "action.schema.json",
  data: "data.schema.json",
  metrics: "metric.schema.json",
  glossary: "glossary.schema.json",
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (extname(p) === ".yaml" || extname(p) === ".yml") out.push(p);
  }
  return out;
}

// Carica ogni record YAML del registro. JSON_SCHEMA evita che js-yaml
// converta le date ISO in oggetti Date (il JSON Schema si aspetta stringhe).
export function loadRegistry() {
  const records = new Map(); // id -> { record, file, rel, folder }
  for (const file of walk(REGISTRY_DIR)) {
    const rel = relative(ROOT, file);
    const folder = basename(join(file, ".."));
    const text = readFileSync(file, "utf8");
    let record;
    try {
      record = yaml.load(text, { schema: yaml.JSON_SCHEMA });
    } catch {
      continue; // i file malformati sono già segnalati da validate.mjs
    }
    if (!record || typeof record !== "object" || !record.id) continue;
    records.set(record.id, { record, file, rel, folder });
  }
  return records;
}

export function byFolder(records, folder) {
  return [...records.values()].filter((r) => r.folder === folder).map((r) => r.record);
}
