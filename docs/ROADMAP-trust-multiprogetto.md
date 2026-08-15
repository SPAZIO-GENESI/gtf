# Roadmap — da "il Trust Center di attestazione" a prodotto multi-progetto

> Documento di indirizzo, non di esecuzione. I piani eseguibili sono i file
> `Pnn_*.md` alla radice del repo, uno per volta.
> Versione **1.0** — 15 agosto 2026.

---

## 1. Dove siamo e dove andiamo

**Oggi** `gtf` è un repo solo: motore (schemi + generatori), dati (registro +
snapshot) e sito pubblico stanno insieme, e tutto è cablato su un unico
progetto — l'**attestazione delle opere digitali**. Il collettore interroga
`imgauth.spaziogenesi.org`, il punteggio conta i tag dei tre repo di quel
servizio, l'intestazione del Trust Center dice *"perché
attestazione.spaziogenesi.org merita fiducia"*.

Misura dell'accoppiamento, contata sul codice (non a occhio): **67 riferimenti**
a `spaziogenesi` / `attestazione` / `imgauth` / `SPAZIO-GENESI` dentro
`generators/`, concentrati in quattro file — `collect-evidence.mjs` (34),
`build-site.mjs` (19), `scan-privacy.mjs` (5), `score.mjs` (4). `validate.mjs`,
`lib/registry.mjs` e tutti gli `schemas/` ne hanno **zero**: il nucleo di
validazione è già agnostico, è la periferia che va scollegata.

**Dove andiamo:** il Trust Framework diventa un **prodotto** — un motore che si
applica a un progetto qualunque — e i progetti a cui si applica diventano
**istanze** ("tenant") con dati, dominio e punteggio propri, senza che uno
possa contaminare l'altro.

| | Prima | Dopo |
|---|---|---|
| Motore | mescolato ai dati | `core/` — zero stringhe di progetto, verificato dalla CI |
| Dati | `registry/`, `snapshots/` alla radice | `tenants/<id>/…`, uno per progetto |
| Configurazione | costanti nel codice | `tenants/<id>/tenant.config.json` |
| Sito | un solo host, un solo progetto | radice = prodotto · un sottodominio per progetto |
| Punteggio | uno | uno per progetto, calcolato con la stessa formula |
| Proprietà | Spazio Genesi ETS | prodotto **Tangram.page**, ospitato da Spazio Genesi ETS come partner tecnologico |

Prima applicazione dichiarata: **ATTESTAZIONE**. Seconda: **RADART**.

---

## 2. Architettura di destinazione

```
gtf/
├── core/                        ← il prodotto (futuro pacchetto Tangram)
│   ├── schemas/                 tipi di record (già agnostici)
│   ├── generators/              validate · score · build-site · collect · scan
│   └── package.json             VERSIONE DEL MOTORE
├── tenants/
│   ├── attestazione/
│   │   ├── tenant.config.json   identità, domini, endpoint, repo, formule  ← VERSIONE DEL PACCHETTO
│   │   ├── registry/            i 252 record di oggi
│   │   ├── snapshots/           le settimane raccolte
│   │   ├── content/             changelog e testi curati del tenant
│   │   └── site/                output generato per questo tenant
│   └── radart/                  (dal piano del secondo tenant)
├── content/                     testi del prodotto (radice del sito)
├── site/                        output della radice trust.spaziogenesi.org
└── docs/                        architettura, verbali, whitepaper, questa roadmap
```

**La regola che tiene in piedi tutto:** `core/` non deve contenere il nome di
nessun progetto. Non è una buona intenzione, è una **guardia di CI** che fa
fallire la build — stesso meccanismo della guardia anti-divergenza i18n di P41 e
della guardia sulla versione di `openapi.json` di P34. Senza guardia, alla terza
fretta qualcuno riscrive una costante nel motore e siamo daccapo.

---

## 3. I piani, in ordine

| Piano | Cosa fa | Rischio | Visibile all'utente |
|---|---|---|---|
| **P44** — Isolamento core ↔ tenant | Config del tenant, spostamento dati e motore, guardia CI, doppio changelog, versione per componente | basso (criterio: output **byte-identico**) | solo la nuova pagina changelog |
| **P45** — Domini e siti separati | `trust.spaziogenesi.org` = prodotto · `attestazione.trust.spaziogenesi.org` = Trust Center dell'attestazione | **medio-alto** (DNS, badge, whitepaper — vedi §4) | sì, molto |
| **P46** — Secondo tenant: RADART | Pacchetto `tenants/radart`, registro seed, policy di visibilità per repo privati | medio | sì (nuovo sottodominio) |
| **P47** — Correzione dell'astrazione | Ciò che RADART rivela di sbagliato nel core torna nel core. **Nessuna estrazione prima di questo passo** | basso | no |
| **P48** — Estrazione del prodotto Tangram | `core/` esce come repo/pacchetto proprio, i tenant lo consumano a versione | medio | no |

