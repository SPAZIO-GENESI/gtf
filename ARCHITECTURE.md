# Genesis Trust Framework (GTF) — Architettura del Digital Trust Operating System

**Servizio**: attestazione.spaziogenesi.org · **Titolare**: Spazio Genesi ETS
**Documento**: GTF-ARCH · **Versione**: 0.1.1 · **Data**: 2026-07-14 · **Stato**: bozza per revisione
**Natura**: questo documento NON è documentazione del servizio. È il progetto del **sistema che
produce, collega e mantiene** tutta la documentazione, le evidenze e la fiducia del servizio.
È scritto per essere eseguibile da modelli AI diversi in modo indipendente e coerente.

---

## 0. Scopo, non-scopo, vincoli

**Scopo**: progettare l'ecosistema (dati, processi, automazioni, pubblicazione) attraverso cui il
servizio dimostra pubblicamente la propria affidabilità. Ogni affermazione → un'evidenza; ogni
evidenza → la procedura che l'ha generata; ogni procedura → la decisione e la norma che la motivano.

**Non-scopo**: scrivere policy, procedure, manuali. Quelli sono *output* del framework (generati
dopo, dal registro, secondo §11).

**Vincoli di realtà** (non negoziabili):
- Organizzazione piccola (studenti/docenti/ricercatori, tempo volontario). Regola: **ogni processo
  che richiede lavoro umano ricorrente deve costare < 1 h/mese**, tutto il resto è automatizzato
  o non si fa (Least Complexity).
- Solo infrastruttura gratuita/non-profit già in uso: GitHub (repo, Actions, Pages, Issues),
  Cloudflare (Workers, R2, D1, cron), Azure non-profit, Google Workspace non-profit.
- **Nessun nuovo servizio a pagamento.** Il sigillo eIDAS qualificato resta un upgrade futuro
  (già nel piano commerciale), non un prerequisito.
- Onestà prima del marketing: il framework deve rendere impossibile affermare più di quanto le
  evidenze dimostrino (vedi §5.2 posizionamento eIDAS e §8 anti-gaming).

**Principio architetturale cardine**: ~70% delle evidenze esiste già (§6.1). Il GTF non costruisce
un sistema nuovo: costruisce il **tessuto connettivo** — identità stabili, collegamenti tipati,
generazione automatica, pubblicazione — sopra ciò che il servizio già produce.

---

## 1. Principi operativi (da slogan a regole verificabili)

Ogni principio "by design" è tradotto in una regola meccanicamente verificabile dalla CI (§11.1).
I principi hanno ID stabile `PRN-**` e sono essi stessi record del registro (§3).

| ID | Principio | Regola verificabile (gate CI) |
|---|---|---|
| PRN-01 | Transparency by Design | Ogni record del registro ha `visibility: public\|internal\|secret`; default `public`; `internal`/`secret` richiedono campo `why_not_public` compilato |
| PRN-02 | Evidence by Design | Ogni controllo (CTL) referenzia ≥1 evidenza (EVD) con `freshness` dichiarata; evidenza scaduta → controllo `stale`, score giù |
| PRN-03 | Documentation by Design | Nessun documento scritto a mano nel Trust Center: tutto generato dal registro; la CI fallisce se un file pubblicato non ha record sorgente |
| PRN-04 | Security by Design | Ogni CTL di sicurezza referenzia l'implementazione (IMP → file/riga/config) e la minaccia (RSK) che mitiga |
| PRN-05 | Privacy by Design | Ogni flusso di dati ha record DAT (dato, base giuridica, retention); flusso senza DAT → build fail |
| PRN-06 | Governance by Design | Ogni modifica al registro passa da PR; decisioni non ovvie → ADR obbligatoria (etichetta `needs-adr` blocca il merge) |
| PRN-07 | Automation by Design | Campo `collection: auto\|manual` su ogni EVD; % auto è un indicatore di score; nuove EVD `manual` richiedono giustificazione |
| PRN-08 | Open Verification | Per ogni affermazione pubblica esiste uno script/procedura che un terzo può eseguire senza credenziali (`verify_howto` obbligatorio sui CTL pubblici) |
| PRN-09 | Continuous Improvement | Ogni incidente (INC) produce ≥1 azione (ACT) con scadenza; ACT scadute aperte → banner nel Trust Center |
| PRN-10 | Least Complexity | Ogni nuovo processo dichiara `human_cost_minutes_month`; il totale di sistema ha un tetto (budget 8 h/mese) visibile nel Trust Center |

---

## 2. DTOS — i sette livelli, mappati sull'esistente

Il Digital Trust Operating System è organizzato a livelli. Ogni livello **consuma** il livello
superiore (che lo motiva) e **produce** input per quello inferiore (che lo dimostra). La mappa
seguente distingue ciò che ESISTE (✅) da ciò che il GTF AGGIUNGE (➕).

