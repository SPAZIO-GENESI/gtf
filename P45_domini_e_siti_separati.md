# P45 — Domini e siti separati: la radice diventa il prodotto

> **Piano eseguibile.** Fasi in ordine, criteri di accettazione verificabili,
> ⛔ dove serve la conferma esplicita del gestore.
> Contesto e visione: [`docs/ROADMAP-trust-multiprogetto.md`](docs/ROADMAP-trust-multiprogetto.md).
> Prerequisito: **P44 chiuso** (`core/` ↔ `tenants/<id>/`, guardia CI attiva,
> versione per componente) — vedi [`P44_isolamento_core_tenant.md`](P44_isolamento_core_tenant.md).

---

## Guida al modello, fase per fase

| Fase | Modello | Perché |
|---|---|---|
| F0 — Ricognizione e baseline | **Sonnet** | sola lettura, comandi fissi |
| F1 — L'output del tenant si sposta | **Sonnet** | rinomina di percorsi, gate byte-identico |
| F2 — Il sito della radice | **Sonnet** | generatore nuovo, output dichiarato, nulla di pubblicato |
| F3 — ⛔ Repo di pubblicazione e token | **Opus** | crea un repo pubblico e un PAT: irreversibile verso l'esterno |
| F4 — ⛔ DNS e dominio custom | **Opus** | tocca il DNS di zona; un errore qui non si vede in locale |
| F5 — ⛔ Passaggio della radice | **Opus** | da qui `trust.spaziogenesi.org` cambia contenuto: è produzione |
| F6 — Consumatori ed evidenze | **Sonnet** | editing meccanico guidato dal doc |
| F7 — Documentazione | **Sonnet** | prosa su fatti già avvenuti |
| F7 — ⛔ push finale e verifica live | **Opus** | ripubblica entrambi i siti |

---

## 1. Obiettivo

Separare due cose che oggi condividono un host:

| Host | Cosa diventa |
|---|---|
| `trust.spaziogenesi.org` | **il prodotto** — cos'è il Trust Framework, come funziona, quali progetti lo applicano, con un **riepilogo breve dei punteggi** dei tenant |
| `attestazione.trust.spaziogenesi.org` | **il Trust Center dell'attestazione** — l'`index.html` ricco di oggi (242 KB: principi, requisiti, controlli, evidenze, rischi, decisioni, punteggio) |

### Decisioni del gestore già prese (15 agosto 2026)

- **D2 → opzione (a)**: repo Pages sottile per tenant, alimentato dal build del
  monorepo. È il pattern già rodato da `deploy-staging.yml` di imgauthweb verso
  `attestazione-staging`. Motivo: GitHub Pages ammette **un solo dominio custom
  per repository**, quindi il sottodominio non è ottenibile dal solo repo `gtf`;
  le alternative (Cloudflare Pages/Worker, o percorsi invece di sottodomini)
  toccherebbero proxy e CSP di zona o rinuncerebbero all'obiettivo.
- **La radice mostra anche un riepilogo breve dei punteggi dei tenant**, non solo
  la spiegazione del prodotto.

### Cosa **non** cambia

Nessun record del registro, nessuna formula, nessun punteggio, nessun endpoint,
nessun contenuto di `tenants/attestazione/`. Il punteggio dell'attestazione deve
restare **91/100 con 10/10 indicatori** dall'inizio alla fine.

---

## 2. Criterio globale — il gate che rende questo piano sicuro

**Nessun URL pubblico oggi esistente smette di rispondere.** Non è un auspicio:
è la lista qui sotto, da verificare con `curl` dopo ogni fase che tocca la
pubblicazione (F4, F5, F7).

