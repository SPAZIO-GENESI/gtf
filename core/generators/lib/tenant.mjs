import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./root.mjs";

// L'id del tenant attivo, se non specificato da GTF_TENANT, viene letto da
// default-tenant.json alla radice del repo — non da una costante qui dentro.
// F3: la guardia check-core-isolation.mjs scandisce core/** e fallisce su
// nomi di progetto; un id di tenant hardcoded in questo file lo
// contaminerebbe. default-tenant.json vive fuori da core/ apposta: è
// configurazione di bootstrap del repo, non logica del motore.
function readDefaultTenantId() {
  const file = join(ROOT, "default-tenant.json");
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")).id;
}

function resolveTenantId() {
  const id = process.env.GTF_TENANT || readDefaultTenantId();
  if (!id) {
    throw new Error(
      "Nessun tenant specificato: imposta GTF_TENANT oppure crea default-tenant.json alla radice del repo."
    );
  }
  return id;
}

export function loadTenant(id = resolveTenantId()) {
  const file = join(ROOT, "tenants", id, "tenant.config.json");
  if (!existsSync(file)) {
    throw new Error(`Configurazione tenant non trovata: ${file}`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

const activeTenantId = resolveTenantId();

export const TENANT_DIR = join(ROOT, "tenants", activeTenantId);
if (!existsSync(TENANT_DIR)) {
  throw new Error(`Cartella del tenant non trovata: ${TENANT_DIR}`);
}

export const TENANT_REGISTRY_DIR = join(TENANT_DIR, "registry");
export const TENANT_SNAPSHOTS_DIR = join(TENANT_DIR, "snapshots");
