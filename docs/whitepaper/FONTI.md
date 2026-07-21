# FONTI — whitepaper tecnico v1.0 (P38)

File di lavoro prodotto in FASE 0. Non è un artefatto pubblico finale: resta
nel repo (trasparenza) ma non è collegato dalla pagina pubblica. Elenca, per
ogni sezione del whitepaper (scaletta in `P38-DESIGN-whitepaper-tecnico.md`
§3), la fonte esatta usata in FASE 1 per le sezioni derivate da materiale
esistente. Le sezioni marcate **F2** restano stub: la fonte per quelle si
completa in fase di stesura + fact-check (Opus), non qui.

⚠️ Le fonti che vivono in `img-auth-hub` (CLAUDE.md, ARCHITECTURE.md) sono
**private**: nel whitepaper pubblico entra solo il fatto/concetto, mai un
dettaglio operativo, un nome di script o una procedura interna (gotcha §9.1
del design doc). Dove la stessa informazione esiste anche in una fonte
pubblica (registro GTF, README, pagine live), quella è preferita come
citazione nel testo finale.

## Verifica preliminare (F0)

- **`gtf/site/` → Pages**: confermato in `.github/workflows/publish.yml` —
  build via Actions (`npm run validate && npm run score && npm run
  build-site`), poi `actions/upload-pages-artifact` con `path: ./site` e
  `actions/deploy-pages`. Non è Pages "da branch": è generato ad ogni push
  che tocca `registry/**`, `generators/**`, `site/**`. `devops.html` (e
  `badge.svg`, `score.json`) sono file **statici committati** in `site/`,
  non prodotti da `build-site.mjs` — solo `index.html` è generato.
- **Link nel footer**: `generators/build-site.mjs` righe 377-407 (blocco
  `<footer><nav class="footer-cols">`), colonna "Il registro" (riga 380-384)
  contiene già `<a href="/devops.html">DevOps e rilasci</a>`. Il whitepaper
  seguirà lo stesso pattern (nuovo `<a href="/whitepaper.html">`) in FASE 4 —
  MAI solo nell'HTML generato, sempre nel generatore (gotcha §9.2 design doc,
  confermato per l'ennesima volta corretto qui: `devops.html` sopravvive alle
  rigenerazioni perché è nel template, non nel file statico).
- **Ricetta PDF**: confermata in memoria `pdf-architettura-generazione`
  (marked + Edge headless, `Start-Process` non call operator `&`, verificare
  sempre il PDF risultante con il tool Read prima di considerarlo buono —
  non solo la dimensione del file). Nessuno script committato: da rifare a
  mano in FASE 4.
- **Inventario §2 del design doc**: confermato, nessuna sorpresa strutturale.
  Aggiunta una fonte non elencata nel design doc originale: il registro GTF
  pubblico (`gtf/registry/controls/*.yaml`, `risks/*.yaml`,
  `decisions/*.yaml`) e la sua resa in `gtf/site/index.html` (sezione
  Compliance Map, id `#compliance`) sono la fonte **preferita** per §6, §7,
  §10, §12 rispetto a CLAUDE.md/ARCHITECTURE.md: già pubblica, già nel
  lessico giusto, già scritta per un pubblico esterno.

## Claim → fonte, per sezione

### §1 Abstract + Sommario
Non richiede fonte tecnica: sintesi delle sezioni sottostanti, scritta per
ultima nel testo (ma collocata per prima nel documento). Nessun claim nuovo.

### §2 Scopo e pubblico
Concettuale, non tecnico — deriva dall'obiettivo del design doc stesso
(§"Obiettivo"/"Pubblico del documento", `P38-DESIGN-whitepaper-tecnico.md`)
e dal principio "le garanzie si dichiarano insieme ai limiti", già applicato
in tutto il progetto (vedi memoria `trasparenza-punto-di-decisione`).

### §3 Il sistema in breve
- Flusso end-to-end (hash nel browser → timestamp+HMAC server → PDF firmato
  → ancoraggi): `CLAUDE.md` § "Flusso end-to-end" (privato, hub) — concetto
  già pubblico in forma equivalente su `attestazione.spaziogenesi.org`
  (pagina Attesta, Istruzioni) e in `gtf/site/index.html` (Compliance Map,
  `CTL-hash-client-side`).
- Sei canali (sito, bot Telegram, MCP stdio, MCP remoto, API/self-service,
  pagina pubblica `/c/<hash>`): `CLAUDE.md` tabella "Repository e percorsi
  locali" + voci P21/P23/P26/P29 (privato); pubblicamente verificabile da
  `attestazione.spaziogenesi.org/developer/` (matrice credenziale×client) e
  dai repo pubblici `attest-bot`, `attest-mcp`, `attest-mcp-remote`.
- Full privacy by design (hash calcolato dal client, il file non transita
  sul percorso sito): `CTL-hash-client-side` (registro GTF, pubblico) +
  `privacy.html` §2 (authweb, pubblico) — fonte primaria per il testo finale.

