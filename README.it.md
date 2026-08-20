*[English version](./README.md)*

# gtf — Genesis Trust Framework

[![Genesis Trust Score](https://trust.spaziogenesi.org/badge.svg)](https://trust.spaziogenesi.org)

Motore e registri attraverso cui **Spazio Genesi ETS** dimostra pubblicamente
perché il servizio [attestazione.spaziogenesi.org](https://attestazione.spaziogenesi.org)
merita fiducia — con evidenze verificabili da chiunque, non con dichiarazioni.
Il motore (`core/`) è un prodotto sviluppato da **Tangram.page**
(vedi [core/LICENSE](./core/LICENSE)); Spazio Genesi ETS lo applica ai propri
servizi come partner tecnologico e ne cura i registri (vedi [LICENSE](./LICENSE)).
Il motore è generico (nessun nome di progetto al suo interno, vedi §15 di
ARCHITECTURE.md): questo repo ospita oggi un solo pacchetto di dati
(`attestazione`), ma è costruito per applicarsi a più di un progetto.

Questo repository è la **Single Source of Truth**: ogni documento, pagina del
Trust Center, matrice di conformità e punteggio (Open Trust Score) è
**generato** dai registri in `tenants/<id>/registry/`, mai scritto a mano.

Leggi prima [ARCHITECTURE.md](./ARCHITECTURE.md): non è documentazione del
servizio, è il progetto del sistema che la produce. Dal 16 agosto 2026 (P45)
[trust.spaziogenesi.org](https://trust.spaziogenesi.org) è la pagina del
framework, con un riepilogo dei tenant; il Trust Center pubblico di
attestazione è su
[attestazione.trust.spaziogenesi.org](https://attestazione.trust.spaziogenesi.org).

## Struttura

- `core/` — il motore, generico per qualunque progetto (nessun nome di
  progetto al suo interno, sorvegliato da una guardia CI, vedi ARCHITECTURE.md
  §15):
  - `schemas/` — uno schema JSON per tipo di record del registro (principi,
    requisiti, controlli, implementazioni, evidenze, processi, decisioni,
    rischi, dati, metriche, glossario, azioni).
  - `generators/` — script Node: `validate.mjs` (schema + integrità del
    grafo), `collect-evidence.mjs` (snapshot settimanale da endpoint
    pubblici, tag di release inclusi), `check-cadences.mjs` (avviso Telegram
    se un processo ricorrente supera la sua cadenza dichiarata),
    `anchor-monthly.mjs` (bundle mensile da attestare col servizio stesso,
    §6.4), `score.mjs` (Open Trust Score dal registro + ultimo snapshot),
    `build-site.mjs` (genera `site/index.html`), `build-changelog.mjs`
    (genera `CHANGELOG.md` e `site/changelog.html` da `content/changelog.yaml`),
    `check-core-isolation.mjs` (la guardia anti-contaminazione di `core/`).
- `tenants/<id>/` — i dati di un progetto applicato: `registry/` (i record
  YAML veri e propri), `snapshots/` (evidenze raccolte settimanalmente,
  ADR-GTF-004), `tenant.config.json` (testi del Trust Center, URL esterni,
  elenco repo di codice, endpoint del collettore), `site/` (il Trust Center
  **di quel tenant** — `index.html`, `score.json`, `badge.svg` generati, più
  — dal P47 — i contenuti statici mantenuti a mano del tenant: whitepaper e
  pagina DevOps del servizio, non più output di build soltanto). Un solo
  tenant esiste oggi: `tenants/attestazione/`.
- `content/` — testi curati del prodotto, non derivati dal registro
  (`changelog.yaml`, sorgente unica a doppia resa; `site.config.json`, testi
  e riepilogo tenant della radice).
- `site/` — **dal 16 agosto 2026 (P45), l'output della radice**: la pagina
  del prodotto (`index.html`, `content/site.config.json` + riepilogo dei
  tenant, generata da `build-root.mjs`), `changelog/index.html` (del
  prodotto, non di un tenant — clean URL dal P47), più le copie di
  compatibilità `badge.svg`/`score.json` del tenant indicato in `compat`
  (22 punti pubblici esterni li consumano da qui) e il file di verifica
  motori di ricerca. Tutto generato, non modificarlo a mano — dettagli in
  `site/README.md`. **Dal P47**: `devops.html`, `whitepaper.html` e
  `whitepaper-v1.0.pdf` non sono più qui — sono contenuto del tenant
  attestazione (vedi sotto), e la radice ospita solo tre **shim** statici
  (`whitepaper.html`, `devops.html`, `changelog.html`) che rimandano al
  posto giusto per chi ha ancora l'indirizzo vecchio.
- `default-tenant.json` — quale tenant usare se `GTF_TENANT` non è
  impostata (configurazione di bootstrap, fuori da `core/` apposta).

## Due siti, due domini, un solo motore

Dal 16 agosto 2026 (P45, `ADR-GTF-015`) il repo `gtf` pubblica **due bersagli**:

- **`site/`** (la radice) va direttamente su GitHub Pages di questo repo →
  [trust.spaziogenesi.org](https://trust.spaziogenesi.org) — la pagina del
  framework.
- **`tenants/<id>/site/`** (il Trust Center di ciascun tenant) viene spinto
  con `git push` (PAT dedicato) in un **repo Pages sottile per tenant** —
  per l'attestazione, `SPAZIO-GENESI/trust-attestazione` →
  [attestazione.trust.spaziogenesi.org](https://attestazione.trust.spaziogenesi.org).
  Il repo sottile esiste perché GitHub Pages ammette **un solo dominio
  custom per repository**: il sottodominio del tenant non è ottenibile dal
  solo repo `gtf`, che già pubblica la radice. Il repo sottile è di **sola
  pubblicazione** — non modificarlo lì, il contenuto è sovrascritto a ogni
  deploy.

Dettagli, tabella degli URL che non si possono spostare, e motivazione
completa in [ARCHITECTURE.md §15](./ARCHITECTURE.md#15-multi-progetto--core-e-tenantsid).

## Sviluppo locale

```bash
npm install
GTF_TENANT=attestazione npm run validate   # schema, integrità dei riferimenti, anti-segreti
GTF_TENANT=attestazione npm run build      # validate + check-core + score + build-site + build-root + build-changelog (come in CI)
```

`GTF_TENANT` è facoltativa finché esiste un solo tenant (`default-tenant.json`
la imposta di default), ma va sempre passata esplicitamente non appena ne
esiste più di uno.

## Stato

**M4 in corso, M5 avviata (P44, dal 2026-08-15)**: canary HMAC (P17-B) attivo
e verificato in produzione; collettore di evidenze settimanale attivo;
`autart-signer` pubblicato (P11). Primo ancoraggio dogfooding eseguito
(2026-07, ADR-GTF-008); convenzione di tag `vX.Y.Z` adottata sui tre repo
pubblici (imgauth, imgauthweb, autart-signer) e monitoraggio automatico delle
cadenze ricorrenti con avviso Telegram attivo e verificato (ADR-GTF-009).
Restore drill e prima revisione trimestrale completati senza rilievi (P33).
Score 91-94/100 (fluttua onestamente con i dati reali raccolti), 10/10
indicatori disponibili.
Dal 15 agosto 2026 il motore si sta separando dai dati del progetto
attestazione (P44, `core/` ↔ `tenants/attestazione/`, ADR-GTF-014) per poter
applicare lo stesso framework a un secondo progetto (RADART, P46) senza
duplicare codice — vedi [ARCHITECTURE.md §15](./ARCHITECTURE.md#15-multi-progetto--core-e-tenantsid)
e `docs/ROADMAP-trust-multiprogetto.md`.
Dettagli fase per fase in [ARCHITECTURE.md §12](./ARCHITECTURE.md#12-roadmap--wbs).

## Licenza

MIT — vedi anche [NOTICE](./NOTICE). Il motore in `core/` è coperto da [core/LICENSE](./core/LICENSE)
(Tangram.page); il resto del repository — i registri dei tenant — da
[LICENSE](./LICENSE) (Spazio Genesi ETS).
