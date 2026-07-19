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

// Governance (MET-governance, ADR-GTF-011): media di validazione CI del
// registro (quota run success di validate.yml su gtf/main) e gate umano P24
// sui rilasci di produzione (quota run ci.yml su imgauth/main il cui job
// deploy-production è concluso con un record di approvazione). I run senza
// quel job (path-ignore, fallimento a monte) sono esclusi dal denominatore,
// non contati come mancate approvazioni.
function governanceRatio(week) {
  if (!week) return { ratio: null, note: null };
  const validateSnap = readJsonSnapshot(week, "governance-validate-runs.json");
  const gateSnap = readJsonSnapshot(week, "governance-prod-gate.json");

  let validateRatio = null;
  let validateNote = "n/d";
  if (validateSnap?.ok && Array.isArray(validateSnap.data) && validateSnap.data.length > 0) {
    const total = validateSnap.data.length;
    const success = validateSnap.data.filter((r) => r.conclusion === "success").length;
    validateRatio = pct(success, total);
    validateNote = `validate ${success}/${total}`;
  }

  let gateRatio = null;
  let gateNote = "n/d";
  if (gateSnap?.ok && Array.isArray(gateSnap.data)) {
    const withJob = gateSnap.data.filter((r) => r.has_job);
    if (withJob.length > 0) {
      const approved = withJob.filter(
        (r) => r.job_conclusion === "success" && Array.isArray(r.approvals) && r.approvals.length > 0
      ).length;
      gateRatio = pct(approved, withJob.length);
      gateNote = `gate ${approved}/${withJob.length}`;
    }
  }

  const components = [validateRatio, gateRatio].filter((v) => v !== null);
  if (components.length === 0) return { ratio: null, note: null };
  const ratio = Math.round(components.reduce((a, b) => a + b, 0) / components.length);
  const note = `${validateNote} + ${gateNote} — quota PR esclusa (maintainer singolo, ADR-GTF-011)`;
  return { ratio, note };
}

// Privacy (MET-privacy, ADR-GTF-012): quota di flussi rilevati dallo
// scanner (generators/scan-privacy.mjs, snapshot privacy-scan.json) che
// hanno un DAT corrispondente nel mapping, al netto dei falsi positivi
// dichiarati. Snapshot assente/fallito → null, mai un valore inventato.
function privacyRatio(week) {
  if (!week) return { ratio: null, note: null };
  const scan = readJsonSnapshot(week, "privacy-scan.json");
  if (!scan?.ok || !Array.isArray(scan.flows)) return { ratio: null, note: null };

  const covered = scan.flows.filter((f) => f.status === "covered").length;
  const falsePositives = scan.flows.filter((f) => f.status === "false_positive").length;
  const notCovered = scan.flows.filter((f) => f.status === "not_covered").length;
  const denom = scan.flows.length - falsePositives;
  if (denom <= 0) return { ratio: null, note: "nessun flusso rilevato dallo scanner al netto dei falsi positivi" };

  const ratio = pct(covered, denom);
  const note = `scanner su imgauth@${scan.tag ?? "n/d"}: ${covered}/${denom} flussi mappati a un DAT (${falsePositives} falsi positivi dichiarati esclusi${notCovered > 0 ? `, ${notCovered} non coperti` : ""}) — non copre repo client (es. bot Telegram)`;
  return { ratio, note };
}

