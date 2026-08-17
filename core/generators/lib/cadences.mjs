import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "./registry.mjs";
import { TENANT_SNAPSHOTS_DIR } from "./tenant.mjs";

// Sorgente unica delle scadenze ricorrenti. Esiste perché due consumatori
// devono raccontare la stessa identica storia: l'allarme Telegram
// (check-cadences.mjs) e la scheda Manutenzione del pannello, alimentata dal
// file pubblicato da build-cadences.mjs. Quando la logica stava solo nel
// primo, il secondo avrebbe potuto dire "tutto a posto" mentre il bot
// segnalava una scadenza — la classe di divergenza che il framework esiste
// per evitare.

const ANCHORS_DIR = join(TENANT_SNAPSHOTS_DIR, "anchors");

// Grazia oltre il mese per il ciclo di ancoraggio (GTF-ARCH §6.4): un
// pacchetto mensile non cade mai a giorno fisso.
export const ANCHOR_GRACE_DAYS = 35;

const DAY_MS = 86400000;

function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function toMs(dateStr) {
  return new Date(dateStr).getTime();
}

// Ultimo pacchetto di ancoraggio committato. È la fonte di verità di quel
// ciclo: nessuna data da aggiornare a mano, quindi nessuna data che possa
// mentire — il pacchetto o c'è o non c'è.
function latestAnchorDate() {
  if (!existsSync(ANCHORS_DIR)) return null;
  const bundles = readdirSync(ANCHORS_DIR)
    .filter((f) => /^\d{4}-\d{2}-bundle\.json$/.test(f))
    .sort();
  if (bundles.length === 0) return null;
  try {
    const data = JSON.parse(readFileSync(join(ANCHORS_DIR, bundles[bundles.length - 1]), "utf8"));
    return data.generated_at ?? null;
  } catch {
    return null;
  }
}

function registryUrl(cfg, rel) {
  const base = cfg.operations?.registry_blob_base;
  return base ? `${base}/${rel.split("\\").join("/")}` : null;
}

function makeItem({ id, title, record, rel, cfg, lastDone, dueMs, neverRun }) {
  const now = Date.now();
  const overdueDays = dueMs !== null && now > dueMs ? Math.floor((now - dueMs) / DAY_MS) : null;
  return {
    id,
    title,
    who: record?.who ?? null,
    needs_technical: record?.needs_technical ?? null,
    duration_minutes: record?.duration_minutes ?? null,
    frequency_days: record?.frequency_days ?? null,
    last_done: lastDone,
    never_run: Boolean(neverRun),
    next_due: dueMs !== null ? isoDay(dueMs) : null,
    overdue_days: overdueDays,
    steps: record?.steps ?? [],
    registry_url: rel ? registryUrl(cfg, rel) : null,
  };
}

// Elenco completo delle manutenzioni ricorrenti, scadute e non, ordinate per
// urgenza. Chi vuole solo le scadute filtra su overdue_days !== null: la
// scheda del pannello ha bisogno anche delle altre, per dire "nulla da fare"
// invece di non dire niente.
export function computeCadences(cfg, records = loadRegistry()) {
  const birth = cfg.operations?.birth_date;
  const items = [];

  const processes = [...records.values()].filter((r) => r.folder === "processes");
  const byId = new Map(processes.map((r) => [r.record.id, r]));

  // 1. Il ciclo di ancoraggio: la cadenza si legge dai pacchetti, i passi dal
  //    processo che lo descrive. Due sorgenti perché sono due cose diverse —
  //    quando è stato fatto, e come si fa.
  const anchorProcessId = cfg.operations?.anchor_process_id;
  const anchorEntry = anchorProcessId ? byId.get(anchorProcessId) : null;
  if (anchorEntry) {
    const anchorDate = latestAnchorDate();
    items.push(
      makeItem({
        id: anchorEntry.record.id,
        title: anchorEntry.record.title,
        record: anchorEntry.record,
        rel: anchorEntry.rel,
        cfg,
        lastDone: anchorDate ? isoDay(toMs(anchorDate)) : null,
        dueMs: anchorDate ? toMs(anchorDate) + ANCHOR_GRACE_DAYS * DAY_MS : 0,
        neverRun: !anchorDate,
      })
    );
  }

  // 2. I processi a cadenza dichiarata. Senza last_run si parte dalla nascita
  //    del registro: un processo mai eseguito deve risultare scaduto, non
  //    perennemente "non ancora dovuto".
  for (const entry of processes) {
    const p = entry.record;
    if (!p.frequency_days) continue;
    const ref = p.last_run ?? birth;
    items.push(
      makeItem({
        id: p.id,
        title: p.title,
        record: p,
        rel: entry.rel,
        cfg,
        lastDone: p.last_run ?? null,
        dueMs: ref ? toMs(ref) + p.frequency_days * DAY_MS : 0,
        neverRun: !p.last_run,
      })
    );
  }

  items.sort((a, b) => {
    if (a.next_due === b.next_due) return a.id.localeCompare(b.id);
    if (a.next_due === null) return -1;
    if (b.next_due === null) return 1;
    return a.next_due < b.next_due ? -1 : 1;
  });
  return items;
}

export function overdueOnly(items) {
  return items.filter((i) => i.overdue_days !== null);
}
