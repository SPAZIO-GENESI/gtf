import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Estratto da registry.mjs in F2: registry.mjs ora importa TENANT_REGISTRY_DIR
// da tenant.mjs, e tenant.mjs importava ROOT da registry.mjs — un ciclo che
// in ESM lascia ROOT non inizializzato al momento in cui tenant.mjs lo usa
// (TDZ). Questo modulo non dipende da nessuno dei due, quindi rompe il ciclo.
export const ROOT = join(fileURLToPath(import.meta.url), "..", "..", "..");