### L1 — Identità (Missione, Visione, Valori, Principi)
- ✅ Missione implicita in sito_2026 e nel lessico onesto di authweb ("il file non lascia mai il
  tuo dispositivo", nessun "caricare").
- ➕ Record `PRN-*` (§1) e un record `MSN-01` (missione) come radice del grafo: ogni norma,
  controllo, evidenza risale fino a un principio. Nessun testo nuovo: si formalizza l'esistente.

### L2 — Norme, Compliance, Governance
- ✅ Licenze pubbliche (AGPL su imgauth, MIT su authweb); convenzioni operative in CLAUDE.md;
  escrow dei segreti (caveau 13/06/2026); regola "HMAC_SECRET mai ruotato".
- ➕ Registro requisiti `REQ-*` (§5), registro decisioni `ADR-*` (§9.2), registro ruoli (§9.1),
  posizionamento eIDAS esplicito (§5.2).

### L3 — Processi, Procedure, Workflow
- ✅ Processi di fatto: rilascio coordinato con SemVer per componente; monitor 15 min con
  issue `status-alert` e Telegram sui cambi di stato; cron Worker 30 min; escrow.
- ➕ Ogni processo diventa record `PRC-*` con owner, trigger, output, evidenza prodotta,
  `human_cost_minutes_month`. Le *procedure testuali* verranno generate dai record (non ora).

### L4 — Software, Database, API, Cloud, Automazioni
- ✅ È il sistema in produzione: authweb (Pages), imgauth (Worker + R2 EU + D1 + cron),
  authart (Azure, PAdES B-LT + TSA), monitor (Actions). Contratto API documentato in CLAUDE.md.
- ➕ Record `IMP-*`: puntatori versionati a file/config che realizzano ciascun controllo
  (es. `IMP-imgauth-hmac` → `worker.js#signHmac`, `wrangler.toml#[placement]`).

### L5 — Evidenze (Log, Hash, Audit trail, Registri, Backup)
- ✅ Il piano evidenze è già ricco: D1 `health_log` (eventi fini), R2 `status/history.json`
  (rollup 90gg), prove OTS (`ots/<sha256>.ots`), archivio certificati, sidecar `meta/cert/*`,
  storia git di 3 repo pubblici/pubblicandi, issue del monitor, RESILIENZA-E-BACKUP.md.
- ➕ Registro `EVD-*` (che cosa, dove, chi la produce, freshness, come verificarla),
  raccolta schedulata (§6.3) e **ancoraggio dogfooding**: il bundle mensile di evidenze viene
  attestato **con il servizio stesso** (hash + OTS) — il prodotto certifica il proprio sistema
  di fiducia (§6.4).

### L6 — Trasparenza (Dashboard, Trust Center, Metriche)
- ✅ Già pubblici: `/status/` con drill-down giornaliero, `/changelog/`, versioni live
  (`/ping`, footer), badge verificabile, pagina permanente `/c/<hash>`, codice sorgente.
- ➕ **Trust Center** `/trust/` (§7) che federa tutto + **Open Trust Score** (§8).

### L7 — Stakeholder
- ✅ Utenti/artisti (interfaccia, video-guida, contest logo), gallerie (pista Deodato),
  istituzioni (RUNTS, 5x1000).
- ➕ Ogni sezione del Trust Center dichiara lo stakeholder di destinazione; le domande di §13
  sono organizzate per stakeholder (collezionista ≠ ricercatore ≠ PA).

**Regola inter-livello**: nessun elemento può esistere "sciolto". La CI (§11.1) verifica che il
grafo sia connesso: ogni EVD risale a un CTL, ogni CTL a ≥1 REQ o PRN, ogni REQ a una norma o
alla missione. Elementi orfani = build fail.

---

## 3. Single Source of Truth — il Trust Registry

### 3.1 Collocazione e forma

- **Nuovo repository pubblico** `spazio-genesi/gtf` (GitHub). Motivi: img-auth-hub resta
  privato (contiene materiale operativo); la fiducia richiede che il registro stesso sia
  pubblico, versionato, con storia verificabile. Git È l'audit trail del registro
  (chi/cosa/quando/perché per ogni modifica, gratis).
- Il registro è una directory di **file YAML, un record per file**, validati da JSON Schema.
  Non un database: diff leggibili, PR review, blame, nessuna infrastruttura da mantenere.
- Tutto il resto (documenti, Trust Center, score, matrici) è **derivato** dal registro dalla CI.
  Nessuna informazione vive in due posti: se serve altrove, si genera.

```
gtf/
├── registry/
│   ├── principles/      PRN-*.yaml
│   ├── requirements/    REQ-*.yaml      (clausole normative adottate)
│   ├── controls/        CTL-*.yaml      (come soddisfiamo il requisito)
│   ├── implementations/ IMP-*.yaml      (puntatori a codice/config reali)
│   ├── evidence/        EVD-*.yaml      (definizione evidenza + raccolta)
│   ├── processes/       PRC-*.yaml
│   ├── decisions/       ADR-*.yaml      (Architecture/Any Decision Records)
│   ├── risks/           RSK-*.yaml
│   ├── incidents/       INC-*.yaml
│   ├── actions/         ACT-*.yaml      (azioni correttive/migliorative)
│   ├── data/            DAT-*.yaml      (mappa dati personali / flussi)
│   ├── metrics/         MET-*.yaml      (definizione indicatori score)
│   └── glossary/        GLS-*.yaml
├── schemas/             JSON Schema per ogni tipo di record
├── generators/          script Node (generazione doc, score, matrici, feed)
├── site/                sorgente statica Trust Center (HTML/CSS/JS puro, stile authweb)
├── snapshots/           bundle evidenze raccolte (§6.3) — o R2, vedi §6.3
└── .github/workflows/   validate.yml · collect-evidence.yml · publish.yml · score.yml
```

### 3.2 Schema di identità

ID **stabili, mai riusati, mai rinominati** (un ID ritirato resta nel registro con
`status: retired` e `superseded_by`). Formato: `TIPO-slug-breve` o `TIPO-NNN`.

| Prefisso | Entità | Esempio |
|---|---|---|
| MSN / PRN | Missione / Principio | `PRN-02` |
| REQ | Requisito normativo adottato | `REQ-gdpr-min-01`, `REQ-27037-acq-02` |
| CTL | Controllo | `CTL-hash-client-side` |
| IMP | Implementazione | `IMP-authweb-sha256hex` |
| EVD | Evidenza | `EVD-d1-health-log` |
| PRC | Processo | `PRC-release-coordinata` |
| ADR | Decisione | `ADR-014-smart-placement` |
| RSK | Rischio | `RSK-hmac-compromise` |
| INC | Incidente | `INC-2026-001` |
| ACT | Azione | `ACT-2026-007` |
| DAT | Dato/flusso | `DAT-cert-metadata` |
| MET | Metrica | `MET-uptime-signer` |

### 3.3 Schema dei record (i quattro tipi portanti)

```yaml
# controls/CTL-hash-client-side.yaml
id: CTL-hash-client-side
title: "L'impronta è calcolata nel browser; il file non lascia il dispositivo"
status: active            # draft | active | stale | retired
visibility: public
satisfies: [REQ-gdpr-min-01, PRN-05]
mitigates: [RSK-data-exfiltration]
implemented_by: [IMP-authweb-sha256hex, IMP-imgauth-api-hash-clientpath]
evidenced_by: [EVD-source-public-authweb, EVD-network-trace-attest]
verify_howto: >
  Apri attestazione.spaziogenesi.org con DevTools › Network, attesta un file:
  la richiesta a /api/hash contiene solo {sha256,name,type,size}, nessun byte del file.
owner: it@spaziogenesi.org
review_every_days: 180
last_reviewed: 2026-07-09
```

```yaml
# requirements/REQ-gdpr-min-01.yaml
id: REQ-gdpr-min-01
source: { norm: GDPR, ref: "art. 5(1)(c) — minimizzazione" }
statement: "Trattare solo i dati strettamente necessari alla finalità di attestazione"
applicability: full        # full | partial | inspiration | not-applicable (+ motivo)
satisfied_by: [CTL-hash-client-side, CTL-matomo-cookieless]
```

```yaml
# evidence/EVD-d1-health-log.yaml
id: EVD-d1-health-log
title: "Log fine degli eventi di salute (errori, degradi, rallentamenti)"
location: { system: cloudflare-d1, ref: "imgauth-health/health_log", public_via: "GET /api/health-log?day=" }
produced_by: PRC-status-sampling
collection: auto
freshness_max_days: 1
integrity: "append-only per convenzione; snapshot mensile hashato+ancorato (EVD-monthly-anchor)"
supports: [CTL-availability-monitoring]
```

```yaml
# decisions/ADR-014-smart-placement.yaml
id: ADR-014-smart-placement
date: 2026-07-03
status: accepted           # proposed | accepted | superseded
context: "Health-check Worker→authart ~10x più lenti della chiamata diretta (~1.3-2s vs ~150ms)"
decision: "Attivare Smart Placement ([placement] mode=smart in wrangler.toml)"
consequences: "Esecuzione vicino ai backend; da osservare frequenza eventi 'lento'"
affects: [CTL-availability-monitoring, IMP-imgauth-wrangler-toml]
evidence: [EVD-git-imgauth]   # il commit eafe464 è l'evidenza della decisione
```

**Nota AI-first**: i record sono volutamente atomici e schematizzati perché un modello AI possa
generarli, validarli e collegarli senza ambiguità; la prosa (policy, procedure, pagine) si
genera DAI record, mai il contrario. La storia pregressa (P0–P19 in CLAUDE.md) viene importata
una-tantum come ADR retroattive con `evidence: [EVD-git-*]` (§12, fase M1).

### 3.4 Regole di integrità del grafo (enforce in CI)

1. Ogni riferimento `[XXX-*]` deve risolvere a un record esistente (no link rotti).
2. Ogni CTL `active` ha ≥1 IMP e ≥1 EVD non-stale; altrimenti passa a `stale` automaticamente.
3. Ogni REQ `full|partial` ha ≥1 CTL; REQ `not-applicable` ha `justification`.
4. Ogni INC chiuso ha ≥1 ACT; ACT ha `due_date` e `status`.
5. Ogni record `visibility: internal|secret` ha `why_not_public`.
6. Nessun record contiene valori di segreti (regex-lint su pattern noti; i segreti si
   *nominano* — `HMAC_SECRET` — mai si *citano*).

---

## 4. Topologia dei repository

| Repo | Visibilità | Ruolo nel GTF |
|---|---|---|
| `gtf` (nuovo) | **pubblico** | SSOT: registro + schemi + generatori + Trust Center + score |
| `imgauth` | pubblico (AGPL) | L4; le sue Actions producono evidenze (monitor); `IMP-*` puntano qui |
| `imgauthweb` | pubblico (MIT) | L4/L6; ospita il link al Trust Center; `IMP-*` puntano qui |
| `autart-signer` | pubblico (AGPL, dal 2026-07-09) | L4; firma PAdES/TSA — codice ispezionabile |
| `img-auth-hub` | privato | Officina interna: bozze, marketing, materiale operativo. NON è SSOT di nulla che sia pubblico: ciò che matura migra in `gtf` |

**Flussi tra repo** (tutti via GitHub Actions, nessun servizio nuovo):
- `imgauth`/`imgauthweb`/`autart-signer` → `gtf`: un workflow `repository_dispatch` notifica
  release/tag; il collector (§6.3) legge comunque tutto via API pubbliche (pull, non push,
  per minimizzare i segreti cross-repo).
- `gtf` → pubblicazione: GitHub Pages del repo `gtf` (Trust Center), raggiungibile come
  `attestazione.spaziogenesi.org/trust/` tramite **route Cloudflare + Worker proxy leggero**
  (stesso pattern già rodato di `/c/*`) *oppure* sottodominio `trust.spaziogenesi.org`
  (CNAME Pages). Decisione da prendere come ADR-GTF-002; il pattern `/c/*` esistente
  suggerisce la prima (un solo dominio user-facing).

---

## 5. Compliance Framework — le norme come strumenti

### 5.1 Modello di ingestione

Le norme NON si "adottano in blocco". Per ciascuna si estraggono le sole clausole pertinenti
come record REQ con `applicability` dichiarata. Questo produce automaticamente la
**Compliance Map** (matrice generata, §11.2): `Norma → REQ → CTL → IMP → EVD`, navigabile nei
due sensi (dalla norma all'evidenza e dall'evidenza alla norma).

| Norma | Modalità d'uso nel GTF | Ambito principale |
|---|---|---|
| ISO/IEC 27037 | `partial` — principi di identificazione/acquisizione/conservazione della prova digitale applicati al ciclo di vita di hash, `.ots`, PDF archiviati | L5: catena di custodia delle evidenze d'opera |
| ISO/IEC 27042 | `partial` — analisi/interpretazione della prova: come si verifica un certificato (semaforo authweb, client OTS, `verify_howto`) | Verificabilità |
| ISO/IEC 27043 | `partial` — processi di investigazione: template incident/postmortem (INC), readiness | Incidenti |
| ISO/IEC 27001 | `inspiration` — **niente certificazione** (insostenibile per un ETS): si adottano i controlli Annex A pertinenti come CTL, dichiarando quali NO e perché | Sicurezza organizzativa |
| GDPR | `full` — è legge: registro DAT (art. 30 in scala minima), minimizzazione (già by-design: il file non transita), informativa, diritti | Privacy |
| eIDAS 2.0 | `partial` — vedi §5.2: posizionamento come servizio **non qualificato**, con art. 46-equivalente (non discriminazione degli effetti giuridici) come argomento chiave | Valore probatorio |
| CAD + Linee guida AgID doc. informatico | `partial` — formazione del documento informatico (PDF firmato PAdES B-LT + marca RFC 3161 TSA AATL), integrità, riferimento temporale | Documento informatico |

### 5.2 Posizionamento eIDAS — il controllo di onestà più importante

Il framework impone (come CTL con evidenza = testo pubblicato nel Trust Center) la
dichiarazione esplicita e stabile:

> Il servizio produce **attestazioni di esistenza non qualificate**: firma elettronica avanzata
> con certificato self-signed + marca temporale RFC 3161 (TSA in Adobe AATL) + ancoraggio
> Bitcoin (OpenTimestamps). **Non** è un servizio fiduciario qualificato eIDAS. Alle prove
> elettroniche non qualificate non possono essere negati effetti giuridici per il solo motivo
> della forma elettronica o della non-qualificazione; il valore probatorio è rimesso al giudice.
> L'upgrade a sigillo qualificato è nella roadmap pubblica, condizionato alla sostenibilità.

Questa onestà è già nella cultura del progetto (lessico onesto, "auto-dichiarato" nel PDF):
il GTF la rende un **controllo verificabile** (se la frase sparisce dal Trust Center, un check
la rileva) anziché un'abitudine.

### 5.3 Requisiti seed (esempi di partenza, non esaustivi — la compilazione completa è fase M2)

- `REQ-27037-acq-01`: l'acquisizione dell'impronta è documentata e riproducibile (WebCrypto,
  algoritmo dichiarato, codice pubblico) → `CTL-hash-client-side`.
- `REQ-27037-pres-01`: conservazione con integrità dimostrabile → `CTL-r2-eu-archive` +
  `CTL-ots-anchor` (la prima prova `.ots` non si sovrascrive: idempotenza = catena di custodia).
- `REQ-gdpr-min-01`: minimizzazione → hash client-side, Matomo cookieless, nessun account.
- `REQ-eidas-pos-01`: informazione veritiera sul livello di garanzia → §5.2.
- `REQ-cad-doc-01`: documento informatico con firma + riferimento temporale opponibile →
  `CTL-pades-blt-tsa`.
- `REQ-27043-ir-01`: processo di risposta agli incidenti definito e provato →
  `PRC-incident-response` + `EVD-monitor-issues`.

---

## 6. Evidence Plane — il piano delle evidenze

### 6.1 Inventario dell'esistente (da registrare, non da costruire)

| Evidenza | Dove vive | Pubblica via | Collection |
|---|---|---|---|
| Eventi salute fini | D1 `health_log` | `/api/health-log?day=` | auto (cron 30') |
| Rollup 90gg + uptime | R2 `status/history.json` | `/api/status-history` | auto |
| Stato live | Worker | `/api/status` | auto (180s) |
| Prove OTS opere | R2 `ots/` | `/api/ots?hash=` | auto |
| Certificati emessi | R2 `pdf/` + sidecar `meta/cert/` | `/api/cert`, `/c/<hash>` | auto |
| Guasti e ripristini | Issue `status-alert` (imgauth) | GitHub | auto (monitor 15') |
| Storia modifiche | git dei 3 repo | GitHub | auto |
| Versioni in produzione | `/ping`, footer authweb, health authart | pubblico | auto |
| Changelog utente | `/changelog/` | pubblico | manual (in release) |
| Decisioni storiche | CLAUDE.md P0–P19, commit | privato → da migrare in ADR | manual una-tantum |
| Backup/resilienza | RESILIENZA-E-BACKUP.md | privato → derivare CTL pubblici | manual |
| Escrow segreti | caveau (13/06/2026) | MAI pubblica; esiste come CTL con `visibility: internal` | manual |

### 6.2 Che cosa manca (gap → deliverable M2)

1. **Snapshot immutabili**: D1 e R2 sono sovrascrivibili dal titolare. Serve lo snapshot
   periodico esterno con hash (→ §6.3/6.4) perché "non potremmo falsificare lo storico
   nemmeno volendo" diventi dimostrabile.
2. **Evidenza del processo di release**: tag git firmati o almeno release GitHub per ogni
   bump di versione (oggi la versione è nel manifest ma il rilascio non lascia un oggetto
   release). CTL nuovo, costo ~0 (fa parte del flusso di deploy).
3. **Evidenza di restore**: il backup non provato non è un'evidenza. `PRC-restore-drill`
   semestrale (manuale, ≤30 min, verbale = record EVD).
4. **Canary HMAC esterno** (già P17-B in backlog): unica evidenza che rileva la rotazione
   errata del segreto. Entra nel GTF come `CTL-hmac-canary` con `status: draft`.

### 6.3 Collettore di evidenze (`collect-evidence.yml`, GitHub Actions nel repo `gtf`)

Schedulato **settimanale** (+ `workflow_dispatch`). Solo letture pubbliche o token read-only:

1. Interroga `/api/status-history`, `/api/health-log` (ultimi 7 giorni), `/ping` dei tre
   componenti, lista issue `status-alert`, ultimi commit/tag dei repo pubblici.
2. Scrive gli esiti in `snapshots/YYYY-WW/` (JSON grezzi + `manifest.json` con SHA-256 di
   ogni file). Committa nel repo `gtf` → lo snapshot è versionato, diffabile, pubblico.
3. Aggiorna il campo `last_seen` delle EVD `auto` (freshness): un'evidenza che smette di
   arrivare fa scattare `stale` sul CTL che la usa — **il decadimento è visibile, non silenzioso**.

### 6.4 Ancoraggio dogfooding (chiusura del cerchio)

**Mensile**: hash SHA-256 del `manifest.json` cumulativo del mese → attestato **con il servizio
stesso** (`/api/hash` + `/api/cert-pdf` via canary umano o, meglio, prova `.ots` diretta) e
ancorato in Bitcoin. Effetto: lo storico di trasparenza del servizio è protetto dalla stessa
tecnologia che il servizio vende, e chiunque può verificarlo con gli stessi strumenti pubblici.
È l'argomento di fiducia più forte disponibile a costo zero, ed è anche una dimostrazione d'uso.

**Primo ciclo eseguito il 2026-07-09** (ADR-GTF-008): periodo 2026-07, bundle
`snapshots/anchors/2026-07-bundle.json`, registrato come `CTL-dogfooding-anchor`. Il rapporto
tra bundle mensili onorati e mesi trascorsi da `GTF_BIRTH_MONTH` è incorporato in `MET-integrity`
(`generators/score.mjs`), in media con la sonda HMAC e la quota di repository con tag di release
(§9.3). Sorvegliato da `CTL-cadence-monitoring`: un avviso Telegram scatta se il mese successivo
non produce un nuovo bundle entro la finestra di grazia.

### 6.5 Conservazione e catena di custodia (ISO 27037 applicata a noi stessi)

- Evidenze d'opera (cert, `.ots`): R2 EU, chiavi immutabili per convenzione (prima prova mai
  sovrascritta), recuperabili solo da chi conosce l'hash (modello di fiducia invariato).
- Evidenze di sistema (snapshot): git pubblico (storia immutabile di fatto) + ancora mensile OTS.
- Retention dichiarata per classe nel record EVD (es. health-log 90gg live + snapshot
  settimanali indefiniti; niente dati personali negli snapshot → GDPR-safe by construction).

---

## 7. Trust Center — architettura

**Non una pagina: un'applicazione statica generata**, stessa filosofia di authweb (HTML/CSS/JS
puro, zero framework, zero CDN terzi, accessibile WCAG AA, lessico onesto). Sorgente in
`gtf/site/`, dati in JSON generati dal registro a ogni merge (§11.2). Nessun backend nuovo:
i dati live (status, score corrente) arrivano dalle API già esistenti + un file JSON statico
rigenerato dalla CI.

### 7.1 Mappa delle sezioni → sorgente dati

| Sezione | Sorgente (tutto derivato) |
|---|---|
| Missione e principi | record MSN/PRN |
| Standard adottati e stato di conformità | Compliance Map generata (REQ×CTL con stato) |
| **Open Trust Score** | `score.json` generato (§8) + storico |
| Stato del servizio | embed/link `/status/` (già esistente — non si duplica) |
| Roadmap | record ACT/PRC con `milestone` + fasi §12 |
| Decisioni (ADR) | registro ADR, ordinato, con diff link |
| Incidenti e azioni correttive | registro INC/ACT + issue `status-alert` linkate |
| Evidenze pubblicabili | registro EVD `public` con `verify_howto` — ogni voce ha il bottone "verifica tu stesso" |
| Audit e revisioni | record delle review periodiche (PRC) + esiti |
| Metriche e qualità | MET + snapshot (uptime, latenze, freshness) |
| Documentazione, FAQ, glossario | generati da record GLS + pagine derivate |
| Changelog e cronologia completa | `/changelog/` (utente) + git log del registro (sistema) |
| Verifica indipendente | pagina "Come verificarci": script e istruzioni per riprodurre ogni claim (PRN-08) |

### 7.2 Regola anti-vetrina

Ogni affermazione nel Trust Center è renderizzata **dal** record e porta con sé: ID, ultima
revisione, link all'evidenza, link al `verify_howto`. Il generatore rifiuta testo libero senza
record sorgente (PRN-03). Se un controllo va `stale`, la pagina lo mostra in giallo — il Trust
Center che ammette i propri buchi è più credibile di uno sempre verde, ed è questo il punto.

---

## 8. Open Trust Score

### 8.1 Design

Un punteggio **di maturità, non di marketing**: misura quanto il sistema di fiducia è completo,
fresco e verificato. Pubblicato come `score.json` + badge SVG (riuso del pattern
`/api/badge`) + pagina con lo storico. **Formula pubblica nel registro** (record MET):
chiunque può ricalcolarlo dagli stessi dati (PRN-08).

### 8.2 I dieci indicatori (0–100 ciascuno, media pesata → score complessivo)

| Indicatore | Formula (calcolabile dalla CI, dati del registro + snapshot) |
|---|---|
| Trasparenza | % record `public` sul totale (pesata) + % CTL con `verify_howto` |
| Integrità | esito sonda HMAC (da status) + % release con tag + ancore OTS mensili riuscite/attese |
| Tracciabilità | % CTL con catena completa REQ→CTL→IMP→EVD senza buchi |
| Documentazione | % record entro `review_every_days`; penalità per `stale` |
| Automazione | % EVD `collection: auto` |
| Audit | giorni dall'ultima review interna vs cadenza; % finding (ACT) chiusi nei termini |
| Conservazione | freshness snapshot; esito ultimo restore-drill (binario, decade dopo 210gg) |
| Riproducibilità | % claim pubblici con procedura di verifica eseguibile da terzi |
| Privacy | % flussi con DAT completo; assenza dati personali negli snapshot (check automatico) |
| Governance | % merge nel registro via PR con review; % decisioni non-ovvie con ADR |

### 8.3 Anti-gaming (il punteggio deve poter scendere)

- Gli input sono **fatti raccolti automaticamente** (snapshot, stati CI, freshness), non
  autodichiarazioni; dove serve un giudizio umano (review, drill) l'input è l'*esistenza
  dell'evidenza datata*, non un voto.
- Lo storico dello score è append-only nel repo (e dentro il bundle ancorato §6.4): un calo
  non è cancellabile.
- Il badge mostra anche la **data di calcolo**: uno score vecchio si svaluta da solo
  (stesso principio del badge grigio che "si auto-guarisce").
- Nessuna soglia "verde" di comodo: la pagina mostra i 10 assi separatamente; il numero unico
  è dichiaratamente una media, con link alla formula.

---

## 9. Governance

### 9.1 Ruoli (dimensionati su un ETS di volontari — cariche, non persone a tempo pieno)

| Ruolo | Responsabilità nel GTF | Nota |
|---|---|---|
| Maintainer del servizio | merge su repo di prodotto; deploy (con conferma esplicita, come da convenzione) | oggi: il gestore |
| Trust Officer | merge sul repo `gtf`; presidia score, review scadute, ACT aperte | può coincidere col Maintainer finché l'ETS è piccolo — la separazione è un obiettivo di maturità (indicatore Governance) |
| Referente privacy | registro DAT, informative, richieste interessati | interno all'ETS |
| Revisore esterno leggero | 1 review/anno del registro da parte di una terza parte indipendente — verbale = EVD | dal 2026-07-14: **Radixia srl** ([radixia.ai](https://www.radixia.ai)), nessun legame con l'ETS né con l'Accademia (ADR-GTF-010); piano operativo in `docs/piano-review-esterna-2026.md` |

### 9.2 Ciclo decisionale

- **ADR obbligatoria** per: scelte architetturali, sicurezza/segreti, modifiche a contratto API,
  posizionamento pubblico, eccezioni ai principi. Le decisioni di routine restano nei commit.
- ADR = record YAML (§3.3) + eventuale prosa breve; `status: proposed → accepted` via PR.
- **Import retroattivo**: P0–P19 e le decisioni chiave già documentate in CLAUDE.md diventano
  ADR con data storica ed evidenza nei commit — la cronologia completa del progetto richiesta
  dal Trust Center esiste già, va solo formalizzata (fase M1).

### 9.3 Cicli operativi (tutto il costo umano ricorrente del sistema)

| Cadenza | Attività | Costo umano |
|---|---|---|
| continuo | CI valida registro, monitor 15', cron 30' | 0 |
| settimanale | collettore evidenze (auto); triage notifiche | ~10 min |
| mensile | ancora dogfooding; sguardo a score e ACT scadute | ~20 min |
| trimestrale | review dei CTL in scadenza (il registro dice quali) | ~1 h |
| semestrale | restore drill; review rischi RSK | ~1 h |
| annuale | review esterna leggera; revisione principi | ~2 h |

Budget totale ≈ 6–7 h/anno di cerimonie + il lavoro ordinario. Se un'attività sfora
sistematicamente, è un difetto di design da correggere (PRN-10), non da assorbire.

**Nessuna di queste cadenze dipende dalla sola memoria umana** (ADR-GTF-009, dal 2026-07-09):
ogni `PRC` ricorrente dichiara `frequency_days` e `last_run`; `generators/check-cadences.mjs`
gira dentro il collettore settimanale e confronta ciascuna scadenza (comprese quelle mensile,
trimestrale, semestrale, annuale della tabella sopra) contro il registro, avvisando via Telegram
**solo** quando qualcosa è davvero scaduto (`CTL-cadence-monitoring`, `RSK-cadence-drift`).

### 9.4 Incidenti

Il flusso esiste già a metà (monitor → issue `status-alert` → Telegram → richiusura commentata).
Il GTF aggiunge solo: (a) issue chiusa di guasto critico ⇒ record INC generato (semi-auto da
template), (b) INC ⇒ ≥1 ACT con scadenza, (c) INC/ACT pubblicati nel Trust Center. I postmortem
sono senza colpa e pubblici per default.

---

## 10. AI Governance — il framework è AI-first

Il progetto è dichiaratamente sviluppato da modelli AI. Questo va **dichiarato e governato**,
non nascosto: è parte della trasparenza.

1. **Provenance obbligatoria**: ogni documento generato porta frontmatter
   `generated_by: {model, date, generator_version, source_records: [...]}`. Ogni record YAML
   creato/modificato da AI passa comunque da PR: **il gate umano è la review, sempre**.
2. **Prompt e generatori versionati**: i template di generazione vivono in
   `gtf/generators/` — cambiare il modo in cui si genera un documento è una modifica
   tracciata come il codice.
3. **Riproducibilità tra modelli**: qualunque modello che rispetti schemi (§3.3) e regole di
   integrità (§3.4) produce output compatibile — è il motivo per cui la SSOT è il registro
   dati e non la prosa. Questo documento (GTF-ARCH) è il contratto tra modelli.
4. **Limiti dichiarati**: record `PRN-11` (da creare): le decisioni con effetti legali,
   economici o sui dati personali richiedono approvazione umana esplicita; l'AI propone,
   documenta e implementa, non delibera.
5. **Trust Center, sezione "Come è costruito questo sito"**: dichiara pipeline AI, gate umani,
   e linka i generatori. Coerente con l'identità del progetto (studenti e ricercatori: il
   metodo È il messaggio).

---

## 11. Automazione — le pipeline

Tutte GitHub Actions nel repo `gtf` (free tier abbondante per questi volumi). Nessun segreto
di produzione nelle pipeline del registro: leggono solo superfici pubbliche.

### 11.1 `validate.yml` — su ogni PR (il guardiano della SSOT)
1. JSON Schema su ogni record; 2. integrità del grafo (§3.4); 3. lint anti-segreti;
4. no-orphan (ogni record raggiungibile dalla missione); 5. freshness → marca `stale`;
6. calcolo score *preview* nel commento della PR (si vede l'impatto della modifica sullo
score prima del merge — feedback loop immediato).

### 11.2 `publish.yml` — su merge in main
1. Genera: Compliance Map (matrice REQ×CTL×IMP×EVD), pagine Trust Center, `score.json`,
   badge SVG, feed `trust.json` machine-readable (per ricercatori e verifiche automatiche);
2. deploy su GitHub Pages; 3. tag `registry-vX.Y.Z` (SemVer del registro: MAJOR = cambia uno
   schema, MINOR = nuovi record, PATCH = correzioni).

### 11.3 `collect-evidence.yml` — settimanale (§6.3) · `anchor.yml` — mensile (§6.4)

### 11.4 Integrazioni esistenti (nessuna modifica invasiva)
- `monitor.yml` (imgauth) resta com'è: le sue issue SONO evidenze; il collettore le legge.
- Il cron del Worker resta com'è: D1/R2 sono le sorgenti primarie di L5.
- Rilasci: si aggiunge solo la creazione del tag/release GitHub al flusso di deploy (§6.2.2).

---

## 12. Roadmap / WBS

Fasi incrementali; ogni fase lascia il sistema **coerente e pubblicabile** (mai uno stato
"a metà" visibile). Criterio di uscita esplicito per fase.

| Fase | Contenuto | Deliverable | Uscita quando |
|---|---|---|---|
| **M0 — Fondazione** (≈1 sett.) | repo `gtf`, schemi JSON, `validate.yml`, MSN/PRN, ADR-GTF-001 (adozione framework) e ADR-GTF-002 (URL Trust Center) | registro vuoto ma valido, CI verde | la CI rifiuta un record malformato e un link rotto |
| **M1 — Import dell'esistente** (≈2 sett.) | EVD dell'inventario §6.1; CTL/IMP dei controlli già in produzione (HMAC, Turnstile, rate-limit, CORS, R2 EU, OTS, TSA, sonda, escrow…); ADR retroattive da P0–P19 | grafo popolato: il servizio di oggi, descritto e collegato | ogni CTL attivo ha IMP+EVD reali; zero orfani |
| **M2 — Compliance Map** (≈2-3 sett.) | REQ dalle 7 fonti normative (§5), posizionamento eIDAS pubblicato, registro DAT, RSK principali | matrice Norma→…→Evidenza generata | ogni REQ ha stato e giustificazione; §5.2 online |
| **M3 — Trust Center + Score** (≈2-3 sett.) | `site/`, generatori, `publish.yml`, `score.json` + badge, collettore §6.3 | `/trust/` pubblico con score calcolato | uno sconosciuto risponde alle domande di §13 senza chiedere nulla a nessuno |
| **M4 — Ciclo vivo** (continuo) | ancora dogfooding mensile, restore drill, review esterna annuale, canary HMAC (P17-B), pubblicazione autart-signer (P11) | primo bundle ancorato; primo verbale di drill | lo score riflette un ciclo completo di cadenze §9.3 |

Dipendenze esterne già note: P11 (repo authart pubblico) condiziona il CTL "codice interamente
pubblico"; P17-B (canary) condiziona l'indicatore Integrità pieno. Entrambe già in backlog:
il GTF le *assorbe*, non le duplica.

---

## 13. Il test finale — le domande e dove vivono le risposte

| Domanda | Risposta immediata in |
|---|---|
| Perché questo servizio è affidabile? | Trust Center home: principi + score + catene claim→evidenza |
| Come viene garantita l'integrità? | CTL-hmac / CTL-ots-anchor / CTL-pades-blt-tsa → evidenze + `verify_howto` |
| Come vengono gestiti gli errori? | sezione Incidenti: INC + ACT + `/status/` drill-down |
| Come vengono conservate le prove? | EVD con location/retention + §6.5 + `verify_howto` (R2 EU, `.ots` idempotente) |
| Chi ha preso questa decisione? | ADR (con data, contesto, conseguenze, commit) |
| Quando è stata modificata questa procedura? | git log del record PRC (blame pubblico) |
| Quale evidenza dimostra questa affermazione? | ogni claim renderizzato porta il link EVD (PRN-03: non può esistere claim senza) |
| Quale norma supporta questo requisito? | REQ.source nella Compliance Map |
| Quale implementazione realizza questo controllo? | CTL.implemented_by → IMP → file/riga nel repo pubblico |

Se una di queste domande richiede più di due click dal Trust Center, è un bug del framework.

---

## 14. Decisioni aperte (da chiudere come prime ADR del repo `gtf`)

0. **ADR-GTF-001 — Nome del framework**: ✅ **deciso** (2026-07-09) — "Genesis Trust Framework"
   (GTF), repo `spazio-genesi/gtf`. Coerente col nome dell'ente (Spazio Genesi) e con il
   lessico onesto del servizio; "Trust Center", "Trust Registry", "Open Trust Score" restano
   nomi di componenti interni al framework, non del brand.
1. **ADR-GTF-002 — URL del Trust Center**: `/trust/` sotto attestazione.spaziogenesi.org via
   route Worker (coerenza a un dominio, pattern `/c/*` già rodato) vs `trust.spaziogenesi.org`
   (più semplice, zero Worker). Propensione: route Worker.
2. **ADR-GTF-003 — Lingua**: registro in inglese (interoperabilità AI/standard) con Trust
   Center generato in italiano (+ inglese poi), oppure tutto italiano. Propensione: record
   bilingui minimi (title it, statement it, id/campi en).
3. **ADR-GTF-004 — Collocazione snapshot**: dentro il repo `gtf` (semplice, pubblico,
   diffabile) vs bucket R2 dedicato (più pulito se crescono). Partire nel repo, migrare a
   soglia dimensione.

---

*Questo documento vive nel repo `spazio-genesi/gtf` come record governato dal framework che
descrive (registro decisioni, ADR-GTF-001..004). Nato come bozza in `img-auth-hub` (repo
privato di lavorazione) e migrato qui in fase M0 secondo il piano che esso stesso definiva.*
