# P47 — Ogni contenuto sul proprio host, e il motore ha un autore

> **Piano eseguibile.** Fasi in ordine, criteri di accettazione verificabili,
> ⛔ dove serve la conferma esplicita del gestore.
> Contesto e visione: [`docs/ROADMAP-trust-multiprogetto.md`](docs/ROADMAP-trust-multiprogetto.md).
> Prerequisito: **P45 chiuso** (due host in linea, repo Pages sottile, DNS) —
> vedi [`P45_domini_e_siti_separati.md`](P45_domini_e_siti_separati.md).
> Chiude il debito dichiarato in `ARCHITECTURE.md` §15.1-15.2 ("sanabile in P47").

---

## Guida al modello, fase per fase

| Fase | Modello | Perché |
|---|---|---|
| F0 — Ricognizione e baseline | **Sonnet** | sola lettura, comandi fissi elencati qui sotto |
| F1 — Il whitepaper si sposta | **Sonnet** | `git mv` + tre link, criteri misurabili |
| F2 — DevOps si sposta e si sfronda | **Sonnet** | editing di prosa guidato, nessun generatore toccato |
| F3 — Clean URL e identità del changelog | **Sonnet** | modifica a un generatore, output confrontabile |
| F4 — Pulizia del footer del tenant e link rotti | **Sonnet** | editing di configurazione, verifica con `curl` |
| F5 — Attribuzione e licenze | **Sonnet** | stringhe già decise dal gestore, nessuna scelta aperta |
| F6 — Consumatori, evidenze, documentazione | **Sonnet** | editing meccanico guidato dal doc |
| F7 — ⛔ Push e verifica live | **Opus** | ripubblica due siti e tocca due repo pubblici esterni |

Nessuna fase tocca segreti, DNS, deploy Cloudflare o il registro dei record
(nessun CTL/RSK/EVD nuovo). Se durante l'esecuzione emerge la tentazione di
toccare uno di questi, **fermarsi e chiedere**: non è in questo piano.

---

## 1. Obiettivo

Dopo P45 i due host esistono ma i contenuti non hanno seguito la divisione: il
whitepaper e la pagina DevOps parlano del **servizio di attestazione** e vivono
sul dominio del **framework**; il changelog del framework indossa i vestiti del
tenant; il Trust Center dell'attestazione rimanda a cose che riguardano solo
GTF; e il motore non dichiara da nessuna parte chi lo ha scritto.

