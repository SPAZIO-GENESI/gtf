<!--
STATO: bozza FASE 1 (scheletro + sezioni derivate). Le sezioni marcate
[F2 — DA SCRIVERE] restano stub con scaletta interna: prosa tecnica nuova e
fact-check sono compito della fase successiva (Opus), non di questa.
I commenti <!-- FONTE: ... --> tracciano la provenienza di ogni claim
(regola §5 del design doc) e vanno RIMOSSI prima del render in FASE 4.
Non rendere questo file in PDF così com'è.
-->

# Attestazione di esistenza per opere digitali: architettura, garanzie e limiti

**Whitepaper tecnico, v1.0**
Spazio Genesi ETS
<!-- FONTE: decisione P38-DESIGN-whitepaper-tecnico.md §1.2/§1.3 -->

*Bozza — data e numero di versione da confermare alla pubblicazione (FASE 4).*

---

## Abstract

This document describes, in technical terms, what a digital-existence
attestation system built on public infrastructure can and cannot guarantee.
The system computes a SHA-256 fingerprint of a digital work — entirely on
the client, so the file itself never leaves the user's device — and binds
it to a server-generated timestamp with an HMAC token. Three independent
time anchors corroborate the resulting certificate: the HMAC itself, an
RFC 3161 timestamp from a Certificate Authority trusted in Adobe's AATL
program (embedded in a PAdES B-LT/LTV signature), and a Bitcoin
timestamp via OpenTimestamps. None of these mechanisms proves authorship;
together they prove that a specific fingerprint existed at a specific
instant in time, and that the resulting certificate has not been altered
since.

The document is deliberately as precise about what the system does **not**
guarantee as about what it does: the signing identity is self-signed (not
a qualified eIDAS trust service), declared metadata (title, author, year)
are self-declarations, and the HMAC signing key is a single point of trust
mitigated — not eliminated — by escrow and continuous self-testing. A
public, machine-readable governance registry (the Genesis Trust Framework)
makes every claim in this document independently checkable, including the
integrity of this PDF itself, which is attested on the very service it
describes.
<!-- FONTE: sintesi delle sezioni 3-9, 12; nessun claim nuovo non altrove tracciato -->

## Sommario

Questo documento descrive, in termini tecnici, cosa un sistema di
attestazione di esistenza per opere digitali costruito su infrastruttura
pubblica può e non può garantire. Il sistema calcola l'impronta SHA-256 di
un'opera digitale interamente **nel browser dell'utente** — il file non
lascia mai il dispositivo — e la vincola a un timestamp generato dal
server tramite un token HMAC. Tre àncore temporali indipendenti
corroborano il certificato risultante: l'HMAC stesso, una marca temporale
RFC 3161 da un'autorità di certificazione riconosciuta nel programma
Adobe AATL (incorporata in una firma PAdES B-LT/LTV), e un'ancora Bitcoin
via OpenTimestamps. Nessuno di questi meccanismi prova la paternità
dell'opera; insieme provano che una determinata impronta esisteva a un
determinato istante, e che il certificato risultante non è stato alterato
da allora.

Il documento è deliberatamente preciso tanto su ciò che il sistema **non**
garantisce quanto su ciò che garantisce: l'identità del firmatario è
self-signed (non un servizio fiduciario qualificato eIDAS), i metadati
dichiarati (titolo, autore, anno) sono auto-dichiarazioni, e la chiave di
firma HMAC è un punto di fiducia singolo — mitigato, non eliminato, da
un meccanismo di recupero e da un'auto-verifica continua. Un registro di
governance pubblico e leggibile da macchina (il Genesis Trust Framework)
rende ogni affermazione di questo documento verificabile in modo
indipendente, inclusa l'integrità di questo stesso PDF, attestato sul
servizio che descrive.
<!-- FONTE: traduzione italiana dell'abstract, stessa provenienza -->

---

## 1. Scopo e pubblico

