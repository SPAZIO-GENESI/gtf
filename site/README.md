# site/ — Sorgente statica della radice (il prodotto)

Applicazione statica (HTML/CSS/JS puro, stessa filosofia di authweb: zero
framework, zero CDN di terze parti) generata a ogni merge in `main`, pubblicata
**direttamente da questo repo** (GitHub Pages di `gtf`) su
`trust.spaziogenesi.org`. Vedi GTF-ARCH §7 e §15.

Il Trust Center di un tenant (`tenants/<id>/site/`) NON viene pubblicato da
qui: dal 16 agosto 2026 (P45) esce con un `git push` diretto verso un **repo
Pages sottile dedicato** (per l'attestazione, `SPAZIO-GENESI/trust-attestazione`
— di sola pubblicazione, sovrascritto per intero a ogni deploy), perché
GitHub Pages ammette un solo dominio custom per repository e questo repo
già serve la radice. Vedi `tenants/attestazione/site/README.md`.

**Dal P45**: questa cartella è l'output della **radice** — la pagina del
prodotto (`index.html`, generato da `core/generators/build-root.mjs` a
partire da `content/site.config.json` più un riepilogo letto dagli
`score.json` di ciascun tenant), non più del Trust Center di un singolo
progetto. Il Trust Center di un tenant (missione, Compliance Map, rischi,
decisioni, il **suo** `score.json`/`badge.svg`) vive in
`tenants/<id>/site/`, generato da `build-site.mjs`/`score.mjs`.

`index.html`, `changelog/index.html`, e le copie di compatibilità `score.json` /
`badge.svg` (F2.4: badge/score del tenant indicato in
`content/site.config.json` › `compat`, copiati qui perché 22 punti pubblici
esterni li consumano da questo host — non spostarli) sono **generati**, non
scritti a mano (`npm run build`, eseguito da
`.github/workflows/publish.yml` prima del deploy) — non modificarli
direttamente, le modifiche verrebbero sovrascritte al prossimo build.

**Dal P47 (16 agosto 2026)**: whitepaper e pagina DevOps non sono più
contenuto della radice — vivono su `attestazione.trust.spaziogenesi.org`
(tenant attestazione, vedi `tenants/attestazione/site/README.md`), perché
descrivono quel servizio, non il framework. Restano qui solo **shim**:
`whitepaper.html`, `devops.html` e `changelog.html` (quest'ultimo verso
`/changelog/`, non verso un altro host) — tre righe di HTML statiche che
rimandano al posto giusto, mantenute a mano perché un consumatore esterno
immutabile (README npm di `attest-mcp`, `imgauth/docs/DEVOPS.md`) punta
ancora al vecchio indirizzo. Non sono contenuto da tenere aggiornato: se
il contenuto cambia, cambia sull'host di destinazione. Il PDF del
whitepaper (`whitepaper-v1.0.pdf`) **non ha shim**: per decisione esplicita
del gestore, l'indirizzo vecchio risponde 404 (vedi `P47_contenuti_sul_proprio_host.md`).
Il file di verifica motori di ricerca resta qui, statico, mantenuto a mano.

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
