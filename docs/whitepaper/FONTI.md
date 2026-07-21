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

**Aggiunta in FASE 3 (2026-07-21, su richiesta del gestore)**: un
paragrafo su Spazio Genesi come ente del terzo settore (ETS) senza scopo
di lucro, e su perché questo è coerente con (non sostitutivo di) le
garanzie tecniche del documento. Fonte: natura ETS pubblica (stampata su
ogni certificato emesso, dichiarata su tutte le pagine pubbliche);
nessun dettaglio privato (RUNTS, indirizzi) riportato. Da includere nella
revisione del gestore insieme al resto del testo.

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

---

# ESITO DELLA FASE 2 (2026-07-21)

FASE 2 completata: scritte le quattro sezioni nuove (§4 modello di
minaccia, §5 fondamenti crittografici, §8 limiti dichiarati, §10
posizionamento C2PA) più il posizionamento eIDAS (§9.1), ed eseguito il
fact-check dell'intero documento, comprese le sezioni derivate in F1.

## A. Fonti esterne consultate e verificate in F2

Tutte consultate il **21 luglio 2026**. Il gotcha §9.6 del design doc
chiede di citare versione/data: fatto, sia qui sia nei commenti del
sorgente.

**Crittografia (§5)**
- NIST, FIPS 180-4 *Secure Hash Standard* — standard di SHA-256.
- NIST SP 800-131A — SHA-256 raccomandata come minimo per
  l'interoperabilità; SHA-2 e SHA-3 ammesse.
- NIST, *NIST Retires SHA-1 Cryptographic Algorithm* (dicembre 2022) —
  SHA-1 già vietata per la generazione di firme digitali, deprecata fino
  al 31/12/2030, non ammessa oltre.
- *The First Practical Collision for 31-Step SHA-256*, ASIACRYPT 2024 —
  collisione pratica su 31 dei 64 passi, ~1,2 ore su 64 thread.
- *Collision Attacks on SHA-256 up to 37 Steps with Improved Trail
  Search*, EUROCRYPT 2026 — IACR ePrint **2026/232**, 13 febbraio 2026,
  Zhang / Li / Gao / Wang. ⚠️ Verificata solo la **pagina ePrint** (titolo,
  autori, data, "first 37-step collision attack"): il PDF completo non è
  stato letto, quindi il whitepaper **non afferma nulla** su complessità
  o tipo di collisione — solo il numero di passi, che è nel titolo.
- Kelsey–Schneier, *Second Preimages on n-Bit Hash Functions for Much Less
  than 2^n Work* (2005) — costo k·2^(n/2+1) + 2^(n−k). Il valore 2^222 per
  un messaggio da 2^34 blocchi è **aritmetica derivata** dalla formula,
  non una citazione.
- Grover / post-quantistico: consenso pubblico corrente (SHA-256 → ~2^128
  effettivi; i percorsi di transizione PQC riguardano la chiave pubblica,
  non impongono la sostituzione delle hash SHA-2).

**C2PA (§10)**
- Specifica tecnica C2PA **2.4, aprile 2026** — versione e data verificate
  direttamente sulla specifica pubblicata (spec.c2pa.org). Per contesto:
  2.3 del 05/01/2026, 2.2 del 01/05/2025 — cadenza rapida, motivo per cui
  il testo scrive sempre "alla data di questo documento".
- Governance: Joint Development Foundation, affiliata Linux Foundation;
  specifica aperta royalty-free. ⚠️ **Non** è stato possibile confermare
  che C2PA sia uno standard ISO o di altro ente formale: il whitepaper
  quindi **non lo afferma**.
- *C2PA Soft Binding API* + elenco pubblico degli algoritmi di soft
  binding approvati — filigrane invisibili e impronte percettive per
  recuperare un manifest rimosso, tramite un'API di risoluzione remota.
- Sezione della specifica su dati incorporati vs conservati all'esterno —
  fonte del punto sulla rimovibilità del manifest.
- EU AI Act: obblighi di trasparenza sui contenuti sintetici applicabili
  dal **2 agosto 2026** (fonti concordanti). ⚠️ Esiste una proroga in
  discussione al 02/12/2026 per i sistemi già sul mercato: **non citata**
  nel testo perché in evoluzione e destinata a invecchiare in un PDF
  immutabile.

**eIDAS (§9.1)**
- Regolamento (UE) n. 910/2014, come modificato dal Regolamento (UE)
  2024/1183 ("eIDAS 2", in vigore dal 20/05/2024).
- Articoli 25 (firma elettronica), 41 (marca temporale — non
  discriminazione al §1, presunzione riservata alle sole marche
  qualificate al §2), 46 (documento elettronico).
