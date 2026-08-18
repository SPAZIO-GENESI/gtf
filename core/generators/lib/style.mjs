// Estratto da build-site.mjs in P44 F4: build-changelog.mjs riusa lo stesso
// foglio di stile, così le due pagine del Trust Center restano un unico
// sistema visivo invece di due copie che divergono (lezione di beta.html).
export const STYLE = `
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
  .lang-switch { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; margin: 0 0 1.2rem; }
  .lang-switch a { text-decoration: none; color: var(--ink-muted); }
  .lang-switch a[aria-current] { color: var(--ink); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
  .lang-switch .sep { color: var(--ink-muted); margin: 0 0.4em; }
  .eyebrow { font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); margin: 0 0 0.4rem; }
  .hero h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 600; margin: 0 0 0.6rem; }
  .tagline { font-family: var(--font-display); font-size: 1.15rem; font-style: italic; color: var(--ink-muted); max-width: 38rem; margin: 0 0 1rem; }
  .thesis { max-width: 38rem; margin: 0 0 2rem; }

  .ledger { border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 1.2rem 0; }
  .ledger-table { width: 100%; max-width: 26rem; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  .ledger-table td { padding: 0.3rem 0; }
  .ledger-label { color: var(--ink); }
  .ledger-value { text-align: right; font-family: var(--font-mono); }
  tr.is-pending .ledger-label, tr.is-pending .ledger-value { color: var(--ink-muted); font-style: italic; cursor: help; }
  tr.is-pending .ledger-value::before { content: "— "; }
  tr.is-partial { cursor: help; }
  tr.is-partial .ledger-label { border-bottom: 1px dotted var(--ink-muted); }
  tr.ledger-total td { padding-top: 0.6rem; border-top: 3px double var(--ink); font-family: var(--font-display); font-size: 1.4rem; font-weight: 600; }
  .ledger-total .unit { font-size: 1rem; font-weight: 400; color: var(--ink-muted); }
  .ledger-note { font-size: 0.85rem; color: var(--ink-muted); margin: 0.8rem 0 0; }

  nav.spine { position: sticky; top: 0; z-index: 10; background: var(--paper); border-bottom: 1px solid var(--rule); padding: 0.7rem 0; margin-bottom: 1rem; }
  nav.spine ul { display: flex; flex-wrap: wrap; gap: 1.3rem; padding: 0; margin: 0; list-style: none; }
  nav.spine a { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; text-decoration: none; border-bottom: 2px solid transparent; padding-bottom: 2px; }
  nav.spine a:hover, nav.spine a:focus-visible { border-bottom-color: var(--gold); }

  .folio { position: relative; background: var(--card); border: 1px solid var(--rule); border-radius: 8px; padding: 1.6rem 1.6rem 1.8rem; margin: 1.6rem 0; scroll-margin-top: 4rem; }
  .folio::before {
    content: attr(data-folio);
    position: absolute; top: 0.7rem; right: 1rem;
    font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.05em;
    color: var(--ink-muted); opacity: 0.7;
  }
  .folio h2 { font-family: var(--font-display); font-size: 1.3rem; margin: 0 0 1rem; }

  /* Sezioni apribili: <details>/<summary> nativi, nessun JS (CLAUDE.md, invariante 7). */
  /* Freccetta disegnata coi bordi (stesso trucco già usato per nascondere il marker di .journal). */
  .folio > summary { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; }
  .folio > summary::-webkit-details-marker { display: none; }
  .folio > summary h2 { margin: 0; }
  .folio > summary::after {
    content: ""; flex: 0 0 auto; width: 0.55rem; height: 0.55rem;
    border-right: 2px solid var(--ink-muted); border-bottom: 2px solid var(--ink-muted);
    transform: rotate(-45deg); transition: transform 0.15s ease;
  }
  .folio[open] > summary::after { border-color: var(--gold); transform: rotate(45deg); }
  .folio[open] > summary { margin-bottom: 1rem; }

  .tag { display: inline-block; font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.01em; padding: 1px 6px; border: 1px solid var(--rule); border-radius: 3px; color: var(--ink-muted); background: var(--paper); white-space: nowrap; }
  .tag-line { margin: 0.6rem 0 0; }

  .pill { display: inline-block; font-size: 0.72rem; padding: 2px 9px; border-radius: 999px; font-weight: 600; }
  .status-badge { margin-left: 0.3rem; }
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
  .footer-cols { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1.6rem 2.6rem; margin: 0 0 1.5rem; }
  .footer-col { min-width: 12rem; }
  .footer-col h3 { font-family: var(--font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-muted); font-weight: 600; margin: 0 0 0.6rem; }
  .footer-col a { display: block; margin: 0.35rem 0; font-size: 0.85rem; }
  .footer-bottom { padding-top: 1.2rem; border-top: 1px solid var(--rule); }
  .footer-version { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-muted); margin: 0.6rem 0 0; }
  @media (max-width: 40rem) { .footer-cols { justify-content: flex-start; } }
`;
