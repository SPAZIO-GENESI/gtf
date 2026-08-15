import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Estratto da registry.mjs in F2: registry.mjs ora importa TENANT_REGISTRY_DIR
// da tenant.mjs, e tenant.mjs importava ROOT da registry.mjs — un ciclo che
// in ESM lascia ROOT non inizializzato al momento in cui tenant.mjs lo usa
// (TDZ). Questo modulo non dipende da nessuno dei due, quindi rompe il ciclo.
// F3: il file è sceso di un livello (generators/lib/ → core/generators/lib/),
// quindi risalire alla radice del repo richiede un ".." in più (4, non 3).
export const ROOT = join(fileURLToPath(import.meta.url), "..", "..", "..", "..");