Questo documento non è materiale promozionale. È un documento tecnico
pubblico rivolto a chi deve valutare con rigore che cosa il sistema di
attestazione garantisce — e, in modo altrettanto esplicito, che cosa non
garantisce. Si rivolge a prestatori di servizi fiduciari (nel seguito del
processo di valutazione per un eventuale sigillo elettronico qualificato),
al Consiglio Direttivo e all'assemblea dei soci dell'ente, ad accademie e
partner convenzionati che devono spiegare il servizio ai propri iscritti,
a revisori esterni indipendenti, e a ricercatori e sviluppatori che
vogliono integrare o verificare il sistema in autonomia.
<!-- FONTE: P38-DESIGN-whitepaper-tecnico.md §"Pubblico del documento" -->

Il principio guida di questo documento — e, più in generale, di tutta la
comunicazione pubblica del progetto — è che **le garanzie si dichiarano
insieme ai limiti**. Non esiste una sezione "vantaggi" senza una sezione
"limiti" di pari dignità: il valore probatorio di un'attestazione dipende
tanto da ciò che copre quanto dalla trasparenza su ciò che non copre.
<!-- FONTE: principio applicato in tutto il progetto, vedi memoria
     `trasparenza-punto-di-decisione`; qui riportato solo come principio,
     non come catalogo di casi interni -->

## 2. Il sistema in breve

Il sistema produce **attestazioni di esistenza** ("proof of existence")
per opere digitali di qualsiasi formato: un certificato PDF firmato che
dichiara "questa impronta crittografica esisteva a questo istante", con
tre meccanismi indipendenti a corroborare la data.

### 2.1 Flusso end-to-end

1. L'utente seleziona l'opera; il **browser** ne calcola l'impronta
   SHA-256 con l'API WebCrypto nativa. Il file non viene mai inviato al
   server, per nessuna operazione — né attestazione né verifica.
2. Il server riceve la sola impronta (più eventuali metadati facoltativi
   dichiarati dall'utente — titolo, autore, anno, note), genera un
   timestamp lato server e un token HMAC che vincola impronta e timestamp
   insieme.
3. Su richiesta esplicita dell'utente, il server genera un certificato
   PDF con l'impronta, il timestamp, un QR di verifica, ed effettua tre
   operazioni di ancoraggio (§4): l'apposizione della firma HMAC (già
   fatto), l'invio a una terza parte per la marca temporale RFC 3161, e
   la sottomissione a più calendari OpenTimestamps per l'ancoraggio
   Bitcoin.
4. Il certificato firmato viene archiviato e restituito all'utente.
5. La verifica successiva può avvenire in due modi indipendenti: un
   ricalcolo dell'impronta in locale (mai un invio del file al server),
   oppure il solo controllo della validità della firma HMAC — utile per
   chi possiede il certificato ma non l'opera stessa in quel momento.
<!-- FONTE: CLAUDE.md § "Flusso end-to-end" (privato); concetto equivalente
     pubblico in CTL-hash-client-side (registro GTF) e nella pagina
     Attesta/Verifica di attestazione.spaziogenesi.org -->

### 2.2 Sei canali, una sola garanzia crittografica

Il sistema è raggiungibile da sei canali distinti — un'interfaccia web,
un bot di messaggistica, due server per agenti software (uno locale, uno
remoto), un'interfaccia programmatica per sviluppatori, e una pagina
pubblica permanente per ogni opera attestata. I meccanismi crittografici
che garantiscono l'integrità di un certificato (HMAC, timestamp
server-side, rate limiting) sono **identici su tutti i canali**: nessun
canale ha un percorso di emissione "più debole" degli altri. Ciò che
cambia da canale a canale è esclusivamente **dove transita il file** da
attestare — non l'integrità del risultato. Il canale web è l'unico in cui
il file non transita mai da alcun server, nemmeno in streaming; gli altri
canali dichiarano esplicitamente, prima dell'uso, il proprio modello di
transito.
<!-- FONTE: CLAUDE.md tabella repository + voci backlog P21/P23/P26/P29
     (privato); pubblico in attestazione.spaziogenesi.org/developer/
     (matrice credenziale×client) e nei repo pubblici attest-bot,
     attest-mcp, attest-mcp-remote -->

