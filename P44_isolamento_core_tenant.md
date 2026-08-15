# P44 — Isolamento core ↔ tenant: le fondamenta multi-progetto

> **Piano eseguibile.** Fasi in ordine, criteri di accettazione verificabili,
> ⛔ dove serve la conferma esplicita del gestore.
> Contesto e visione: [`docs/ROADMAP-trust-multiprogetto.md`](docs/ROADMAP-trust-multiprogetto.md).
> Numerazione: continua la sequenza unica dell'ecosistema (P0–P43 in
> `img-auth-hub`); gli ADR del registro restano su `ADR-GTF-nnn`.

---

## Guida al modello, fase per fase

| Fase | Modello | Perché |
|---|---|---|
| F0 — Baseline | **Sonnet** | sola lettura, comandi fissi |
| F1 — Config del tenant | **Sonnet** | editing meccanico guidato dal doc, gate byte-identico |
| F2 — Spostamento dei dati | **Sonnet** | `git mv` + aggiornamento percorsi, gate byte-identico |
| F3 — Motore in `core/` + guardia CI | **Sonnet** | stesso lavoro di F2, gate byte-identico |
| F4 — Changelog a doppia resa | **Sonnet** | generatore nuovo, output dichiarato |
| F5 — Versione per componente | **Sonnet** | tre stringhe e un footer |
| F6 — Documentazione | **Sonnet** | prosa su fatti già avvenuti |
| F6 — ⛔ push e verifica live | **Opus** | il push su `main` fa partire il deploy di GitHub Pages: è produzione |

---

## 1. Obiettivo

Separare **motore** e **dati** dentro il repo `gtf`, in modo che il motore non
sappia più nulla del progetto a cui è applicato, e che i dati del progetto
"attestazione" vivano in un pacchetto proprio.

**Non** cambia niente di ciò che è pubblicato: nessun dominio, nessun record,
nessun punteggio, nessun endpoint. L'unica cosa che l'utente vedrà comparire è
la nuova pagina *changelog* (F4) e due numeri di versione nel footer (F5).

### Criterio globale — il gate che rende questo piano sicuro

Alla fine di **F1, F2 e F3** il sito rigenerato deve essere **identico** a quello
di partenza:

- `site/index.html` e `site/badge.svg` → **byte per byte**;
- `site/score.json` → identico **ignorando il solo campo `computed_at`**
  (cambia a ogni esecuzione, è un orologio, non un dato).

Baseline di riferimento: **91/100, 10/10 indicatori, 252 record, 0 errori.**

Se il confronto non torna, **non si prosegue**: si trova la causa. Questo gate è
l'intera assicurazione del piano — un refactoring che non cambia l'output è un
refactoring che non ha rotto niente.

### Fuori perimetro (esplicito)

Domini e sottodomini (→ P45), secondo tenant RADART (→ P46), estrazione di
`core/` come repo o pacchetto npm (→ P48), rebranding del nome, traduzione
inglese, migrazione degli snapshot su R2. Non anticiparne nemmeno un pezzo: la
tentazione di "già che ci siamo" è ciò che trasforma un refactoring sicuro in
un incidente.

---

## 2. Stato di partenza (verificato il 2026-08-15)

- 252 record YAML in `registry/`, 8 cartelle settimana in `snapshots/` più `anchors/`.
- Punteggio **91/100**, 10/10 indicatori disponibili.
- 67 riferimenti al progetto attestazione nei generatori, così distribuiti:
  `collect-evidence.mjs` 34 · `build-site.mjs` 19 · `scan-privacy.mjs` 5 ·
  `score.mjs` 4 · `anchor-monthly.mjs` 2 · `check-cadences.mjs` 2 ·
  `scan-scorecard.mjs` 1. **Zero** in `validate.mjs`, `lib/registry.mjs`, `schemas/`.
- Ultimo commit su `main` in cima; albero pulito.

---

## F0 — Baseline (Sonnet)

1. Aggiungi `.baseline/` a `.gitignore` (serve subito: le fasi seguenti usano
   `git stash -u`, che **non** tocca i file ignorati — se non lo ignori, la
   baseline verrebbe stashata insieme alle modifiche e il confronto sarebbe
   impossibile).
