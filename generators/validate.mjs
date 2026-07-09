import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const REGISTRY_DIR = join(ROOT, "registry");
const SCHEMAS_DIR = join(ROOT, "schemas");

// Mappa cartella del registro -> file di schema
const FOLDER_SCHEMA = {
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

// Campi che contengono ID (singoli o array) e vanno risolti nel grafo
const REFERENCE_FIELDS = [
  "satisfies", "mitigates", "implemented_by", "evidenced_by", "supports",
  "satisfied_by", "affects", "evidence", "mitigated_by", "actions",
  "superseded_by", "produces_evidence", "produced_by", "derives_from",
];

const ID_PATTERN = /^[A-Z]{3,4}-[\w-]+$/;

// Pattern di best-effort per valori che sembrano segreti (non nomi di variabile)
const SECRET_VALUE_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(secret|password|token|api[_-]?key)\s*:\s*["']?[A-Za-z0-9+/_-]{20,}["']?/i,
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (extname(p) === ".yaml" || extname(p) === ".yml") out.push(p);
  }
  return out;
}

function loadSchemas(ajv) {
  const validators = {};
  for (const file of readdirSync(SCHEMAS_DIR)) {
    if (!file.endsWith(".schema.json")) continue;
    const schema = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), "utf8"));
    validators[file] = ajv.compile(schema);
  }
  return validators;
}

function main() {
  const errors = [];
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validators = loadSchemas(ajv);

  const files = walk(REGISTRY_DIR);
  const records = new Map(); // id -> { record, file }

  for (const file of files) {
    const rel = relative(ROOT, file);
    const folder = basename(join(file, ".."));
    const schemaFile = FOLDER_SCHEMA[folder];
    const text = readFileSync(file, "utf8");

    // Lint anti-segreti sul testo grezzo, prima ancora del parsing
    for (const pattern of SECRET_VALUE_PATTERNS) {
      if (pattern.test(text)) {
        errors.push(`${rel}: possibile segreto in chiaro (pattern ${pattern})`);
      }
    }

    if (!schemaFile) {
      errors.push(`${rel}: cartella "${folder}" non mappata a nessuno schema`);
      continue;
    }

    let record;
    try {
      // JSON_SCHEMA evita che js-yaml converta le date ISO in oggetti Date:
      // il JSON Schema si aspetta stringhe (format: date), non oggetti.
      record = yaml.load(text, { schema: yaml.JSON_SCHEMA });
    } catch (e) {
      errors.push(`${rel}: YAML non valido — ${e.message}`);
      continue;
    }
    if (!record || typeof record !== "object") {
      errors.push(`${rel}: il file non contiene un oggetto YAML valido`);
      continue;
    }

    const validate = validators[schemaFile];
    if (!validate(record)) {
      for (const err of validate.errors) {
        errors.push(`${rel}: ${err.instancePath || "/"} ${err.message}`);
      }
    }

    const expectedId = basename(file, extname(file));
    if (record.id !== expectedId) {
      errors.push(`${rel}: id "${record.id}" non corrisponde al nome file "${expectedId}"`);
    }

    if (records.has(record.id)) {
      errors.push(`${rel}: id duplicato "${record.id}" (già usato in ${records.get(record.id).rel})`);
    } else {
      records.set(record.id, { record, rel });
    }
  }

  // Risoluzione dei riferimenti nel grafo (regola PRN-01 / §3.4.1)
  for (const [id, { record, rel }] of records) {
    for (const field of REFERENCE_FIELDS) {
      const value = record[field];
      if (value === undefined) continue;
      const targets = Array.isArray(value) ? value : [value];
      for (const target of targets) {
        if (typeof target !== "string" || !ID_PATTERN.test(target)) continue;
        if (!records.has(target)) {
          errors.push(`${rel}: campo "${field}" referenzia "${target}" che non esiste nel registro`);
        }
      }
    }
  }

  // Regola: controllo attivo richiede implementazione + evidenza già verificato dallo schema
  // (control.schema.json § allOf); qui verifichiamo che quelle referenziate non siano stale.
  for (const [id, { record, rel }] of records) {
    if (id.startsWith("CTL-") && record.status === "active") {
      for (const evdId of record.evidenced_by || []) {
        const evd = records.get(evdId);
        if (evd && evd.record.freshness_max_days && evd.record.last_seen) {
          const ageDays = (Date.now() - new Date(evd.record.last_seen).getTime()) / 86400000;
          if (ageDays > evd.record.freshness_max_days) {
            errors.push(`${rel}: evidenza "${evdId}" scaduta (freschezza superata) — il controllo dovrebbe passare a "stale"`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} errore/i di validazione del registro GTF:\n`);
    for (const e of errors) console.error(" - " + e);
    process.exit(1);
  }

  console.log(`Registro GTF valido: ${records.size} record, 0 errori.`);
}

main();
