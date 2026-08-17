import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadTenant, TENANT_SNAPSHOTS_DIR, TENANT_REGISTRY_DIR } from "./lib/tenant.mjs";

const SNAPSHOTS_DIR = TENANT_SNAPSHOTS_DIR;
const ANCHORS_DIR = join(SNAPSHOTS_DIR, "anchors");
const REGISTRY_EVIDENCE_DIR = join(TENANT_REGISTRY_DIR, "evidence");

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

// Come fetchText ma per contenuto binario (PDF): serve per ricalcolare
// l'impronta del file effettivamente servito, non del file committato.
async function fetchBytes(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, status: res.status, url };
    return { ok: true, bytes: Buffer.from(await res.arrayBuffer()), url };
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
  const cfg = loadTenant();
  const c = cfg.collector;
  const ghHeaders = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
    : { Accept: "application/vnd.github+json" };

  const today = new Date();
  const week = isoWeek(today);
  const dir = join(SNAPSHOTS_DIR, week);
  mkdirSync(dir, { recursive: true });

  const results = {};
  const evdHits = new Set();

  results.status = await fetchJson(`${c.api_base}/api/status`);
  if (results.status.ok) evdHits.add("EVD-status-live");

  results["status-history"] = await fetchJson(`${c.api_base}/api/status-history`);
  if (results["status-history"].ok) evdHits.add("EVD-r2-status-history");

  const healthLog = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    healthLog[day] = await fetchJson(`${c.api_base}/api/health-log?day=${day}`);
  }
  results["health-log"] = healthLog;
  if (Object.values(healthLog).some((r) => r.ok)) evdHits.add("EVD-d1-health-log");

  results.ping = await fetchJson(`${c.api_base}/ping`);
  if (results.ping.ok) evdHits.add("EVD-versions-live");

  results["monitor-issues"] = await fetchJson(
    `https://api.github.com/repos/${c.github_owner}/${c.monitor_repo}/issues?labels=${c.monitor_label}&state=all&per_page=20`,
    ghHeaders
  );
  if (results["monitor-issues"].ok) evdHits.add("EVD-monitor-issues");

  for (const item of c.code_repos) {
    results[item.snapshot] = await fetchJson(`https://api.github.com/repos/${c.github_owner}/${item.repo}/commits?per_page=5`, ghHeaders);
    if (results[item.snapshot].ok) evdHits.add(item.evidence);
  }

  // Tag di release (convenzione vX.Y.Z, vedi PRC-release-coordinata): alimentano
  // il terzo componente di MET-integrity ("quota di release con tag git").
  for (const repo of c.tag_repos) {
    results[`tags-${repo}`] = await fetchJson(`https://api.github.com/repos/${c.github_owner}/${repo}/tags?per_page=30`, ghHeaders);
  }

  // Governance (MET-governance, P32/ADR-GTF-011): validazione CI del registro —
  // ultimi 30 run di validate.yml su gtf/main, campi minimi (id/conclusion/data).
  const validateRunsRaw = await fetchJson(
    `https://api.github.com/repos/${c.github_owner}/${c.registry_repo}/actions/workflows/validate.yml/runs?per_page=30&branch=main`,
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
  const prsRaw = await fetchJson(`https://api.github.com/search/issues?q=repo:${c.github_owner}/${c.registry_repo}+is:pr`, ghHeaders);
  results["governance-prs"] = prsRaw.ok
    ? { ok: true, url: prsRaw.url, data: { total_count: prsRaw.data.total_count } }
    : prsRaw;

  // Governance: gate umano sui rilasci di produzione (P24) — ultimi 20 run del
  // workflow di gate sul repo di produzione del tenant; per ciascuno, il job
  // di gate e, se concluso, il record di approvazione ridotto a {login, state}
  // (nessun altro campo personale). Run senza quel job (path-ignore, fallito
  // prima) restano con has_job:false: il denominatore li esclude in score.mjs.
  const prodGateRunsRaw = await fetchJson(
    `https://api.github.com/repos/${c.github_owner}/${c.prod_gate_repo}/actions/workflows/${c.prod_gate_workflow}/runs?per_page=20&branch=main`,
    ghHeaders
  );
  const prodGateEntries = [];
  if (prodGateRunsRaw.ok) {
    for (const run of prodGateRunsRaw.data.workflow_runs ?? []) {
      const jobsRes = await fetchJson(
        `https://api.github.com/repos/${c.github_owner}/${c.prod_gate_repo}/actions/runs/${run.id}/jobs`,
        ghHeaders
      );
      const job = jobsRes.ok ? (jobsRes.data.jobs ?? []).find((j) => j.name === c.prod_gate_job) : null;
      const entry = {
        run_id: run.id,
        created_at: run.created_at,
        has_job: Boolean(job),
        job_conclusion: job?.conclusion ?? null,
        approvals: null,
      };
      if (job && job.conclusion) {
        const approvalsRes = await fetchJson(
          `https://api.github.com/repos/${c.github_owner}/${c.prod_gate_repo}/actions/runs/${run.id}/approvals`,
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
  // più — la sola visibilità pubblica dei run del workflow di gate è ciò che
  // l'evidenza dichiara ("verificabile aprendo la tab Actions del repo di
  // produzione, pubblico").
  if (prodGateRunsRaw.ok) evdHits.add("EVD-cicd-staging-runs");

  // EVD-changelog-user (P32/C2): la pagina pubblica del changelog risponde.
  // GET, non HEAD: GitHub Pages lo supporta comunque, ma il Worker applicativo
  // (sotto) risponde 404 a HEAD (router interno, non instrada quel verbo).
  results["changelog-user"] = await fetchMeta(c.changelog_url);
  if (results["changelog-user"].ok && results["changelog-user"].status === 200) evdHits.add("EVD-changelog-user");

  // EVD-cloudflare-access-admin (P32/C2): /admin non autenticato deve
  // reindirizzare al login di Cloudflare Access, mai rispondere direttamente.
  results["cloudflare-access-admin"] = await fetchMeta(c.admin_url, { redirect: "manual" });
  {
    const r = results["cloudflare-access-admin"];
    if (r.ok && r.status >= 300 && r.status < 400 && (r.location ?? "").includes(c.admin_expected_redirect)) {
      evdHits.add("EVD-cloudflare-access-admin");
    }
  }

  // EVD-edge-security-headers (P32/C2): CSP+HSTS+Permissions-Policy presenti
  // sui host esposti dichiarati dal tenant (front-end statico + Worker
  // applicativo). GET, non HEAD: il router del Worker può rispondere 404 a
  // HEAD (verbo non instradato) pur restituendo comunque gli header di
  // sicurezza edge — usare GET ovunque evita di dipendere da quel dettaglio
  // di implementazione.
  results["edge-security-headers"] = {};
  for (const [key, url] of Object.entries(c.security_headers_urls)) {
    results["edge-security-headers"][key] = await fetchMeta(url);
  }
  {
    const edgeOk = Object.keys(c.security_headers_urls).every((k) => {
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
    const badgeRes = await fetchText(c.badge_url_template.replace("{hash}", bundleHash));
    const anchored = badgeRes.ok && badgeRes.text.includes(c.badge_ok_marker);
    results["dogfooding-anchor"] = { file: latestAnchor, hash: bundleHash, ok: badgeRes.ok, anchored };
    if (anchored) evdHits.add("EVD-dogfooding-anchor");
  } else {
    results["dogfooding-anchor"] = { file: null, hash: null, ok: false, anchored: false };
  }

  // EVD-security-txt (P37): security.txt raggiungibile e non scaduto su
  // tutti i domini dichiarati dal tenant. GET, non HEAD (il Worker applicativo
  // può non rispondere a HEAD, memoria gtf-collector-network-gotchas).
  results["security-txt"] = {};
  for (const [key, url] of Object.entries(c.security_txt_urls)) {
    results["security-txt"][key] = await fetchText(url);
  }
  {
    const notExpired = (text) => {
      const m = /^Expires:\s*(.+)$/m.exec(text ?? "");
      if (!m) return false;
      const d = new Date(m[1].trim());
      return !Number.isNaN(d.getTime()) && d.getTime() > today.getTime();
    };
    const securityTxtOk = Object.keys(c.security_txt_urls).every((k) => {
      const r = results["security-txt"][k];
      return Boolean(r.ok && r.text.includes("Contact:") && notExpired(r.text));
    });
    if (securityTxtOk) evdHits.add("EVD-security-txt");
  }

  // EVD-whitepaper-integrity (P38): il PDF pubblicato deve restare
  // bit-per-bit identico all'impronta attestata (ADR-P38) — è dichiarato
  // immutabile per design. GET, non HEAD (stesso gotcha di rete di sopra).
  {
    const WHITEPAPER_SHA256 = c.whitepaper.sha256;
    const pdfRes = await fetchBytes(c.whitepaper.url);
    const liveHash = pdfRes.ok ? sha256(pdfRes.bytes) : null;
    const matches = liveHash === WHITEPAPER_SHA256;
    results["whitepaper-integrity"] = { ok: pdfRes.ok, sha256: liveHash, expected: WHITEPAPER_SHA256, matches };
    if (matches) evdHits.add("EVD-whitepaper-integrity");
  }

  // EVD-dnssec-chain: la catena di fiducia DNSSEC deve restare chiusa. Tre
  // prove indipendenti: il registro (RDAP) dichiara la delega firmata con il DS
  // atteso; il DS è visibile via DNS e la risposta risulta autenticata (AD);
  // i nomi che contano — dominio di verifica e posta — risultano autenticati.
  // ⚠️ La presenza di DNSKEY NON è una prova: i provider restituiscono le chiavi
  // condivise della propria infrastruttura anche per zone non firmate.
  if (c.dnssec) {
    const dc = c.dnssec;
    const doh = (name, type) =>
      fetchText(dc.doh_template.replace("{name}", name).replace("{type}", type))
        .then((r) => { try { return r.ok ? JSON.parse(r.text) : null; } catch { return null; } });

    const rdapRes = await fetchText(dc.rdap_url);
    let delegationSigned = false, dsMatches = false;
    try {
      const s = JSON.parse(rdapRes.text).secureDNS || {};
      delegationSigned = s.delegationSigned === true;
      dsMatches = (s.dsData || []).some((d) =>
        d.keyTag === dc.expected_ds.keyTag &&
        d.algorithm === dc.expected_ds.algorithm &&
        d.digestType === dc.expected_ds.digestType &&
        String(d.digest).toUpperCase() === dc.expected_ds.digest.toUpperCase());
    } catch { /* rdap non parsabile: resta false */ }

    // Stesso campionamento ripetuto dei nomi (vedi commento sotto): anche la
    // query DS alterna fra istanze del resolver nelle ore dopo un cambio.
    let dsVisible = false, dsAuthenticated = false;
    for (let attempt = 0; attempt < 3 && !(dsVisible && dsAuthenticated); attempt++) {
      const dsAnswer = await doh(dc.zone, "DS");
      if (dsAnswer && (dsAnswer.Answer || []).some((x) => x.type === 43)) dsVisible = true;
      if (dsAnswer && dsAnswer.AD === true) dsAuthenticated = true;
    }

    // Un resolver pubblico è un insieme di istanze con cache indipendenti: nelle
    // ore successive a un cambio di delega alcune rispondono ancora da una voce
    // memorizzata prima della firma, e lo stesso nome alterna AD=true/false. Si
    // campiona più volte e basta un AD=true a considerare il nome autenticato:
    // riduce il rumore di campionamento, non allenta il controllo (un AD=true
    // non può provenire da una zona non validata).
    const names = {};
    for (const n of dc.authenticated_names || []) {
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        const a = await doh(n, "A");
        ok = Boolean(a && a.Status === 0 && a.AD === true);
      }
      names[n] = ok;
    }
    let mxAuthenticated = null;
    if (dc.authenticated_mx) {
      const mx = await doh(dc.authenticated_mx, "MX");
      mxAuthenticated = Boolean(mx && mx.Status === 0 && mx.AD === true &&
        (mx.Answer || []).some((x) => x.type === 15));
    }

    const checks = { delegationSigned, dsMatches, dsVisible, dsAuthenticated,
      namesAuthenticated: Object.values(names).every(Boolean),
      mxAuthenticated: mxAuthenticated !== false };
    const allOk = Object.values(checks).every(Boolean);
    results["dnssec-chain"] = { zone: dc.zone, checks, names, mxAuthenticated, ok: allOk };
    if (allOk) evdHits.add("EVD-dnssec-chain");
  }

  // EVD-agent-discovery (P50): i documenti di scopribilità per agenti devono
  // essere raggiungibili E coerenti. Il controllo che conta davvero è l'ultimo:
  // l'indice delle skill dichiara lo SHA-256 di ogni SKILL.md, quindi si
  // riscarica ogni skill dal vivo e si ricalcola — così un deploy parziale o un
  // digest non riallineato vengono scoperti dal registro, non da un agente che
  // scarta la skill in silenzio. GET, mai HEAD (stesso gotcha di rete di sopra).
  if (c.agent_discovery) {
    const d = c.agent_discovery;
    const got = {};
    for (const [key, url] of Object.entries(d)) got[key] = await fetchText(url);

    const parse = (r) => {
      if (!r.ok) return null;
      try { return JSON.parse(r.text); } catch { return null; }
    };

    const catalog = parse(got.api_catalog);
    const card = parse(got.mcp_server_card);
    const index = parse(got.agent_skills_index);

    const checks = {
      robots_content_signal: Boolean(got.robots_txt?.ok && /^Content-Signal:/m.test(got.robots_txt.text)),
      api_catalog_linkset: Array.isArray(catalog?.linkset) && catalog.linkset.length > 0,
      mcp_card_complete: Boolean(card?.serverInfo?.name && card?.serverInfo?.version && card?.transport?.endpoint),
      auth_md_heading: Boolean(got.auth_md?.ok && /^#\s*auth\.md/mi.test(got.auth_md.text)),
      llms_txt_present: Boolean(got.llms_txt?.ok && got.llms_txt.text.trim().length > 0),
      skills_index_valid: Array.isArray(index?.skills) && index.skills.length > 0,
    };

    // Verifica dei digest: ogni skill dichiarata viene riscaricata e ricalcolata.
    const skills = [];
    if (checks.skills_index_valid) {
      for (const s of index.skills) {
        const res = await fetchBytes(s.url);
        const live = res.ok ? "sha256:" + sha256(res.bytes) : null;
        skills.push({ name: s.name, url: s.url, ok: res.ok, declared: s.digest, live, matches: live === s.digest });
      }
    }
    checks.skills_digests_match = skills.length > 0 && skills.every((s) => s.matches);

    // Record DNS-AID (SVCB sotto _agents): devono esistere con i parametri
    // dichiarati — e, altrettanto importante, NON devono comparire quelli che
    // abbiamo scelto di non pubblicare. Il controllo `must_not_exist` sorveglia
    // una promessa che abbiamo fatto pubblicamente (nessuna dichiarazione di
    // agente A2A, che non esiste): se un giorno qualcuno lo aggiungesse senza
    // costruire l'agente, il registro se ne accorge invece di scoprirlo un
    // client che fallisce l'handshake.
    let dnsAid = null;
    if (c.dns_aid) {
      const svcb = async (name) => {
        const r = await fetchText(c.dns_aid.doh_template.replace("{name}", name));
        try {
          const j = JSON.parse(r.text);
          return (j.Answer || []).filter((x) => x.type === 64).map((x) => x.data);
        } catch { return null; }
      };
      const present = [];
      for (const rec of c.dns_aid.records || []) {
        const data = await svcb(rec.name);
        const joined = (data || []).join(" ");
        const missing = (rec.must_contain || []).filter((m) => !joined.includes(m));
        present.push({ name: rec.name, found: Boolean(data && data.length), data, missing, ok: Boolean(data && data.length) && missing.length === 0 });
      }
      const absent = [];
      for (const name of c.dns_aid.must_not_exist || []) {
        const data = await svcb(name);
        absent.push({ name, declared: Boolean(data && data.length), ok: !(data && data.length) });
      }
      dnsAid = { present, absent, ok: present.every((x) => x.ok) && absent.every((x) => x.ok) };
      checks.dns_aid_records = dnsAid.ok;
    }

    const allOk = Object.values(checks).every(Boolean);
    results["agent-discovery"] = {
      reachable: Object.fromEntries(Object.entries(got).map(([k, v]) => [k, Boolean(v.ok)])),
      checks,
      skills,
      dnsAid,
      ok: allOk,
    };
    if (allOk) evdHits.add("EVD-agent-discovery");
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