2. Verifica lo stato di partenza:
   ```bash
   npm ci
   npm run validate    # atteso: "Registro GTF valido: 252 record, 0 errori."
   npm run build       # validate + score + build-site
   ```
3. Congela la baseline:
   ```bash
   mkdir -p .baseline
   cp site/index.html site/score.json site/badge.svg .baseline/
   ```
4. Annota in `content/changelog.yaml` (voce `component: framework`,
   `public: false`) il punteggio e il numero di record letti.

**Accettazione:** `.baseline/` contiene i tre file; `npm run validate` verde;
punteggio 91/100 con 10/10 indicatori.

### Come si confronta (usa questo blocco in F1, F2, F3)

```bash
npm run build
diff .baseline/index.html site/index.html && echo "index.html OK"
diff .baseline/badge.svg  site/badge.svg  && echo "badge.svg OK"
node -e "const a=require('./.baseline/score.json'),b=require('./site/score.json');delete a.computed_at;delete b.computed_at;const eq=JSON.stringify(a)===JSON.stringify(b);console.log(eq?'score.json OK':'score.json DIVERSO');if(!eq)process.exit(1)"
```

⚠️ **Se il confronto fallisce solo su `MET-conservation` o `MET-audit`**: quei
due indicatori dipendono dalla data odierna (settimane presenti nelle ultime 8,
giorni dall'ultima revisione). Se nel frattempo è passata la mezzanotte o è
iniziata una nuova settimana ISO, la baseline è vecchia, non il codice. In quel
caso rigenerala dal codice **prima** delle modifiche, nello stesso momento:

```bash
git stash push -u -m "P44 wip"
npm run build && cp site/index.html site/score.json site/badge.svg .baseline/
git stash pop
```

---

## F1 — La configurazione del tenant (Sonnet)

Nessun file si sposta ancora. Si estraggono **tutte** le costanti di progetto
dai generatori e si spostano in un file di configurazione, che i generatori
leggono.

### F1.1 — Crea `tenants/attestazione/tenant.config.json`

Copia esattamente questo contenuto. Ogni valore è preso dal codice attuale: **non
riscriverne nessuno a memoria**, e non "migliorare" testi o URL — qualunque
differenza rompe il gate byte-identico.

```json
{
  "id": "attestazione",
  "version": "1.0.0",
  "name": "Attestazione delle opere digitali",
  "owner": "Spazio Genesi ETS",
  "language": "it",

  "site": {
    "title": "Trust Center — Genesis Trust Framework",
    "eyebrow": "Genesis Trust Framework",
    "heading": "Il registro della fiducia di Spazio Genesi ETS",
    "thesis_html": "Perché <a href=\"https://attestazione.spaziogenesi.org\">attestazione.spaziogenesi.org</a>\n    merita fiducia — con evidenze verificabili, non dichiarazioni.",
    "metrics_url": "https://github.com/SPAZIO-GENESI/gtf/tree/main/registry/metrics",
    "badge_alt": "Genesis Trust Score",
    "nav_external": [
      { "label": "Stato dei servizi ↗", "href": "https://attestazione.spaziogenesi.org/status/" },
      { "label": "Changelog ↗", "href": "https://attestazione.spaziogenesi.org/changelog/" }
    ],
    "footer_columns": [
      {
        "heading": "Il registro",
        "links": [
          { "label": "Codice sorgente (GTF)", "href": "https://github.com/SPAZIO-GENESI/gtf" },
          { "label": "Registro pubblico", "href": "https://github.com/SPAZIO-GENESI/gtf/tree/main/registry" },
          { "label": "Formula del punteggio", "href": "https://github.com/SPAZIO-GENESI/gtf/tree/main/registry/metrics" },
          { "label": "DevOps e rilasci", "href": "/devops.html" },
          { "label": "Whitepaper tecnico", "href": "/whitepaper.html" }
        ]
      },
      {
        "heading": "Il servizio di attestazione",
        "links": [
          { "label": "Attesta e verifica", "href": "https://attestazione.spaziogenesi.org" },
          { "label": "Stato dei servizi", "href": "https://attestazione.spaziogenesi.org/status/" },
          { "label": "Cronologia dei miglioramenti", "href": "https://attestazione.spaziogenesi.org/changelog/" },
          { "label": "Sviluppatori: API &amp; MCP", "href": "https://attestazione.spaziogenesi.org/developer/" },
          { "label": "Privacy", "href": "https://attestazione.spaziogenesi.org/privacy.html" }
        ]
      },
      {
        "heading": "Codice open source",
        "links": [
          { "label": "imgauth (motore)", "href": "https://github.com/SPAZIO-GENESI/imgauth" },
          { "label": "imgauthweb (interfaccia)", "href": "https://github.com/SPAZIO-GENESI/imgauthweb" },
          { "label": "autart-signer (firma)", "href": "https://github.com/SPAZIO-GENESI/autart-signer" },
          { "label": "attest-mcp (server MCP)", "href": "https://github.com/SPAZIO-GENESI/attest-mcp" }
        ]
      }
    ],
    "footer_note_html": "Genesis Trust Framework · pagina generata automaticamente dal\n      <a href=\"https://github.com/SPAZIO-GENESI/gtf\">registro pubblico</a> —\n      nessun testo di questa pagina è scritto a mano (principio PRN-03)."
  },

  "score": {
    "birth_month": "2026-07",
    "release_tag_repos": ["imgauth", "imgauthweb", "autart-signer"],
    "governance_note_reference": "ADR-GTF-011",
    "privacy_repo_label": "imgauth",
    "privacy_note_scope": "non copre repo client (es. bot Telegram)"
  },

  "collector": {
    "api_base": "https://imgauth.spaziogenesi.org",
    "site_base": "https://attestazione.spaziogenesi.org",
    "trust_base": "https://trust.spaziogenesi.org",
    "github_owner": "SPAZIO-GENESI",
    "registry_repo": "gtf",
    "code_repos": [
      { "repo": "imgauth", "snapshot": "git-imgauth", "evidence": "EVD-git-imgauth" },
      { "repo": "imgauthweb", "snapshot": "git-imgauthweb", "evidence": "EVD-git-imgauthweb" },
      { "repo": "autart-signer", "snapshot": "git-authart", "evidence": "EVD-git-authart" }
    ],
    "tag_repos": ["imgauth", "imgauthweb", "autart-signer"],
    "monitor_repo": "imgauth",
    "monitor_label": "status-alert",
    "prod_gate_repo": "imgauth",
    "prod_gate_workflow": "ci.yml",
    "prod_gate_job": "deploy-production",
    "changelog_url": "https://attestazione.spaziogenesi.org/changelog/",
    "admin_url": "https://imgauth.spaziogenesi.org/admin",
    "admin_expected_redirect": "cloudflareaccess.com",
    "security_headers_urls": {
      "attestazione": "https://attestazione.spaziogenesi.org/",
      "imgauth": "https://imgauth.spaziogenesi.org/ping"
    },
    "security_txt_urls": {
      "attestazione": "https://attestazione.spaziogenesi.org/.well-known/security.txt",
      "imgauth": "https://imgauth.spaziogenesi.org/.well-known/security.txt"
    },
    "badge_url_template": "https://imgauth.spaziogenesi.org/api/badge?hash={hash}",
    "badge_ok_marker": "✓ opera attestata",
    "whitepaper": {
      "url": "https://trust.spaziogenesi.org/whitepaper-v1.0.pdf",
      "sha256": "898ec96815e6bee1f85f93651fb64b6d1ad289510f4ac2fd9fbaa92fe01de452"
    }
  },

  "privacy_scan": {
    "code_repo": "SPAZIO-GENESI/imgauth",
    "schema_dir": "schema",
    "worker_file": "worker.js",
    "tags_snapshot": "tags-imgauth.json",
    "map_file": "privacy-map.json",
    "sensitive_column_pattern": "email|owner|member|name|user|phone|address|customer",
    "storage_prefixes": [
      { "id": "r2:pdf", "pattern": "`pdf\\/" },
      { "id": "r2:ots", "pattern": "`ots\\/" },
      { "id": "r2:meta/cert", "pattern": "`meta\\/cert\\/" },
      { "id": "r2:integrations", "pattern": "`integrations\\/" },
      { "id": "r2:status", "pattern": "[\"'`]status\\/" },
      { "id": "r2:meta-counters", "pattern": "[\"'`]meta\\/(agent-403-count|cert-count)[\"'`]" }
    ]
  },

  "scorecard": {
    "repos": ["SPAZIO-GENESI/imgauth", "SPAZIO-GENESI/imgauthweb", "SPAZIO-GENESI/autart-signer"]
  },

  "operations": {
    "attestation_site": "attestazione.spaziogenesi.org",
    "processes_url": "https://github.com/SPAZIO-GENESI/gtf/tree/main/registry/processes"
  }
}
```

### F1.2 — Il caricatore

Crea `generators/lib/tenant.mjs`:

- esporta `loadTenant(id)` che legge `tenants/<id>/tenant.config.json`;
- l'id viene da `process.env.GTF_TENANT`, con **default `"attestazione"`**
  (finché c'è un solo tenant nessun comando cambia);
- se il file non esiste, **fallisci subito** con un messaggio che dice quale
  percorso è stato cercato — mai un default silenzioso, mai un `{}`;
- esporta anche `TENANT_DIR`, `TENANT_REGISTRY_DIR`, `TENANT_SNAPSHOTS_DIR`
  (in F1 puntano ancora ai percorsi vecchi alla radice: li sposta F2).

### F1.3 — Riscrivi i sette generatori

Un file alla volta, ricontrollando il gate dopo ognuno (così, se salta, sai
quale file l'ha rotto).

| File | Cosa sostituire |
|---|---|
| `build-site.mjs` | titolo, eyebrow, h1, tesi, `lang`, link della barra di navigazione, tre colonne del footer, nota finale, URL delle metriche nella nota del ledger |
| `collect-evidence.mjs` | tutti gli URL e i nomi di repo → `cfg.collector.*`; l'elenco `code_repos` diventa un ciclo, non tre blocchi copiati |
| `score.mjs` | `GTF_BIRTH_MONTH`, l'array dei tre repo, le note di governance e privacy |
| `scan-privacy.mjs` | `IMGAUTH_REPO`, `SENSITIVE_COLUMN`, `R2_PREFIXES`, percorso di `privacy-map.json` |
| `scan-scorecard.mjs` | `REPOS` |
| `anchor-monthly.mjs` | le due righe di istruzioni che nominano il sito |
| `check-cadences.mjs` | il suggerimento dell'ancoraggio e l'URL dei processi |

**Quattro trappole che rompono il gate se le sbagli:**

1. **Interpolazione grezza, non escapata**, per `thesis_html`,
   `footer_note_html` e le etichette del footer. Oggi quei testi finiscono nel
   template **senza** passare da `esc()`: contengono già HTML valido
   (`<a href…>`) ed entità già scritte (`Sviluppatori: API &amp; MCP`). Se le
   passi da `esc()`, `&amp;` diventa `&amp;amp;` e il confronto salta.
2. **Gli a capo e l'indentazione contano.** `thesis_html` e `footer_note_html`
   contengono `\n` seguiti da spazi: sono nell'HTML di oggi. Il JSON sopra li
   ha già; non riformattarli.
3. **La nota di `privacyRatio`** deve continuare a produrre la stringa esatta
   `scanner su imgauth@<tag>: …` — usa `cfg.score.privacy_repo_label`, non il
   nome completo del repo (`SPAZIO-GENESI/imgauth` produrrebbe un testo diverso,
   che finisce in `score.json`).
4. **`storage_prefixes` sono regex in JSON**: le barre rovesce vanno
   raddoppiate (`\\/`), e in `scan-privacy.mjs` vanno ricostruite con
   `new RegExp(p.pattern)`. Se una regex non compila, lo scanner smette di
   rilevare flussi e `MET-privacy` cambia valore — il gate lo intercetta, ma
   sapere dove guardare fa risparmiare tempo.

**Accettazione F1:** blocco di confronto verde su tutti e tre i file. Nessun
file spostato. `grep -rn "spaziogenesi\|imgauth\|SPAZIO-GENESI\|Spazio Genesi\|attestazione" generators/`
non restituisce più nulla.

---

## F2 — I dati dentro il pacchetto del tenant (Sonnet)

```bash
git mv registry  tenants/attestazione/registry
git mv snapshots tenants/attestazione/snapshots
```

Poi aggiorna i percorsi:

- `generators/lib/registry.mjs` — `REGISTRY_DIR` viene dal tenant, non da
  `ROOT`. Tienilo esportato con lo stesso nome per non toccare `validate.mjs`.
- `collect-evidence.mjs` — `SNAPSHOTS_DIR`, `ANCHORS_DIR`, `REGISTRY_EVIDENCE_DIR`
  (quest'ultimo è quello che scrive `last_seen`: se resta al vecchio percorso,
  il collettore ricrea in silenzio una cartella `registry/` fantasma).
- `score.mjs`, `scan-privacy.mjs`, `scan-scorecard.mjs` — `SNAPSHOTS_DIR`.
- `anchor-monthly.mjs` — dove scrive il bundle.
- **`.github/workflows/collect-evidence.yml`** — la riga
  `git add snapshots/ registry/evidence/` va aggiornata ai nuovi percorsi.
- ⚠️ **`.github/workflows/publish.yml`** — il filtro `paths:` elenca
  `registry/**`, `schemas/**`, `generators/**`, `snapshots/**`. Dopo lo
  spostamento quei percorsi **non esistono più**: il deploy non fallirebbe, non
  partirebbe **e basta**, in silenzio. È la trappola più pericolosa di tutto il
  piano. Aggiorna i filtri (`tenants/**`, `core/**` in F3, `content/**`).

**Accettazione F2:** blocco di confronto verde; `git status` mostra solo
rinomini (`R`), nessun file cancellato e ricreato; nessuna cartella `registry/`
o `snapshots/` residua alla radice.

⚠️ **OneDrive**: un `git mv` di centinaia di file può fallire con un lock. Se
succede, ritenta — non toccare la configurazione di git (memoria
`onedrive-git-reflog-lock`).

---

## F3 — Il motore in `core/` e la guardia che lo tiene pulito (Sonnet)

```bash
git mv schemas    core/schemas
git mv generators core/generators
```

1. ⚠️ **`ROOT` in `core/generators/lib/registry.mjs`** è calcolato risalendo di
   tre livelli (`join(fileURLToPath(import.meta.url), "..", "..", "..")`). Con un
   livello in più diventano **quattro**. Sbagliarlo non dà un errore chiaro: fa
   leggere una cartella che non esiste, e il registro risulta vuoto. Dopo la
   modifica aggiungi una verifica esplicita: se `TENANT_DIR` non esiste, esci
   con un messaggio che stampa il percorso cercato.
2. `package.json` alla radice: aggiorna gli script a `core/generators/*.mjs`.
   **Resta l'unico** con dipendenze e `npm ci` — niente workspace npm in P44.
3. Crea `core/package.json` come **solo manifesto di versione** (nessuna
   dipendenza, `private: true`), con `"version": "0.2.0"`: è il numero del
   motore, e serve a F5.
4. Crea `core/README.md`: cosa può e non può contenere questa cartella.
5. **Guardia anti-contaminazione** — `core/generators/check-core-isolation.mjs`:
   scandisce `core/**` (esclusi `node_modules` e i `.md`) e fallisce con exit 1
   elencando file e riga se trova, senza distinzione di maiuscole:
   `spaziogenesi`, `spazio genesi`, `attestazione`, `imgauth`, `autart`,
   `attest-`, `radart`, `SPAZIO-GENESI`.
   Aggiungila come `npm run check-core`, invocata **sia** da `npm run build`
   **sia** dal job di `.github/workflows/validate.yml`.
6. Verifica che la guardia funga davvero: inserisci temporaneamente la stringa
   `imgauth` in un commento di `core/generators/score.mjs`, controlla che
   `npm run check-core` esca con 1 e il messaggio giusto, poi rimuovila. Una
   guardia mai vista fallire non è una guardia.

**Accettazione F3:** blocco di confronto verde; `npm run check-core` esce 0 sul
codice pulito e 1 sulla stringa iniettata; `npm run validate` verde;
`upload-pages-artifact` punta ancora a `./site` (l'output **non** si sposta in
P44).

---

## F4 — Changelog a doppia resa (Sonnet)

La fonte `content/changelog.yaml` esiste già. Serve il generatore.

Crea `core/generators/build-changelog.mjs`:

- legge `content/changelog.yaml`;
- scrive `CHANGELOG.md` alla radice con **tutte** le voci, in ordine di data
  decrescente, raggruppate per data, con componente e versione;
- scrive `site/changelog.html` con le sole voci `public: true`, riusando lo
  **stesso `STYLE`** e la stessa impaginazione di `build-site.mjs` (estrai lo
  stile in `core/generators/lib/style.mjs` e importalo da entrambi: due copie
  divergono, è la lezione di `beta.html`);
- entrambe le rese portano in testa la riga "file generato, non modificarlo a
  mano";
- fallisci con un messaggio chiaro se una voce non ha `date`, `component`,
  `title` o `public`.

Poi:

- aggiungi `"build-changelog"` allo script `build`;
- aggiungi la voce *Changelog* alla colonna "Il registro" del footer, in
  `tenant.config.json` (`{"label": "Changelog", "href": "/changelog.html"}`);
- aggiungi la pagina alla barra di navigazione se ti sembra utile — decisione
  di resa, non di sostanza.

⚠️ **Qui il gate byte-identico si rompe di proposito**: `index.html` guadagna una
voce nel footer e nasce `site/changelog.html`. È l'unico cambiamento visibile
previsto da P44. Verifica che sia **solo** quello:

```bash
diff .baseline/index.html site/index.html
```

deve mostrare esclusivamente la riga del nuovo link. Poi aggiorna la baseline.

**Accettazione F4:** `CHANGELOG.md` e `site/changelog.html` generati, entrambi
con le voci attese e con il numero giusto (le `public: false` non compaiono sul
sito); il diff su `index.html` contiene solo il nuovo link.

---

## F5 — Una versione per componente (Sonnet)

1. `core/package.json` › `version`: **0.2.0** (era 0.1.0 nel package di radice —
   questo piano cambia la forma del motore, non solo un dettaglio).
2. `tenants/attestazione/tenant.config.json` › `version`: **1.0.0** (primo
   pacchetto tenant formalizzato).
3. `score.mjs` scrive in `score.json` due campi nuovi: `core_version` e
   `tenant` (`{id, version}`).
4. `build-site.mjs` li mostra nel footer, in fondo alla nota generata:
   `motore v0.2.0 · pacchetto attestazione v1.0.0` — stesso schema del footer di
   authweb ("interfaccia vX · motore vY"): chi legge sa quale versione di che
   cosa sta guardando.
5. Registra la decisione nel registro: `ADR-GTF-014` —
   *Isolamento core ↔ tenant e versione per componente*. Contesto (un solo
   progetto cablato nel motore), decisione (config del tenant + guardia CI +
   SemVer per componente), conseguenze (il secondo tenant è ora un pacchetto,
   non un fork; il punteggio resta calcolato con la stessa formula per tutti).
   Nessun CTL nuovo: non è un controllo di sicurezza, è struttura.
   Stile sobrio, come da convenzione del registro.
6. Voce in `content/changelog.yaml` con `public: true` — la prima notizia
   pubblica del nuovo changelog: il Trust Framework diventa applicabile a più
   progetti, l'attestazione è la prima applicazione dichiarata.

**Accettazione F5:** `npm run build` verde; il footer mostra le due versioni;
`npm run validate` passa con 253 record (252 + `ADR-GTF-014`); il punteggio
resta **91/100 con 10/10 indicatori** (un ADR in più non muove nessun
indicatore — se lo muove, capisci perché prima di proseguire).

---

## F6 — Documentazione e chiusura

### Scrittura (Sonnet)

- **`ARCHITECTURE.md` → v0.2.0**: §4 (topologia repo: nasce la distinzione
  core/tenant), §7 (il Trust Center è per tenant), §12 (roadmap: aggiungi la
  riga multi-progetto) e una sezione nuova **§15 — Multi-progetto**: cos'è un
  tenant, cosa può stare in `core/`, la guardia, il versioning per componente.
  Rimanda alla roadmap per i piani successivi invece di duplicarla.
- **`README.md`** del repo: struttura aggiornata, comando `GTF_TENANT=…`,
  spiegazione delle due rese del changelog.
- **`site/README.md`**: aggiungi `changelog.html` all'elenco dei generati.
- **`CLAUDE.md` di `img-auth-hub`**: due righe nella sezione GTF — il framework
  è ora multi-progetto, il registro di attestazione è un pacchetto tenant, i
  piani vivono in `gtf/Pnn_*.md`. Non riscrivere la storia di P20.
- Voci finali in `content/changelog.yaml` e rigenerazione.

### ⛔ Push e verifica live (**Opus**)

Il push su `main` fa partire `publish.yml`, che ricostruisce e **ripubblica**
`trust.spaziogenesi.org`. È un rilascio in produzione: serve la conferma
esplicita del gestore.

Prima di chiedere la conferma, verifica di aver soddisfatto queste condizioni:

1. `npm run validate`, `npm run check-core`, `npm run build` tutti verdi da
   albero pulito;
2. i filtri `paths:` di `publish.yml` includono i percorsi nuovi (**se sbagli
   questo, il deploy non parte e il sito resta a una versione vecchia senza che
   nessun workflow diventi rosso**);
3. il collettore settimanale non è passato a metà migrazione: controlla che non
   siano comparsi commit `chore: snapshot evidenze …` sui percorsi vecchi. Se
   è successo, riconcilia prima di pushare.

Dopo il push, verifica **dal vivo** (sola lettura):

- `https://trust.spaziogenesi.org/` risponde 200 e il footer mostra le due versioni;
- `https://trust.spaziogenesi.org/badge.svg` risponde e dice ancora 91/100 —
  è incorporato nel footer di authweb e in cinque README pubblici;
- `https://trust.spaziogenesi.org/whitepaper-v1.0.pdf` risponde e il suo SHA-256
  è ancora `898ec9…de452` (è l'impronta attestata, controllata ogni settimana da
  `EVD-whitepaper-integrity`);
- `https://trust.spaziogenesi.org/changelog.html` risponde 200;
- `/devops.html` e `/whitepaper.html` rispondono ancora.

Poi lancia a mano il workflow *Collect evidence snapshot* e controlla che scriva
nei percorsi nuovi e committi senza errori: è l'unico modo di sapere che il
collettore sopravvive alla migrazione senza aspettare lunedì.

**Se qualcosa non torna:** `git revert` del commit di merge e ripubblicazione. Lo
stato precedente è interamente ricostruibile — nessun dato è stato trasformato,
solo spostato.

---

## 3. Riepilogo delle trappole

1. `publish.yml` — filtri `paths:` obsoleti: il deploy smette di partire **in silenzio**.
2. `ROOT` in `registry.mjs` — un livello in più: registro vuoto, nessun errore chiaro.
3. `REGISTRY_EVIDENCE_DIR` in `collect-evidence.mjs` — se resta al vecchio percorso, ricrea una `registry/` fantasma.
4. `score.json` contiene `computed_at`: escludilo dal confronto, sempre.
5. `MET-conservation` e `MET-audit` dipendono dalla data: baseline e confronto nello stesso giorno, o rigenera la baseline con `git stash`.
6. Testi del footer e della tesi: interpolazione **grezza**, mai `esc()` — `&amp;` diventerebbe `&amp;amp;`.
7. A capo e indentazione dentro `thesis_html` / `footer_note_html`: fanno parte dell'output.
8. Nota di `privacyRatio`: deve restare `scanner su imgauth@…`, non il nome completo del repo.
9. Regex in JSON: barre rovesce raddoppiate, ricostruite con `new RegExp`.
10. Il collettore gira da solo il lunedì alle 06:00 UTC e committa nel repo.
11. OneDrive può bloccare `git mv` su molti file: ritenta, non toccare git.
12. `site/833b2eaa595b8ad4fc09b6700bdcfe60.txt` (verifica motori di ricerca), `devops.html`, `whitepaper.html`, `whitepaper-v1.0.pdf`: **non si toccano** in P44.

---

## 4. Dopo P44

P45 (domini), P46 (RADART), P47 (correzione dell'astrazione), P48 (estrazione
del prodotto). Vedi la roadmap. **Non incatenare le fasi né i piani di propria
iniziativa**: a fine P44 ci si ferma e si aspetta un nuovo via libera.