**Perché in quest'ordine.** P44 è dovuto in ogni caso, qualunque decisione si
prenda dopo: separare motore e dati è il prerequisito di tutto e non pregiudica
nulla. P48 (l'estrazione vera del prodotto) va **dopo** il secondo tenant, non
prima: un'astrazione con un solo consumatore è una scommessa, con due è una
constatazione. Estrarre adesso significherebbe versionare e mantenere un
pacchetto la cui interfaccia scopriremo sbagliata al primo uso reale.

---

## 4. Scoperte che vincolano i piani

Verificate nel codice e nella configurazione, non ricordate.

1. **GitHub Pages ammette un solo dominio custom per repository.**
   `attestazione.trust.spaziogenesi.org` come host distinto da
   `trust.spaziogenesi.org` **non è ottenibile dal solo repo `gtf`**. Tre
   strade in P45: (a) un repo Pages sottile per tenant, alimentato dal build
   del monorepo via PAT — è il pattern già rodato da `deploy-staging.yml` di
   imgauthweb verso `attestazione-staging`; (b) spostare l'hosting su
   Cloudflare (un progetto Pages o un Worker per host); (c) rinunciare ai
   sottodomini e usare percorsi (`trust.spaziogenesi.org/attestazione/`).
   **Raccomandazione: (a)** — non tocca il proxy, non tocca la CSP di zona, usa
   una meccanica che in questo progetto ha già funzionato.

2. **`trust.spaziogenesi.org` è DNS-only, non proxato da Cloudflare.** Non
   riceve gli header di sicurezza di zona. Se P45 lo porta dietro il proxy, va
   aggiunto alla whitelist della Transform Rule `security-headers` **solo dopo**
   la bonifica dal JS inline e uno sweep verde di tutte le sue pagine: è
   esattamente la regola imparata dai sette microsi­ti rotti il 16/7 dalla
   regola zone-wide.

3. **`badge.svg` è consumato fuori da qui.** L'URL
   `https://trust.spaziogenesi.org/badge.svg` è incorporato nel footer di
   authweb e nei README di almeno cinque repo pubblici. Se la radice cambia
   contenuto, quell'URL **deve continuare a rispondere** (badge della radice,
   oppure redirect, oppure aggiornamento coordinato di tutti i consumatori
   nello stesso giro). Un badge rotto sui README è un danno di fiducia
   sproporzionato rispetto al lavoro che lo causa.

4. **Il whitepaper ha un'impronta attestata e un'evidenza che la ricontrolla.**
   `EVD-whitepaper-integrity` scarica
   `https://trust.spaziogenesi.org/whitepaper-v1.0.pdf`, ne ricalcola lo SHA-256
   e lo confronta con `898ec9…de452`; la pagina pubblica di verifica
   `/c/898ec9…` punta a quel file. Cambiare quell'URL senza aggiornare evidenza
   e pagina rompe una catena di prova pubblica. Vincolo per P45: **quell'URL non
   si sposta**, o si sposta con redirect e aggiornamento dell'evidenza nello
   stesso commit.

5. **RADART è a repo privati e proprietari.** Il collettore di oggi funziona
   perché legge solo endpoint e API pubbliche, senza segreti. Per RADART questo
   non basta: serve una **policy di visibilità per tenant** — quali evidenze
   sono pubblicabili, quali restano private e compaiono solo come impronta
   attestata. Il registro ha già il campo `visibility` sui record: è
   l'aggancio giusto, va portato dal record all'**evidenza raccolta**. È il
   contenuto principale di P46, e la ragione per cui P46 non è una copia di
   P44 con altri nomi.

6. **Le formule del punteggio sono tarate su attestazione.** `releaseTagRatio`
   itera tre repo per nome, `privacyRatio` scansiona `imgauth`, `governanceRatio`
   legge `ci.yml` di imgauth, `dogfoodingAnchorRatio` parte da `GTF_BIRTH_MONTH`.
   Tutte queste diventano **configurazione del tenant**, non costanti del motore
   — e il criterio di non-regressione di P44 è che il punteggio di attestazione
   resti **91/100 con 10/10 indicatori**, identico a oggi.

