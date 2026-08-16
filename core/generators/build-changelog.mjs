import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { ROOT } from "./lib/root.mjs";
import { loadSiteConfig } from "./lib/site-config.mjs";
import { STYLE } from "./lib/style.mjs";
import { esc, para, renderFooterColumns, renderMatomo } from "./lib/render.mjs";

const CHANGELOG_SOURCE = join(ROOT, "content", "changelog.yaml");
const REQUIRED_FIELDS = ["date", "component", "title"];

function loadEntries() {
  const data = yaml.load(readFileSync(CHANGELOG_SOURCE, "utf8"), { schema: yaml.JSON_SCHEMA });
  const entries = data?.entries ?? [];

  entries.forEach((e, i) => {
    const label = e?.title ? `"${e.title}"` : `senza titolo`;
    const missing = REQUIRED_FIELDS.filter((f) => e?.[f] === undefined || e?.[f] === null || e?.[f] === "");
    if (typeof e?.public !== "boolean") missing.push("public");
    if (missing.length > 0) {
      throw new Error(
        `content/changelog.yaml, voce #${i + 1} (${label}): campi mancanti o non validi: ${missing.join(", ")}`
      );
    }
  });

  // Ordine: data decrescente. Array.prototype.sort è stabile (ES2019+), quindi
  // a parità di data l'ordine dentro il file sorgente è preservato.
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function componentMeta(e) {
  return e.version ? `${e.component} · v${e.version}` : e.component;
}

// --- CHANGELOG.md (tutte le voci, per chi sviluppa) ---

function mdEntry(e) {
  return `### ${e.title}\n*${componentMeta(e)}*\n\n${String(e.body ?? "").trim()}\n`;
}

function buildMarkdown(entries) {
  let out = "# Changelog\n\nFile generato da `content/changelog.yaml` — non modificarlo a mano.\n\n";
  let currentDate = null;
  for (const e of entries) {
    if (e.date !== currentDate) {
      currentDate = e.date;
      out += `## ${currentDate}\n\n`;
    }
    out += mdEntry(e) + "\n";
  }
  return out;
}

// --- site/changelog.html (solo public: true, stesso stile del Trust Center) ---

function htmlEntry(e) {
  return `      <details class="entry">
        <summary><span class="entry-date">${esc(e.date)}</span><span class="entry-title">${esc(e.title)}</span><span class="entry-status">${esc(componentMeta(e))}</span></summary>
        <div class="entry-body">
          <p>${para(e.body)}</p>
        </div>
      </details>`;
}

function buildChangelogPage(publicEntries, cfg) {
  const items =
    publicEntries.length > 0
      ? publicEntries.map(htmlEntry).join("\n")
      : `      <p class="empty">Ancora nessuna novità pubblica.</p>`;

  return `<!-- File generato da content/changelog.yaml — non modificarlo a mano. -->
<!doctype html>
<html lang="${cfg.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Changelog — ${esc(cfg.title)}</title>
<style>${STYLE}</style>
${renderMatomo(cfg.matomo)}
</head>
<body>
  <header class="hero">
    <p class="eyebrow">${cfg.eyebrow}</p>
    <h1>Changelog</h1>
    <p class="thesis">Le novità del framework, generate dallo stesso registro pubblico che alimenta la pagina principale.</p>
  </header>

  <nav class="spine">
    <ul>
      <li><a href="/">← Il framework</a></li>
    </ul>
  </nav>

  <main>
  <section id="changelog" class="folio" data-folio="LOG">
    <h2>Changelog</h2>
    <div class="journal">
${items}
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
    </div>
  </footer>
</body>
</html>
`;
}

// Shim, non contenuto: stesso pattern di site/whitepaper.html e
// site/devops.html (P47 F1/F2). site/changelog.html restava un file reale
// finché non aveva un clean URL; con F3.2 diventa un cartello verso
// /changelog/ — nessuno stile, nessun footer, solo il redirect.
function buildChangelogShim() {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<!--
  Shim, non contenuto. Il changelog del framework ha ora un clean URL
  (P47 F3.2): /changelog/ invece di /changelog.html. Questo file resta qui
  solo per chi arriva dal vecchio indirizzo. Non aggiornare il contenuto
  qui: la pagina vera è generata su site/changelog/index.html.
-->
<meta http-equiv="refresh" content="0; url=/changelog/">
<link rel="canonical" href="/changelog/">
<title>Changelog — si è spostato</title>
<meta name="robots" content="noindex">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 34rem; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.6; color: #221c14; background: #FBFAF6; }
  a { color: #5a3d10; }
  @media (prefers-color-scheme: dark) { body { color: #ece4d3; background: #17140f; } a { color: #d1a969; } }
</style>
</head>
<body>
  <p>Il changelog ha un nuovo indirizzo: <a href="/changelog/">/changelog/</a>.</p>
</body>
</html>
`;
}

function main() {
  const cfg = loadSiteConfig();
  const entries = loadEntries();

  writeFileSync(join(ROOT, "CHANGELOG.md"), buildMarkdown(entries));
  console.log(`CHANGELOG.md generato (${entries.length} voci).`);

  const publicEntries = entries.filter((e) => e.public);
  // Resta su ROOT/site apposta (F1, P45): il changelog è del prodotto
  // (content/changelog.yaml), non del tenant — non spostarlo per simmetria
  // con build-site.mjs/score.mjs. Dalla P47 F3.2 ha un clean URL
  // (site/changelog/index.html) e site/changelog.html è solo lo shim verso
  // di esso — la ragione di restare sulla radice non cambia, il percorso sì.
  const changelogDir = join(ROOT, "site", "changelog");
  mkdirSync(changelogDir, { recursive: true });
  writeFileSync(join(changelogDir, "index.html"), buildChangelogPage(publicEntries, cfg));
  writeFileSync(join(ROOT, "site", "changelog.html"), buildChangelogShim());
  console.log(`site/changelog/index.html generato (${publicEntries.length} voci pubbliche); site/changelog.html è lo shim.`);
}

main();