| URL | Chi lo consuma | Regola in P45 |
|---|---|---|
| `trust.spaziogenesi.org/badge.svg` | **22 file** verificati: 18 pagine authweb (IT+EN), il template in `imgauthweb/scripts/build-integrazioni.mjs`, e i README di `imgauth`, `imgauthweb`, `gtf` | **resta e continua a mostrare 91/100** — la radice ne pubblica una copia generata (§F2.4) |
| `trust.spaziogenesi.org/whitepaper-v1.0.pdf` | `EVD-whitepaper-integrity` (ricalcola lo SHA-256 ogni settimana), la pagina pubblica di verifica `/c/898ec9…` e il README di `attest-mcp` | **non si sposta, non si duplica, non si rigenera** — resta il file committato di oggi |
| `trust.spaziogenesi.org/whitepaper.html` | footer del Trust Center, link esterni | resta sulla radice |
| `trust.spaziogenesi.org/devops.html` | footer del Trust Center, `imgauth/docs/DEVOPS.md` | resta sulla radice |
| `trust.spaziogenesi.org/changelog.html` | footer del Trust Center | resta sulla radice — il changelog è del **prodotto** (`content/changelog.yaml`), non del tenant |
| `trust.spaziogenesi.org/score.json` | nessun consumatore esterno noto, ma è pubblico | resta (copia, come il badge) |
| `trust.spaziogenesi.org/833b2eaa…txt` | verifica proprietà per i motori di ricerca | **non si tocca** |
| `trust.spaziogenesi.org/` | link esterni, footer authweb | cambia **contenuto** (è l'obiettivo), continua a rispondere 200 |

⚠️ **Con GitHub Pages non esiste un redirect server-side.** Un `.svg`, un `.pdf`
o un `.json` non si possono redirigere con un meta-refresh HTML: o il file
risponde a quell'URL, o è rotto. Per questo la regola sopra è "resta", non
"redirige".

### Perché `devops.html` e `whitepaper.html` restano sulla radice

Sono contenuto *dell'attestazione* ospitato sull'host del *prodotto*: una
piccola incoerenza concettuale, scelta di proposito. L'alternativa (spostarli
sul sottodominio con redirect dalla radice) aggiunge quattro pagine di redirect
e una copia del PDF con impronta attestata — cioè rischio reale su una catena di
prova pubblica, in cambio di ordine estetico. **Il debito è dichiarato qui e
sanabile in P47**, quando l'astrazione sarà corretta dal secondo tenant.

### Ordine obbligatorio dei rilasci

Il sottodominio **nasce, risponde e viene verificato prima** che la radice cambi
contenuto. Tra F4 e F5 il Trust Center risponde su entrambi gli host: nessun
istante in cui non è raggiungibile da nessuna parte. È lo stesso passo A/passo B
di P29 FASE 2 ("mai un 301 verso una pagina non ancora pubblicata").

---

## 3. Stato di partenza (verificato il 2026-08-15, dopo P44)

- `site/` contiene: `index.html` (242 KB, generato), `score.json` e `badge.svg`
  (generati), `changelog.html` (generato), `devops.html` e `whitepaper.html`
  (statici, mantenuti a mano), `whitepaper-v1.0.pdf` (statico), `README.md`,
  `833b2eaa595b8ad4fc09b6700bdcfe60.txt` (verifica motori di ricerca).
- Percorsi di output nel motore, **tutti** cablati su `ROOT/site`:
  `build-site.mjs:8` (`SITE_DIR`), `score.mjs:6` (`SITE_DIR`),
  `build-changelog.mjs:125` (`join(ROOT,"site","changelog.html")`).
- `publish.yml` pubblica `./site` con `upload-pages-artifact` + `deploy-pages`;
  filtri `paths:` su `tenants/**`, `core/**`, `content/**`,
  `default-tenant.json`, `site/**`, `package.json`, il workflow stesso.
- `site/` **non contiene un file `CNAME`**: il dominio custom della radice è
  configurato nelle impostazioni Pages del repo. Da non dimenticare in F4: con
  `upload-pages-artifact` il dominio custom **non** viene dall'artefatto.
- Punteggio **91/100**, 10/10 indicatori, 253 record, 0 errori.
- `collect-evidence.yml` fa `git add tenants/attestazione/snapshots/
  tenants/attestazione/registry/evidence/` — **hardcoded al tenant**. Non è in
  `core/`, quindi la guardia non lo intercetta. Generalizzarlo è **P46**: in P45
  non si tocca.

---

## F0 — Ricognizione e baseline (Sonnet)

1. Albero pulito, dipendenze installate, gate verde:
   ```bash
   npm ci
   npm run validate    # atteso: 253 record, 0 errori
   npm run build       # validate + check-core + score + build-site + build-changelog
   ```
2. Congela la baseline dell'output del tenant:
   ```bash
   mkdir -p .baseline
   cp site/index.html site/score.json site/badge.svg site/changelog.html .baseline/
   ```
   (`.baseline/` è già in `.gitignore` da P44.)
