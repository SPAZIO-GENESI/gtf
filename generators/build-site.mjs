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

// low/full → salvia, medium/partial → ambra, high → sigillo, resto → neutro
function pillClass(value) {
  const v = String(value ?? "").toLowerCase();
  if (v === "low" || v === "full") return "pill pill-sage";
  if (v === "medium" || v === "partial") return "pill pill-amber";
  if (v === "high") return "pill pill-seal";
  return "pill pill-muted";
}

function phaseNumber(id) {
  // "ADR-P7" -> 7, "ADR-GTF-002" -> Infinity (ordinate dopo, per id crescente)
  const m = /^ADR-P(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : Infinity;
}

function renderLedger(score) {
  const rows = score.indicators
    .map((i) => {
      if (i.value === null) {
        return `        <tr class="is-pending" title="${esc(i.note)}"><td class="ledger-label">${esc(i.label)}</td><td class="ledger-value">n/d</td></tr>`;
      }
      return `        <tr class="is-counted"><td class="ledger-label">${esc(i.label)}</td><td class="ledger-value">${i.value}</td></tr>`;
    })
    .join("\n");
  return `    <div class="ledger" role="group" aria-label="Punteggio di maturità calcolato dal registro pubblico">
      <table class="ledger-table">
        <tbody>
${rows}
          <tr class="ledger-total"><td class="ledger-label">Saldo</td><td class="ledger-value">${score.overall}<span class="unit">/100</span></td></tr>
        </tbody>
      </table>
      <p class="ledger-note">${score.available_count} di ${score.total} indicatori disponibili — i restanti non sono stimati: restano <em>n/d</em> finché non esisteranno i dati per calcolarli davvero. <a href="https://github.com/SPAZIO-GENESI/gtf/tree/main/registry/metrics">Formula di ciascuno</a>.</p>
    </div>`;
}

function renderMission(records) {
  const msn = records.get("MSN-01")?.record;
  const principles = byFolder(records, "principles")
    .filter((p) => p.type === "principle")
    .sort((a, b) => a.id.localeCompare(b.id));
  const items = principles
    .map(
      (p) => `      <article class="record">
        <p class="tag">${esc(p.id)}</p>
        <h3>${esc(p.title)}</h3>
        <p>${para(p.statement)}</p>
        <p class="rule">Regola verificabile: ${para(p.rule)}</p>
      </article>`
    )
    .join("\n");
  return `  <section id="missione" class="folio" data-folio="MSN · PRN">
    <h2>Missione e principi</h2>
    <p class="lede">${para(msn?.statement)}</p>
    <div class="record-grid">
${items}
    </div>
  </section>`;
}

function renderEidas(records) {
  const ctl = records.get("CTL-eidas-honest-positioning")?.record;
  return `  <section id="eidas" class="folio" data-folio="CTL">
    <h2>Cosa NON è questo servizio</h2>
    <p>${para(ctl?.statement)}</p>
    <p class="tag-line"><span class="tag">${esc(ctl?.id)}</span></p>
  </section>`;
}

function renderComplianceMap(records) {
  const reqs = byFolder(records, "requirements").sort((a, b) => a.id.localeCompare(b.id));
  const cards = reqs
    .map((r) => {
      const ctlItems = (r.satisfied_by ?? [])
        .map((id) => {
          const ctl = records.get(id)?.record;
          if (!ctl) return `          <li><span class="tag">${esc(id)}</span></li>`;
          const verify = ctl.verify_howto
            ? `<details><summary>come verificare</summary><p>${para(ctl.verify_howto)}</p></details>`
            : "";
          return `          <li><span class="tag">${esc(ctl.id)}</span> ${esc(ctl.title)}${verify}</li>`;
        })
        .join("\n");
      return `      <article class="norm-card">
        <header>
          <span class="${pillClass(r.applicability)}">${esc(r.applicability)}</span>
          <h3>${esc(r.source?.norm)}</h3>
          <p class="ref">${esc(r.source?.ref)}</p>
        </header>
        <p>${para(r.statement)}</p>
        <ul class="ctl-list">
${ctlItems || '          <li class="empty">nessun controllo collegato ancora</li>'}
        </ul>
        <p class="tag-line"><span class="tag">${esc(r.id)}</span></p>
      </article>`;
    })
    .join("\n");
  return `  <section id="compliance" class="folio" data-folio="REQ · CTL · EVD">
    <h2>Compliance Map</h2>
    <div class="norm-grid">
${cards}
    </div>
  </section>`;
}

function renderRisks(records) {
  const risks = byFolder(records, "risks").sort((a, b) => a.id.localeCompare(b.id));
  const cards = risks
    .map((r) => {
      const mitigations = (r.mitigated_by ?? [])
        .map((id) => `          <li><span class="tag">${esc(id)}</span> ${esc(records.get(id)?.record?.title ?? id)}</li>`)
        .join("\n");
      return `      <article class="norm-card">
        <header>
          <div class="risk-pills">
            <span class="${pillClass(r.likelihood)}">probabilità: ${esc(r.likelihood ?? "—")}</span>
            <span class="${pillClass(r.impact)}">impatto: ${esc(r.impact ?? "—")}</span>
          </div>
          <h3>${esc(r.title)}</h3>
        </header>
        <p class="ref">Mitigato da</p>
        <ul class="ctl-list">
${mitigations || '          <li class="empty">nessuna mitigazione collegata ancora</li>'}
        </ul>
        <p class="tag-line"><span class="tag">${esc(r.id)}</span></p>
      </article>`;
    })
    .join("\n");
  return `  <section id="rischi" class="folio" data-folio="RSK">
    <h2>Rischi</h2>
    <div class="norm-grid">
${cards}
    </div>
  </section>`;
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
      (a) => `      <details class="entry">
        <summary><span class="entry-date">${esc(a.date)}</span><span class="entry-title">${esc(a.title)}</span><span class="entry-status">${esc(a.status)}</span></summary>
        <div class="entry-body">
          <p>${para(a.context)}</p>
          <p><strong>Decisione:</strong> ${para(a.decision)}</p>
          ${a.consequences ? `<p><strong>Conseguenze:</strong> ${para(a.consequences)}</p>` : ""}
          <p class="tag-line"><span class="tag">${esc(a.id)}</span></p>
        </div>
      </details>`
    )
    .join("\n");
  return `  <section id="decisioni" class="folio" data-folio="ADR">
    <h2>Decisioni</h2>
    <div class="journal">
${items}
    </div>
  </section>`;
}