### §4 Modello di minaccia — **F2** (stub in F1)
Materiale grezzo (non ancora prosa): `CLAUDE.md` § "Sicurezza emissione
certificati" (l'audit P7 che trovò la falsificabilità originale, caso reale
da citare col metodo, non i dettagli); `ARCHITECTURE.md` §5 "Assunzioni di
sicurezza" (14 assunzioni, ciascuna già nel formato minaccia→mitigazione→
rischio residuo→decisione — struttura riusabile quasi 1:1 per la sezione,
ma va **filtrata**: molte assunzioni citano dettagli operativi privati da
tagliare, vedi gotcha §9.1); registro GTF `RSK-*.yaml` (pubblico, 19 rischi
già formalizzati — fonte preferita per il testo pubblicabile).

### §5 Fondamenti crittografici — **F2** (stub in F1)
Nessuna fonte interna esistente (marcato "DA SCRIVERE" nel design doc §2).
Il ragionamento "un'impronta inventata non è preimmagine di nulla" esiste
già in `ARCHITECTURE.md` Assunzione 6 (P16) e va riusato come argomento
centrale; il resto (collision vs second-preimage resistance, stato dell'arte
SHA-256, crypto-agility) è ricerca F2 da verificare sul web, non da fonti
interne.

### §6 Le tre àncore indipendenti
- HMAC server: `CLAUDE.md` § "Sicurezza emissione certificati"; pubblico in
  `CTL-hmac-signing` (registro GTF).
- Marca RFC 3161 (TSA in Adobe AATL) + PAdES B-LT/LTV: backlog P9
  (`CLAUDE.md`), sezione authart (`CLAUDE.md` § authart, campo
  `signer_key_usage`); pubblico in `CTL-pades-blt-tsa` + repo
  `autart-signer` (AGPL-3.0, ispezionabile).
