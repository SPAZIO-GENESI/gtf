import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { ROOT } from "./lib/registry.mjs";

const SNAPSHOTS_DIR = join(ROOT, "snapshots");
const ANCHORS_DIR = join(SNAPSHOTS_DIR, "anchors");
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

// Come fetchJson ma per risposte non-JSON (HTML, redirect, SVG): non legge
// mai il body a meno che serva davvero (fetchText), altrimenti solo status/header.
async function fetchMeta(url, { method = "GET", redirect = "follow", headers = {} } = {}) {
  try {
    const res = await fetch(url, { method, redirect, headers, signal: AbortSignal.timeout(15000) });
    return {
      ok: true,
      url,
      status: res.status,
      location: res.headers.get("location"),
      headers: {
        "content-security-policy": res.headers.get("content-security-policy"),
        "strict-transport-security": res.headers.get("strict-transport-security"),
        "permissions-policy": res.headers.get("permissions-policy"),
      },
    };
  } catch (e) {
    return { ok: false, error: e.message, url };
  }
}

async function fetchText(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, status: res.status, url };
    return { ok: true, text: await res.text(), url };
  } catch (e) {
    return { ok: false, error: e.message, url };
  }
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

  // EVD-cicd-staging-runs (P32/C2): riusa il fetch di sopra, zero chiamate in
  // più — la sola visibilità pubblica dei run di ci.yml è ciò che l'evidenza
  // dichiara ("verificabile aprendo la tab Actions del repo pubblico imgauth").
  if (prodGateRunsRaw.ok) evdHits.add("EVD-cicd-staging-runs");

  // EVD-changelog-user (P32/C2): la pagina pubblica del changelog risponde.
  // GET, non HEAD: GitHub Pages lo supporta comunque, ma il Worker imgauth
  // (sotto) risponde 404 a HEAD (router interno, non instrada quel verbo).
  results["changelog-user"] = await fetchMeta("https://attestazione.spaziogenesi.org/changelog/");
  if (results["changelog-user"].ok && results["changelog-user"].status === 200) evdHits.add("EVD-changelog-user");

  // EVD-cloudflare-access-admin (P32/C2): /admin non autenticato deve
  // reindirizzare al login di Cloudflare Access, mai rispondere direttamente.
  results["cloudflare-access-admin"] = await fetchMeta("https://imgauth.spaziogenesi.org/admin", { redirect: "manual" });
  {
    const r = results["cloudflare-access-admin"];
    if (r.ok && r.status >= 300 && r.status < 400 && (r.location ?? "").includes("cloudflareaccess.com")) {
      evdHits.add("EVD-cloudflare-access-admin");
    }
  }

  // EVD-edge-security-headers (P32/C2): CSP+HSTS+Permissions-Policy presenti
  // sui due host esposti (attestazione via GitHub Pages+edge, imgauth Worker).
  // GET, non HEAD: il router del Worker imgauth risponde 404 a HEAD (verbo
  // non instradato) pur restituendo comunque gli header di sicurezza edge —
  // usare GET ovunque evita di dipendere da quel dettaglio di implementazione.
  results["edge-security-headers"] = {
    attestazione: await fetchMeta("https://attestazione.spaziogenesi.org/"),
    imgauth: await fetchMeta("https://imgauth.spaziogenesi.org/ping"),
  };
  {
    const edgeOk = ["attestazione", "imgauth"].every((k) => {
      const r = results["edge-security-headers"][k];
      return Boolean(
        r.ok &&
          r.status === 200 &&
          r.headers["content-security-policy"] &&
          r.headers["strict-transport-security"] &&
          r.headers["permissions-policy"]
      );
    });
    if (edgeOk) evdHits.add("EVD-edge-security-headers");
  }

  // EVD-dogfooding-anchor (P32/C2): sha256 del bundle mensile più recente
  // ricalcolato in locale (file già committato, nessun segreto coinvolto) e
  // confrontato via il badge pubblico — verde solo se l'hash è realmente
  // in archivio (stesso principio non falsificabile del badge stesso).
  const anchorFiles = existsSync(ANCHORS_DIR)
    ? readdirSync(ANCHORS_DIR)
        .filter((f) => /^\d{4}-\d{2}-bundle\.json$/.test(f))
        .sort()
    : [];
  if (anchorFiles.length > 0) {
    const latestAnchor = anchorFiles[anchorFiles.length - 1];
    const bundleHash = sha256(readFileSync(join(ANCHORS_DIR, latestAnchor)));
    const badgeRes = await fetchText(`https://imgauth.spaziogenesi.org/api/badge?hash=${bundleHash}`);
    const anchored = badgeRes.ok && badgeRes.text.includes("✓ opera attestata");
    results["dogfooding-anchor"] = { file: latestAnchor, hash: bundleHash, ok: badgeRes.ok, anchored };
    if (anchored) evdHits.add("EVD-dogfooding-anchor");
  } else {
    results["dogfooding-anchor"] = { file: null, hash: null, ok: false, anchored: false };
  }

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
