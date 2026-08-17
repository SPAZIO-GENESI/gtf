import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/root.mjs";
import { STYLE } from "./lib/style.mjs";
import { esc, renderFooterColumns, renderMatomo } from "./lib/render.mjs";
import { loadSiteConfig } from "./lib/site-config.mjs";

// P45 F2: questo generatore scrive site/index.html — la pagina del
// *prodotto* (il framework), non di un tenant. Vive in core/ ed è
// scandito dalla guardia di isolamento: nessun nome di progetto qui
// dentro, tutto arriva da content/site.config.json o dai
// tenant.config.json (vedi P45_domini_e_siti_separati.md §F2.2). Il dominio
// del prodotto stesso non fa eccezione: viene da cfg.canonical_base, non
// hardcoded qui (check-core-isolation.mjs lo boccerebbe comunque).
const SITE_DIR = join(ROOT, "site");
const TENANTS_DIR = join(ROOT, "tenants");
const CORE_VERSION = JSON.parse(readFileSync(join(ROOT, "core", "package.json"), "utf8")).version;
const LOCALES = ["it", "en"];

function listTenantIds() {
  return readdirSync(TENANTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

// Un tenant appena creato (senza ancora uno score.json pubblicato) non deve
// rompere la radice: si salta con un avviso su stderr, non un errore.
// name_<locale> è opzionale (P48): un tenant senza traduzione del nome
// ricade sul name italiano, non deve bloccare le altre lingue.
function loadTenantSummary(id, locale = "it") {
  const cfgFile = join(TENANTS_DIR, id, "tenant.config.json");
  const cfg = JSON.parse(readFileSync(cfgFile, "utf8"));

  const scoreFile = join(TENANTS_DIR, id, "site", "score.json");
  if (!existsSync(scoreFile)) {
    console.error(`[build-root] tenant "${id}": ${scoreFile} non trovato, saltato dal riepilogo.`);
    return null;
  }

  const publicUrl = cfg.site?.public_url;
  if (!publicUrl) {
    console.error(`[build-root] tenant "${id}": tenant.config.json senza site.public_url, saltato dal riepilogo.`);
    return null;
  }

  const score = JSON.parse(readFileSync(scoreFile, "utf8"));
  const name = (locale !== "it" && cfg[`name_${locale}`]) || cfg.name;
  return { id: cfg.id, name, owner: cfg.owner, version: cfg.version, publicUrl, score };
}

function scorePill(overall) {
  if (overall === null || overall === undefined) return "pill pill-muted";
  if (overall >= 80) return "pill pill-sage";
  if (overall >= 50) return "pill pill-amber";
  return "pill pill-seal";
}

function renderTenantCard(t, ui) {
  const overall = t.score.overall;
  return `      <article class="record">
        <p class="tag">${esc(t.id)}</p>
        <h3><a href="${esc(t.publicUrl)}">${esc(t.name)}</a></h3>
        <p>${esc(t.owner)}</p>
        <p><span class="${scorePill(overall)}">${esc(overall ?? "n/d")}/100</span> ·
          ${esc(t.score.available_count)}/${esc(t.score.total)} ${esc(ui.indicators)} · v${esc(t.version)}</p>
        <p class="rule"><a href="${esc(t.publicUrl)}">${esc(ui.open_trust_center)}</a></p>
      </article>`;
}

function renderSection(s) {
  return `  <section class="folio" data-folio="TRUST">
    <h2>${esc(s.heading)}</h2>
    <p>${s.body_html}</p>
  </section>`;
}

// Coppia IT/EN sempre entrambe presenti, quella corrente marcata
// aria-current: mai fidarsi solo dell'auto-detect in lang.js, l'uscita
// manuale deve restare a un click su ogni pagina.
function renderLangSwitch(locale) {
  return LOCALES.map((code) => {
    const href = code === "it" ? "/" : `/${code}/`;
    return code === locale
      ? `<a href="${href}" aria-current="page">${code.toUpperCase()}</a>`
      : `<a href="${href}" data-lang="${code}">${code.toUpperCase()}</a>`;
  }).join(`<span class="sep">·</span>`);
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

function renderPage(cfg, tenants, path) {
  const sections = cfg.sections.map(renderSection).join("\n\n");
  const ui = cfg.ui;
  const cards = tenants.map((t) => renderTenantCard(t, ui)).join("\n");
  const cardsBlock = cards || `      <p class="rule">${esc(ui.no_projects)}</p>`;

  return `<!doctype html>
<html lang="${cfg.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.title)}</title>
${renderHreflang(cfg.canonical_base, path)}
<style>${STYLE}</style>
${renderMatomo(cfg.matomo)}
<script src="/lang.js" defer></script>
</head>
<body>
  <header class="hero">
    <p class="lang-switch">${renderLangSwitch(cfg.language)}</p>
    <p class="eyebrow">${cfg.eyebrow}</p>
    <h1>${cfg.heading}</h1>
    <p class="tagline">${cfg.tagline_html}</p>
    <p class="thesis">${cfg.thesis_html}</p>
  </header>

  <main>
${sections}

  <section id="progetti" class="folio" data-folio="TNT">
    <h2>${esc(ui.projects_heading)}</h2>
    <div class="record-grid">
${cardsBlock}
    </div>
  </section>
  </main>

  <footer>
    <nav class="footer-cols" aria-label="${esc(ui.footer_nav_label)}">
${renderFooterColumns({ site: cfg })}
    </nav>
    <div class="footer-bottom">
      ${cfg.footer_note_html}
      <br><img src="/badge.svg" alt="Genesis Trust Score" height="20" style="margin-top:0.5rem;">
      <p class="footer-version">${esc(ui.engine)} v${esc(CORE_VERSION)} · ${esc(ui.product_site)} v${esc(cfg.version)}</p>
    </div>
  </footer>
</body>
</html>
`;
}

// F2.4: copia di compatibilità — badge.svg e score.json restano
// raggiungibili sulla radice per i 22 punti pubblici che li consumano
// (vedi P45 §2). Un tenant di compat mancante è un errore fatale, non un
// avviso: un badge assente sulla radice è un danno di fiducia pubblico.
function copyCompatFiles(cfg) {
  const badgeTenant = cfg.compat?.badge_from_tenant;
  const scoreTenant = cfg.compat?.score_from_tenant;
  if (!badgeTenant || !scoreTenant) {
    throw new Error("content/site.config.json: compat.badge_from_tenant / compat.score_from_tenant mancanti.");
  }

  const badgeSrc = join(TENANTS_DIR, badgeTenant, "site", "badge.svg");
  const scoreSrc = join(TENANTS_DIR, scoreTenant, "site", "score.json");
  if (!existsSync(badgeSrc)) {
    throw new Error(
      `compat.badge_from_tenant="${badgeTenant}" ma ${badgeSrc} non esiste: il badge pubblico sulla radice si romperebbe su 22 punti pubblici.`
    );
  }
  if (!existsSync(scoreSrc)) {
    throw new Error(`compat.score_from_tenant="${scoreTenant}" ma ${scoreSrc} non esiste.`);
  }

  copyFileSync(badgeSrc, join(SITE_DIR, "badge.svg"));
  copyFileSync(scoreSrc, join(SITE_DIR, "score.json"));
}

function main() {
  const tenantIds = listTenantIds();
  let tenantCount = 0;

  for (const locale of LOCALES) {
    const cfg = loadSiteConfig(locale);
    const tenants = tenantIds.map((id) => loadTenantSummary(id, locale)).filter((t) => t !== null);
    tenantCount = tenants.length;

    const dir = locale === "it" ? SITE_DIR : join(SITE_DIR, locale);
    const path = locale === "it" ? "/" : `/${locale}/`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), renderPage(cfg, tenants, path));

    if (locale === "it") copyCompatFiles(cfg);
  }

  console.log(`site/index.html + site/{${LOCALES.filter((l) => l !== "it").join(",")}}/index.html generati — ${tenantCount} progetto/i nel riepilogo.`);
}

main();
