// Estratto da build-site.mjs in P44 F4: build-changelog.mjs riusa questi
// helper. Vivono in lib/, non in build-site.mjs, apposta — build-site.mjs
// esegue main() al caricamento del modulo (è uno script, non una libreria):
// importarli da lì avrebbe rigenerato site/index.html come effetto
// collaterale ogni volta che si costruisce il changelog.

export function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Rende cliccabili gli URL nudi nel testo (già escaped da esc()): non c'è
// markdown nei campi del registro, un URL scritto in prosa deve comunque
// arrivare cliccabile sul Trust Center pubblico.
function linkifyUrls(str) {
  return str.replace(/https?:\/\/[^\s<>"']+/g, (url) => {
    const trailing = url.match(/[.,;:)]+$/);
    const clean = trailing ? url.slice(0, -trailing[0].length) : url;
    const trail = trailing ? trailing[0] : "";
    return `<a href="${clean}" target="_blank" rel="noopener">${clean}</a>${trail}`;
  });
}

export function para(str) {
  return linkifyUrls(esc(str).trim().replace(/\n\s*/g, " "));
}

// Le colonne del footer: interpolazione grezza (non esc()), le etichette
// arrivano già in HTML valido dal config (es. "API &amp; MCP" già escapata).
export function renderFooterColumns(cfg) {
  return cfg.site.footer_columns
    .map((col) => {
      const links = col.links.map((l) => `        <a href="${l.href}">${l.label}</a>`).join("\n");
      return `      <div class="footer-col">
        <h3>${col.heading}</h3>
${links}
      </div>`;
    })
    .join("\n");
}
