# site/ — Sorgente statica del Trust Center

Applicazione statica (HTML/CSS/JS puro, stessa filosofia di authweb: zero
framework, zero CDN di terze parti) generata dal registro a ogni merge in
`main`. Vedi GTF-ARCH §7.

`index.html`, `score.json`, `badge.svg` e `changelog.html` sono **generati**,
non scritti a mano (`npm run build`, eseguito da `.github/workflows/publish.yml`
prima del deploy su `trust.spaziogenesi.org`) — non modificarli direttamente,
le modifiche verrebbero sovrascritte al prossimo build. Per cambiare il
contenuto: modifica il registro del tenant attivo (`tenants/<id>/registry/`),
`content/changelog.yaml`, o i generatori in `core/generators/`
(`score.mjs`, `build-site.mjs`, `build-changelog.mjs`).

**v0 (M3)**: missione/principi, posizionamento eIDAS, Open Trust Score
(5 dei 10 indicatori calcolabili solo dal registro, gli altri
dichiaratamente `n/d`), Compliance Map, rischi, decisioni. Sezioni
rimandate: FAQ/glossario (registro ancora vuoto), pagine di audit/incidenti
dedicate (nessun record INC/ACT ancora esistente), feed `trust.json`
machine-readable.
