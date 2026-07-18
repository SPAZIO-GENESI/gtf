# Piano operativo — Prima review esterna del Genesis Trust Framework (2026)

**Processo**: `PRC-review-esterna-annuale` · **Decisione**: `ADR-GTF-010`
**Revisore**: Radixia srl — [radixia.ai](https://www.radixia.ai) (Milano; Enterprise AI, Open Cloud, Labs; membro Eclipse Foundation)
**Committente**: Spazio Genesi ETS (contatto: it@spaziogenesi.org)
**Stato**: predisposto il 2026-07-14, eseguibile da subito
**Guida passo-passo**: `docs/guida-esecutiva-review-esterna.md` (stesso perimetro,
comandi e output attesi spiegati per chi non è programmatore)

## Oggetto

Prima review esterna indipendente del registro GTF e dei controlli che
dichiarano lo stato di affidabilità di **attestazione.spaziogenesi.org**.
Non è un audit di certificazione: è la "review esterna leggera" prevista da
GTF-ARCH §9.1/§9.3 — verificare che ciò che il registro afferma sia
sostenuto da evidenze reali e riproducibili, e segnalare dove non lo è.

## Materiali (tutti pubblici, nessun accesso da concedere)

| Materiale | Dove |
|---|---|
| Registro (record YAML + schemi) | https://github.com/SPAZIO-GENESI/gtf (`registry/`, `schemas/`) |
| Trust Center pubblicato | https://trust.spaziogenesi.org |
| Documento architetturale | `ARCHITECTURE.md` nel repo gtf |
| Snapshot evidenze + bundle ancorati | `snapshots/` nel repo gtf |
| Repo di prodotto | github.com/SPAZIO-GENESI/{imgauth, imgauthweb, autart-signer, attest-mcp, attest-bot, attest-mcp-remote} |
| Servizio live | https://attestazione.spaziogenesi.org (+ `/api/status`, `/status/`, `/docs`) |

Prerequisiti tecnici lato revisore: git, Node.js ≥ 20. Nessuna credenziale:
il perimetro della review è interamente pubblico per design (PRN — la
fiducia si dimostra con record verificabili, non con accessi privilegiati).

## Passi operativi

1. **Kickoff (~30 min, anche asincrono)** — consegna di questo piano,
   `ARCHITECTURE.md` e del glossario; accordo sulla data di consegna del
   verbale.
2. **Riproducibilità del punteggio (~30 min)** — `git clone` del repo gtf,
   `npm ci && npm run build` offline: il validatore deve passare (0 errori)
   e l'Open Trust Score ricalcolato deve coincidere con quello pubblicato su
   trust.spaziogenesi.org. È il test cardine: il punteggio deriva solo dal
   registro committato, mai da chiamate di rete.
3. **Campione di controlli (~1–2 h)** — scelta libera del revisore di
   almeno 5 controlli `CTL-*` con `status: active`, verificando per ciascuno:
   l'implementazione dichiarata (`implemented_by`) esiste nel codice/config
   pubblico; l'evidenza dichiarata (`evidenced_by`) esiste ed è datata;
   il back-link da requisiti (`REQ`) o rischi (`RSK`) è coerente.
   Suggeriti (non vincolanti): `CTL-hmac-canary` (verificabile live),
   `CTL-dogfooding-anchor` (bundle ancorato sul servizio stesso),
   `CTL-cicd-pipeline` (run GitHub Actions pubblici),
   `CTL-eidas-honest-positioning` (controllo di onestà, non tecnico).
4. **Cadenze e coerenza (~30 min)** — i processi `PRC-*` ricorrenti hanno
   `frequency_days` e, dove eseguiti, `last_run` plausibili; le decisioni
   `ADR-*` citate dai controlli esistono; nessuna affermazione del Trust
   Center risulta priva di record a sostegno.
5. **Verbale** — documento sintetico (anche 1–2 pagine) con: perimetro
   esaminato, esito per ciascun passo, rilievi (se presenti) con gravità
   proposta, raccomandazioni. Il verbale è **pubblico per default**
   (postmortem e review senza colpa, GTF-ARCH §9.4).

## Esito e registrazione (a carico dell'ETS)

- Verbale committato nel repo gtf e registrato come `EVD-review-esterna-2026`.
- Ogni rilievo diventa un'azione correttiva `ACT-*` con scadenza.
- `PRC-review-esterna-annuale.last_run` aggiornato alla data del verbale.
- Trust Center rigenerato (`npm run build`) nello stesso giro.

## Impegno stimato

~3–4 h lato revisore, ~2 h lato ETS (kickoff, chiarimenti, registrazione
esito). La cadenza è annuale; il monitoraggio automatico
(`check-cadences.mjs`) avvisa se la successiva review supera la scadenza.
