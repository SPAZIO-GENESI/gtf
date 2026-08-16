# Changelog

File generato da `content/changelog.yaml` — non modificarlo a mano.

## 2026-08-16

### P45 F5: la radice passa al prodotto
*framework*

trust.spaziogenesi.org non pubblica piu' il Trust Center di un progetto ma la pagina del framework, con il riepilogo dei punteggi dei progetti che lo applicano. Rimosso da publish.yml lo step di assemblaggio transitorio nato in F1, che ricopiava l'output del tenant sulla radice. Gli URL che altri consumano non si sono mossi, per impegno esplicito: /badge.svg e /score.json restano sulla radice come copie generate da build-root.mjs (22 punti pubblici incorporano quel badge), e whitepaper-v1.0.pdf, whitepaper.html, devops.html e changelog.html non sono mai stati spostati. Bug reale trovato prima di pubblicare, non previsto dal piano: publish.yml non eseguiva build-root, quindi la radice avrebbe pubblicato le sole copie committate e il badge si sarebbe congelato in silenzio al valore dell'ultimo commit invece di seguire il punteggio reale — stessa falla gia' trovata su build-changelog in P44 F6. Aggiunto lo step mancante.

### P45 F4: il Trust Center dell'attestazione risponde sul suo sottodominio
*framework*

attestazione.trust.spaziogenesi.org e' in linea: record CNAME verso spazio-genesi.github.io in DNS-only (mai proxato — e' un quarto livello e l'Universal SSL di Cloudflare ne copre uno solo; in DNS-only il certificato lo emette GitHub), dominio custom impostato sulle Pages del repo sottile, Enforce HTTPS attivo. Da ora il file CNAME e' scritto dal job di pubblicazione ricavando l'host da tenant.config.json (site.public_url): senza, il rsync --delete cancellerebbe quello scritto da GitHub e il dominio custom andrebbe perso al primo deploy. Verificato dal vivo: /, /badge.svg e /score.json a 200 con il punteggio 91/100 e 10/10 indicatori, stile corretto (i percorsi assoluti ora risolvono). /devops.html, /whitepaper.html e /changelog.html rispondono 404 su questo host: sono contenuti che vivono sulla radice, atteso qui e corretto in F6.1. La radice resta invariata — sette URL a 200 e impronta del whitepaper 898ec9…de452 — quindi il Trust Center risponde ora su due host: e' la finestra sicura in cui F5 puo' spostare la radice.

### P45 F3: il Trust Center dell'attestazione ha un repo di pubblicazione proprio
*framework*

Creato il repository pubblico SPAZIO-GENESI/trust-attestazione, di sola pubblicazione: il contenuto e' generato da qui e sovrascritto a ogni deploy (avvertenza esplicita nel suo README). Esiste perche' GitHub Pages ammette un solo dominio custom per repository, e questo repo pubblica gia' la radice. Il bersaglio si legge da tenant.config.json (site.publish_repo), non e' scritto nel workflow: al secondo tenant bastera' un altro pacchetto. Nuovo step in publish.yml che pubblica tenants/<id>/site/ con git push diretto (PAT dedicato, nessuna action di terze parti), sostituzione completa via rsync --delete; fallisce rumorosamente se il secret manca. Il file CNAME non si scrive ancora: con un dominio custom che non risolve, Pages redirigerebbe anche l'URL *.github.io e il sito sarebbe irraggiungibile — arriva in F4 col DNS. Verificato: spazio-genesi.github.io/trust-attestazione/ risponde 200 con overall 91 e 10/10 indicatori; i quattro percorsi assoluti del footer danno 404 (atteso su sottopercorso: /badge.svg si risolve col dominio custom in F4, gli altri tre in F6.1). trust.spaziogenesi.org invariato: sette URL a 200, badge ancora 91/100, SHA-256 del whitepaper 898ec96815e6bee1f85f93651fb64b6d1ad289510f4ac2fd9fbaa92fe01de452.

### P45 F2: la radice ha un sito proprio, non ancora pubblicato
*framework*

Nuovo core/generators/build-root.mjs (scandito dalla guardia di isolamento, nessun nome di progetto hardcoded): legge content/site.config.json, enumera i tenant e ne legge lo score.json per un riepilogo a schede (nome, punteggio, indicatori, versione, link al proprio Trust Center). Copia badge.svg e score.json dal tenant dichiarato in compat verso la radice: e' un impegno pubblico verso i 22 riferimenti esterni al badge, non un dettaglio implementativo. Nulla di pubblicato cambia: la radice online resta il Trust Center fino a F5.

### P45 F1: l'output del tenant si sposta in tenants/<id>/site/
*framework*

