import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { ROOT } from "./lib/registry.mjs";

const SNAPSHOTS_DIR = join(ROOT, "snapshots");
const REGISTRY_EVIDENCE_DIR = join(ROOT, "registry", "evidence");

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function fetchJson(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, status: res.status, url };
    return { ok: true, data: await res.json(), url };
  } catch (e) {
    return { ok: false, error: e.message, url };
  }
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

// Aggiorna last_seen con una sostituzione mirata sul testo grezzo, non un
// dump YAML completo: preserva formattazione, commenti e ordine dei campi
// del file esistente (un dump js-yaml li riscriverebbe tutti).
function updateLastSeen(evdId, dateStr) {
  const file = join(REGISTRY_EVIDENCE_DIR, `${evdId}.yaml`);
  if (!existsSync(file)) return false;
  let text = readFileSync(file, "utf8");
  if (/^last_seen:/m.test(text)) {
    text = text.replace(/^last_seen:.*$/m, `last_seen: ${dateStr}`);
  } else if (/^collection:.*$/m.test(text)) {
    text = text.replace(/^(collection:.*)$/m, `$1\nlast_seen: ${dateStr}`);
  } else {
    return false;
  }
  writeFileSync(file, text);
  return true;
}

async function main() {
  const ghHeaders = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
    : { Accept: "application/vnd.github+json" };

  const today = new Date();
  const week = isoWeek(today);
  const dir = join(SNAPSHOTS_DIR, week);
  mkdirSync(dir, { recursive: true });

  const results = {};
  const evdHits = new Set();

  results.status = await fetchJson("https://imgauth.spaziogenesi.org/api/status");
  if (results.status.ok) evdHits.add("EVD-status-live");

  results["status-history"] = await fetchJson("https://imgauth.spaziogenesi.org/api/status-history");
  if (results["status-history"].ok) evdHits.add("EVD-r2-status-history");

  const healthLog = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    healthLog[day] = await fetchJson(`https://imgauth.spaziogenesi.org/api/health-log?day=${day}`);
  }
  results["health-log"] = healthLog;
  if (Object.values(healthLog).some((r) => r.ok)) evdHits.add("EVD-d1-health-log");

  results["ping-imgauth"] = await fetchJson("https://imgauth.spaziogenesi.org/ping");
  if (results["ping-imgauth"].ok) evdHits.add("EVD-versions-live");

  results["monitor-issues"] = await fetchJson(
    "https://api.github.com/repos/SPAZIO-GENESI/imgauth/issues?labels=status-alert&state=all&per_page=20",
    ghHeaders
  );
  if (results["monitor-issues"].ok) evdHits.add("EVD-monitor-issues");

  results["git-imgauth"] = await fetchJson("https://api.github.com/repos/SPAZIO-GENESI/imgauth/commits?per_page=5", ghHeaders);
  if (results["git-imgauth"].ok) evdHits.add("EVD-git-imgauth");

  results["git-imgauthweb"] = await fetchJson("https://api.github.com/repos/SPAZIO-GENESI/imgauthweb/commits?per_page=5", ghHeaders);
  if (results["git-imgauthweb"].ok) evdHits.add("EVD-git-imgauthweb");

  results["git-authart"] = await fetchJson("https://api.github.com/repos/SPAZIO-GENESI/autart-signer/commits?per_page=5", ghHeaders);
  if (results["git-authart"].ok) evdHits.add("EVD-git-authart");

  // Tag di release (convenzione vX.Y.Z, vedi PRC-release-coordinata): alimentano
  // il terzo componente di MET-integrity ("quota di release con tag git").
  for (const repo of ["imgauth", "imgauthweb", "autart-signer"]) {
    results[`tags-${repo}`] = await fetchJson(`https://api.github.com/repos/SPAZIO-GENESI/${repo}/tags?per_page=30`, ghHeaders);
  }

  // Governance (MET-governance, P32/ADR-GTF-011): validazione CI del registro —
  // ultimi 30 run di validate.yml su gtf/main, campi minimi (id/conclusion/data).
  const validateRunsRaw = await fetchJson(
    "https://api.github.com/repos/SPAZIO-GENESI/gtf/actions/workflows/validate.yml/runs?per_page=30&branch=main",
    ghHeaders
  );
  results["governance-validate-runs"] = validateRunsRaw.ok
    ? {
        ok: true,
        url: validateRunsRaw.url,
        data: (validateRunsRaw.data.workflow_runs ?? []).map((r) => ({
          id: r.id,
          conclusion: r.conclusion,
          created_at: r.created_at,
        })),
      }
    : validateRunsRaw;

  // Governance: quota di PR sul registro gtf (termine NON usato dalla formula
  // v1 — un maintainer singolo non fa revisione tra pari — ma tenuto
  // verificabile nel tempo per trasparenza sul perché è escluso).
  const prsRaw = await fetchJson("https://api.github.com/search/issues?q=repo:SPAZIO-GENESI/gtf+is:pr", ghHeaders);
  results["governance-prs"] = prsRaw.ok
    ? { ok: true, url: prsRaw.url, data: { total_count: prsRaw.data.total_count } }
    : prsRaw;

  // Governance: gate umano sui rilasci di produzione (P24) — ultimi 20 run di
  // ci.yml su imgauth/main; per ciascuno, il job deploy-production e, se
  // concluso, il record di approvazione ridotto a {login, state} (nessun
  // altro campo personale). Run senza quel job (path-ignore, fallito prima)
  // restano con has_job:false: il denominatore li esclude in score.mjs.
  const prodGateRunsRaw = await fetchJson(
    "https://api.github.com/repos/SPAZIO-GENESI/imgauth/actions/workflows/ci.yml/runs?per_page=20&branch=main",
    ghHeaders
  );
  const prodGateEntries = [];
  if (prodGateRunsRaw.ok) {
    for (const run of prodGateRunsRaw.data.workflow_runs ?? []) {
      const jobsRes = await fetchJson(`https://api.github.com/repos/SPAZIO-GENESI/imgauth/actions/runs/${run.id}/jobs`, ghHeaders);
      const job = jobsRes.ok ? (jobsRes.data.jobs ?? []).find((j) => j.name === "deploy-production") : null;
      const entry = {
        run_id: run.id,
        created_at: run.created_at,
        has_job: Boolean(job),
        job_conclusion: job?.conclusion ?? null,
        approvals: null,
      };
      if (job && job.conclusion) {
        const approvalsRes = await fetchJson(
          `https://api.github.com/repos/SPAZIO-GENESI/imgauth/actions/runs/${run.id}/approvals`,
          ghHeaders
        );
        entry.approvals =
          approvalsRes.ok && Array.isArray(approvalsRes.data)
            ? approvalsRes.data.map((a) => ({ login: a.user?.login ?? null, state: a.state }))
            : [];
      }
      prodGateEntries.push(entry);
    }
  }
  results["governance-prod-gate"] = { ok: prodGateRunsRaw.ok, url: prodGateRunsRaw.url, data: prodGateEntries };

  const manifest = { collected_at: today.toISOString(), week, files: {} };
  for (const [name, data] of Object.entries(results)) {
    const filename = `${name}.json`;
    const text = JSON.stringify(data, null, 2) + "\n";
    writeFileSync(join(dir, filename), text);
    manifest.files[filename] = sha256(text);
  }
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  const todayStr = today.toISOString().slice(0, 10);
  let updated = 0;
  for (const id of evdHits) {
    if (updateLastSeen(id, todayStr)) updated++;
  }

  console.log(`Snapshot ${week} scritto in ${dir}: ${Object.keys(results).length} file, ${updated} evidenze con last_seen aggiornato.`);
}

main();
