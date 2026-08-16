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

// Analytics Matomo: URL e siteId sono valori di un tenant, non del motore
// (vedi core/README.md "Cosa NON può stare qui" — nessun default che assuma
// quale installazione è quella vera). Il chiamante passa cfg.matomo /
// cfg.site.matomo letto da site.config.json o tenant.config.json; senza
// configurazione la pagina resta semplicemente senza tracciamento.
// Cookieless (disableCookies): nessun banner di consenso richiesto.
export function renderMatomo(matomo) {
  if (!matomo?.url || !matomo?.site_id) return "";
  return `<!-- Matomo -->
<script>
  var _paq = window._paq = window._paq || [];
  _paq.push(['disableCookies']);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="${matomo.url}";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '${matomo.site_id}']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
<!-- End Matomo -->`;
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