index.html, score.json e badge.svg rinominati con git mv; changelog.html resta in site/ perche' e' del prodotto, non del tenant (commentato nel generatore, o la prossima sessione lo "corregge" per simmetria). Nuovo TENANT_SITE_DIR in tenant.mjs, senza fallback silenzioso alla vecchia cartella. Step di assemblaggio transitorio in publish.yml (muore in F5) perche' il deploy continui a pubblicare il tenant sulla radice. Gate byte-identico verde, punteggio invariato 91/100 con 10/10 indicatori.

### P45 F0: baseline congelata prima di separare radice e sottodominio
*framework*

npm run validate (253 record, 0 errori) e npm run build verdi da albero pulito; score invariato 91/100, 10/10 indicatori. Congelati in .baseline/ i quattro file generati del tenant attestazione (index.html, score.json, badge.svg, changelog.html). Verificati dal vivo gli otto URL pubblici di trust.spaziogenesi.org (/, /badge.svg, /score.json, /changelog.html, /devops.html, /whitepaper.html, /whitepaper-v1.0.pdf, il file di verifica per i motori di ricerca): tutti 200. SHA-256 di whitepaper-v1.0.pdf invariato (898ec96815e6bee1f85f93651fb64b6d1ad289510f4ac2fd9fbaa92fe01de452). Questo e' il termine di paragone per le fasi successive di P45.

## 2026-08-15

### Il collettore settimanale era rotto da F3, e nessuno se ne era accorto
*core*

Il lancio manuale del collettore prescritto da F6 (l'unico modo di verificarlo senza aspettare il lunedi) lo ha trovato rosso: scan-privacy.mjs cercava privacy-map.json in generators/lib/, il percorso precedente allo spostamento del motore dentro core/ fatto da F3. Invisibile fino a oggi perche' scan-privacy non fa parte di npm run build ma solo del collettore, che non era piu' stato eseguito dopo F3: il lunedi successivo la raccolta di evidenze sarebbe fallita in silenzio, con MET-privacy e MET-automation che si sarebbero degradati per freschezza scaduta senza che la causa fosse evidente. Corretto risolvendo il percorso da import.meta.url invece che dalla radice del repo, cosi' l'estrazione futura di core/ come pacchetto (P48) non lo rompe una terza volta. Verificati in locale anche gli step successivi, che il job non aveva mai raggiunto: scan-privacy (14 flussi, 10 coperti, 0 non coperti) e scan-scorecard (7.6/7.6/5.6), entrambi scrivono nei percorsi nuovi del tenant. Lezione: uno spostamento di cartelle va verificato anche sugli script che nessun gate esegue.

### Due falle nella pipeline di pubblicazione del changelog
*framework*

Trovate dai controlli pre-push di F6, non dal design doc, ed entrambe nate con F4. (A) content/** non era nei filtri paths: di publish.yml: una modifica alla sola sorgente del changelog non avrebbe fatto partire il deploy - la trappola numero 1 del piano (il sito resta indietro e nessun workflow diventa rosso), applicata al percorso nuovo introdotto da F4 stessa. (B) il job non eseguiva npm run build-changelog: a differenza di index.html, score.json e badge.svg, la pagina del changelog non veniva rigenerata in CI ma pubblicata dalla sola copia committata a mano, quindi un build locale dimenticato avrebbe messo online un changelog vecchio in silenzio. Corrette entrambe prima del push. Lezione: quando una fase introduce un percorso nuovo, i filtri paths: e gli step del job vanno riletti nello stesso giro, non alla fase dopo.

### Documentazione allineata al motore multi-progetto
*framework*

F6 di P44_isolamento_core_tenant.md (parte scrittura): ARCHITECTURE.md passa a 0.2.0 con una nuova sezione 15 (Multi-progetto: cos'e un tenant, cosa puo stare in core/, la guardia, il versioning per componente) e riferimenti aggiornati in 4 (topologia repo), 7 (Trust Center per tenant) e 12 (nuova riga di roadmap M5). README.md riscritto sulla struttura reale post F0-F5 (core/, tenants/<id>/, content/, default-tenant.json) con il comando GTF_TENANT=... al posto di quello ormai obsoleto. site/README.md aggiorna l'elenco dei file generati con changelog.html. Due righe aggiunte alla sezione P20 di img-auth-hub/CLAUDE.md, senza riscrivere la sua storia. Resta da fare il push (Opus, e' un rilascio in produzione: ripubblica trust.spaziogenesi.org).

### Il Trust Framework diventa applicabile a più progetti
*framework*

Il registro pubblico che alimenta questo Trust Center è ora costruito da un motore agnostico separato dai dati del progetto a cui si applica (ADR-GTF-014). L'attestazione delle opere digitali è la prima applicazione dichiarata; il punteggio, i controlli e le evidenze che leggi qui restano calcolati esattamente come prima, con la stessa formula. Il footer mostra ora due numeri di versione: quello del motore e quello del pacchetto di dati di questo progetto.

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

