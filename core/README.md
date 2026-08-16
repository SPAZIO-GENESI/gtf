# `core/` — il motore del Genesis Trust Framework

Questa cartella è il **motore generico**: schemi (`schemas/`) e generatori
(`generators/`) che calcolano il punteggio di fiducia e costruiscono il
Trust Center a partire da un registro di record YAML. Non sa nulla di alcun
progetto specifico.

Il motore è un prodotto sviluppato da **Tangram.page**, coperto dalla licenza
in [`LICENSE`](./LICENSE) (MIT). Spazio Genesi ETS lo applica ai propri
servizi come partner tecnologico e ne fornisce l'infrastruttura, ma non ne è
l'autore.

## Cosa può stare qui

- Codice che vale per **qualunque** tenant: parsing, validazione, calcolo del
  punteggio, rendering HTML/SVG, guardie di qualità.
- Riferimenti generici agli **schemi del registro** (principi, requisiti,
  controlli, evidenze, rischi, decisioni, processi, azioni, dati, metriche,
  glossario) e alle loro regole di forma.
- Testi in italiano quando descrivono il **framework** stesso (es. "Genesis
  Trust Framework", nomi di indicatori come `MET-privacy`), non un progetto a
  cui il framework è applicato.

## Cosa NON può stare qui

- Nomi di progetto, dominio, repository o organizzazione (es.
  "spaziogenesi", "attestazione", "imgauth", "autart", "attest-", "radart",
  "SPAZIO-GENESI") — quelli vivono in `tenants/<id>/tenant.config.json` e nei
  file YAML del registro di ciascun tenant.
- Qualunque valore di default che assuma quale tenant è "quello vero": la
  scelta del tenant attivo (`GTF_TENANT`, con fallback a
  `default-tenant.json` alla radice del repo) è configurazione di bootstrap,
  non logica del motore.
- Dipendenze npm proprie: `core/package.json` è solo un **manifesto di
  versione** (`version`, nessun `dependencies`). Le librerie usate dai
  generatori (`ajv`, `ajv-formats`, `js-yaml`) restano nel `package.json`
  alla radice, l'unico con `npm ci` (niente workspace npm in questa fase).

## La guardia

`generators/check-core-isolation.mjs` (`npm run check-core`, dalla radice)
scandisce `core/**` (esclusi `node_modules` e i file `.md`) e fallisce se
trova uno dei nomi vietati sopra, elencando file e riga. Gira sia dentro
`npm run build` sia nel workflow CI `validate.yml`, a ogni push/PR.

Una guardia mai vista fallire non è una guardia: prima di fidartene, inietta
una stringa vietata in un file di `core/` e verifica che `npm run check-core`
esca con errore.