- ⚠️⚠️ **Limite di verifica da segnalare al gestore**: EUR-Lex non è
  risultata leggibile dagli strumenti automatici (pagina vuota in due
  tentativi, sia sul testo originale sia sul consolidato al 18/10/2024).
  I numeri di articolo e la sostanza sono stati verificati su **fonti
  secondarie concordanti**, non sul testo letterale. Per questo il
  whitepaper **parafrasa e non virgoletta mai** il Regolamento. Si
  raccomanda una verifica umana dei tre riferimenti prima della
  pubblicazione. Nessuna affermazione dipende dal numero esatto: se un
  riferimento risultasse errato si corregge il numero, non la sostanza.

## B. Errori trovati nel fact-check delle sezioni derivate in F1

Cinque, tutti corretti nel sorgente con un commento `⚠️ CORREZIONE F2`
adiacente. Sono elencati qui perché la loro tipologia è istruttiva: sono
tutti **overclaim per generalizzazione**, cioè affermazioni vere in un
caso presentate come vere in tutti.

1. **§2.2** — «il canale web è l'unico in cui il file non transita mai da
   alcun server». **Falso**: `ARCHITECTURE.md` Assunzione 11 (P26)
   stabilisce che il canale MCP remoto ha "un livello di privacy pari al
   sito", e lo stdio calcola l'impronta in locale. L'unico canale con
   transito reale è quello di messaggistica (Assunzione 10). Corretto, e
   propagato ad abstract, sommario e §4.1.
2. **§3.4** — «nessuna delle tre [àncore] dipende da un singolo fornitore
   commerciale che il servizio controlli direttamente». Ambiguo e in
   tensione con §8.5: l'HMAC è generato **esattamente** dal servizio.
   Riscritto per dire la cosa vera e più forte — due delle tre àncore sono
   fuori dal nostro controllo, ed è quello il punto.
3. **§7.1** — «è il singolo meccanismo che rende impossibile retrodatare
   un'attestazione», senza qualificare rispetto a chi. In contraddizione
   diretta con §8.5 (chi detiene la chiave **può** firmare qualunque
   istante). Qualificato: impossibile *a chi richiede l'attestazione*.
4. **§11** — «il registro **è** soggetto a una revisione esterna annuale
   da parte di Radixia srl». **Overclaim**: verificato su
   `PRC-review-esterna-annuale`, che ha `produces_evidence: []` e nessun
   `last_run` — il revisore è designato e il piano pubblicato, ma la prima
   revisione **non è ancora avvenuta**. Riformulato al futuro, con lo
   stato attuale dichiarato. È esattamente la classe di affermazione che
   `RSK-overclaim-eidas` invita a sorvegliare.
5. **§11** — «lo storico è append-only nel repository». Un repository git
   non è append-only in senso tecnico. Riformulato in ciò che è vero e
   comunque sufficiente (ogni rilevazione è committata e conservata; una
   rimozione sarebbe a sua volta visibile).

Minori, corretti senza commento dedicato: un rimando `(§4)` che puntava
alla sezione sbagliata dopo la numerazione definitiva (era §3); un accordo
grammaticale in §6.1; la frase oscura di §11 sui «giorni che superano la
soglia di disponibilità», che non corrispondeva al comportamento reale
(ciò che si mostra anche nei giorni senza disservizio sono i
rallentamenti sotto soglia).

## C. Verifiche di conformità eseguite sul testo finale

- **Gotcha §9.1 (fonti private → documento pubblico)**: sweep sul testo
  ripulito dai commenti per nomi di fornitori, componenti, script,
  segreti, endpoint e prodotti interni. **Unico riscontro**: "Adobe AATL",
  che è il nome di un programma pubblico e compare già nel testo pubblico
  di `CTL-eidas-honest-positioning`. Nessun altro dettaglio operativo è
  entrato nel documento.
- **Lessico onesto**: nessuna occorrenza di "carica/caricare" riferita al
  file dell'utente. Le due occorrenze presenti sono legittime — "il
  caricamento su una piattaforma" (di terzi, §10.3) e "scaricare questo
  PDF" (download reale, §12).
- **Overclaim**: nessuna occorrenza di "firma qualificata", "sigillo
  qualificato" riferito a noi, "valore legale", "conforme a eIDAS",
  "certificazione ISO", né di superlativi di marketing.
- **Numeri commerciali** (regola §1.9 del design doc): nessun prezzo,
  fascia o promozione nel testo; §6.3 rimanda alla pagina pubblica delle
  condizioni. Nessun nome di QTSP e nessuna cifra di costo del sigillo,
  benché presenti nelle fonti private.
