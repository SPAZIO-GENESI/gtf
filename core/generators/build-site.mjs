import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry, byFolder } from "./lib/registry.mjs";
import { loadTenant, TENANT_SITE_DIR } from "./lib/tenant.mjs";
import { STYLE } from "./lib/style.mjs";
import { esc, para, L, renderFooterColumns, renderMatomo } from "./lib/render.mjs";
import { REPORT_UI, METRIC_LABELS_EN } from "./lib/report-ui.mjs";

const SITE_DIR = TENANT_SITE_DIR;
const LOCALES = ["it", "en"];

// Fonde site.i18n.<locale> sopra site.*: solo i campi presenti nel blocco
// di lingua sovrascrivono, il resto (matomo, metrics_url, ecc.) resta
// condiviso. locale "it" non guarda mai i18n — l'italiano è il default.
function localizeSite(cfg, locale) {
  if (locale === "it") return cfg;
  const overrides = cfg.site?.i18n?.[locale] ?? {};
  return { ...cfg, site: { ...cfg.site, ...overrides } };
}

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
function ctlStatusBadge(status, ui) {
  const s = String(status ?? "").toLowerCase();
  const label = ui.statusLabels[s] ?? (status || "—");
  const cls = { active: "pill-sage", draft: "pill-amber", stale: "pill-seal", retired: "pill-muted" }[s] ?? "pill-muted";
  return `<span class="pill ${cls} status-badge">${esc(label)}</span>`;
}

