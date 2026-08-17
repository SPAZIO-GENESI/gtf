import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "./lib/registry.mjs";
import { loadTenant, TENANT_SITE_DIR } from "./lib/tenant.mjs";
import { computeCadences } from "./lib/cadences.mjs";

// Pubblica le manutenzioni ricorrenti in un file che il pannello di gestione
// legge per mostrarle a chi deve eseguirle. I passi vivono nel registro
// (campo steps dei processi) e non nel pannello: così la procedura si corregge
// modificando il registro pubblico, senza un rilascio del motore, e resta una
// cosa sola con ciò che il registro dichiara di fare.
//
// Il file NON contiene "quanti giorni di ritardo": quel numero invecchierebbe
// tra una pubblicazione e l'altra. Contiene la data di scadenza, e chi legge
// calcola il ritardo con la data di oggi — così il file resta vero anche se
// non viene rigenerato per settimane.
function main() {
  const cfg = loadTenant();
  const items = computeCadences(cfg, loadRegistry()).map(({ overdue_days, ...rest }) => rest);

  const out = {
    generated_at: new Date().toISOString(),
    registry_url: cfg.operations?.processes_url ?? null,
    items,
  };

  const file = join(TENANT_SITE_DIR, "manutenzione.json");
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n");

  console.log(`Manutenzioni pubblicate in ${file}`);
  for (const i of items) {
    const passi = i.steps.length ? `${i.steps.length} passi` : "NESSUN PASSO SCRITTO";
    console.log(`  ${i.id} — prossima scadenza ${i.next_due ?? "(mai eseguito)"} — ${passi}`);
  }
}

main();
