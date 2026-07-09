import { readFileSync, readdirSync } from "node:fs";
import { join, extname, basename } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { SCHEMAS_DIR, FOLDER_SCHEMA, loadRegistry } from "./lib/registry.mjs";

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

  const records = loadRegistry();
  const seenIds = new Map(); // per rilevare id duplicati tra file diversi

  for (const [id, { record, rel, folder, file }] of records) {
    const text = readFileSync(file, "utf8");

    for (const pattern of SECRET_VALUE_PATTERNS) {
      if (pattern.test(text)) {
        errors.push(`${rel}: possibile segreto in chiaro (pattern ${pattern})`);
      }
    }

    const schemaFile = FOLDER_SCHEMA[folder];
    if (!schemaFile) {
      errors.push(`${rel}: cartella "${folder}" non mappata a nessuno schema`);
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

    if (seenIds.has(id)) {
      errors.push(`${rel}: id duplicato "${id}" (già usato in ${seenIds.get(id)})`);
    } else {
      seenIds.set(id, rel);
    }
  }

  // Risoluzione dei riferimenti nel grafo (regola PRN-01 / §3.4.1)
  for (const [, { record, rel }] of records) {
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