const STYLE = `
  :root {
    color-scheme: light dark;
    --paper: #FBFAF6;
    --card: #F3EEE1;
    --ink: #221c14;
    --ink-muted: #6b6152;
    --rule: #ddd2ba;
    --gold: #5a3d10;
    --sage-bg: #dde8d5; --sage-fg: #2f4a2a;
    --amber-bg: #f3e3ab; --amber-fg: #6b4a10;
    --seal-bg: #f2cdcd; --seal-fg: #7a2020;
    --muted-bg: #eae5d8; --muted-fg: #6b6152;
    --font-display: "Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif;
    --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #17140f;
      --card: #201b13;
      --ink: #ece4d3;
      --ink-muted: #a89a80;
      --rule: #3a3324;
      --gold: #d1a969;
      --sage-bg: #24301f; --sage-fg: #a8c49c;
      --amber-bg: #3a2c14; --amber-fg: #d9b273;
      --seal-bg: #3a1f1f; --seal-fg: #d99a9a;
      --muted-bg: #2a2518; --muted-fg: #a89a80;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: var(--font-body);
    max-width: 60rem;
    margin: 0 auto;
    padding: 0 1.5rem 4rem;
    line-height: 1.6;
    color: var(--ink);
    background: var(--paper);
  }
  a { color: var(--gold); }
  a:focus-visible, summary:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

  .hero { padding: 3rem 0 1.5rem; }
  .eyebrow { font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); margin: 0 0 0.4rem; }
  .hero h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 600; margin: 0 0 0.6rem; }
  .thesis { max-width: 38rem; margin: 0 0 2rem; }

  .ledger { border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 1.2rem 0; }
  .ledger-table { width: 100%; max-width: 26rem; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  .ledger-table td { padding: 0.3rem 0; }
  .ledger-label { color: var(--ink); }
  .ledger-value { text-align: right; font-family: var(--font-mono); }
  tr.is-pending .ledger-label, tr.is-pending .ledger-value { color: var(--ink-muted); font-style: italic; cursor: help; }
  tr.is-pending .ledger-value::before { content: "— "; }
  tr.ledger-total td { padding-top: 0.6rem; border-top: 3px double var(--ink); font-family: var(--font-display); font-size: 1.4rem; font-weight: 600; }
  .ledger-total .unit { font-size: 1rem; font-weight: 400; color: var(--ink-muted); }
  .ledger-note { font-size: 0.85rem; color: var(--ink-muted); margin: 0.8rem 0 0; }

  nav.spine { position: sticky; top: 0; z-index: 10; background: var(--paper); border-bottom: 1px solid var(--rule); padding: 0.7rem 0; margin-bottom: 1rem; }
  nav.spine ul { display: flex; flex-wrap: wrap; gap: 1.3rem; padding: 0; margin: 0; list-style: none; }
  nav.spine a { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; text-decoration: none; border-bottom: 2px solid transparent; padding-bottom: 2px; }
  nav.spine a:hover, nav.spine a:focus-visible { border-bottom-color: var(--gold); }

  section.folio { position: relative; background: var(--card); border: 1px solid var(--rule); border-radius: 8px; padding: 1.6rem 1.6rem 1.8rem; margin: 1.6rem 0; scroll-margin-top: 4rem; }
  section.folio::before {
    content: attr(data-folio);
    position: absolute; top: 0.7rem; right: 1rem;
    font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.05em;
    color: var(--ink-muted); opacity: 0.7;
  }
  section.folio h2 { font-family: var(--font-display); font-size: 1.3rem; margin: 0 0 1rem; }

  .tag { display: inline-block; font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.01em; padding: 1px 6px; border: 1px solid var(--rule); border-radius: 3px; color: var(--ink-muted); background: var(--paper); white-space: nowrap; }
  .tag-line { margin: 0.6rem 0 0; }

  .pill { display: inline-block; font-size: 0.72rem; padding: 2px 9px; border-radius: 999px; font-weight: 600; }
  .pill-sage { background: var(--sage-bg); color: var(--sage-fg); }
  .pill-amber { background: var(--amber-bg); color: var(--amber-fg); }
  .pill-seal { background: var(--seal-bg); color: var(--seal-fg); }
  .pill-muted { background: var(--muted-bg); color: var(--muted-fg); }

  .record-grid, .norm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 1rem; }
  .record, .norm-card { background: var(--paper); border: 1px solid var(--rule); border-radius: 6px; padding: 0.9rem 1rem; }
  .record h3, .norm-card h3 { font-size: 1rem; margin: 0.2rem 0 0.3rem; }
  .record .rule { font-size: 0.82rem; color: var(--ink-muted); margin-top: 0.5rem; }
  .norm-card header { margin-bottom: 0.5rem; }
  .norm-card .ref { font-size: 0.78rem; color: var(--ink-muted); margin: 0.1rem 0 0; }
  .ctl-list { padding-left: 1.1rem; margin: 0.6rem 0 0; }
  .ctl-list li { margin-bottom: 0.4rem; }
  .ctl-list .empty { color: var(--ink-muted); font-style: italic; list-style: none; margin-left: -1.1rem; }

  .risk-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem; }

  .journal .entry { border-bottom: 1px solid var(--rule); padding: 0.6rem 0; }
  .journal .entry:last-child { border-bottom: none; }
  .journal summary { cursor: pointer; display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: baseline; list-style: none; }
  .journal summary::-webkit-details-marker { display: none; }
  .entry-date { font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-muted); min-width: 6rem; }
  .entry-title { font-weight: 600; flex: 1; }
  .entry-status { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-muted); }
  .entry-body { padding: 0.6rem 0 0.2rem 6.8rem; }
  .entry-body p { margin: 0.4rem 0; }
  @media (max-width: 40rem) { .entry-body { padding-left: 0; } }

  footer { margin-top: 3rem; padding-top: 1.2rem; border-top: 1px solid var(--rule); font-size: 0.85rem; color: var(--ink-muted); }
`;

