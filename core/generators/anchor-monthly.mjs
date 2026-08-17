import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { loadTenant, TENANT_SNAPSHOTS_DIR } from "./lib/tenant.mjs";

const SNAPSHOTS_DIR = TENANT_SNAPSHOTS_DIR;
const ANCHORS_DIR = join(SNAPSHOTS_DIR, "anchors");

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Costruisce un bundle deterministico di TUTTI gli snapshot settimanali
// raccolti finora (non solo quelli del mese corrente: il primo ancoraggio
// dogfooding copre tutta la storia accumulata fino a oggi; i successivi,
// mensili, copriranno il periodo dall'ultimo ancoraggio).
function main() {
  const cfg = loadTenant();
  const now = new Date();
  const period = monthKey(now);
  const force = process.argv.includes("--force");

  mkdirSync(ANCHORS_DIR, { recursive: true });
  const outFile = join(ANCHORS_DIR, `${period}-bundle.json`);

  // Ogni rigenerazione cambia generated_at, quindi cambia l'impronta: se il
  // pacchetto del mese esiste già ed è stato eventualmente già attestato,
  // riscriverlo scollegherebbe il certificato dal file. Senza --force, una
  // nuova esecuzione nello stesso mese si limita a rileggere quello che c'è.
  if (existsSync(outFile) && !force) {
    const existing = readFileSync(outFile, "utf8");
    const digest = sha256(existing);
    console.log(`Il pacchetto "${period}" esiste già in snapshots/anchors/${period}-bundle.json`);
    console.log(`SHA-256 del file: ${digest}`);
    console.log("");
    console.log("Non è stato riscritto: se lo hai già attestato, questa è l'impronta da usare.");
    console.log("Per rifarlo davvero (solo se creato per errore e NON ancora attestato), rilancia con --force.");
    return;
  }

  const weeks = readdirSync(SNAPSHOTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "anchors")
    .map((d) => d.name)
    .sort();

  const entries = [];
  for (const week of weeks) {
    const manifestPath = join(SNAPSHOTS_DIR, week, "manifest.json");
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      continue;
    }
    entries.push({ week, collected_at: manifest.collected_at, files: manifest.files });
  }

  if (entries.length === 0) {
    console.error("Nessuno snapshot trovato in snapshots/ — esegui prima npm run collect-evidence.");
    process.exit(1);
  }

  if (force && existsSync(outFile)) {
    console.log(`--force: il pacchetto "${period}" esiste già e verrà riscritto.`);
    console.log("L'impronta cambierà: un eventuale certificato già emesso non corrisponderà più al nuovo file.");
    console.log("");
  }

  const bundle = {
    type: "genesis-trust-framework-dogfooding-bundle",
    period,
    generated_at: now.toISOString(),
    weeks_included: entries.map((e) => e.week),
    entries,
  };
  const text = JSON.stringify(bundle, null, 2) + "\n";
  const digest = sha256(text);

  writeFileSync(outFile, text);

  console.log(`Bundle "${period}" scritto in snapshots/anchors/${period}-bundle.json`);
  console.log(`SHA-256 del file: ${digest}`);
  console.log(`Settimane incluse: ${entries.map((e) => e.week).join(", ")}`);
  console.log("");
  console.log("Prossimo passo (manuale, richiede un umano per Turnstile):");
  console.log(`1. Trascina questo file su ${cfg.operations.attestation_site}, scheda Attesta`);
  console.log("2. Genera il certificato E scarica il PDF (solo /api/cert-pdf innesca");
  console.log("   l'ancoraggio OpenTimestamps reale, /api/hash da solo no)");
  console.log("3. Condividi qui l'impronta e il link permanente /c/<hash>");
}

main();