7. **Il collettore settimanale scrive nel repo e gira da solo.** Cron del lunedì
   06:00 UTC, `git add snapshots/ registry/evidence/` e push. Durante una
   migrazione di percorsi, un suo passaggio ricrea le cartelle vecchie. Va
   coordinato: migrazione e push nello stesso giro, e se il cron è passato in
   mezzo, riconciliare prima di proseguire.

8. **`gtf` è un repo pubblico.** Questa roadmap e i piani `Pnn_*.md`, una volta
   pushati, sono leggibili da chiunque — compresa la frase "prodotto
   Tangram.page ospitato da Spazio Genesi ETS come partner tecnologico". È
   coerente col principio di trasparenza del framework (PRN-03) e con la scelta
   già fatta per `DEVOPS.md`, ma **è una comunicazione di posizionamento**: la
   decisione di pubblicarla è del gestore, non mia. Finché non c'è push, i file
   restano locali.

---

## 5. Decisioni aperte

| # | Decisione | Opzioni | Raccomandazione | Quando serve |
|---|---|---|---|---|
| **D1** | Repo unico o repo separati | monorepo con confine duro · split immediato core/tenant | **Monorepo con confine duro adesso, split a P48** — l'isolamento di dati e codice si ottiene con directory + config + guardia CI, senza il costo di tre repo da tenere allineati prima di sapere se l'interfaccia è giusta | non blocca P44 |
| **D2** | Come ottenere i sottodomini | repo Pages sottili · Cloudflare · percorsi | **repo Pages sottili** (§4.1) | prima di P45 |
| **D3** | Nome del prodotto | "Genesis Trust Framework" resta · nome neutro Tangram, con GTF come istanza Spazio Genesi | **Rinviare il rebranding a dopo P47**, ma da P44 il core smette comunque di nominare Spazio Genesi. Rinominare tocca badge, whitepaper, ADR-GTF-001 e cinque README: è un lavoro a sé, non una nota a margine | prima di P48 |
| **D4** | Licenza | tutto MIT come oggi · core MIT + pacchetti tenant riservati | **core MIT** (è ciò che rende adottabile un framework di fiducia) **+ pacchetto tenant con la licenza del progetto** — RADART è già "tutti i diritti riservati" | prima di P46 |

---

## 6. Versione per componente

Stessa disciplina del resto dell'ecosistema (CLAUDE.md § Versioning): SemVer,
sorgente di verità unica nel manifesto del componente, nessuno step di build che
la genera, e **visibile dove conta**.

| Componente | Sorgente di verità | Dove appare |
|---|---|---|
| Motore | `core/package.json` › `version` | footer del Trust Center, `score.json` |
| Pacchetto tenant | `tenants/<id>/tenant.config.json` › `version` | footer del Trust Center di quel tenant |
| Sito prodotto (radice) | `content/site.config.json` › `version` | footer della radice |
| Architettura | intestazione di `docs/ARCHITECTURE.md` | il documento stesso |

Il footer che mostra "motore v0.2.0 · pacchetto attestazione v1.0.0" è lo stesso
schema mentale del footer di authweb ("interfaccia vX · motore vY"): chi guarda
sa **quale versione di che cosa** sta leggendo, senza aprire un repo.

---

## 7. I due changelog

Una sola fonte, due rese — perché due file scritti a mano divergono sempre (la
lezione di `beta.html`, e quella di `index2`).

- **Fonte:** `content/changelog.yaml` (e uno per tenant, se serve). Ogni voce ha
  data, componente, versione, titolo, corpo e `public: true|false`.
- **Resa pubblica:** pagina `changelog` sul sito Trust — solo le voci
  `public: true`, scritte per chi legge da fuori: novità, funzionalità, cambi
  che si vedono.
- **Resa interna:** `CHANGELOG.md` alla radice del repo — **tutte** le voci,
  incluse quelle tecniche, con il dettaglio dei passi. È il diario con cui io e
  te teniamo il filo tra una sessione e l'altra.

Il generatore che produce entrambe arriva in **P44 F4**. La fonte
`content/changelog.yaml` esiste già da oggi, seminata con le prime voci: da
questo momento ogni passo si annota lì, non nella cronologia di una chat che si
azzera.

---

## 8. Cosa resta fuori da tutta la roadmap

Detto adesso per non riscoprirlo dopo: **traduzione inglese** del Trust Center,
**feed `trust.json`** machine-readable, **pagine incidenti/glossario** (record
ancora vuoti), **migrazione degli snapshot su R2** (ADR-GTF-004 dice: nel repo
finché il volume regge). Nessuno di questi è bloccante per il multi-progetto, e
mescolarli ai piani li allungherebbe soltanto.
