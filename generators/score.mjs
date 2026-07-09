import { writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRegistry, byFolder } from "./lib/registry.mjs";

const SITE_DIR = join(ROOT, "site");
const SNAPSHOTS_DIR = join(ROOT, "snapshots");
const ANCHORS_DIR = join(SNAPSHOTS_DIR, "anchors");

// Mese di nascita del GTF (ARCHITECTURE.md): da qui parte l'attesa di un
// ancoraggio dogfooding al mese (CTL-dogfooding-anchor).
const GTF_BIRTH_MONTH = "2026-07";

// Settimana più recente raccolta dal collettore (generators/collect-evidence.mjs).
// Le cartelle YYYY-Www ordinano correttamente in lessicografico (settimana a 2 cifre);
// "anchors" non è una settimana ed è esclusa.
function latestWeek() {
  if (!existsSync(SNAPSHOTS_DIR)) return null;
  const weeks = readdirSync(SNAPSHOTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "anchors")
    .map((d) => d.name)
    .sort();
  return weeks.length > 0 ? weeks[weeks.length - 1] : null;
}

function readJsonSnapshot(week, filename) {
  const file = join(SNAPSHOTS_DIR, week, filename);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// Componente "worker" (sonda HMAC) dell'ultimo /api/status raccolto.
function latestSnapshotWorkerStatus(week) {
  if (!week) return null;
  const wrapper = readJsonSnapshot(week, "status.json");
  if (!wrapper?.ok || !wrapper.data?.worker) return null;
  return { week, worker: wrapper.data.worker };
}

// Quota di repo pubblici (imgauth, imgauthweb, autart-signer) con almeno un
// tag di release (convenzione vX.Y.Z, PRC-release-coordinata). Proxy semplice:
// non conta ancora quante versioni storiche sono taggate, solo se la pratica
// è adottata per repo — si raffina quando esisterà più storico.
function releaseTagRatio(week) {
  if (!week) return { ratio: null, tagged: 0, total: 0 };
  const repos = ["imgauth", "imgauthweb", "autart-signer"];
  const checked = repos
    .map((repo) => readJsonSnapshot(week, `tags-${repo}.json`))
    .filter((r) => r?.ok);
  if (checked.length === 0) return { ratio: null, tagged: 0, total: 0 };
  const tagged = checked.filter((r) => Array.isArray(r.data) && r.data.length > 0).length;
  return { ratio: pct(tagged, checked.length), tagged, total: checked.length };
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

// Quota di ancoraggi dogfooding mensili riusciti su quelli attesi da quando
// il GTF esiste (un bundle <YYYY-MM>-bundle.json committato = un mese onorato).
function dogfoodingAnchorRatio() {
  if (!existsSync(ANCHORS_DIR)) return { ratio: null, done: 0, expected: 0 };
  const done = readdirSync(ANCHORS_DIR).filter((f) => /^\d{4}-\d{2}-bundle\.json$/.test(f)).length;
  const [birthYear, birthMonth] = GTF_BIRTH_MONTH.split("-").map(Number);
  const now = new Date();
  const expected = (now.getUTCFullYear() - birthYear) * 12 + (now.getUTCMonth() + 1 - birthMonth) + 1;
  return { ratio: pct(Math.min(done, expected), expected), done, expected };
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

  // Integrità: media dei componenti disponibili tra sonda HMAC (ultimo snapshot
  // settimanale), quota di ancoraggi dogfooding mensili onorati e quota di repo
  // pubblici con almeno un tag di release.
  const week = latestWeek();
  const snap = latestSnapshotWorkerStatus(week);
  const WORKER_SCORE = { ok: 100, degraded: 50, down: 0 };
  const workerComponent = snap ? WORKER_SCORE[snap.worker] ?? null : null;
  const anchor = dogfoodingAnchorRatio();
  const tags = releaseTagRatio(week);
  const integrityComponents = [workerComponent, anchor.ratio, tags.ratio].filter((v) => v !== null);
  const integrity =
    integrityComponents.length > 0
      ? Math.round(integrityComponents.reduce((a, b) => a + b, 0) / integrityComponents.length)
      : null;
  const integrityNote =
    integrityComponents.length > 0
      ? `sonda HMAC (${snap ? `componente "worker", snapshot ${snap.week}` : "nessuno snapshot"}) + ancoraggi dogfooding onorati (${anchor.done}/${anchor.expected} mesi da ${GTF_BIRTH_MONTH}) + repo con tag di release (${tags.tagged}/${tags.total || "n/d"}) — proxy iniziale, non ancora la quota storica di versioni taggate`
      : "richiede almeno uno snapshot dal collettore di evidenze, un ancoraggio dogfooding o dati sui tag (nessuno ancora raccolto)";

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