3. **Congela lo stato pubblico**, che è ciò che P45 promette di non rompere:
   ```bash
   for u in / /badge.svg /score.json /changelog.html /devops.html /whitepaper.html /whitepaper-v1.0.pdf; do
     printf "%s -> " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "https://trust.spaziogenesi.org$u"
   done
   curl -s https://trust.spaziogenesi.org/whitepaper-v1.0.pdf | sha256sum
   ```
   Attesi: **200 su tutti**, e SHA-256 del PDF
   `898ec96815e6bee1f85f93651fb64b6d1ad289510f4ac2fd9fbaa92fe01de452`.
   Annota gli esiti nel changelog (`component: framework`, `public: false`):
   sono il termine di paragone di F4, F5 e F7.

**Accettazione F0:** i quattro file in `.baseline/`, gli otto URL a 200, l'hash
del PDF invariato, `npm run validate` verde.

⚠️ Se il confronto dell'output fallisce più avanti solo su `MET-conservation` o
`MET-audit`: dipendono dalla data odierna. Rigenera la baseline con
`git stash push -u` / `npm run build && cp …` / `git stash pop`, come in P44 F0.

---

## F1 — L'output del tenant si sposta in `tenants/<id>/site/` (Sonnet)

Il sito del tenant smette di essere "il sito" e diventa "il sito di *quel*
tenant". **Niente di pubblicato cambia**: `publish.yml` continua a pubblicare
quel contenuto sulla radice.

### F1.1 — Sposta i file generati

```bash
mkdir -p tenants/attestazione/site
git mv site/index.html     tenants/attestazione/site/index.html
git mv site/score.json     tenants/attestazione/site/score.json
git mv site/badge.svg      tenants/attestazione/site/badge.svg
```

`changelog.html` **non si sposta**: è del prodotto, resta generato in `site/`
(vedi §2). `devops.html`, `whitepaper.html`, `whitepaper-v1.0.pdf`,
`833b2eaa…txt`, `README.md` **non si toccano**.

### F1.2 — Aggiorna i percorsi nel motore

- `core/generators/lib/tenant.mjs`: esporta `TENANT_SITE_DIR = join(TENANT_DIR,
  "site")`, con la stessa verifica di esistenza degli altri (`mkdirSync` con
  `recursive: true` se manca, oppure errore esplicito che stampa il percorso —
  **mai** un fallback silenzioso a `ROOT/site`).
- `core/generators/build-site.mjs:8` e `core/generators/score.mjs:6`:
  `SITE_DIR` viene da `TENANT_SITE_DIR`. Tieni il nome della costante invariato:
  meno righe toccate, meno occasioni di sbagliare.
- `core/generators/build-changelog.mjs`: **resta** su `join(ROOT, "site")`.
  Aggiungi un commento di una riga che dica perché (è il changelog del prodotto,
  non del tenant) — senza, la prossima sessione lo "correggerà" per simmetria.

### F1.3 — Il deploy continua a pubblicare il tenant sulla radice

In `publish.yml`, `upload-pages-artifact` › `path` da `./site` a
`./tenants/attestazione/site`… **no**: così si perderebbero `devops.html`,
`whitepaper.html`, il PDF e il changelog, che restano in `site/`.

Usa invece uno step di assemblaggio prima dell'upload, che compone la cartella
pubblicata **senza modificare i sorgenti**:

```yaml
      - name: Assembla il sito da pubblicare (transitorio: F1→F5)
        run: |
          cp tenants/attestazione/site/index.html  site/index.html
          cp tenants/attestazione/site/score.json  site/score.json
          cp tenants/attestazione/site/badge.svg   site/badge.svg
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./site
```

È esplicitamente **transitorio** e muore in F5: annotalo nel workflow con quel
commento, altrimenti resta lì per sempre e nessuno saprà se serve ancora.

### F1.4 — Gate byte-identico

```bash
npm run build
diff .baseline/index.html     tenants/attestazione/site/index.html && echo "index.html OK"
diff .baseline/badge.svg      tenants/attestazione/site/badge.svg  && echo "badge.svg OK"
diff .baseline/changelog.html site/changelog.html                  && echo "changelog.html OK"
node -e "const a=require('./.baseline/score.json'),b=require('./tenants/attestazione/site/score.json');delete a.computed_at;delete b.computed_at;const eq=JSON.stringify(a)===JSON.stringify(b);console.log(eq?'score.json OK':'score.json DIVERSO');if(!eq)process.exit(1)"
```