- Bitcoin via OpenTimestamps: backlog P10 + P15 (ridondanza 4 calendar,
  misura `Promise.any`); pubblico in `CTL-ots-anchor` + `CTL-dogfooding-anchor`
  (quest'ultimo con hash e bundle reali verificabili da chiunque).
- Analisi di indipendenza + fail-open dichiarato (TSA/OTS giù non bloccano
  l'emissione): `CLAUDE.md` § imgauth endpoint `/api/cert-pdf` e § authart
  ("Fail-open: TSA od OCSP irraggiungibili → firma senza marca").

### §7 Catena di custodia
- Vincolato dalla firma (hash, timestamp, metadati canonici) vs solo
  descrittivo (nome file, dimensione, MIME — residuo noto): `CLAUDE.md` §
  "Sicurezza emissione certificati", paragrafo "Residuo noto (basso
  impatto)". Testo già scritto in tono adatto a un documento pubblico,
  riusabile quasi verbatim (concettualmente).
- Archiviazione R2 EU: `CLAUDE.md` § imgauth ("Archivio: bucket R2 …
  giurisdizione EU"); pubblico in `CTL-r2-eu-archive`.
- Backup offsite B2 + restore drill: P33 (`CLAUDE.md` backlog) — dettagli
  operativi (provider, bucket) sono **deliberatamente non pubblici**
  (`ADR-GTF-013`, citato anche nel verbale). Fonte pubblica da citare:
  `CTL-r2-offsite-backup` (registro) + verbale pubblico
  `gtf/docs/verbali/2026-07-restore-drill.md` (esito 3/3, metodo di
  verifica, correzione emersa durante la prova — ottimo esempio di onestà
  metodologica da citare nel whitepaper).
- Garanzie di recupero come minimo garantito: rimando a `/condizioni/`
  **senza numeri di prezzo** (regola §1.9 del design doc) — citare solo che
  esiste una tabella pubblica di garanzie di recupero per fascia.

### §8 Il tempo
- Timestamp solo server-side (anti-retrodatazione): `CLAUDE.md` §
  "Sicurezza emissione certificati" punto 1 e Assunzione 6
  (`ARCHITECTURE.md`, "Timestamp e HMAC restano server-side").
- Granularità delle àncore: orologio server (istantaneo), TSA RFC 3161
  (istantaneo, embedded nella firma), conferma Bitcoin/OTS (ore — "pending"
  poi confermata): `CLAUDE.md` § endpoint `/api/ots` ("La prova è 'pending'
  all'emissione: matura in poche ore con la conferma Bitcoin").
- "Prova di esistenza a una data": concetto già usato nel testo pubblico
  (Trust Center, ADR-P16) — proof-of-existence come termine tecnico standard
  (OpenTimestamps stesso lo usa).

### §9 Limiti dichiarati — **F2** (stub in F1, ma con argomenti già scritti)
- Identità self-signed: `ARCHITECTURE.md` Assunzione 4 + `CTL-eidas-honest-
  positioning` (pubblico, testo "Cosa NON è questo servizio" in
  `gtf/site/index.html` — da RIUSARE verbatim, è già stato validato e
  ripetuto in ogni revisione).
- Metadati auto-dichiarati: `CLAUDE.md` § P8 backlog + Assunzione 5.
- Impronta dal client (non i byte): Assunzione 6 (argomento completo già
  scritto, citato sopra in §5/§7).
- HMAC a chiave singola: `CLAUDE.md` § imgauth "HMAC_SECRET non si ruota
  MAI" + memoria `escrow-segreti` (privata: nel whitepaper entra solo il
  concetto "chiave singola, mitigata da escrow e sonda interna", non i
  dettagli dell'escrow). Transparency log: nessun impegno, solo menzione
  come voce in valutazione (coerente con VALUTAZIONE-analisi-esterna, fuori
  perimetro adottato).
- Risoluzione 30 min dello storico di stato: P36 (`CLAUDE.md`), pubblico in
  `CTL-availability-monitoring` (testo aggiornato con la tacca proporzionale).

### §10 Standard e riferimenti (parte non-eIDAS, F1; parte eIDAS F2)
- RFC 3161, ETSI PAdES: già citati sopra (§6).
- OpenTimestamps: sito ufficiale (pubblico, non serve fonte interna).
- RFC 9116 (security.txt): P37 (`CLAUDE.md`), pubblico in
  `CTL-responsible-disclosure` + `attestazione.spaziogenesi.org/sicurezza/`.
- GDPR (zero dati nel percorso anonimo): `privacy.html` (pubblico) +
  `CTL-privacy-policy-public`/`CTL-hash-client-side`/`CTL-matomo-cookieless`.
- W3C Verifiable Credentials: nessuna fonte interna — menzione da
  watch-list, testo da scrivere in F2 con attenzione a non promettere
  adozione (stessa cautela di C2PA).
- eIDAS (posizionamento): **F2**, ma il testo sorgente esiste già e va
  riusato verbatim — vedi §9 sopra (`CTL-eidas-honest-positioning`).

### §11 Posizionamento C2PA — **F2** (stub in F1)
Nessuna fonte interna (marcato "DA SCRIVERE", traccia solo in
`VALUTAZIONE-analisi-esterna-roadmap-2026-07-21.md` §2.2/§4.4 — quel
documento vive in `img-auth-hub`, privato, ma la sua conclusione
("nessuna adozione C2PA, complementare non concorrente") è già una
decisione di progetto riportabile). Il resto è ricerca F2 su fonti
pubbliche correnti (spec C2PA, adozione).

### §12 Trasparenza operativa
- Registro committato + Open Trust Score riproducibile offline:
  `gtf/ARCHITECTURE.md` §8 "Open Trust Score" (pubblico, repo gtf stesso) —
  fonte diretta, nessuna mediazione necessaria.
- Evidenze raccolte automaticamente: `gtf/ARCHITECTURE.md` §8.2 riga
  Automazione + `generators/collect-evidence.mjs` (pubblico, ispezionabile).
- Review esterna indipendente: `ADR-GTF-010` (Radixia, pubblico) +
  `gtf/docs/piano-review-esterna-2026.md`.
- Responsible disclosure: P37, `CTL-responsible-disclosure` (pubblico).
- Pagina di stato, onestà bidirezionale: P36, `CTL-availability-monitoring`
  (pubblico, testo aggiornato).
- Score attuale al momento della stesura: `gtf/site/score.json`
  (`overall: 91`, 10/10 indicatori disponibili) — **da rileggere al momento
  del render finale in F4/F5**, il numero cambia nel tempo; il whitepaper
  deve descrivere il MECCANISMO (riproducibile, non gonfiabile), non
  congelare un numero che invecchia in un PDF immutabile. Decisione da
  confermare in F2/F3: citare lo score con "consultabile in tempo reale su
  trust.spaziogenesi.org", non un valore fisso.

### §13 Storia delle revisioni · Licenza · Come verificare
- Licenza CC BY 4.0, autore "Spazio Genesi ETS", versione: decisioni §1.3/
  §1.4 del design doc — nessuna fonte esterna necessaria.
- Hash del PDF + link `/c/<hash>`: placeholder in F1, valorizzati in F4/F5
  (il PDF non esiste ancora). Pattern identico al bundle dogfooding mensile
  GTF (`ADR-GTF-008`) — stessa "chiusura circolare" concettuale.

## Nota per F2 (fact-check)

Ogni claim sopra elencato va riverificato contro la fonte al momento della
stesura definitiva (le fonti private specialmente evolvono tra sessioni).
I due claim che richiedono verifica **esterna** (non nel registro/CLAUDE.md)
sono isolati sopra: stato dell'arte SHA-256 (§5) e spec/adozione C2PA
(§11) — citare versione/data della fonte pubblica consultata, come
richiesto dal gotcha §9.6 del design doc.
