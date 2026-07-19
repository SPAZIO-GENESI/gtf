# Verbale — prima revisione interna trimestrale

**Data**: 2026-07-19 · **Esito**: senza rilievi · **Processo**: `PRC-review-trimestrale`

Eseguita in anticipo rispetto alla cadenza dichiarata (90 giorni dalla
nascita del framework, 2026-07-09 → scadenza naturale 2026-10-07): il
primo ciclo completo si chiude ora invece di aspettare la scadenza,
scelta legittima e più prudente.

## Controlli (CTL)

Censiti tutti i 29 controlli attivi del registro. Di questi, **2** hanno
una prossima scadenza di revisione entro il trimestre corrente (cadenza a
90 giorni anziché 180): il pannello di amministrazione delle credenziali
agente e la catena di rilascio CI/CD. Entrambi sono stati riverificati
contro lo stato reale, non solo ri-datati:

- **Pannello admin**: verificato dal vivo che l'accesso senza credenziali
  a `/admin` reindirizza al login Cloudflare Access, come dichiarato dal
  controllo. Confermato.
- **Catena di rilascio (CI/CD)**: verificato che la pipeline continua a
  girare regolarmente e che la descrizione dello stato di avanzamento
  resta accurata. Confermato.

I restanti 27 controlli hanno prossima scadenza tra gennaio e luglio
2027: nessuna azione in questo ciclo.

## Rischi (RSK)

Riletti i 12 rischi a impatto medio o alto del registro. Un punto ha
richiesto una verifica dal vivo oltre alla sola rilettura: una pagina
pubblica introdotta di recente presenta per la prima volta un prezzo
futuro legato a un upgrade normativo non ancora disponibile — controllato
che il testo resti condizionato e non prometta una data, coerente con la
posizione dichiarata. Nessuno scostamento trovato: tutte le mitigazioni
dichiarate restano valide.

## Azioni correttive (ACT)

Zero aperte all'inizio del ciclo, zero aperte al termine: nessuna
anomalia o scostamento ha richiesto un'azione correttiva in questo primo
giro.

## Esito

Nessun rilievo. Due controlli confermati con verifica reale, nessun
controllo marcato "stale", nessuna azione correttiva necessaria.