**Accettazione F1:** i quattro confronti verdi; `git status` mostra tre rinomini
(`R`) e nessun file cancellato e ricreato; `npm run check-core` pulito
(`TENANT_SITE_DIR` è un nome generico: se la guardia si lamenta, hai scritto un
nome di progetto da qualche parte); nessun `index.html`/`badge.svg`/`score.json`
residuo in `site/`.

---

## F2 — Il sito della radice (Sonnet)

Si costruisce la pagina del prodotto, **senza pubblicarla**. Alla fine di F2 il
sito online è ancora quello di oggi.

### F2.1 — `content/site.config.json`

Configurazione della radice, sullo stesso modello di `tenant.config.json`
(roadmap §6). Contiene almeno:

```json
{
  "version": "1.0.0",
  "language": "it",
  "title": "…",
  "eyebrow": "…",
  "heading": "…",
  "thesis_html": "…",
  "sections": [ { "heading": "…", "body_html": "…" } ],
  "compat": {
    "badge_from_tenant": "attestazione",
    "score_from_tenant": "attestazione"
  },
  "footer_columns": [ … ],
  "footer_note_html": "…"
}
```

⚠️ Il blocco `compat` è la ragione per cui `badge.svg` non si rompe. Non è un
dettaglio implementativo: è un **impegno pubblico**, e va commentato come tale
nel file. Quando ci saranno due tenant, la domanda "quale punteggio mostra il
badge della radice?" avrà già una risposta scritta.

I testi del prodotto li scrive chi esegue la fase, **senza nominare
Tangram.page**: la roadmap (D3) rinvia il rebranding a dopo P47 e nota che
pubblicare quel nome è una comunicazione di posizionamento riservata al gestore.
Descrivi cosa il framework fa, non come si chiamerà.

### F2.2 — `core/generators/build-root.mjs`

- legge `content/site.config.json`;
- enumera `tenants/*/tenant.config.json` e, per ciascuno, legge
  `tenants/<id>/site/score.json` se esiste;
- se `score.json` manca per un tenant, **lo salta con un avviso su stderr** e
  prosegue (un tenant appena creato non deve rompere la radice);
- scrive `site/index.html`: intestazione del prodotto, sezioni esplicative, e il
  **riepilogo dei tenant** — una scheda per tenant con nome, punteggio,
  indicatori disponibili (`available_count`/`total`), versione del pacchetto e
  link al proprio Trust Center;
- riusa `lib/style.mjs` e `lib/render.mjs` (`esc`, `para`,
  `renderFooterColumns`): **non** duplicare stile o helper — è la lezione di
  `beta.html`, e in P44 F4 aveva già rischiato di rigenerare `index.html` come
  effetto collaterale;
- mostra nel footer `motore vX · sito prodotto vY`, come il footer del tenant.

⚠️ **`build-root.mjs` sta in `core/` e la guardia lo scandisce**: ogni nome di
progetto deve venire da `site.config.json` o dai `tenant.config.json`, mai da una
costante. Il link al Trust Center di ciascun tenant va letto dal tenant, non
costruito con una regola tipo `<id>.trust.…` (in P46 un tenant potrebbe avere un
host diverso). Aggiungi quindi a `tenants/attestazione/tenant.config.json`:

```json
"site": { …, "public_url": "https://attestazione.trust.spaziogenesi.org" }
```

### F2.3 — Aggancio al build

- nuovo script `"build-root": "node core/generators/build-root.mjs"`;
- inseriscilo in `build` **dopo** `build-site` (legge gli `score.json` che quello
  ha appena scritto);
- `site/README.md`: aggiorna l'elenco dei generati — ora `site/` è l'output della
  **radice**, e i file del tenant vivono in `tenants/<id>/site/`.

### F2.4 — La copia di compatibilità

`build-root.mjs`, dopo aver scritto `index.html`, copia in `site/`:

- `tenants/<compat.badge_from_tenant>/site/badge.svg` → `site/badge.svg`
- `tenants/<compat.score_from_tenant>/site/score.json` → `site/score.json`

