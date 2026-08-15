import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./lib/root.mjs";

// Questo stesso file elenca i termini vietati, quindi li contiene per
// definizione — è l'unico file di core/ escluso dal proprio scan.
const SELF = fileURLToPath(import.meta.url);

// Guardia anti-contaminazione (P44 F3): core/ deve restare applicabile a
// qualunque tenant. Se uno di questi nomi compare dentro core/**, un
// progetto specifico si è infilato nel motore generico.
const FORBIDDEN_TERMS = [
  "spaziogenesi",
  "spazio genesi",
  "spazio-genesi",
  "attestazione",
  "imgauth",
  "autart",
  "attest-",
  "radart",
];

const CORE_DIR = join(ROOT, "core");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
    } else if (extname(p) !== ".md") {
      out.push(p);
    }
  }
  return out;
}

function main() {
  const hits = [];
  const files = walk(CORE_DIR);

  for (const file of files) {
    if (file === SELF) continue;
    const rel = relative(ROOT, file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const lower = line.toLowerCase();
      for (const term of FORBIDDEN_TERMS) {
        if (lower.includes(term)) {
          hits.push(`${rel}:${i + 1}: contiene "${term}" — ${line.trim()}`);
        }
      }
    });
  }

  if (hits.length > 0) {
    console.error(`\ncore/ contiene ${hits.length} riferimento/i a un progetto specifico:\n`);
    for (const h of hits) console.error(" - " + h);
    console.error(
      "\ncore/ deve restare generico: sposta questi valori in tenants/<id>/tenant.config.json " +
        `o in default-tenant.json (vedi ${basename(CORE_DIR)}/README.md).`
    );
    process.exit(1);
  }

  console.log(`core/ pulito: nessun riferimento a un progetto specifico in ${files.length} file.`);
}

main();
