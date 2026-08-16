# site/ — Sorgente statica della radice (il prodotto)

Applicazione statica (HTML/CSS/JS puro, stessa filosofia di authweb: zero
framework, zero CDN di terze parti) generata a ogni merge in `main`, pubblicata
su `trust.spaziogenesi.org`. Vedi GTF-ARCH §7.

**Dal P45**: questa cartella è l'output della **radice** — la pagina del
prodotto (`index.html`, generato da `core/generators/build-root.mjs` a
partire da `content/site.config.json` più un riepilogo letto dagli
`score.json` di ciascun tenant), non più del Trust Center di un singolo
progetto. Il Trust Center di un tenant (missione, Compliance Map, rischi,
decisioni, il **suo** `score.json`/`badge.svg`) vive in
`tenants/<id>/site/`, generato da `build-site.mjs`/`score.mjs`.

`index.html`, `changelog.html`, e le copie di compatibilità `score.json` /
`badge.svg` (F2.4: badge/score del tenant indicato in
`content/site.config.json` › `compat`, copiati qui perché 22 punti pubblici
esterni li consumano da questo host — non spostarli) sono **generati**, non
scritti a mano (`npm run build`, eseguito da
`.github/workflows/publish.yml` prima del deploy) — non modificarli
direttamente, le modifiche verrebbero sovrascritte al prossimo build.
`devops.html`, `whitepaper.html`, `whitepaper-v1.0.pdf` e il file di verifica
motori di ricerca **non** sono generati: restano statici, mantenuti a mano.

Per cambiare il contenuto: modifica `content/site.config.json` (radice),
`content/changelog.yaml`, il registro del tenant attivo
(`tenants/<id>/registry/`), o i generatori in `core/generators/`
(`score.mjs`, `build-site.mjs`, `build-root.mjs`, `build-changelog.mjs`).

**v0 (M3)**: missione/principi, posizionamento eIDAS, Open Trust Score
(5 dei 10 indicatori calcolabili solo dal registro, gli altri
dichiaratamente `n/d`), Compliance Map, rischi, decisioni. Sezioni
rimandate: FAQ/glossario (registro ancora vuoto), pagine di audit/incidenti
dedicate (nessun record INC/ACT ancora esistente), feed `trust.json`
machine-readable.