| | Prima (oggi) | Dopo (P47) |
|---|---|---|
| `whitepaper.html` + `whitepaper-v1.0.pdf` | radice | **attestazione.trust** |
| `devops.html` | radice, parla di attestazione + RADART | **attestazione.trust/devops/**, sfrondata delle parti RADART |
| `changelog.html` | radice, ma titolo/footer/badge del tenant | **radice/changelog/**, con l'identità della radice |
| Footer del Trust Center | 7 link, 4 dei quali solo-GTF, 2 in 404 | link propri + **un solo** "Il framework ↗" |
| Autore del motore | non compare in nessun punto pubblico | **Tangram.page** nel footer della radice, in `core/LICENSE`, nei README |

### Decisioni del gestore già prese (16 agosto 2026)

Raccolte in conversazione, **non ridiscutere in esecuzione**:

1. **Il PDF del whitepaper va *solo* su attestazione.trust.** Nessuna copia di
   compatibilità sulla radice: `trust.spaziogenesi.org/whitepaper-v1.0.pdf`
   risponderà **404**. È una revisione consapevole della riga "resta sulla
   radice" nella tabella degli URL immobili di `ARCHITECTURE.md` §15.1 — va
   riscritta, non aggirata (F6).
2. **DevOps va su attestazione.trust, sfrondata.** Non è contenuto del
   framework: si dichiara essa stessa come il processo di rilascio dei servizi
   dell'ETS (26 menzioni attestazione/imgauth, 18 RADART, GTF solo di contorno).
   Le parti RADART si tagliano ora; quando RADART diventerà tenant (P46) avrà la
   propria pagina, non una sezione ospite in casa d'altri.
3. **Attribuzione e copyright del motore a Tangram.page**, con Spazio Genesi ETS
   nel ruolo di consumatore e partner tecnologico che fornisce l'infrastruttura.
   Forma scelta: **doppia riga** — `core/LICENSE` a Tangram.page (il motore),
   `LICENSE` alla radice a Spazio Genesi ETS (i registri dei tenant).
4. **Solo attribuzione, non rebranding.** Il nome del prodotto resta "Genesis
   Trust Framework": rinominarlo tocca badge, whitepaper, `ADR-GTF-001` e cinque
   README ed è un lavoro a sé (roadmap D3, dopo P47). Chi esegue questo piano
   **non** rinomina nulla.

### Cosa **non** cambia

Nessun record del registro, nessuna formula, nessun punteggio, nessun endpoint,
nessun contenuto del registro di `tenants/attestazione/`. Il punteggio deve
restare **91/100 con 10/10 indicatori** dall'inizio alla fine. Il file
`whitepaper-v1.0.pdf` **non si rigenera e non si tocca**: cambia di cartella,
non di byte — la sua impronta `898ec9…de452` è attestata e deve restare identica.

---

## 2. Criterio globale — cosa può rompersi e cosa no

GitHub Pages non ha redirect server-side: un URL o risponde con un file, o è
rotto. Da qui due liste, entrambe da verificare con `curl` in F7.

### 2.1 URL che devono continuare a rispondere (200)

| URL | Perché è immobile |
|---|---|
| `trust.spaziogenesi.org/` | la pagina del prodotto |
| `trust.spaziogenesi.org/badge.svg` | 22 punti pubblici lo incorporano (18 pagine authweb, template del generatore integrazioni, 3 README) |
| `trust.spaziogenesi.org/score.json` | copia di compatibilità |
| `trust.spaziogenesi.org/833b2eaa595b8ad4fc09b6700bdcfe60.txt` | verifica motori di ricerca |
| `attestazione.trust.spaziogenesi.org/`, `/badge.svg`, `/score.json` | Trust Center del tenant |

### 2.2 URL che cambiano, e come si accompagnano

| URL vecchio | Destino | Accompagnamento |
|---|---|---|
| `/whitepaper.html` | contenuto su attestazione.trust | **shim** sulla radice (vedi F1.3) |
| `/devops.html` | contenuto su attestazione.trust/devops/ | **shim** sulla radice |
| `/changelog.html` | contenuto su radice/changelog/ | **shim** sulla radice |
| `/whitepaper-v1.0.pdf` | **404 per decisione** | nessuno — vedi sotto |

**Perché gli shim, se la decisione è "va solo in attestazione".** Uno shim è un
cartello, non contenuto: tre righe di HTML che dicono "questa pagina si è
spostata" e portano al nuovo indirizzo. Serve perché un consumatore esterno non
è correggibile a posteriori: il README di `@spazio-genesi/attest-mcp` **già
pubblicato su npm** (0.4.1) linka `trust.spaziogenesi.org/whitepaper.html`, e un
README pubblicato non si modifica — si può solo pubblicare una versione nuova.
Stesso ragionamento per `/devops.html`, citato due volte in `docs/DEVOPS.md` nel
repo pubblico imgauth, che sopravvive in ogni clone già fatto.

**Perché il PDF invece no.** Nessun consumatore esterno immutabile punta
all'URL del PDF: il README npm linka la pagina, non il file; l'unico consumatore
automatico è `EVD-whitepaper-integrity`, che è **nostro** e si riconfigura nello
stesso commit (F1.4). L'impronta attestata non dipende dall'URL — dipende dai
byte, che non cambiano — quindi la verifica pubblica su
`/c/898ec9…de452` continua a funzionare identica.

> ⚠️ **Gate temporale, non opzionale.** La sparizione del PDF dalla radice e la
> riconfigurazione dell'evidenza devono stare **nello stesso commit**. Se il PDF
> se ne va prima, `EVD-whitepaper-integrity` diventa rossa al primo giro del
> collettore e il punteggio scende — su un framework che promette evidenze
> verificate, un'evidenza rossa causata da noi è il danno peggiore di tutto il
> piano. `publish.yml` pubblica **prima** il tenant e **poi** la radice, quindi
> un commit unico è sicuro: il PDF esiste già sul nuovo host quando sparisce dal
> vecchio.

---

## 3. Stato di partenza (verificato il 2026-08-16)

- `site/` (radice) contiene: `index.html` e `changelog.html` **generati**,
  `badge.svg` e `score.json` copie di compatibilità generate, e i file statici
  mantenuti a mano `devops.html`, `whitepaper.html`, `whitepaper-v1.0.pdf`, più
  il file di verifica dei motori di ricerca.
- `tenants/attestazione/site/` contiene solo output generato (`index.html`,
  `score.json`, `badge.svg`) e un `README.md` che avverte "non modificare qui".
- `gtf/.gitignore` **non** ignora i PDF: `git mv` del whitepaper funziona senza
  `-f` (a differenza dei template in imgauth).
- `publish.yml` pubblica il tenant con `rsync -a --delete --exclude='.git'
  --exclude='README.md'`: qualunque file statico messo in
  `tenants/attestazione/site/` viene pubblicato, e qualunque file rimasto lì da
  un build precedente e non più prodotto **viene cancellato**.

### 3.1 Due difetti già in produzione, da correggere in questo giro

**(a) Tre link a 404 sul Trust Center dell'attestazione.** Verificati con
`curl` il 2026-08-16:

| Dove | URL | Esito |
|---|---|---|
| `tenants/attestazione/site/index.html` riga ~151, sotto il punteggio ("Formula di ciascuno") | `github.com/SPAZIO-GENESI/gtf/tree/main/registry/metrics` | **404** |
| footer, "Registro pubblico" | `…/tree/main/registry` | **404** |
| footer, "Formula del punteggio" | `…/tree/main/registry/metrics` | **404** |

Causa: P44 ha spostato il registro in `tenants/attestazione/registry/`, ma
`tenant.config.json` › `site.metrics_url` e due voci di `footer_columns` sono
rimaste ai percorsi vecchi. Su una pagina il cui unico argomento è "verifica tu
stesso", i link che invitano a verificare sono rotti. Il percorso giusto
(`…/tree/main/tenants/attestazione/registry`) risponde 200.

**(b) Il changelog della radice indossa i vestiti del tenant.**
`core/generators/build-changelog.mjs` chiama `loadTenant()` benché la sorgente
sia `content/changelog.yaml`, cioè il changelog del **prodotto**. Risultato
pubblicato: titolo "Changelog — Trust Center — Genesis Trust Framework",
back-link "← Trust Center" verso `/` (che dopo P45 è la pagina del prodotto),
footer con le colonne dell'attestazione (imgauth, privacy, stato dei servizi) e
il badge del tenant.

---

## F0 — Ricognizione e baseline (Sonnet)

Sola lettura. Serve a poter dimostrare, alla fine, che nulla si è rotto.

1. Albero pulito: `git -C gtf status --short` deve essere vuoto. Se il
   collettore settimanale ha lasciato modifiche non committate, **fermarsi e
   segnalarlo** (gira il lunedì alle 06:00 UTC e committa da sé: una migrazione
   di percorsi mentre lui scrive va coordinata, non forzata).
2. Build verde da albero pulito: `npm run build` e `GTF_TENANT=attestazione npm
   run build`. Annotare punteggio e numero di record.
3. Baseline degli URL pubblici. Per ciascuno degli URL in §2.1 e §2.2 registrare
   il codice HTTP con
   `curl -s -o /dev/null -w "%{http_code}"`.
4. Impronta di partenza del PDF:
   `sha256sum site/whitepaper-v1.0.pdf` → deve dare
   `898ec96815e6bee1f85f93651fb64b6d1ad289510f4ac2fd9fbaa92fe01de452`.
   Se non combacia, **fermarsi**: il file è già stato alterato da qualcuno e
   nulla di questo piano deve partire prima di aver capito perché.
5. **Verifica che il PDF non citi il proprio URL.** `pdftotext -enc UTF-8
   site/whitepaper-v1.0.pdf - | grep -n "trust.spaziogenesi.org"`. Il corpo del
   documento non dovrebbe contenere l'URL del file (l'impronta e il link di
   verifica vivono nella pagina di accompagnamento, non dentro il PDF). Se
   invece compare un URL che questo piano sta per rendere 404, **riportarlo e
   fermarsi**: un PDF immutabile che rimanda a un indirizzo morto non si corregge
   più, e la decisione cambia.

**Criterio di accettazione F0**: albero pulito, build verde, tabella dei codici
HTTP di partenza scritta nel resoconto, impronta del PDF confermata, esito del
punto 5 riportato esplicitamente.

---

## F1 — Il whitepaper si sposta su attestazione.trust (Sonnet)

### F1.1 — Sposta i due file

```
git mv site/whitepaper.html      tenants/attestazione/site/whitepaper.html
git mv site/whitepaper-v1.0.pdf  tenants/attestazione/site/whitepaper-v1.0.pdf
```

Poi riverificare l'impronta nella nuova posizione: deve essere ancora
`898ec9…de452`. `git mv` non altera i byte, ma questo è il file più delicato del
repo e il controllo costa un comando.

### F1.2 — Correggi i link *dentro* `whitepaper.html`

La pagina è mantenuta a mano e contiene un footer che è una copia congelata di
quello del tenant. Sul nuovo host:

| Link attuale | Diventa | Perché |
|---|---|---|
| `<a href="/">← Trust Center</a>` (spine e footer) | invariato | su attestazione.trust `/` **è** il Trust Center: il back-link torna corretto da solo |
| `<a href="/devops.html">DevOps e rilasci</a>` | `/devops/` | dopo F2 vive lì, sullo stesso host |
| `…/gtf/tree/main/registry` | `…/gtf/tree/main/tenants/attestazione/registry` | stesso 404 di §3.1(a) |
| `<img src="/badge.svg">` | invariato | il badge del tenant vive accanto alla sua pagina |
| `<a href="/whitepaper-v1.0.pdf">` | invariato | il PDF si sposta insieme alla pagina |

Non riscrivere il resto della pagina: contenuto, abstract, impronta pubblicata e
storia delle revisioni restano **parola per parola** com'erano.

### F1.3 — Lo shim sulla radice

Nuovo `site/whitepaper.html`, minimale — nessuno stile, nessun footer, nessun
badge: è un cartello, non una pagina.

- `<meta http-equiv="refresh" content="0; url=https://attestazione.trust.spaziogenesi.org/whitepaper.html">`
- `<link rel="canonical" href="https://attestazione.trust.spaziogenesi.org/whitepaper.html">`
- Un paragrafo visibile con il link, per chi ha il refresh bloccato: una riga che
  dice che il whitepaper è del sistema di attestazione e vive ora sul Trust
  Center di quel progetto.
- Un commento HTML in testa che spiega perché lo shim esiste (README npm
  immutabile) e che **non è contenuto da mantenere**.

Il PDF **non** ha shim: nessun file resta alla radice (decisione 1).

### F1.4 — Riconfigura l'evidenza, nello stesso commit

In `tenants/attestazione/tenant.config.json` › `collector.whitepaper.url`:
`https://trust.spaziogenesi.org/whitepaper-v1.0.pdf` →
`https://attestazione.trust.spaziogenesi.org/whitepaper-v1.0.pdf`.
Il campo `sha256` **non si tocca**.

Cercare poi nel registro altri riferimenti all'URL vecchio:
`grep -rn "trust.spaziogenesi.org/whitepaper" tenants/attestazione/registry/`.
Se `EVD-whitepaper-integrity` (o altri record) hanno l'URL nel campo `location`
o in `verify_howto`, aggiornarlo: un registro che descrive male come si verifica
un'evidenza perde il suo valore.

**Criterio di accettazione F1**: `GTF_TENANT=attestazione npm run build` verde;
`tenants/attestazione/site/` contiene i due file con l'impronta del PDF
invariata; `site/whitepaper.html` è lo shim; nessun `grep` trova più l'URL
vecchio del PDF fuori dal changelog storico e da `.baseline/`.

---

## F2 — DevOps si sposta e si sfronda (Sonnet)

### F2.1 — Sposta con clean URL

```
mkdir -p tenants/attestazione/site/devops
git mv site/devops.html tenants/attestazione/site/devops/index.html
```

### F2.2 — Sfronda le parti RADART

La pagina si apre dichiarando di coprire "il sistema di attestazione delle opere
digitali **e la piattaforma RADART**". Su un Trust Center dell'attestazione,
RADART non ci sta: è un altro progetto, che a P46 avrà il proprio.

- Riscrivere il sommario in apertura come processo di rilascio **del sistema di
  attestazione**.
- Togliere le voci RADART dalla mappa degli ambienti, dalla tabella "Stato di
  attuazione" e dal runbook. Dove una fase del piano P24 riguardava solo RADART,
  la riga sparisce; dove riguardava entrambi, resta con la sola parte
  attestazione.
- **Una riga sola** può restare, alla fine dei principi: che lo stesso processo
  è adottato anche per gli altri servizi dell'ente. Un rimando, non una sezione.
- Non inventare contenuto nuovo e non aggiornare lo stato delle fasi: se una
  riga della tabella dice ⏳, resta ⏳. Questo piano sposta e sfronda, non
  ricertifica lo stato del CI/CD.

### F2.3 — Correggi i link interni

Stessa tabella di F1.2: `/` resta (ora è davvero il Trust Center),
`/whitepaper.html` resta (stesso host dopo F1), il link al registro va al
percorso `tenants/attestazione/registry`, `/badge.svg` resta.

### F2.4 — Lo shim sulla radice

`site/devops.html` come F1.3, verso
`https://attestazione.trust.spaziogenesi.org/devops/`.

**Criterio di accettazione F2**: `grep -ci "radart" tenants/attestazione/site/devops/index.html`
restituisce al più 1 (la riga di rimando consentita); nessun link interno alla
pagina punta a `/devops.html`; lo shim esiste alla radice.

---

## F3 — Clean URL del changelog e identità della radice (Sonnet)

### F3.1 — Il generatore legge la configurazione giusta

In `core/generators/build-changelog.mjs`: sostituire `loadTenant()` con il
caricamento di `content/site.config.json` (lo stesso che usa
`build-root.mjs` — riusare quella funzione, non scriverne una seconda).
Conseguenze da verificare nel template: `cfg.language`, `cfg.site.title`,
`cfg.site.eyebrow`, `cfg.site.footer_note_html`, `renderFooterColumns(cfg)` e
`cfg.site.badge_alt` devono risolvere sulla configurazione della radice.

Attenzione: `site.config.json` alla radice ha i campi al primo livello
(`title`, `eyebrow`, `footer_columns`, `footer_note_html`), non annidati sotto
`site` come nel tenant. Adeguare gli accessi, o normalizzare — ma **senza**
cambiare `build-root.mjs`, che oggi funziona.

Nel corpo del template:
- il back-link `← Trust Center` diventa `← Il framework`;
- la frase "Le novità di questo Trust Center" diventa una frase sul framework
  (il changelog racconta il prodotto, non un singolo Trust Center);
- il badge resta `/badge.svg`: alla radice è la copia di compatibilità, esiste.

### F3.2 — Clean URL

Il generatore scrive ora `site/changelog/index.html` invece di
`site/changelog.html`. Aggiornare il commento nel codice che spiega perché il
file resta sulla radice (la ragione non cambia, il percorso sì).

Nuovo `site/changelog.html` come shim verso `/changelog/`, con lo stesso commento
esplicativo degli altri.

⚠️ `site/changelog.html` è **generato**: assicurarsi che il generatore non
riscriva più quel percorso, altrimenti al primo build lo shim viene sovrascritto
dalla pagina intera e il lavoro si annulla in silenzio.

### F3.3 — I riferimenti nella configurazione della radice

`content/site.config.json` › `footer_columns`: `/changelog.html` → `/changelog/`.
Le voci `/whitepaper.html` e `/devops.html` in quella stessa colonna vanno
**rimosse** (dopo F1/F2 non sono più contenuto della radice) — oppure, se il
gestore vuole restino come rimandi, riscritte come URL assolute verso
attestazione.trust con la freccia `↗` usata altrove per i link esterni.
In dubbio: rimuoverle. Il footer della radice deve parlare del framework.

**Criterio di accettazione F3**: `npm run build` verde; `site/changelog/index.html`
ha titolo, eyebrow e footer della radice e nessun link a imgauth/privacy/stato
servizi; `CHANGELOG.md` alla radice è **invariato rispetto a prima della fase**
(cambia solo la resa HTML, non quella Markdown) — verificarlo con `git diff`.

---

## F4 — Pulizia del footer del tenant e link rotti (Sonnet)

Tutto in `tenants/attestazione/tenant.config.json`. Nessun HTML a mano: la
pagina è generata.

### F4.1 — I due percorsi in 404

- `site.metrics_url` → `https://github.com/SPAZIO-GENESI/gtf/tree/main/tenants/attestazione/registry/metrics`
- voce footer "Registro pubblico" → `…/tree/main/tenants/attestazione/registry`
- voce footer "Formula del punteggio" → stesso di `metrics_url`

### F4.2 — La colonna "Il registro" si asciuga

| Voce attuale | Destino |
|---|---|
| Il framework ↗ (`trust.spaziogenesi.org/`) | **resta** — è il solo link al framework, come deciso |
| Codice sorgente (GTF) | **via** — riguarda il framework, non questo progetto |
| Registro pubblico | **resta**, percorso corretto — è la prova su cui poggia la pagina |
| Formula del punteggio | **resta**, percorso corretto — stessa ragione |
| DevOps e rilasci ↗ | **resta**, ma diventa interno: `/devops/` senza freccia |
| Whitepaper tecnico ↗ | **resta**, ma diventa interno: `/whitepaper.html` senza freccia |
| Changelog ↗ (`trust…/changelog.html`) | **via** — è il changelog del framework |

Il criterio, se in esecuzione emerge un caso non elencato: **resta ciò che
dimostra qualcosa su questo progetto; se ne va ciò che parla solo del
framework**, salvo l'unico link "Il framework ↗".

### F4.3 — Il resto della pagina

Verificare che nel corpo generato non resti prosa che spiega *il framework in
sé* (a differenza dei principi e dei controlli del progetto, che restano).
`ADR-GTF-001` e simili sono **record del registro** e restano dove sono: sono
decisioni storiche del progetto, non contenuto di navigazione. Questo piano non
tocca il registro.

**Criterio di accettazione F4**: `GTF_TENANT=attestazione npm run build` verde;
tutti i link `github.com/...` presenti in
`tenants/attestazione/site/index.html` rispondono 200 (verificarli in ciclo con
`curl`, non a vista); il footer non contiene più `trust.spaziogenesi.org` se non
nella voce "Il framework"; punteggio ancora 91/100 e 10/10.

---

## F5 — Attribuzione e licenze (Sonnet)

Stringhe già decise, da scrivere così come sono.

### F5.1 — `core/LICENSE` (nuovo file)

Testo MIT integrale, riga di copyright:
`Copyright (c) 2026 Tangram.page`.
Il testo della licenza non si modifica in nessun'altra parola.

### F5.2 — `LICENSE` alla radice

Resta MIT con `Copyright (c) 2026 Spazio Genesi ETS`. **Non toccare il testo
della licenza**: aggiungere invece, *sopra* di essa, tre righe di nota che
dicano che il motore in `core/` è coperto da `core/LICENSE` (Tangram.page) e che
questa licenza copre il resto del repository, cioè i registri dei tenant.

### F5.3 — `core/package.json`

Aggiungere `"author": "Tangram.page (https://tangram.page)"` e
`"license": "MIT"`. Nient'altro: non toccare `version`, che segue la disciplina
per componente.

### F5.4 — Il footer della radice

`content/site.config.json` › `footer_note_html`: aggiungere una frase che dica
che il Genesis Trust Framework è un prodotto **Tangram.page**
(`https://tangram.page`) e che Spazio Genesi ETS lo applica ai propri servizi
come partner tecnologico, fornendo l'infrastruttura su cui gira. Tenere la nota
esistente sulla generazione automatica della pagina: è un'affermazione diversa e
serve.

⚠️ Il footer del **tenant** non riceve questa frase: lì il soggetto è il
progetto di attestazione, non il motore.

### F5.5 — I due README

- `README.md` (radice): una riga nell'apertura — motore di Tangram.page,
  registri di Spazio Genesi ETS. Correggere la frase attuale, che attribuisce
  l'intero repo all'ETS.
- `core/README.md`: una riga sull'autore e sul rimando a `core/LICENSE`.

**Criterio di accettazione F5**: `npm run build` verde; `tangram` compare in
`site/index.html` generato; `core/LICENSE` esiste ed è MIT con il titolare
giusto; nessuna occorrenza di "Tangram" nell'output del tenant.

---

## F6 — Consumatori, evidenze, documentazione (Sonnet)

### F6.1 — Consumatori esterni (altri repo, **commit ma non push**: il push è F7)

| Repo | File | Cosa |
|---|---|---|
| `imgauthweb` | `js/atlante.js` riga ~40 | URL whitepaper → attestazione.trust |
| `imgauth` | `docs/DEVOPS.md` righe ~15 e ~182 | due riferimenti a `/devops.html` → nuovo URL |

Il README di `@spazio-genesi/attest-mcp` **non si tocca in questo giro**: il link
resta valido grazie allo shim, e ripubblicare su npm per un link è
sproporzionato. Correggerlo al prossimo rilascio del pacchetto, non prima —
annotarlo nel resoconto finale come debito minore.

### F6.2 — `ARCHITECTURE.md` (gtf)

- §15.1, tabella degli URL immobili: riscrivere le righe di whitepaper, devops e
  changelog secondo §2 di questo piano. La riga del PDF diceva "resta sulla
  radice": ora dice il contrario, ed è una **revisione dichiarata**, con la
  ragione — non una riga cancellata in silenzio.
- §15.2 "Cosa resta fuori da P45": togliere lo spostamento di
  `devops.html`/`whitepaper.html`, ora fatto.
- Aggiungere la separazione delle licenze (motore/registri) dove il documento
  descrive la struttura del repo.
- Bump di versione del documento secondo la sua convenzione interna, e
  rigenerazione del PDF **solo se** quel documento ha un PDF mantenuto: se non
  esiste, non crearlo in questo piano.

### F6.3 — `content/changelog.yaml`

Una voce nuova, `component: framework`, `public: true`, in cima. Deve dire, in
lingua piana e senza gergo di implementazione: che il whitepaper e la pagina
DevOps del sistema di attestazione vivono ora sul Trust Center di quel progetto;
che il vecchio indirizzo porta al nuovo; che il documento **è lo stesso file, con
la stessa impronta attestata**, quindi ogni verifica già fatta resta valida; e
che il motore del framework è un prodotto Tangram.page, ospitato e applicato da
Spazio Genesi ETS.

Non elencare i file toccati: il changelog pubblico dice cosa cambia per chi
legge, non quali percorsi sono stati rinominati.

### F6.4 — Documentazione di servizio

- `site/README.md` e `tenants/attestazione/site/README.md`: entrambi dichiarano
  oggi quali file sono generati e quali statici. Dopo P47 i file statici mantenuti
  a mano **stanno nel pacchetto del tenant**, non alla radice: aggiornare
  entrambi, e avvertire nel README del tenant che quella cartella non è più solo
  output generato.
- `README.md` (radice), §Struttura: le due righe che elencano il contenuto di
  `site/`.

**Criterio di accettazione F6**: nessun `grep` su gtf, imgauth, imgauthweb trova
riferimenti agli URL vecchi fuori da `CHANGELOG.md`, `content/changelog.yaml`
(voci storiche), `.baseline/` e i piani `P44`/`P45` — che sono cronaca di fatti
avvenuti e **non si riscrivono**.

---

## F7 — ⛔ Push e verifica live (Opus)

Richiede la conferma esplicita del gestore. Da qui in poi si tocca la produzione
di due siti pubblici e due repo esterni.

1. Ricapitolare al gestore, prima di qualunque push: cosa diventerà 404 per
   decisione, quali shim sono stati messi, e che l'impronta del PDF è invariata.
2. Push di `gtf` (un commit unico per il gate di §2, o una serie che si chiude
   nello stesso push). Il workflow `publish.yml` pubblica **prima** il tenant,
   **poi** la radice: è l'ordine che rende sicuro lo spostamento del PDF.
3. Attendere il workflow verde. Se fallisce, **non** ripushare alla cieca:
   leggere il log.
4. Verifica live, con `curl`, di **tutti** gli URL di §2.1 (devono dare 200) e di
   §2.2 (gli shim devono dare 200 e portare al nuovo indirizzo; il PDF alla
   radice deve dare 404 — è l'unico 404 atteso di tutto il piano).
5. Riscaricare il PDF dal **nuovo** URL e ricalcolarne lo SHA-256: deve essere
   `898ec9…de452`. È la verifica che conta più di tutte le altre.
6. Aprire in browser il Trust Center dell'attestazione e la radice, e controllare
   che i link del footer rispondano — non a vista sull'HTML: eseguendoli.
7. Push di `imgauthweb` e `imgauth` (F6.1), separati, ciascuno col proprio
   messaggio.
8. Eseguire per davvero il collettore (`npm run collect-evidence`) e verificare
   che `EVD-whitepaper-integrity` risulti verde con il nuovo URL. Leggerne
   l'output, non solo l'exit code: è la lezione di P44 F6.
9. Punteggio finale: 91/100, 10/10 indicatori. Se è cambiato, capire perché
   prima di dichiarare chiuso.

---

## 4. Riepilogo delle trappole

1. **Il PDF non si rigenera mai.** Si sposta con `git mv` e si ricontrolla
   l'impronta. Qualunque strumento che "ottimizzi" o riscriva il PDF distrugge
   il valore dell'attestazione.
2. **Evidenza e file nello stesso commit** (§2), altrimenti il collettore
   settimanale colora di rosso un'evidenza per colpa nostra.
3. **`site/changelog.html` è generato**: se il generatore continua a scriverlo,
   lo shim viene sovrascritto al primo build e nessuno se ne accorge.
4. **`rsync --delete`** sul tenant: un file statico che smette di essere
   committato sparisce dal sito pubblicato. Vale anche al contrario — è ciò che
   rende sicuro aggiungere lì i file statici.
5. **Il collettore committa da sé** il lunedì alle 06:00 UTC. Se è passato in
   mezzo alla migrazione, riconciliare prima di proseguire.
6. **`.baseline/` e i piani P44/P45 non si riscrivono**: sono la fotografia di
   com'erano le cose, e servono proprio a quello.
7. **Attribuzione ≠ rebranding**: se durante F5 viene la tentazione di rinominare
   il framework, è fuori perimetro per decisione esplicita.
8. **La pagina DevOps mantenuta a mano è una seconda fonte di verità** rispetto a
   `imgauth/docs/DEVOPS.md` — cioè esattamente ciò che PRN-03 vieta. Questo piano
   la sposta e la sfronda, **non** risolve la duplicazione: va annotata come
   debito aperto, non sanata di nascosto in F2.

---

## 5. Fuori perimetro (esplicito)

Clean URL anche per `whitepaper.html` (non richiesto, e romperebbe il link npm
anche sul nuovo host); traduzione inglese dei due contenuti spostati; rebranding
del prodotto (roadmap D3, dopo questo piano); risoluzione della duplicazione
DevOps HTML ↔ `DEVOPS.md`; secondo tenant RADART e la sua pagina DevOps propria
(P46); estrazione di `core/` come pacchetto (P48); qualunque modifica al
registro dei record.

---

## 6. Dopo P47

Resta aperto, in ordine di dipendenza: **P46** (RADART come secondo tenant, che
erediterà il pattern degli host e chiuderà la parte RADART tolta in F2),
**P48** (estrazione del motore come pacchetto proprio, dove l'attribuzione
scritta in F5 diventa il punto di partenza invece di una nota), e la decisione
D3 sul nome del prodotto.
