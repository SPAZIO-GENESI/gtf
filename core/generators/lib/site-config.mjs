// Estratto da build-root.mjs in P47 F3: build-changelog.mjs riusa questo
// helper. Vive in lib/, non in build-root.mjs, apposta — build-root.mjs
// esegue main() al caricamento del modulo (è uno script, non una libreria):
// importarlo da lì avrebbe rigenerato site/index.html come effetto
// collaterale ogni volta che si costruisce il changelog (stesso motivo per
// cui render.mjs esiste separato da build-site.mjs, vedi il commento lì).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./root.mjs";

export function loadSiteConfig() {
  const file = join(ROOT, "content", "site.config.json");
  return JSON.parse(readFileSync(file, "utf8"));
}