function phaseNumber(id) {
  // "ADR-P7" -> 7, "ADR-GTF-002" -> Infinity (ordinate dopo, per id crescente)
  const m = /^ADR-P(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : Infinity;
}

function renderLedger(score, cfg, ui, locale) {
  const label = (l) => (locale !== "it" && METRIC_LABELS_EN[l]) || l;
  const hasPartial = score.indicators.some((i) => i.value !== null && i.note);
  const rows = score.indicators
    .map((i) => {
      if (i.value === null) {
        return `        <tr class="is-pending" title="${esc(i.note)}"><td class="ledger-label">${esc(label(i.label))}</td><td class="ledger-value">${esc(ui.ledgerNoteNd)}</td></tr>`;
      }
      if (i.note) {
        return `        <tr class="is-counted is-partial" title="${esc(i.note)}"><td class="ledger-label">${esc(label(i.label))} *</td><td class="ledger-value">${i.value}</td></tr>`;
      }
      return `        <tr class="is-counted"><td class="ledger-label">${esc(label(i.label))}</td><td class="ledger-value">${i.value}</td></tr>`;
    })
    .join("\n");
  return `    <div class="ledger" role="group" aria-label="${esc(ui.ledgerAriaLabel)}">
      <table class="ledger-table">
        <tbody>
${rows}
          <tr class="ledger-total"><td class="ledger-label">${esc(ui.ledgerSaldo)}</td><td class="ledger-value">${score.overall}<span class="unit">/100</span></td></tr>
        </tbody>
      </table>
      <p class="ledger-note">${esc(ui.ledgerNote(score.available_count, score.total))}<em>${esc(ui.ledgerNoteNd)}</em>${esc(ui.ledgerNoteEnd)}${hasPartial ? esc(ui.ledgerPartialNote) : ""} <a href="${cfg.site.metrics_url}">${esc(ui.ledgerFormula)}</a>.</p>
    </div>`;
}

function renderMission(records, locale, ui) {
  const msn = records.get("MSN-01")?.record;
  const principles = byFolder(records, "principles")
    .filter((p) => p.type === "principle")
    .sort((a, b) => a.id.localeCompare(b.id));
  const items = principles
    .map(
      (p) => `      <article class="record">
        <p class="tag">${esc(p.id)}</p>
        <h3>${esc(p.title)}</h3>
        <p>${para(L(p, "statement", locale))}</p>
        <p class="rule">${esc(ui.regolaVerificabile)}${para(L(p, "rule", locale))}</p>
      </article>`
    )
    .join("\n");
  return `  <details id="missione" class="folio" data-folio="MSN · PRN">
    <summary><h2>${esc(ui.missioneHeading)}</h2></summary>
    <p class="lede">${para(L(msn, "statement", locale))}</p>
    <div class="record-grid">
${items}
    </div>
  </details>`;
}

function renderEidas(records, locale, ui) {
  const ctl = records.get("CTL-eidas-honest-positioning")?.record;
  return `  <details id="eidas" class="folio" data-folio="CTL">
    <summary><h2>${esc(ui.eidasHeading)}</h2></summary>
    <p>${para(L(ctl, "statement", locale))}</p>
    <p class="tag-line"><span class="tag">${esc(ctl?.id)}</span> ${ctlStatusBadge(ctl?.status, ui)}</p>
  </details>`;
}

function renderComplianceMap(records, locale, ui) {
  const reqs = byFolder(records, "requirements").sort((a, b) => a.id.localeCompare(b.id));
  const cards = reqs
    .map((r) => {
      const ctlItems = (r.satisfied_by ?? [])
        .map((id) => {
          const ctl = records.get(id)?.record;
          if (!ctl) return `          <li><span class="tag">${esc(id)}</span></li>`;
          const verifyHowto = L(ctl, "verify_howto", locale);
          const verify = verifyHowto
            ? `<details><summary>${esc(ui.comeVerificare)}</summary><p>${para(verifyHowto)}</p></details>`
            : "";
          return `          <li><span class="tag">${esc(ctl.id)}</span> ${ctlStatusBadge(ctl.status, ui)} ${esc(L(ctl, "title", locale))}${verify}</li>`;
        })
        .join("\n");
      const norm = L(r, "source_norm", locale) || r.source?.norm;
      const ref = L(r, "source_ref", locale) || r.source?.ref;
      return `      <article class="norm-card">
        <header>
          <span class="${pillClass(r.applicability)}">${esc(r.applicability)}</span>
          <h3>${esc(norm)}</h3>
          <p class="ref">${esc(ref)}</p>
        </header>
        <p>${para(L(r, "statement", locale))}</p>
        <ul class="ctl-list">
${ctlItems || `          <li class="empty">${esc(ui.nessunControllo)}</li>`}
        </ul>
        <p class="tag-line"><span class="tag">${esc(r.id)}</span></p>
      </article>`;
    })
    .join("\n");
  return `  <details id="compliance" class="folio" data-folio="REQ · CTL · EVD">
    <summary><h2>${esc(ui.complianceHeading)}</h2></summary>
    <div class="norm-grid">
${cards}
    </div>
  </details>`;
}

function renderRisks(records, locale, ui) {
  const risks = byFolder(records, "risks").sort((a, b) => a.id.localeCompare(b.id));
  const cards = risks
    .map((r) => {
      const mitigations = (r.mitigated_by ?? [])
        .map((id) => {
          const ctl = records.get(id)?.record;
          return `          <li><span class="tag">${esc(id)}</span> ${ctlStatusBadge(ctl?.status, ui)} ${esc(L(ctl, "title", locale) ?? id)}</li>`;
        })
        .join("\n");
      return `      <article class="norm-card">
        <header>
          <div class="risk-pills">
            <span class="${pillClass(r.likelihood)}">${esc(ui.probabilita)}${esc(r.likelihood ?? "—")}</span>
            <span class="${pillClass(r.impact)}">${esc(ui.impatto)}${esc(r.impact ?? "—")}</span>
          </div>
          <h3>${esc(L(r, "title", locale))}</h3>
        </header>
        <p class="ref">${esc(ui.mitigatoDa)}</p>
        <ul class="ctl-list">
${mitigations || `          <li class="empty">${esc(ui.nessunaMitigazione)}</li>`}
        </ul>
        <p class="tag-line"><span class="tag">${esc(r.id)}</span></p>
      </article>`;
    })
    .join("\n");
  return `  <details id="rischi" class="folio" data-folio="RSK">
    <summary><h2>${esc(ui.rischiHeading)}</h2></summary>
    <div class="norm-grid">
${cards}
    </div>
  </details>`;
}

// Le 60 decisioni pubbliche non sono tradotte (scope P48): restano in
// italiano anche sulla pagina inglese, con una nota onesta invece di far
// finta che lo siano — meglio di ometterle, chi legge l'inglese tecnico
// riesce comunque a seguirle nella maggior parte dei casi.
function renderDecisions(records, locale, ui, decisionsNote) {
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
  const note = locale !== "it" && decisionsNote ? `<p class="rule">${esc(decisionsNote)}</p>` : "";
  return `  <details id="decisioni" class="folio" data-folio="ADR">
    <summary><h2>${esc(ui.decisioniHeading)}</h2></summary>
${note}
    <div class="journal">
${items}
    </div>
  </details>`;
}

// Le voci "esterne" della barra di navigazione (dopo le cinque ancore
// interne, sempre le stesse: struttura del report, non del tenant).
function renderNavExternal(cfg) {
  return cfg.site.nav_external.map((item) => `      <li><a href="${item.href}">${item.label}</a></li>`).join("\n");
}

function renderHreflang(base, path) {
  const links = LOCALES.map((code) => {
    const href = code === "it" ? `${base}/` : `${base}/${code}/`;
    return `<link rel="alternate" hreflang="${code}" href="${href}">`;
  });
  links.push(`<link rel="alternate" hreflang="x-default" href="${base}/">`);
  links.push(`<link rel="canonical" href="${base}${path}">`);
  return links.join("\n");
}

function renderPage(records, score, cfg, locale, path) {
  const ui = REPORT_UI[locale];
  const decisionsNote = cfg.site?.i18n?.[locale]?.decisions_note;
  const body = [
    renderMission(records, locale, ui),
    renderEidas(records, locale, ui),
    renderComplianceMap(records, locale, ui),
    renderRisks(records, locale, ui),
    renderDecisions(records, locale, ui, decisionsNote),
  ].join("\n\n");

  const switchLinks = LOCALES.map((code) => {
    const href = code === "it" ? "/" : `/${code}/`;
    return code === locale
      ? `<a href="${href}" aria-current="page">${code.toUpperCase()}</a>`
      : `<a href="${href}" data-lang="${code}">${code.toUpperCase()}</a>`;
  }).join(`<span class="sep">·</span>`);

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${cfg.site.title}</title>
${renderHreflang(cfg.site.public_url, path)}
<style>${STYLE}</style>
${renderMatomo(cfg.site.matomo)}
<script src="/lang.js" defer></script>
</head>
<body>
  <header class="hero">
    <p class="lang-switch">${switchLinks}</p>
    <p class="eyebrow">${cfg.site.eyebrow}</p>
    <h1>${cfg.site.heading}</h1>
    <p class="tagline">${cfg.site.tagline_html}</p>
${renderLedger(score, cfg, ui, locale)}
  </header>

  <nav class="spine">
    <ul>
      <li><a href="#missione">${esc(ui.navMissione)}</a></li>
      <li><a href="#eidas">${esc(ui.navEidas)}</a></li>
      <li><a href="#compliance">${esc(ui.navCompliance)}</a></li>
      <li><a href="#rischi">${esc(ui.navRischi)}</a></li>
      <li><a href="#decisioni">${esc(ui.navDecisioni)}</a></li>
${renderNavExternal(cfg)}
    </ul>
  </nav>

  <main>
${body}
  </main>

  <footer>
    <nav class="footer-cols" aria-label="${esc(ui.footerNavLabel)}">
${renderFooterColumns(cfg)}
    </nav>
    <div class="footer-bottom">
      ${cfg.site.footer_note_html}
      <br><img src="/badge.svg" alt="${cfg.site.badge_alt}" height="20" style="margin-top:0.5rem;">
      <p class="footer-version">${esc(ui.engine)} v${esc(score.core_version)} · ${esc(ui.package)} ${esc(cfg.id)} v${esc(cfg.version)}</p>
    </div>
  </footer>
</body>
</html>
`;
}

function main() {
  const baseTenant = loadTenant();
  const records = loadRegistry();
  const score = JSON.parse(readFileSync(join(SITE_DIR, "score.json"), "utf8"));

  for (const locale of LOCALES) {
    const cfg = localizeSite(baseTenant, locale);
    const dir = locale === "it" ? SITE_DIR : join(SITE_DIR, locale);
    const path = locale === "it" ? "/" : `/${locale}/`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), renderPage(records, score, cfg, locale, path));
  }

  console.log(`site/index.html + site/{${LOCALES.filter((l) => l !== "it").join(",")}}/index.html generati.`);
}

main();
