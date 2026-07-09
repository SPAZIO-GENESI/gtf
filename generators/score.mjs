import { writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRegistry, byFolder } from "./lib/registry.mjs";

const SITE_DIR = join(ROOT, "site");
const SNAPSHOTS_DIR = join(ROOT, "snapshots");

// Legge l'ultimo snapshot settimanale del collettore (generators/collect-evidence.mjs),
// se esiste, per il solo componente "worker" (sonda HMAC) di /api/status.
// Le cartelle YYYY-Www ordinano correttamente in lessicografico (settimana a 2 cifre).
function latestSnapshotWorkerStatus() {
  if (!existsSync(SNAPSHOTS_DIR)) return null;
  const weeks = readdirSync(SNAPSHOTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "anchors")
    .map((d) => d.name)
    .sort();
  if (weeks.length === 0) return null;
  const latest = weeks[weeks.length - 1];
  const file = join(SNAPSHOTS_DIR, latest, "status.json");
  if (!existsSync(file)) return null;
  try {
    const wrapper = JSON.parse(readFileSync(file, "utf8"));
    if (!wrapper.ok || !wrapper.data?.worker) return null;
    return { week: latest, worker: wrapper.data.worker };
  } catch {
    return null;
  }
}

function isPublic(record) {
  return (record.visibility ?? "public") === "public";
}

function daysAgo(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

function pct(numerator, denominator) {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function computeIndicators(records) {
  const all = [...records.values()].map((r) => r.record);
  const ctl = byFolder(records, "controls");
  const ctlActive = ctl.filter((c) => c.status === "active");
  const evd = byFolder(records, "evidence");

  // Trasparenza: % record pubblici + % CTL attivi con verify_howto
  const pctPublicRecords = pct(all.filter(isPublic).length, all.length);
  const ctlActiveWithVerify = ctlActive.filter((c) => c.verify_howto).length;
  const pctCtlVerify = pct(ctlActiveWithVerify, ctlActive.length);
  const transparency =
    pctPublicRecords !== null && pctCtlVerify !== null
      ? Math.round((pctPublicRecords + pctCtlVerify) / 2)
      : null;

  // Tracciabilità: % CTL attivi con catena satisfies+implemented_by+evidenced_by completa
  const fullChain = ctlActive.filter(
    (c) => (c.satisfies?.length ?? 0) > 0 && (c.implemented_by?.length ?? 0) > 0 && (c.evidenced_by?.length ?? 0) > 0
  ).length;
  const traceability = pct(fullChain, ctlActive.length);

  // Documentazione: % CTL (ogni stato) con last_reviewed entro review_every_days
  const fresh = ctl.filter(
    (c) => c.last_reviewed && c.review_every_days && daysAgo(c.last_reviewed) <= c.review_every_days
  ).length;
  const documentation = pct(fresh, ctl.length);

  // Automazione: % EVD con collection=auto
  const automation = pct(evd.filter((e) => e.collection === "auto").length, evd.length);

  // Riproducibilità: stesso segnale del secondo termine di Trasparenza (limite dichiarato in MET-reproducibility)
  const reproducibility = pctCtlVerify;

  // Integrità: parziale, solo componente "worker" (sonda HMAC) dell'ultimo snapshot
  // raccolto — non include ancora storico release taggate né esito ancore OTS mensili.
  const snap = latestSnapshotWorkerStatus();
  const WORKER_SCORE = { ok: 100, degraded: 50, down: 0 };
  const integrity = snap ? WORKER_SCORE[snap.worker] ?? null : null;
  const integrityNote = snap
    ? `parziale: solo sonda HMAC (componente "worker", snapshot ${snap.week}) — non ancora storico release taggate; il primo ancoraggio dogfooding mensile esiste (CTL-dogfooding-anchor) ma non è ancora incorporato nel calcolo`
    : "richiede almeno uno snapshot dal collettore di evidenze (non ancora raccolto)";

  return [
    { id: "MET-transparency", label: "Trasparenza", value: transparency },
    { id: "MET-integrity", label: "Integrità", value: integrity, note: integrityNote },
    { id: "MET-traceability", label: "Tracciabilità", value: traceability },
    { id: "MET-documentation", label: "Documentazione", value: documentation },
    { id: "MET-automation", label: "Automazione", value: automation },
    { id: "MET-audit", label: "Audit", value: null, note: "nessun ciclo di revisione trimestrale ancora concluso" },
    { id: "MET-conservation", label: "Conservazione", value: null, note: "nessun restore-drill ancora eseguito" },
    { id: "MET-reproducibility", label: "Riproducibilità", value: reproducibility },
    { id: "MET-privacy", label: "Privacy", value: null, note: "richiede uno scanner del codice non ancora costruito" },
    { id: "MET-governance", label: "Governance", value: null, note: "richiede dati GitHub, score v0 lavora solo offline dal registro" },
  ];
}

function buildBadgeSvg(overall, available, total) {
  const text = `Genesis Trust Score ${overall}/100 (${available}/${total})`;
  const width = 44 + text.length * 6.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="24" role="img" aria-label="${text}">
  <rect width="100%" height="100%" rx="4" fill="#5a3d10"/>
  <text x="12" y="16" font-family="IBM Plex Mono, monospace" font-size="12" fill="#FBFAF6">${text}</text>
</svg>
`;
}

function main() {
  const records = loadRegistry();
  const indicators = computeIndicators(records);
  const available = indicators.filter((i) => i.value !== null);
  const overall = available.length > 0 ? Math.round(available.reduce((s, i) => s + i.value, 0) / available.length) : null;

  const score = {
    overall,
    available_count: available.length,
    total: indicators.length,
    indicators,
    computed_at: new Date().toISOString(),
  };

  writeFileSync(join(SITE_DIR, "score.json"), JSON.stringify(score, null, 2) + "\n");
  writeFileSync(join(SITE_DIR, "badge.svg"), buildBadgeSvg(overall ?? "n/d", available.length, indicators.length));

  console.log(`Score calcolato: ${overall}/100 (${available.length}/${indicators.length} indicatori disponibili).`);
}

main();
