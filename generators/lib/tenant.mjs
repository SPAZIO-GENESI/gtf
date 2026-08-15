import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./root.mjs";

// L'id del tenant attivo: finché ne esiste uno solo, nessun comando deve
// cambiare — GTF_TENANT resta assente e si usa sempre "attestazione".
const DEFAULT_TENANT_ID = "attestazione";

export function loadTenant(id = process.env.GTF_TENANT || DEFAULT_TENANT_ID) {
  const file = join(ROOT, "tenants", id, "tenant.config.json");
  if (!existsSync(file)) {
    throw new Error(`Configurazione tenant non trovata: ${file}`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

const activeTenantId = process.env.GTF_TENANT || DEFAULT_TENANT_ID;

export const TENANT_DIR = join(ROOT, "tenants", activeTenantId);

export const TENANT_REGISTRY_DIR = join(TENANT_DIR, "registry");
export const TENANT_SNAPSHOTS_DIR = join(TENANT_DIR, "snapshots");