function renderPage(records, score) {
  const body = [
    renderMission(records),
    renderEidas(records),
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
<style>${STYLE}</style>
</head>
<body>
  <header class="hero">
    <p class="eyebrow">Genesis Trust Framework</p>
    <h1>Il registro della fiducia di Spazio Genesi ETS</h1>
    <p class="thesis">Perché <a href="https://attestazione.spaziogenesi.org">attestazione.spaziogenesi.org</a>
    merita fiducia — con evidenze verificabili, non dichiarazioni.</p>
${renderLedger(score)}
  </header>

  <nav class="spine">
    <ul>
      <li><a href="#missione">Missione</a></li>
      <li><a href="#eidas">Posizionamento eIDAS</a></li>
      <li><a href="#compliance">Compliance Map</a></li>
      <li><a href="#rischi">Rischi</a></li>
      <li><a href="#decisioni">Decisioni</a></li>
      <li><a href="https://attestazione.spaziogenesi.org/status/">Stato dei servizi ↗</a></li>
      <li><a href="https://attestazione.spaziogenesi.org/changelog/">Changelog ↗</a></li>
    </ul>
  </nav>

  <main>
${body}
  </main>

  <footer>
    Genesis Trust Framework · pagina generata automaticamente dal
    <a href="https://github.com/SPAZIO-GENESI/gtf">registro pubblico</a> —
    nessun testo di questa pagina è scritto a mano (principio PRN-03).
    <br><img src="/badge.svg" alt="Genesis Trust Score" height="20" style="margin-top:0.5rem;">
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
