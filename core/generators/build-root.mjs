import { readFileSync, readdirSync, existsSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/root.mjs";
import { STYLE } from "./lib/style.mjs";
import { esc, renderFooterColumns } from "./lib/render.mjs";
import { loadSiteConfig } from "./lib/site-config.mjs";

// P45 F2: questo generatore scrive site/index.html — la pagina del
// *prodotto* (il framework), non di un tenant. Vive in core/ ed è
// scandito dalla guardia di isolamento: nessun nome di progetto qui
// dentro, tutto arriva da content/site.config.json o dai
// tenant.config.json (vedi P45_domini_e_siti_separati.md §F2.2).
const SITE_DIR = join(ROOT, "site");
const TENANTS_DIR = join(ROOT, "tenants");
const CORE_VERSION = JSON.parse(readFileSync(join(ROOT, "core", "package.json"), "utf8")).version;

function listTenantIds() {
  return readdirSync(TENANTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

// Un tenant appena creato (senza ancora uno score.json pubblicato) non deve
// rompere la radice: si salta con un avviso su stderr, non un errore.
function loadTenantSummary(id) {
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
  return { id: cfg.id, name: cfg.name, owner: cfg.owner, version: cfg.version, publicUrl, score };
}

function scorePill(overall) {
  if (overall === null || overall === undefined) return "pill pill-muted";
  if (overall >= 80) return "pill pill-sage";
  if (overall >= 50) return "pill pill-amber";
  return "pill pill-seal";
}

function renderTenantCard(t) {
  const overall = t.score.overall;
  return `      <article class="record">
        <p class="tag">${esc(t.id)}</p>
        <h3><a href="${esc(t.publicUrl)}">${esc(t.name)}</a></h3>
        <p>${esc(t.owner)}</p>
        <p><span class="${scorePill(overall)}">${esc(overall ?? "n/d")}/100</span> ·
          ${esc(t.score.available_count)}/${esc(t.score.total)} indicatori · v${esc(t.version)}</p>
        <p class="rule"><a href="${esc(t.publicUrl)}">Apri il Trust Center →</a></p>
      </article>`;
}

function renderSection(s) {
  return `  <section class="folio" data-folio="TRUST">
    <h2>${esc(s.heading)}</h2>
    <p>${s.body_html}</p>
  </section>`;
}

function renderPage(cfg, tenants) {
  const sections = cfg.sections.map(renderSection).join("\n\n");
  const cards = tenants.map(renderTenantCard).join("\n");
  const cardsBlock = cards || `      <p class="rule">Nessun progetto disponibile ancora.</p>`;

  return `<!doctype html>
<html lang="${cfg.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.title)}</title>
<style>${STYLE}</style>
</head>
<body>
  <header class="hero">
    <p class="eyebrow">${cfg.eyebrow}</p>
    <h1>${cfg.heading}</h1>
    <p class="thesis">${cfg.thesis_html}</p>
  </header>

  <main>
${sections}

  <section id="progetti" class="folio" data-folio="TNT">
    <h2>I progetti che lo applicano</h2>
    <div class="record-grid">
${cardsBlock}
    </div>
  </section>
  </main>

  <footer>
    <nav class="footer-cols" aria-label="Collegamenti del footer">
${renderFooterColumns({ site: cfg })}
    </nav>
    <div class="footer-bottom">
      ${cfg.footer_note_html}
      <br><img src="/badge.svg" alt="Genesis Trust Score" height="20" style="margin-top:0.5rem;">
      <p class="footer-version">motore v${esc(CORE_VERSION)} · sito prodotto v${esc(cfg.version)}</p>
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
  const cfg = loadSiteConfig();
  const tenants = listTenantIds()
    .map(loadTenantSummary)
    .filter((t) => t !== null);

  writeFileSync(join(SITE_DIR, "index.html"), renderPage(cfg, tenants));
  copyCompatFiles(cfg);

  console.log(`site/index.html (radice) generato — ${tenants.length} progetto/i nel riepilogo.`);
}

main();