### 2.3 Full privacy by design

La scelta architetturale più rilevante del canale primario (l'interfaccia
web) è che l'impronta si calcola interamente lato client: il server non
riceve, non elabora e non può conservare i byte dell'opera. Questo non è
un compromesso sulla capacità probatoria del certificato: un'impronta
crittografica a 256 bit non è invertibile, quindi il certificato attesta
propriamente "questa impronta esisteva a questo istante" indipendentemente
da dove l'impronta sia stata calcolata — la garanzia anti-retrodatazione
resta intatta perché timestamp e firma restano generati esclusivamente
dal server. È lo stesso modello di fiducia adottato da OpenTimestamps
stesso, i cui calendari pubblici vedono solo digest, mai i file originali.
<!-- FONTE: ARCHITECTURE.md Assunzione 6 (P16, privato); pubblico in
     CTL-hash-client-side + privacy.html §2 (authweb) -->

## 3. Le tre àncore temporali indipendenti

Un singolo certificato attestato porta tre prove indipendenti della sua
data, ciascuna verificabile senza dover fidarsi delle altre due né del
servizio che le ha raccolte.

### 3.1 HMAC — l'integrità immediata

Al momento dell'emissione, il server calcola un token HMAC-SHA256 che
vincola insieme l'impronta dell'opera, il timestamp generato dal server
(mai dal client) e — quando presenti — i metadati dichiarati dall'utente,
normalizzati in una forma canonica stabile. Nessuna di queste componenti
può essere alterata dopo l'emissione senza invalidare la firma: un
tentativo di modificare l'impronta dichiarata, il timestamp o i metadati
di un certificato già emesso produce un token che non supera più la
verifica.
<!-- FONTE: CLAUDE.md § "Sicurezza emissione certificati" (privato);
     pubblico in CTL-hmac-signing (registro GTF) -->

I campi puramente descrittivi — nome del file, dimensione dichiarata,
tipo MIME — restano **fuori** dal perimetro vincolato dalla firma: sono
metadati di comodo per la leggibilità del certificato, non parte della
prova. Questo è un residuo di design dichiarato, non una lacuna scoperta
successivamente: l'impronta crittografica, il timestamp e i metadati
dichiarati dall'autore sono l'unico contenuto che il certificato prova
davvero.
<!-- FONTE: CLAUDE.md § "Sicurezza emissione certificati", paragrafo
     "Residuo noto (basso impatto)" -->

### 3.2 Marca temporale RFC 3161 — la terza parte fidata

Il certificato PDF è firmato in formato PAdES B-LT con una marca
temporale RFC 3161 ottenuta da un'autorità di certificazione presente
nel programma Adobe Approved Trust List (AATL), con validazione a lungo
termine (LTV: la catena del certificato e le risposte OCSP sono
incorporate nel documento). La conseguenza pratica è che un lettore PDF
conforme (Adobe Acrobat in primis) mostra la data del certificato come
attestata da una terza parte indipendente e riconosciuta — senza dover
fidarsi della sola dichiarazione del servizio. Il meccanismo di firma è
fail-open per design: se la terza parte (TSA) o il servizio di verifica
dello stato del certificato (OCSP) non sono raggiungibili al momento
dell'emissione, il certificato viene comunque prodotto, privo della sola
marca temporale — l'emissione non si blocca per un disservizio esterno.
<!-- FONTE: CLAUDE.md § authart (privato, backlog P9); pubblico in
     CTL-pades-blt-tsa + repo pubblico autart-signer (AGPL-3.0) -->

### 3.3 Ancoraggio Bitcoin — la prova decentralizzata