Se il tenant indicato non esiste, **fallisci con un messaggio esplicito**: un
badge mancante sulla radice è un danno di fiducia su 22 punti pubblici, non un
warning da ignorare.

**Accettazione F2:** `npm run build` verde; `site/index.html` è la pagina del
prodotto e mostra la scheda dell'attestazione con **91/100 e 10/10**;
`site/badge.svg` è **byte-identico** a `.baseline/badge.svg`;
`npm run check-core` pulito; le pagine statiche in `site/` sono intatte.
Verifica il rendering aprendo il file in un browser (non solo l'HTML a occhio):
la scheda del tenant deve essere **visibile e leggibile**, con bounding box
sensato anche a 390px — memoria `test-dom-presence-vs-visual-position`.

---

## F3 — ⛔ Repo di pubblicazione e token (Opus)

Da qui si tocca l'esterno. **Conferma esplicita del gestore prima di eseguire.**

### F3.0 — Decisione da raccogliere

**Nome del repo di pubblicazione.** Raccomandazione: `trust-attestazione`
(leggibile, dice cosa contiene, non collide con `attestazione-staging`).
Il gestore decide anche se pubblico (raccomandato: sì — ospita un Trust Center
pubblico, e un repo privato non può servire Pages sul piano gratuito).

### F3.1 — Il repo

1. Crea `SPAZIO-GENESI/<nome>`, pubblico, con un `README.md` di due righe che
   dica **"repo di sola pubblicazione: il contenuto è generato da `gtf`, non
   modificarlo qui"**. È la stessa avvertenza dei file generati, applicata a un
   repo intero.
2. Abilita GitHub Pages sul branch `main`, cartella radice. In questa fase il
   sito risponde su `spazio-genesi.github.io/<nome>/` — sottopercorso, quindi
   **i percorsi assoluti dell'HTML saranno rotti**: è atteso e si risolve da sé
   in F4 col dominio custom. Non "aggiustarli" (P24 FASE 7 dovette riscriverli
   proprio perché lì il sottopercorso era definitivo; qui non lo è).

### F3.2 — Il token

PAT **fine-grained**, scoped **solo** su quel repo, permesso `Contents:
Read/write`, scadenza annotata nel caveau. Salvalo come secret
`TRUST_TENANT_DEPLOY_TOKEN` sul repo `gtf`. Stesso schema di
`STAGING_DEPLOY_TOKEN` in imgauthweb.

### F3.3 — Il job di pubblicazione

Nuovo job in `publish.yml` (o workflow separato `publish-tenants.yml`, se
preferisci tenere distinti i due bersagli), che dopo il build:

- prende `tenants/attestazione/site/`;
- vi aggiunge un file `CNAME` con `attestazione.trust.spaziogenesi.org`
  (GitHub Pages da branch **legge** il `CNAME` nella cartella pubblicata: qui
  serve davvero, a differenza della radice);
- pusha nel repo sottile con `git push` diretto usando il PAT — **niente action
  di terze parti**, come in `deploy-staging.yml` di imgauthweb.

⚠️ Il push deve essere una **sostituzione completa** del contenuto, non un
merge: un file rimasto da un build precedente non sparirebbe mai.

**Accettazione F3:** il repo esiste con l'avvertenza nel README; un run manuale
del workflow pubblica il contenuto; `spazio-genesi.github.io/<nome>/` risponde
200 e mostra il Trust Center (con stile rotto dai percorsi assoluti: **atteso**);
`trust.spaziogenesi.org` è ancora identico a F0 (otto URL a 200, hash del PDF
invariato).

---

## F4 — ⛔ DNS e dominio custom (Opus)

**Conferma esplicita del gestore.** Passo guidato: il DNS lo tocca lui, una
istruzione alla volta (memoria `walkthrough-portali-esterni-passo-passo`).

1. Su Cloudflare, zona `spaziogenesi.org`: record **CNAME**
   `attestazione.trust` → `spazio-genesi.github.io`, **DNS-only (grigio)**,
   come già `trust`.
   ⚠️ **Non proxare.** `attestazione.trust.spaziogenesi.org` è un dominio di
   quarto livello: l'Universal SSL di Cloudflare copre `*.spaziogenesi.org` per
   **un solo livello**, quindi dietro il proxy servirebbe un certificato
   Advanced. In DNS-only il certificato lo emette GitHub (Let's Encrypt) e non
   c'è problema. Corollario: quell'host **non riceve** gli header di sicurezza
   di zona, esattamente come `trust` oggi — se un giorno lo si vuole proxare,
   prima bonifica dal JS inline e sweep verde di tutte le pagine (la lezione dei
   sette microsi­ti rotti il 16/7).
2. Nelle impostazioni Pages del repo sottile, imposta il dominio custom
   `attestazione.trust.spaziogenesi.org` e attendi che compaia **Enforce
   HTTPS** (il certificato può richiedere qualche minuto).
3. Verifica dal vivo:
   ```bash
   for u in / /badge.svg /score.json; do
     printf "%s -> " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "https://attestazione.trust.spaziogenesi.org$u"
   done
   ```
   e apri la pagina in un browser: stile corretto (i percorsi assoluti ora
   risolvono), badge visibile, punteggio 91/100.

⚠️ **I link `/devops.html`, `/whitepaper.html` e `/changelog.html` nel footer del
Trust Center daranno 404 su questo host** — sono percorsi assoluti verso file che
vivono sulla radice. È atteso in F4 e si corregge in **F6.1**. Non correggerlo
qui: F6 lo fa insieme al resto, con un solo giro di verifica.

**Accettazione F4:** il sottodominio risponde in HTTPS con la pagina corretta;
`trust.spaziogenesi.org` è **ancora** quello di F0 (riesegui il blocco degli otto
URL e l'hash del PDF). Da questo momento il Trust Center risponde su due host:
è la finestra sicura in cui F5 può agire.

---

## F5 — ⛔ Il passaggio della radice (Opus)

**Conferma esplicita del gestore.** È il momento in cui `trust.spaziogenesi.org`
cambia contenuto.

1. In `publish.yml`: **elimina** lo step di assemblaggio transitorio di F1.3.
   `upload-pages-artifact` continua a pubblicare `./site`, che ora contiene
   l'`index.html` del prodotto (F2), il badge e lo score copiati per
   compatibilità (F2.4), e le pagine statiche mai spostate.
2. Push su `main` → il deploy riparte.
3. Verifica **immediata** dal vivo, con lo stesso blocco di F0:
   ```bash
   for u in / /badge.svg /score.json /changelog.html /devops.html /whitepaper.html /whitepaper-v1.0.pdf; do
     printf "%s -> " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "https://trust.spaziogenesi.org$u"
   done
   curl -s https://trust.spaziogenesi.org/whitepaper-v1.0.pdf | sha256sum
   curl -s https://trust.spaziogenesi.org/badge.svg | grep -o '91'
   ```
   Attesi: **200 ovunque**, hash `898ec9…de452` invariato, badge che dice ancora
   91. Poi apri la radice in un browser: pagina del prodotto, scheda del tenant
   con punteggio, link al sottodominio funzionante.

**Se qualcosa non torna:** `git revert` del commit e ripubblicazione. Il
sottodominio resta in piedi comunque — è già indipendente da F4, ed è la ragione
per cui l'ordine è questo.

**Accettazione F5:** i sette URL a 200, hash del PDF invariato, badge a 91, la
radice mostra il prodotto, il sottodominio mostra il Trust Center.

---

## F6 — Consumatori ed evidenze (Sonnet)

Ora che entrambi gli host rispondono, si allinea tutto ciò che vi punta.

### F6.1 — I link interni del Trust Center

In `tenants/attestazione/tenant.config.json`, i tre link del footer che oggi sono
percorsi assoluti (`/devops.html`, `/whitepaper.html`, `/changelog.html`)
diventano **URL assolute verso la radice**
(`https://trust.spaziogenesi.org/…`): quei file vivono lì (§2).
Verifica anche `<img src="/badge.svg">` nel footer generato
(`build-site.mjs:245`): quello **resta relativo** ed è corretto, perché il badge
del tenant è pubblicato accanto alla sua pagina.

Aggiungi al footer del tenant un link alla radice ("Il framework"), e alla radice
il link al Trust Center di ciascun tenant (già in F2.2): i due siti devono
rimandarsi a vicenda, altrimenti chi arriva su uno non sa che esiste l'altro.

### F6.2 — Le evidenze del registro

Cerca nel registro del tenant i riferimenti a `trust.spaziogenesi.org`:

```bash
grep -rn "trust\.spaziogenesi\.org" tenants/attestazione/registry/ core/ content/
```

- `EVD-whitepaper-integrity` punta a `trust.spaziogenesi.org/whitepaper-v1.0.pdf`
  → **non si tocca**, quell'URL non si è mosso (verificalo, non assumerlo).
- `collector.trust_base` in `tenant.config.json` → verifica a cosa serve
  davvero in `collect-evidence.mjs` prima di cambiarlo: se raccoglie evidenze
  sul **Trust Center del tenant**, ora deve puntare al sottodominio; se
  raccoglie il whitepaper, resta sulla radice. Sono due cose diverse sotto lo
  stesso nome: separale in due chiavi se necessario.
- Qualunque record che descriva "il Trust Center è pubblicato su
  trust.spaziogenesi.org" va aggiornato: è una **descrizione di come funziona un
  controllo**, e se mente il registro perde valore.

Poi **esegui davvero il collettore** (`npm run collect-evidence`, e in CI a mano
dopo il push): P44 F6 ha scoperto proprio così che era rotto da tre fasi, in un
punto invisibile a tutti i gate. Un collettore che non gira non è verificato.

### F6.3 — I consumatori esterni

**Non aggiornarli**, tranne dove il testo diventa falso. Il badge risponde ancora
sulla radice per impegno esplicito (§2), quindi i 22 riferimenti in authweb,
imgauth e gtf **restano validi**. Cambiare 22 file per ordine estetico significa
22 occasioni di sbagliare in cambio di nulla.

Aggiorna invece i punti dove la **prosa** dice qualcosa di non più vero — per
esempio un README che descriva `trust.spaziogenesi.org` come "il Trust Center del
servizio di attestazione": ora quello è il sottodominio. Cerca:

```bash
grep -rn "trust\.spaziogenesi\.org" ../imgauth/README.md ../imgauthweb/README.md ../attest-mcp/README.md README.md
```

⚠️ Ogni repo ha il suo git: un commit per repo, e il push su repo diversi da
`gtf` richiede una conferma a sé.

**Accettazione F6:** nessun 404 nei link del footer su **entrambi** gli host
(verifica cliccando, non leggendo l'HTML); `npm run collect-evidence` verde;
`npm run validate` verde; punteggio invariato **91/100, 10/10**.

---

## F7 — Documentazione e chiusura

### Scrittura (Sonnet)

- **`ARCHITECTURE.md` → v0.3.0**: §7 (il Trust Center è per tenant, e ha un host
  proprio), §15 (aggiungi la topologia dei siti: radice = prodotto, un
  sottodominio per tenant, il repo di pubblicazione sottile e perché esiste).
  Includi la **tabella degli URL immobili** di §2: è la cosa che una sessione
  futura deve trovare prima di toccare qualunque percorso.
- **`README.md`** del repo: struttura dei due output (`site/` e
  `tenants/<id>/site/`), i due comandi di build, il ruolo del repo sottile.
- **`site/README.md`** e un nuovo `tenants/attestazione/site/README.md`: cosa
  genera cosa.
- **`content/changelog.yaml`**: una voce `public: true` — il Trust Center
  dell'attestazione ha un indirizzo proprio, la radice racconta il framework.
- **`CLAUDE.md` di `img-auth-hub`**, sezione P20: due righe sui due host. Non
  riscrivere la storia.
- **Registro**: `ADR-GTF-015` — *Un host per tenant, la radice al prodotto*.
  Contesto (un solo host per due cose diverse; Pages ammette un dominio custom
  per repo), decisione (repo di pubblicazione sottile + sottodominio DNS-only +
  URL immobili sulla radice), conseguenze (il secondo tenant costa un repo e un
  record DNS; `devops.html`/`whitepaper.html` restano sulla radice come debito
  dichiarato). Stile sobrio. Valuta se serve un **RSK** per la nuova dipendenza
  (un PAT che scade e un repo in più da mantenere): se lo aggiungi, aggiungilo
  perché è un rischio reale, non per completezza formale.

### ⛔ Push finale e verifica live (Opus)

Prima di chiedere la conferma:

1. `npm run validate`, `npm run check-core`, `npm run build` verdi da albero
   pulito;
2. i filtri `paths:` di `publish.yml` includono **tutto** ciò che ora influenza
   l'output: `content/**` (c'è dal fix di P44 F6) e il nuovo
   `content/site.config.json` vi ricade — ma **verificalo**, è la trappola che in
   P44 ha già colpito due volte e si manifesta come un deploy che non parte, in
   silenzio, senza che nulla diventi rosso;
3. il collettore non è passato a metà lavoro (nessun commit `chore: snapshot
   evidenze …` inatteso).

Dopo il push, riesegui **entrambi** i blocchi di verifica (radice e
sottodominio), più l'hash del PDF. Poi lancia a mano *Collect evidence snapshot*
e controlla che finisca verde e committi nei percorsi giusti.

⚠️ **Debito noto, non risolto da P45**: i commit del collettore usano il
`GITHUB_TOKEN` di default, che **non innesca altri workflow** — dopo `chore:
snapshot evidenze` né la radice né il sottodominio si aggiornano da soli.
Peggiora leggermente con due bersagli. Se il gestore vuole automatizzarlo servono
un PAT o un trigger `workflow_run`: è una decisione a sé, non un pezzo di P45.

---

## 4. Riepilogo delle trappole

1. **Con Pages non esistono redirect server-side**: `.svg`, `.pdf` e `.json` o
   rispondono a quell'URL o sono rotti.
2. **`badge.svg` è su 22 punti pubblici** (18 pagine authweb + un template + 3
   README): deve continuare a rispondere sulla radice e a dire 91/100.
3. **Il PDF del whitepaper ha un'impronta attestata** verificata ogni settimana:
   quell'URL non si sposta e il file non si rigenera. Una copia in più è una
   copia che può divergere.
4. **Il dominio custom della radice non sta nell'artefatto** (`upload-pages-
   artifact`): vive nelle impostazioni Pages. Il repo sottile invece pubblica da
   branch e **ha bisogno del file `CNAME`** nella cartella.
5. **Non proxare il sottodominio su Cloudflare**: quarto livello, Universal SSL
   copre un livello solo.
6. **Percorsi assoluti**: su `spazio-genesi.github.io/<nome>/` (F3) lo stile
   sembra rotto — è atteso e sparisce col dominio custom. Non "aggiustarlo".
7. **`/devops.html`, `/whitepaper.html`, `/changelog.html` daranno 404 sul
   sottodominio** finché F6.1 non li rende URL assolute verso la radice.
8. **`build-root.mjs` sta in `core/`**: nessun nome di progetto, o la guardia
   fallisce. L'URL pubblica di un tenant si legge dal tenant, non si costruisce
   con una regola.
9. **Lo step di assemblaggio di F1.3 è transitorio** e muore in F5: commentalo
   come tale o resterà per sempre.
10. **`collect-evidence.yml` è hardcoded su `tenants/attestazione/`**: è P46, in
    P45 non si tocca.
11. **Il collettore va eseguito davvero**, non solo letto: in P44 era rotto da
    tre fasi senza che nessun gate se ne accorgesse.
12. **Il push su `main` di `gtf` è produzione** (ripubblica il sito): richiede
    conferma esplicita, sempre.
13. **OneDrive** può bloccare `git mv`: ritenta, non toccare la configurazione di
    git (memoria `onedrive-git-reflog-lock`).

---

## 5. Fuori perimetro (esplicito)

Secondo tenant RADART e policy di visibilità per repo privati (→ P46);
correzione dell'astrazione dopo il secondo tenant (→ P47); estrazione di `core/`
come pacchetto (→ P48); rebranding del nome del prodotto (D3, dopo P47);
spostamento di `devops.html`/`whitepaper.html` sul sottodominio (debito
dichiarato in §2); generalizzazione di `collect-evidence.yml`; traduzione
inglese del Trust Center; feed `trust.json`; migrazione degli snapshot su R2.

Nessuno di questi entra in P45. La tentazione di "già che ci siamo" è ciò che
trasforma una migrazione ordinata in un incidente.

---

## 6. Dopo P45

P46 (RADART come secondo tenant), P47 (correzione dell'astrazione), P48
(estrazione del prodotto). Vedi la roadmap. **Non incatenare le fasi né i piani
di propria iniziativa**: a fine P45 ci si ferma e si aspetta un nuovo via libera
(memoria `fermarsi-tra-fasi-design-doc`).
