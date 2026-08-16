import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry, byFolder } from "./lib/registry.mjs";
import { loadTenant, TENANT_SITE_DIR } from "./lib/tenant.mjs";
import { STYLE } from "./lib/style.mjs";
import { esc, para, renderFooterColumns, renderMatomo } from "./lib/render.mjs";

const SITE_DIR = TENANT_SITE_DIR;

// low/full → salvia, medium/partial → ambra, high → sigillo, resto → neutro
function pillClass(value) {
  const v = String(value ?? "").toLowerCase();
  if (v === "low" || v === "full") return "pill pill-sage";
  if (v === "medium" || v === "partial") return "pill pill-amber";
  if (v === "high") return "pill pill-seal";
  return "pill pill-muted";
}

// Stato di un controllo (CTL), mostrato ovunque il suo cartellino compaia:
// senza, nessuno saprebbe se è davvero attivo senza aprire il registro.
function ctlStatusBadge(status) {
  const s = String(status ?? "").toLowerCase();
  const label = { active: "attivo", draft: "bozza", stale: "da rivedere", retired: "superato" }[s] ?? (status || "—");
  const cls = { active: "pill-sage", draft: "pill-amber", stale: "pill-seal", retired: "pill-muted" }[s] ?? "pill-muted";
  return `<span class="pill ${cls} status-badge">${esc(label)}</span>`;
}

function phaseNumber(id) {
  // "ADR-P7" -> 7, "ADR-GTF-002" -> Infinity (ordinate dopo, per id crescente)
  const m = /^ADR-P(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : Infinity;
}

function renderLedger(score, cfg) {
  const hasPartial = score.indicators.some((i) => i.value !== null && i.note);
  const rows = score.indicators
    .map((i) => {
      if (i.value === null) {
        return `        <tr class="is-pending" title="${esc(i.note)}"><td class="ledger-label">${esc(i.label)}</td><td class="ledger-value">n/d</td></tr>`;
      }
      if (i.note) {
        return `        <tr class="is-counted is-partial" title="${esc(i.note)}"><td class="ledger-label">${esc(i.label)} *</td><td class="ledger-value">${i.value}</td></tr>`;
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
      <p class="ledger-note">${score.available_count} di ${score.total} indicatori disponibili — i restanti non sono stimati: restano <em>n/d</em> finché non esisteranno i dati per calcolarli davvero.${hasPartial ? " * = valore parziale, passa il mouse per i dettagli." : ""} <a href="${cfg.site.metrics_url}">Formula di ciascuno</a>.</p>
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
    <p class="tag-line"><span class="tag">${esc(ctl?.id)}</span> ${ctlStatusBadge(ctl?.status)}</p>
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
          return `          <li><span class="tag">${esc(ctl.id)}</span> ${ctlStatusBadge(ctl.status)} ${esc(ctl.title)}${verify}</li>`;
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
        .map((id) => {
          const ctl = records.get(id)?.record;
          return `          <li><span class="tag">${esc(id)}</span> ${ctlStatusBadge(ctl?.status)} ${esc(ctl?.title ?? id)}</li>`;
        })
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
      // Cronologia inversa: più recenti in cima.
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      const pa = phaseNumber(a.id);
      const pb = phaseNumber(b.id);
      if (pa !== pb) return pb - pa;
      return b.id.localeCompare(a.id);
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

// Le voci "esterne" della barra di navigazione (dopo le cinque ancore
// interne, sempre le stesse: struttura del report, non del tenant).
function renderNavExternal(cfg) {
  return cfg.site.nav_external.map((item) => `      <li><a href="${item.href}">${item.label}</a></li>`).join("\n");
}

function renderPage(records, score, cfg) {
  const body = [
    renderMission(records),
    renderEidas(records),
    renderComplianceMap(records),
    renderRisks(records),
    renderDecisions(records),
  ].join("\n\n");

  return `<!doctype html>
<html lang="${cfg.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${cfg.site.title}</title>
<style>${STYLE}</style>
${renderMatomo(cfg.site.matomo)}
</head>
<body>
  <header class="hero">
    <p class="eyebrow">${cfg.site.eyebrow}</p>
    <h1>${cfg.site.heading}</h1>
    <p class="thesis">${cfg.site.thesis_html}</p>
${renderLedger(score, cfg)}
  </header>

  <nav class="spine">
    <ul>
      <li><a href="#missione">Missione</a></li>
      <li><a href="#eidas">Posizionamento eIDAS</a></li>
      <li><a href="#compliance">Compliance Map</a></li>
      <li><a href="#rischi">Rischi</a></li>
      <li><a href="#decisioni">Decisioni</a></li>
${renderNavExternal(cfg)}
    </ul>
  </nav>

  <main>
${body}
  </main>

  <footer>
    <nav class="footer-cols" aria-label="Collegamenti del footer">
${renderFooterColumns(cfg)}
    </nav>
    <div class="footer-bottom">
      ${cfg.site.footer_note_html}
      <br><img src="/badge.svg" alt="${cfg.site.badge_alt}" height="20" style="margin-top:0.5rem;">
      <p class="footer-version">motore v${esc(score.core_version)} · pacchetto ${esc(cfg.id)} v${esc(cfg.version)}</p>
    </div>
  </footer>
</body>
</html>
`;
}

function main() {
  const cfg = loadTenant();
  const records = loadRegistry();
  const score = JSON.parse(readFileSync(join(SITE_DIR, "score.json"), "utf8"));
  writeFileSync(join(SITE_DIR, "index.html"), renderPage(records, score, cfg));
  console.log("site/index.html generato.");
}

main();