// Settimana ISO 8601 "YYYY-Www" di una data, stessa convenzione delle
// cartelle snapshots/ (generators/collect-evidence.mjs).
function isoWeekString(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // lunedì = 0
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // giovedì della stessa settimana ISO
  const isoYear = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNum);
  const week = 1 + Math.round((d - week1Monday) / (7 * 86400000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

// Conservazione (MET-conservation, ADR-GTF-013): media di [freschezza degli
// snapshot: quota delle ultime 8 settimane ISO con cartella snapshots/
// presente] e [esito dell'ultimo restore-drill (PRC-restore-drill): 100 se
// riuscito entro 210 giorni, 0 se fallito o decaduto oltre i 210 giorni,
// componente assente se il drill non è mai stato eseguito].
function conservationRatio(records) {
  const now = new Date();
  const total = 8;
  let present = 0;
  for (let i = 0; i < total; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    if (existsSync(join(SNAPSHOTS_DIR, isoWeekString(d)))) present++;
  }
  const freshness = pct(present, total);

  const prc = records.get("PRC-restore-drill")?.record;
  let drill = null;
  let drillNote = "mai eseguito";
  if (prc?.last_run) {
    const days = Math.floor(daysAgo(prc.last_run));
    if (prc.last_outcome === "failed") {
      drill = 0;
      drillNote = `fallito il ${prc.last_run}`;
    } else if (days <= 210) {
      drill = 100;
      drillNote = `riuscito il ${prc.last_run} (${days} giorni fa)`;
    } else {
      drill = 0;
      drillNote = `riuscito ma decaduto (ultimo il ${prc.last_run}, ${days} giorni fa, oltre 210)`;
    }
  }

  const components = [freshness, drill].filter((v) => v !== null);
  if (components.length === 0) return { ratio: null, note: null };
  const ratio = Math.round(components.reduce((a, b) => a + b, 0) / components.length);
  return { ratio, note: `snapshot ${present}/${total} settimane + drill: ${drillNote}` };
}

// Quota di azioni correttive (ACT) chiuse entro scadenza sul totale delle
// risolte (chiuse "done" + scadute "overdue"); le ACT ancora aperte e non
// scadute non contano né a favore né contro. Nessuna ACT risolta -> assente.
function actionsOnTimeRatio(records) {
  const acts = byFolder(records, "actions");
  const done = acts.filter((a) => a.status === "done").length;
  const overdue = acts.filter((a) => a.status === "overdue").length;
  const denom = done + overdue;
  if (denom === 0) return { ratio: null, note: null };
  return { ratio: pct(done, denom), note: `${done}/${denom} chiuse entro scadenza` };
}

// Audit (MET-audit, ADR-GTF-013): media di [freschezza dell'ultima revisione
// trimestrale (PRC-review-trimestrale): 100 entro la cadenza dichiarata, poi
// decadimento lineare fino a 0 a due cadenze di ritardo] e [quota di ACT
// chiuse entro scadenza — vedi actionsOnTimeRatio].
function auditRatio(records) {
  const prc = records.get("PRC-review-trimestrale")?.record;
  let freshness = null;
  let freshnessNote = "mai eseguita";
  if (prc?.last_run) {
    const days = Math.floor(daysAgo(prc.last_run));
    const freq = prc.frequency_days;
    if (days <= freq) {
      freshness = 100;
      freshnessNote = `ultima il ${prc.last_run} (${days}/${freq} giorni)`;
    } else if (days >= freq * 2) {
      freshness = 0;
      freshnessNote = `scaduta da oltre una cadenza intera (ultima il ${prc.last_run}, ${days} giorni fa)`;
    } else {
      freshness = Math.round(100 * (1 - (days - freq) / freq));
      freshnessNote = `ultima il ${prc.last_run}, in decadimento (${days}/${freq} giorni)`;
    }
  }

  const acts = actionsOnTimeRatio(records);
  const components = [freshness, acts.ratio].filter((v) => v !== null);
  if (components.length === 0) return { ratio: null, note: null };
  const ratio = Math.round(components.reduce((a, b) => a + b, 0) / components.length);
  return { ratio, note: `revisione: ${freshnessNote}; ACT: ${acts.note ?? "nessuna ancora risolta"}` };
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

  const governance = governanceRatio(week);
  const privacy = privacyRatio(week);
  const conservation = conservationRatio(records);
  const audit = auditRatio(records);

  return [
    { id: "MET-transparency", label: "Trasparenza", value: transparency },
    { id: "MET-integrity", label: "Integrità", value: integrity, note: integrityNote },
    { id: "MET-traceability", label: "Tracciabilità", value: traceability },
    { id: "MET-documentation", label: "Documentazione", value: documentation },
    { id: "MET-automation", label: "Automazione", value: automation },
    {
      id: "MET-audit",
      label: "Audit",
      value: audit.ratio,
      note: audit.note ?? "nessun ciclo di revisione trimestrale ancora concluso",
    },
    {
      id: "MET-conservation",
      label: "Conservazione",
      value: conservation.ratio,
      note: conservation.note ?? "nessun restore-drill ancora eseguito",
    },
    { id: "MET-reproducibility", label: "Riproducibilità", value: reproducibility },
    {
      id: "MET-privacy",
      label: "Privacy",
      value: privacy.ratio,
      note: privacy.note ?? "richiede almeno uno snapshot dallo scanner (nessuno ancora raccolto)",
    },
    {
      id: "MET-governance",
      label: "Governance",
      value: governance.ratio,
      note: governance.note ?? "richiede almeno uno snapshot dal collettore di evidenze (nessuno ancora raccolto)",
    },
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