Ogni certificato viene inoltre ancorato alla blockchain Bitcoin tramite
il protocollo OpenTimestamps: l'impronta dell'opera (concatenata con un
nonce) viene sottomessa in parallelo a più calendari pubblici e gratuiti,
ciascuno dei quali costruisce indipendentemente una prova crittografica
che, una volta confermata, lega quella impronta a un blocco Bitcoin
specifico — quindi a un intervallo di tempo verificabile da chiunque,
senza fidarsi né del servizio né dei calendari stessi. La prova è
"pendente" al momento dell'emissione e matura entro poche ore, quando la
transazione Bitcoin sottostante riceve conferma. La ridondanza su più
calendari indipendenti significa che la prova resta valida anche se uno o
più calendari smettono di funzionare: ne basta uno a rispondere.
<!-- FONTE: CLAUDE.md backlog P10/P15 (privato); pubblico in
     CTL-ots-anchor + CTL-dogfooding-anchor (quest'ultimo con hash e
     bundle reali verificabili indipendentemente da chiunque) -->

### 3.4 Indipendenza e degradazione controllata

Le tre àncore non dipendono l'una dall'altra: la caduta di una non
invalida le altre due, e nessuna delle tre dipende da un singolo fornitore
commerciale che il servizio controlli direttamente. Se la terza parte per
la marca temporale o i calendari OpenTimestamps sono temporaneamente
irraggiungibili, il sistema **non blocca l'emissione**: preferisce
produrre un certificato con una garanzia in meno piuttosto che nessun
certificato — una scelta di design esplicita, non un compromesso
accidentale. L'HMAC resta in ogni caso la garanzia minima, sempre
presente, perché è l'unica delle tre generata internamente e verificabile
istantaneamente.
<!-- FONTE: CLAUDE.md § endpoint /api/cert-pdf e § authart
     ("Fail-open: TSA od OCSP irraggiungibili → firma senza marca"),
     entrambi privati; il concetto di indipendenza è descritto anche
     nella sezione "Il sistema in breve" del design doc P38 -->

## 4. Modello di minaccia

*[F2 — DA SCRIVERE. Scaletta vincolante (design doc §3.4):]*

- *Asset da proteggere*: l'integrità del legame impronta↔timestamp; la
  disponibilità del servizio di verifica; la riservatezza (assenza) dei
  byte dell'opera sul canale primario.
- *Attori*: utente onesto; falsificatore che tenta di produrre un
  certificato con dati falsi o retrodatati; utente malintenzionato in
  possesso di un token/credenziale legittima; server compromesso;
  archivio manomesso; terze parti (TSA, calendari OTS) irraggiungibili o
  compromesse.
