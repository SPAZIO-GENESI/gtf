import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRegistry, byFolder } from "./lib/registry.mjs";

const SITE_DIR = join(ROOT, "site");

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function para(str) {
  return esc(str).trim().replace(/\n\s*/g, " ");
}

function renderMission(records) {
  const msn = records.get("MSN-01")?.record;
  const principles = byFolder(records, "principles")
    .filter((p) => p.type === "principle")
    .sort((a, b) => a.id.localeCompare(b.id));
  const items = principles
    .map(
      (p) => `      <li><strong>${esc(p.title)}</strong> — ${para(p.statement)}
        <br><small>Regola verificabile: ${para(p.rule)}</small></li>`
    )
    .join("\n");
  return `  <section id="missione">
    <h2>Missione e principi</h2>
    <p>${para(msn?.statement)}</p>
    <ul>
${items}
    </ul>
  </section>`;
}

function renderEidas(records) {
  const ctl = records.get("CTL-eidas-honest-positioning")?.record;
  return `  <section id="eidas">
    <h2>Cosa NON è questo servizio</h2>
    <p>${para(ctl?.statement)}</p>
  </section>`;
}

function renderScore(score) {
  const rows = score.indicators
    .map((i) => {
      const val = i.value === null ? `n/d <small>(${esc(i.note)})</small>` : `${i.value}/100`;
      return `      <tr><td>${esc(i.label)}</td><td>${val}</td></tr>`;
    })
    .join("\n");
  return `  <section id="score">
    <h2>Open Trust Score</h2>
    <p class="score-overall">${score.overall}/100 <small>(${score.available_count} di ${score.total} indicatori disponibili — media dei soli indicatori calcolabili, gli altri restano dichiaratamente n/d)</small></p>
    <table>
      <thead><tr><th>Indicatore</th><th>Valore</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <p><small>Formula di ciascun indicatore nel <a href="https://github.com/SPAZIO-GENESI/gtf/tree/main/registry/metrics">registro pubblico</a>. Calcolato il ${esc(score.computed_at)}.</small></p>
  </section>`;
}

function renderComplianceMap(records) {
  const reqs = byFolder(records, "requirements").sort((a, b) => a.id.localeCompare(b.id));
  const rows = reqs
    .map((r) => {
      const ctls = (r.satisfied_by ?? [])
        .map((id) => {
          const ctl = records.get(id)?.record;
          if (!ctl) return esc(id);
          const verify = ctl.verify_howto ? ` <details><summary>come verificare</summary><p>${para(ctl.verify_howto)}</p></details>` : "";
          return `${esc(ctl.title)}${verify}`;
        })
        .join("<br>");
      return `      <tr><td>${esc(r.source?.norm)}<br><small>${esc(r.source?.ref)}</small></td><td>${esc(r.applicability)}</td><td>${para(r.statement)}</td><td>${ctls || "—"}</td></tr>`;
    })
    .join("\n");
  return `  <section id="compliance">
    <h2>Compliance Map</h2>
    <table>
      <thead><tr><th>Norma</th><th>Applicabilità</th><th>Requisito</th><th>Soddisfatto da</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </section>`;
}

function renderRisks(records) {
  const risks = byFolder(records, "risks").sort((a, b) => a.id.localeCompare(b.id));
  const rows = risks
    .map((r) => {
      const mitigations = (r.mitigated_by ?? [])
        .map((id) => esc(records.get(id)?.record?.title ?? id))
        .join(", ");
      return `      <tr><td>${esc(r.title)}</td><td>${esc(r.likelihood ?? "—")}</td><td>${esc(r.impact ?? "—")}</td><td>${mitigations || "—"}</td></tr>`;
    })
    .join("\n");
  return `  <section id="rischi">
    <h2>Rischi</h2>
    <table>
      <thead><tr><th>Rischio</th><th>Probabilità</th><th>Impatto</th><th>Mitigato da</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </section>`;
}

function phaseNumber(id) {
  // "ADR-P7" -> 7, "ADR-GTF-002" -> Infinity (ordinate dopo, per id crescente)
  const m = /^ADR-P(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : Infinity;
}

function renderDecisions(records) {
  const adrs = byFolder(records, "decisions")
    .filter((a) => a.visibility === "public")
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const pa = phaseNumber(a.id);
      const pb = phaseNumber(b.id);
      if (pa !== pb) return pa - pb;
      return a.id.localeCompare(b.id);
    });
  const items = adrs
    .map(
      (a) => `      <li><strong>${esc(a.date)} — ${esc(a.title)}</strong> <em>(${esc(a.status)})</em>
        <p>${para(a.context)}</p>
        <p><strong>Decisione:</strong> ${para(a.decision)}</p>
        ${a.consequences ? `<p><strong>Conseguenze:</strong> ${para(a.consequences)}</p>` : ""}
      </li>`
    )
    .join("\n");
  return `  <section id="decisioni">
    <h2>Decisioni</h2>
    <ol>
${items}
    </ol>
  </section>`;
}

function renderPage(records, score) {
  const body = [
    renderMission(records),
    renderEidas(records),
    renderScore(score),
    renderComplianceMap(records),
    renderRisks(records),
    renderDecisions(records),
  ].join("\n\n");

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trust Center — Genesis Trust Framework</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    max-width: 60rem;
    margin: 3rem auto;
    padding: 0 1.5rem;
    line-height: 1.6;
    color: #1a1a1a;
    background: #FBFAF6;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #eee; background: #16171a; }
    a { color: #8ab4f8; }
    table, th, td { border-color: #444 !important; }
  }
  h1 { font-size: 1.6rem; }
  h2 { font-size: 1.2rem; margin-top: 2.5rem; border-bottom: 1px solid #ccc; padding-bottom: 0.3rem; }
  a { color: #5a3d10; }
  nav ul { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0; list-style: none; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; vertical-align: top; font-size: 0.92rem; }
  .score-overall { font-size: 1.4rem; font-weight: bold; }
  code, .mono { font-family: "IBM Plex Mono", monospace; }
  footer { margin-top: 3rem; font-size: 0.85rem; opacity: 0.7; }
  details { margin-top: 0.3rem; }
</style>
</head>
<body>
  <h1>Trust Center — Genesis Trust Framework</h1>
  <p>
    Perché <a href="https://attestazione.spaziogenesi.org">attestazione.spaziogenesi.org</a>
    merita fiducia — con evidenze verificabili, non dichiarazioni.
  </p>
  <nav>
    <ul>
      <li><a href="#missione">Missione</a></li>
      <li><a href="#eidas">Posizionamento eIDAS</a></li>
      <li><a href="#score">Open Trust Score</a></li>
      <li><a href="#compliance">Compliance Map</a></li>
      <li><a href="#rischi">Rischi</a></li>
      <li><a href="#decisioni">Decisioni</a></li>
      <li><a href="https://attestazione.spaziogenesi.org/status/">Stato dei servizi ↗</a></li>
      <li><a href="https://attestazione.spaziogenesi.org/changelog/">Changelog ↗</a></li>
    </ul>
  </nav>

${body}

  <footer>
    Genesis Trust Framework · pagina generata automaticamente dal
    <a href="https://github.com/SPAZIO-GENESI/gtf">registro pubblico</a> —
    nessun testo di questa pagina è scritto a mano (principio PRN-03).
  </footer>
</body>
</html>
`;
}

function main() {
  const records = loadRegistry();
  const score = JSON.parse(readFileSync(join(SITE_DIR, "score.json"), "utf8"));
  writeFileSync(join(SITE_DIR, "index.html"), renderPage(records, score));
  console.log("site/index.html generato.");
}

main();
