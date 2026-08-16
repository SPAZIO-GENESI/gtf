# site/ — Trust Center del tenant `attestazione`

Sorgente **generata**, non scritta a mano: `index.html`, `score.json` e
`badge.svg` escono da `core/generators/build-site.mjs` e `score.mjs`,
letti dal registro in `tenants/attestazione/registry/` e dalla
configurazione in `tenants/attestazione/tenant.config.json`. Rigenerali con
`GTF_TENANT=attestazione npm run build` dalla radice del repo — modificarli
qui direttamente non serve a nulla, il prossimo build li sovrascrive.

## Dove finisce questo output

Dal 16 agosto 2026 (P45, vedi `ARCHITECTURE.md` §15) questa cartella **non è
pubblicata da qui**: il job `publish.yml` la spinge con un `git push`
diretto (sostituzione completa, PAT fine-grained dedicato) nel repo Pages
sottile `SPAZIO-GENESI/trust-attestazione` — di sola pubblicazione, il suo
contenuto è sempre e solo una copia di questa cartella. Da lì GitHub Pages
la serve su `attestazione.trust.spaziogenesi.org` (record DNS CNAME
DNS-only, dominio custom impostato nelle impostazioni Pages del repo
sottile, che scrive anche il file `CNAME` che questa cartella non contiene).

`changelog.html` non vive qui: è il changelog del **prodotto**
(`content/changelog.yaml`), generato in `site/` alla radice del repo, non
nel pacchetto di un singolo tenant.

## Perché un repo a sé

GitHub Pages ammette un solo dominio custom per repository. Il repo `gtf`
serve già `trust.spaziogenesi.org` (la radice, la pagina del prodotto): il
sottodominio di questo tenant non è ottenibile dallo stesso repo, da qui il
repo sottile dedicato. Un secondo tenant (RADART, P46) avrebbe il proprio
pacchetto sotto `tenants/<id>/site/` e il proprio repo Pages sottile.