- *Per ciascuna minaccia*: mitigazione tecnica esistente, oppure
  accettazione esplicita del rischio residuo (mai un'omissione silenziosa).
- *Caso reale da citare come dimostrazione del metodo*: l'audit di
  sicurezza che nella prima versione del sistema trovò `/api/cert-pdf`
  privo di autenticazione e in grado di firmare hash falsi e date
  retrodatate — corretto nello stesso ciclo di sviluppo, prima di
  qualunque uso pubblico del servizio. Il caso dimostra che il modello di
  minaccia non è un esercizio teorico ma un processo che ha già trovato e
  corretto un problema reale.
<!-- FONTE per la scaletta: P38-DESIGN-whitepaper-tecnico.md §3.4;
     materiale grezzo da cui F2 svilupperà la prosa: CLAUDE.md §
     "Sicurezza emissione certificati" (il caso P7), ARCHITECTURE.md §5
     "Assunzioni di sicurezza" (14 assunzioni nel formato minaccia→
     mitigazione→rischio residuo→decisione, da filtrare dei dettagli
     operativi privati), registro GTF RSK-*.yaml (19 rischi pubblici,
     fonte preferita per il testo pubblicabile) -->

## 5. Fondamenti crittografici

*[F2 — DA SCRIVERE. Scaletta vincolante (design doc §3.5):]*

- SHA-256: proprietà rilevanti per questo caso d'uso.
- Distinzione tra *collision resistance* e *second-preimage resistance*, e
  perché per una prova di esistenza conta la seconda, non la prima.
- Stato dell'arte: nessuna collisione nota contro SHA-256; il precedente
  di SHA-1 (deprecato dopo attacchi pratici di collisione) come lezione
  storica, non come previsione.
- Crypto-agility: cosa accadrebbe se SHA-256 si indebolisse in futuro — le
  àncore temporali già emesse restano prove d'epoca valide per il periodo
  in cui furono create; un'eventuale transizione futura richiederebbe
  ri-attestazione con l'algoritmo successivo, non invalida retroattivamente
  ciò che è già stato provato.
<!-- FONTE per la scaletta: P38-DESIGN-whitepaper-tecnico.md §3.5. Nessuna
     fonte interna esistente (il design doc §2 marca questa sezione
     "DA SCRIVERE"); l'argomento "un'impronta inventata non è preimmagine
     di nulla" (ARCHITECTURE.md Assunzione 6) è riusabile come premessa
     ma non sostituisce il fact-check su fonti pubbliche correnti
     richiesto dal gotcha §9.6 del design doc -->

## 6. Catena di custodia

Ciò che il token HMAC vincola — impronta, timestamp, metadati dichiarati
in forma canonica — è distinto da ciò che resta puramente descrittivo
(nome file, dimensione, tipo MIME): questa distinzione, già introdotta al
§3.1, è la base su cui si fonda ogni garanzia di integrità successiva
all'emissione.
<!-- FONTE: ripresa da §3.1, stessa fonte -->

### 6.1 Archiviazione

I certificati emessi vengono archiviati in un bucket con residenza dati
nell'Unione Europea, recuperabile solo da chi conosce l'impronta
dell'opera (nessuna enumerazione possibile: la chiave di recupero è
l'impronta stessa, a 256 bit).
<!-- FONTE: CLAUDE.md § imgauth ("Archivio: bucket R2 … giurisdizione
     EU"), privato; pubblico in CTL-r2-eu-archive -->

### 6.2 Backup offsite e prova di ripristino

L'archivio primario è replicato su un backup geograficamente separato, con
verifica periodica di completezza. Il valore di un backup non dichiarato
è nullo finché non viene provato: una prova di ripristino reale ha
prelevato tre campioni rappresentativi (un'opera recente, un'opera del
primo periodo di attività del servizio, un'opera con ancoraggio Bitcoin
già maturo) esclusivamente dal backup — non dall'archivio primario — e li
ha verificati con gli stessi strumenti pubblici disponibili a chiunque:
la validità della firma HMAC tramite l'endpoint pubblico di verifica, la
validità della prova di ancoraggio Bitcoin contro un blocco reale, e la
coerenza del badge pubblico d'archivio. Tutti e tre i campioni sono
risultati verificati con esito positivo; il verbale pubblico della prova
documenta anche un errore di metodo emerso durante l'esecuzione (uno
strumento di estrazione non ancora aggiornato ai metadati facoltativi) e
la sua correzione — un esempio, non un'eccezione, del modo in cui questo
progetto tratta i propri errori: documentati, non nascosti.
<!-- FONTE: CLAUDE.md backlog P33 (privato); dettagli operativi
     (provider, bucket, regione) deliberatamente non pubblici — ADR-GTF-013;
     fonte pubblica citata: gtf/docs/verbali/2026-07-restore-drill.md +
     CTL-r2-offsite-backup (registro GTF) -->

### 6.3 Garanzie di recupero

Il servizio pubblica, in una pagina dedicata soggetta a revisione
periodica, garanzie minime di recupero del certificato differenziate per
fascia di utilizzo — un impegno di custodia, non solo una possibilità
tecnica. Questo documento non riporta le cifre esatte (soggette a
revisione più frequente di quanto sia opportuno per un PDF immutabile):
si rimanda alla pagina pubblica delle condizioni di utilizzo per i valori
correnti.
<!-- FONTE: regola §1.9 del design doc (niente numeri commerciali in un
     documento immutabile); la pagina di riferimento è /condizioni/
     (authweb, pubblica) -->

## 7. Il tempo

### 7.1 Perché il timestamp è solo lato server

Il timestamp che entra nella firma HMAC è generato esclusivamente dal
server, mai ricevuto dal client: è il singolo meccanismo che rende
impossibile retrodatare un'attestazione. Un client potrebbe dichiarare
qualunque data desiderasse, ma quella dichiarazione non entrerebbe mai
nel token firmato — solo l'istante osservato dal server viene vincolato
dalla firma.
<!-- FONTE: CLAUDE.md § "Sicurezza emissione certificati" punto 1 e
     ARCHITECTURE.md Assunzione 6 ("Timestamp e HMAC restano
     server-side") -->

### 7.2 Granularità e affidabilità di ciascuna àncora

Le tre àncore temporali offrono garanzie di granularità diverse, e questo
documento le dichiara esplicitamente invece di presentarle come
equivalenti. Il timestamp del server e la firma HMAC sono immediati e
disponibili all'istante dell'emissione. La marca temporale RFC 3161 è
anch'essa immediata, incorporata direttamente nella firma del PDF.
L'ancoraggio Bitcoin via OpenTimestamps è l'unico dei tre a maturare nel
tempo: la prova nasce "pendente" e diventa verificabile in modo
completamente indipendente solo dopo la conferma della transazione
Bitcoin sottostante, tipicamente entro poche ore.
<!-- FONTE: CLAUDE.md § endpoint /api/ots ("La prova è 'pending'
     all'emissione: matura in poche ore con la conferma Bitcoin") -->

### 7.3 Cosa significa "prova di esistenza a una data"

Nessuna delle tre àncore prova che l'utente abbia creato l'opera in quel
momento, né che ne sia l'autore: tutte e tre provano che una specifica
impronta crittografica — quindi, con probabilità praticamente certa, uno
specifico contenuto — esisteva già a quella data. È lo stesso concetto
tecnico su cui si fonda l'intero protocollo OpenTimestamps ("proof of
existence"), qui applicato con tre livelli di corroborazione indipendenti
anziché uno solo.
<!-- FONTE: concetto standard di proof-of-existence, già usato nel
     linguaggio pubblico del Trust Center e nelle ADR del progetto -->

## 8. Limiti dichiarati

*[F2 — DA SCRIVERE come sezione organica, la più importante del documento.
Scaletta vincolante (design doc §3.9):]*

- Identità del firmatario self-signed, fino a un eventuale sigillo
  elettronico qualificato eIDAS — roadmap onesta, **senza date promesse**.
- I metadati dichiarati (titolo, autore, anno, note) sono
  auto-dichiarazioni: non provano la paternità dell'opera.
- L'impronta arriva dal client, non i byte dell'opera: argomento completo
  da riportare (già scritto altrove nel progetto) — un'impronta inventata
  non è preimmagine di nulla, quindi non indebolisce la prova.
- La chiave HMAC è a chiave singola: un residuo di "fiducia nel server",
  mitigato — non eliminato — da un meccanismo di recupero della chiave e
  da un'auto-verifica continua del suo funzionamento. Un eventuale
  transparency log è materia di valutazione futura, non un impegno preso
  in questo documento.
- La risoluzione temporale dello storico pubblico di stato del servizio è
  di 30 minuti (la cadenza del proprio meccanismo di campionamento): sotto
  quella soglia il sistema non inventa un dato che non possiede.
<!-- FONTE per la scaletta: P38-DESIGN-whitepaper-tecnico.md §3.9.
     Materiale grezzo: CTL-eidas-honest-positioning (registro GTF,
     pubblico — testo "Cosa NON è questo servizio" da RIUSARE verbatim
     in F2, già validato in ogni revisione precedente); ARCHITECTURE.md
     Assunzioni 4/5/6 (privato, da filtrare); CLAUDE.md § imgauth
     ("HMAC_SECRET non si ruota MAI" — nel testo pubblico entra solo il
     concetto "chiave singola mitigata da recupero e auto-verifica", MAI
     i dettagli del meccanismo di recupero, gotcha §9.1); P36
     (CTL-availability-monitoring, pubblico) per la risoluzione 30 min -->

## 9. Standard e riferimenti

Il sistema si appoggia, in modo esplicito e verificabile, ai seguenti
standard e riferimenti pubblici:

- **RFC 3161** — Internet X.509 Public Key Infrastructure Time-Stamp
  Protocol: il protocollo con cui viene richiesta la marca temporale di
  terza parte (§3.2).
- **ETSI PAdES** (PDF Advanced Electronic Signatures), profilo B-LT: il
  formato di firma con validazione a lungo termine usato per il
  certificato PDF.
- **OpenTimestamps**: il protocollo aperto di ancoraggio su blockchain
  usato per la terza àncora temporale (§3.3).
- **RFC 9116** (`security.txt`): il formato standard con cui il servizio
  pubblica il proprio canale di responsible disclosure per la ricerca di
  sicurezza in buona fede, con un impegno pubblico di safe harbor.
  <!-- FONTE: CLAUDE.md backlog P37 (privato); pubblico in
       CTL-responsible-disclosure + attestazione.spaziogenesi.org/sicurezza/ -->
- **GDPR** (Regolamento UE 2016/679): il percorso di attestazione anonimo
  (il canale primario) non tratta alcun dato personale dell'utente finale;
  i soli trattamenti esistenti nel sistema riguardano l'identità di chi
  richiede credenziali per sviluppatori o un abbonamento, documentati
  pubblicamente con base giuridica e tempi di conservazione.
  <!-- FONTE: privacy.html (authweb, pubblico) + CTL-privacy-policy-public/
       CTL-hash-client-side/CTL-matomo-cookieless (registro GTF) -->
- **W3C Verifiable Credentials**: modello di riferimento seguito con
  attenzione come possibile evoluzione futura del formato di certificato;
  nessuna adozione né impegno di roadmap in questa versione del documento.
  <!-- FONTE: nessuna fonte interna; menzione da watch-list, testo da
       scrivere con cautela in F2 (nessuna promessa di adozione) -->

*[F2 — DA COMPLETARE: posizionamento eIDAS. Il testo sorgente esiste già
e va riusato — vedi §8 sopra, CTL-eidas-honest-positioning. Riferimento:
Regolamento (UE) n. 910/2014 (eIDAS) e la sua revisione 2.0.]*

## 10. Posizionamento rispetto a C2PA / Content Credentials

*[F2 — DA SCRIVERE. Scaletta vincolante (design doc §3.11):]*

- Cosa fa C2PA: manifest di provenienza firmato, incorporato nel file,
  catena delle modifiche (edit history), adozione crescente da parte di
  produttori di fotocamere, editor Adobe e strumenti di generazione AI.
- Differenza di modello: **provenienza incorporata** (ricca di contesto,
  ma removibile insieme ai metadati del file) contro **impronta esterna**
  (povera di contesto, ma indistruttibile finché il file esiste — perché
  non dipende da alcun metadato incorporato nel file stesso).
- Perché sono complementari, non concorrenti: un'opera può avere sia
  Content Credentials C2PA sia un'attestazione di esistenza di questo
  tipo; per un'opera priva di manifest C2PA (rimosso, mai apposto, o
  proveniente da uno strumento che non lo supporta), l'attestazione di
  esistenza resta l'unica prova disponibile.
- Scenari concreti da illustrare: un'opera generata con IA e già dotata
  di manifest C2PA, ulteriormente attestata da questo servizio; un'opera
  priva di qualunque provenienza incorporata, per cui l'attestazione è
  l'unica prova esistente.
- Nessuna adozione di C2PA in questa versione del sistema — decisione
  esplicita, non un'omissione.
<!-- FONTE per la scaletta: P38-DESIGN-whitepaper-tecnico.md §3.11.
     Nessuna fonte interna (marcato "DA SCRIVERE" nel design doc §2);
     unica traccia in VALUTAZIONE-analisi-esterna-roadmap-2026-07-21.md
     §2.2/§4.4 (privato, ma la sua conclusione — "nessuna adozione C2PA,
     complementare non concorrente" — è una decisione di progetto già
     presa e riportabile). Il resto richiede ricerca F2 su fonti
     pubbliche correnti (specifica C2PA, stato di adozione), con
     citazione di versione/data come richiesto dal gotcha §9.6 -->

## 11. Trasparenza operativa

Ogni affermazione tecnica di questo documento — comprese quelle sui
propri limiti — è verificabile indipendentemente attraverso un registro
di governance pubblico e leggibile da macchina (controlli, rischi,
decisioni, evidenze), non attraverso dichiarazioni di fiducia.

Il registro alimenta un punteggio di maturità pubblico, calcolabile da
chiunque a partire dagli stessi dati versionati nel repository — non un
punteggio di marketing, ma una media di dieci indicatori indipendenti
(trasparenza, integrità, tracciabilità, documentazione, automazione,
audit, conservazione, riproducibilità, privacy, governance), ciascuno
derivato da fatti raccolti automaticamente piuttosto che da
autodichiarazioni. Il punteggio è consultabile in tempo reale sul Trust
Center pubblico del progetto, insieme al suo storico: un calo non è
occultabile, perché lo storico è append-only nel repository.
<!-- FONTE: gtf/ARCHITECTURE.md §8 "Open Trust Score" (pubblico, repo gtf
     stesso). Il valore numerico corrente (score.json) NON va citato come
     cifra fissa in questo documento immutabile: si rimanda al Trust
     Center live, come deciso in FONTI.md §12 -->

Le evidenze che sostengono i controlli attivi sono raccolte in gran parte
in modo automatico da un collettore che interroga direttamente i sistemi
in produzione, non da dichiarazioni periodiche di chi gestisce il
servizio. Il registro è inoltre soggetto a una revisione esterna annuale da parte
di Radixia srl, terza parte indipendente senza legami con l'ente né con
gli enti formativi convenzionati.
<!-- FONTE: gtf/ARCHITECTURE.md §8.2 riga Automazione +
     generators/collect-evidence.mjs (pubblico); ADR-GTF-010 (revisore
     esterno, pubblico) + gtf/docs/piano-review-esterna-2026.md -->

Il servizio pubblica un canale dichiarato di responsible disclosure
(§9) e una pagina di stato pubblica che riporta, con risoluzione onesta,
sia i disservizi sia i rallentamenti sotto soglia rilevati ogni giorno —
compresi i giorni che superano la soglia di disponibilità: un disservizio
minore non viene né esagerato né nascosto nella rappresentazione
aggregata dello storico.
<!-- FONTE: P37 (CTL-responsible-disclosure) e P36
     (CTL-availability-monitoring), entrambi pubblici -->

## 12. Storia delle revisioni · Licenza · Come verificare questo documento

**Licenza**: questo documento è distribuito con licenza Creative Commons
Attribuzione 4.0 Internazionale (CC BY 4.0).
<!-- FONTE: decisione §1.4 del design doc -->

**Versione corrente**: v1.0 — *[data di pubblicazione da confermare in
FASE 4]*. Il file pubblicato `whitepaper-v1.0.pdf` non viene più
modificato dopo l'attestazione della sua impronta (§ sotto): eventuali
correzioni successive alla pubblicazione danno luogo a una nuova versione
(`whitepaper-v1.1.pdf` e successive), mai a una sostituzione silenziosa
del file esistente. Le versioni precedenti restano pubblicate.
<!-- FONTE: decisione §1.5 del design doc -->

**Come verificare questo documento**: l'impronta SHA-256 di questo PDF è
stata a sua volta attestata sul servizio che questo documento descrive.
*[placeholder — valorizzato in FASE 5, dopo l'attestazione dogfooding:
impronta SHA-256, link alla pagina pubblica di verifica `/c/<hash>`]*.
Chiunque può scaricare questo PDF, ricalcolarne l'impronta in autonomia
(con qualunque strumento SHA-256, non necessariamente il nostro) e
confrontarla con quella pubblicata — la stessa chiusura circolare già
applicata al bundle di evidenze mensile del registro di governance.
<!-- FONTE: pattern ADR-GTF-008 (dogfooding, pubblico); il PDF stesso non
     esiste ancora in questa fase, valori da compilare in FASE 5 -->
