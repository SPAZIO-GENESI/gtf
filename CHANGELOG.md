# Changelog

File generato da `content/changelog.yaml` — non modificarlo a mano.

## 2026-08-15

### Il changelog a doppia resa esiste davvero
*framework*

F4 di P44_isolamento_core_tenant.md eseguita: creato core/generators/build-changelog.mjs, che legge questo file e scrive CHANGELOG.md (tutte le voci, raggruppate per data) e site/changelog.html (solo le voci public: true, stesso stile del Trust Center). Estratto lo STYLE condiviso in core/generators/lib/style.mjs e i tre helper di rendering (esc, para, renderFooterColumns) in core/generators/lib/render.mjs, cosi il generatore del changelog non deve importare build-site.mjs (che esegue main() al solo caricamento del modulo: importarlo avrebbe rigenerato index.html come effetto collaterale). Validazione esplicita sulle quattro voci obbligatorie (date, component, title, public), con messaggio d'errore che indica quale voce e quali campi. Aggiunta la voce Changelog alla colonna "Il registro" del footer. Gate rotto di proposito, come previsto dal piano: il diff su index.html mostra solo la nuova riga del link nel footer, badge.svg e score.json restano identici. Baseline aggiornata dopo la verifica.

### Il motore si sposta in core/, con una guardia che lo tiene pulito
*framework · v0.2.0*

F3 di P44_isolamento_core_tenant.md eseguita: git mv schemas/ e generators/ dentro core/. ROOT in root.mjs risale di un livello in piu (3 -> 4 ".." ) per il nuovo livello di cartella. Creato core/package.json come solo manifesto di versione (0.2.0, nessuna dipendenza) e core/README.md. Nuova guardia core/generators/check-core-isolation.mjs (npm run check-core, in build e in validate.yml): scandisce core/** escludendo node_modules e i .md e fallisce se trova nomi di progetto specifici; verificata iniettando e rimuovendo una stringa vietata. Due contaminazioni reali trovate e risolte, non previste dal piano: il default tenant hardcoded in tenant.mjs (spostato in un nuovo default-tenant.json alla radice del repo, fuori da core/ - e configurazione di bootstrap, non logica del motore) e un esempio "es. imgauth" nella description di implementation.schema.json. publish.yml: filtri paths aggiornati da schemas/**+generators/** a core/**+default-tenant.json. Gate byte-identico verde, score invariato 91/100 10/10 indicatori. Pushato su richiesta esplicita del gestore; verificato dal vivo su trust.spaziogenesi.org (score 91/100, pagine chiave 200).

### I dati del tenant attestazione dentro il proprio pacchetto
*framework*

F2 di P44_isolamento_core_tenant.md eseguita: git mv registry/ e snapshots/ dentro tenants/attestazione/ (386 rinomini). Aggiornati REGISTRY_DIR in registry.mjs (dal tenant, non piu da ROOT) e i percorsi di scrittura in collect-evidence.mjs, score.mjs, scan-privacy.mjs, scan-scorecard.mjs, anchor-monthly.mjs; aggiornati i due workflow (collect-evidence.yml git add, publish.yml filtro paths). Trovato e corretto un ciclo di import non previsto dal piano: registry.mjs importava TENANT_REGISTRY_DIR da tenant.mjs, che a sua volta importava ROOT da registry.mjs - in ESM ROOT restava non inizializzato (TDZ) al momento in cui tenant.mjs lo usava a livello di modulo, crash immediato di ogni comando. Risolto estraendo generators/lib/root.mjs, senza dipendenze dagli altri due. Gate byte-identico verde; nessuna cartella registry/ o snapshots/ residua alla radice. Pushato su richiesta esplicita del gestore; verificato dal vivo su trust.spaziogenesi.org (score 91/100, pagine chiave 200).

### I sette generatori non sanno piu nulla del tenant
*framework*

F1 di P44_isolamento_core_tenant.md eseguita: creato tenants/attestazione/tenant.config.json (copia esatta della bozza del piano) e generators/lib/tenant.mjs (loadTenant, default "attestazione" via GTF_TENANT). I sette generatori (build-site, collect-evidence, score, scan-privacy, scan-scorecard, anchor-monthly, check-cadences) riscritti per leggere URL, repo e testi dal config del tenant invece di averli hardcoded. Gate byte-identico verde a ogni file (index.html e badge.svg identici, score.json identico a meno di computed_at). grep delle costanti di progetto su generators/ pulito, con una sola eccezione intenzionale: il default "attestazione" nel loader stesso (richiesto esplicitamente da F1.2, serve da bootstrap finche esiste un solo tenant). Nessun file di dati spostato (resta per F2).

### Baseline congelata per l'isolamento core/tenant
*framework*

F0 di P44_isolamento_core_tenant.md eseguita: npm run validate conferma 252 record e 0 errori, npm run build conferma il punteggio 91/100 con 10/10 indicatori disponibili. site/index.html, site/score.json e site/badge.svg congelati in .baseline/ (cartella locale, ignorata da git) come riferimento per il gate byte-identico delle fasi F1-F3.

### Avvio della trasformazione multi-progetto
*framework*

Scritta la roadmap docs/ROADMAP-trust-multiprogetto.md (P44 -> P48) e il primo piano eseguibile P44_isolamento_core_tenant.md. Misurato l'accoppiamento reale al progetto attestazione: 67 riferimenti nei generatori, concentrati in collect-evidence.mjs, build-site.mjs, scan-privacy.mjs e score.mjs; schemi, validate.mjs e lib/registry.mjs risultano gia agnostici. Quattro decisioni lasciate aperte al gestore (repo unico o separati, come ottenere i sottodomini, nome del prodotto, licenza). Nessuna modifica al motore, ai dati o al sito.

### Nasce il changelog a doppia resa
*framework*

Questo file diventa la sorgente unica del changelog. Da qui in avanti ogni passo si annota qui, non nella cronologia di una sessione: le sessioni si azzerano, il repo no. La resa pubblica sul sito e quella interna in CHANGELOG.md arrivano con P44 F4; fino ad allora questo file si legge cosi com'e.