- **Punteggio di maturità**: verificato su `generators/score.mjs` (media
  degli indicatori disponibili) e `site/score.json` (10 indicatori, le cui
  etichette corrispondono a quelle elencate nel testo). Il **valore
  corrente non è citato**, per non congelare in un PDF immutabile un
  numero che cambia.
- **Lunghezza**: ~7.600 parole al netto dei commenti, entro il target di
  15-25 pagine (§1.8 del design doc).

## D. Deviazioni consapevoli dalla scaletta del design doc

Da sottoporre al gestore in FASE 3.

1. ✅ **CHIUSO (2026-07-21) — §5.2 — resistenza alle collisioni.** Il
   design doc §3.5 chiedeva di argomentare «perché per la
   proof-of-existence conta la seconda [preimmagine], non la prima
   [collisione]». Il fact-check ha rilevato che l'affermazione è
   **imprecisa**: la resistenza alle collisioni serve eccome, ma protegge
   un soggetto diverso — i terzi contro chi attesta, non chi attesta
   contro i terzi. È anche la proprietà che storicamente è caduta per MD5
   e SHA-1, quindi ometterla sarebbe la scelta peggiore. §5.2 riporta la
   versione corretta. **Decisione del gestore: tenere il livello di
   dettaglio attuale — nessuna modifica al testo.**
2. **§4.4 — l'audit iniziale.** La scaletta diceva che il difetto fu
   corretto «prima di qualunque uso pubblico del servizio». Non
   verificabile dalle fonti (P0, P1 e P7 sono tutti del 10/06/2026 e
   risultano già emessi certificati precedenti alla 1.8.0). Sostituito con
   «nello stesso ciclo di sviluppo in cui fu segnalato», che le fonti
   sostengono.
3. **§7.2 — precisione contro indipendenza.** Aggiunto un paragrafo non
   previsto: la sezione si intitolava "Granularità e affidabilità" ma
   trattava solo la granularità. Il paragrafo ordina le tre àncore per
   indipendenza crescente e precisione decrescente.
4. ✅ **CHIUSO (2026-07-21) — §8.8 — «il diritto d'autore sorge con la
   creazione».** Unica affermazione di natura giuridica introdotta in F2
   (principio generale; Convenzione di Berna, in Italia L. 633/1941 art.
   6). **Decisione del gestore: tenerla — nessuna modifica al testo.**
5. ✅ **CHIUSO (2026-07-21) — §10.5 ragione 1 — indipendenza dal
   formato.** È una lettura del perimetro del prodotto, non un fatto
   tecnico. **Decisione del gestore: confermata — nessuna modifica al
   testo.**
6. **§10 — nessun nome commerciale di adopter C2PA.** Verificati (editor,
   fotocamere di più produttori, generatori IA, piattaforme) ma **non
   citati per nome**: un elenco datato invecchia male in un PDF
   immutabile.

## E. Che cosa resta aperto per FASE 3 e successive

- ✅ **CHIUSO (2026-07-21)** — Titolo confermato dal gestore senza
  modifiche: "Attestazione di esistenza per opere digitali: architettura,
  garanzie e limiti".
- ✅ **CHIUSO (2026-07-21)** — Verifica umana dei tre riferimenti eIDAS su
  EUR-Lex (punto A sopra): il gestore ha letto il testo consolidato del
  Regolamento (UE) 910/2014 e confermato numeri e sostanza degli articoli
  25/41/46. Applicata in §9.1 una precisazione sulla presunzione dell'art.
  41 (evitare di presentare la versione non qualificata come "sempre
  rimessa al giudice caso per caso"; il punto esatto è l'assenza di quella
  specifica presunzione di legge). Nessuna verifica ulteriore necessaria.
- ⛔ **Approvazione esplicita del testo nel suo complesso** (tono,
  posizionamento eIDAS, sezione limiti, licenza CC BY 4.0): tutti e sei i
  punti puntuali sono stati chiusi in revisione punto per punto; resta da
  raccogliere l'ok finale complessivo del gestore sul bundle intero prima
  di passare a FASE 4 (render + push).
- Data di pubblicazione e conferma del numero di versione (§12 del
  sorgente, ancora segnaposto).
- Impronta del PDF e link `/c/<hash>`: segnaposto in §12, valorizzati in
  FASE 5 dopo l'attestazione dogfooding.
- Rimozione dei commenti `<!-- FONTE -->` prima del render (FASE 4.1) —
  questo file `FONTI.md` **resta** nel repository: è trasparenza anch'esso.
