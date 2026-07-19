# Verbale — prima prova di ripristino (restore drill)

**Data**: 2026-07-19 · **Esito**: riuscita · **Processo**: `PRC-restore-drill`

## Cosa è stato provato

Domanda: *se l'archivio primario sparisse, i certificati tornano davvero
dal backup offsite?* Sono stati scelti 3 campioni tra le opere attestate,
ripristinati **dal backup** (non dall'archivio primario) e verificati con
gli stessi strumenti pubblici che userebbe chiunque:

1. un'opera **recente**;
2. un'opera del **primo periodo** di attività del servizio;
3. un'opera con **prova di ancoraggio Bitcoin matura** (già confermata da
   tempo, non più "in attesa").

Per ciascun campione sono state eseguite tre verifiche indipendenti:

- **Autenticità della firma**: attestazione e firma HMAC estratte dal PDF
  ripristinato, verificate contro il servizio pubblico di verifica
  (`/api/verify`, solo firma, nessun file trasmesso).
- **Ancoraggio Bitcoin**: la prova OpenTimestamps del campione verificata
  contro un blocco Bitcoin reale (verifica lite-client su calendari
  pubblici indipendenti).
- **Coerenza dell'archivio**: il badge pubblico "opera attestata" per
  l'impronta del campione.

## Esito

| Campione | Firma HMAC | Ancoraggio Bitcoin | Badge archivio |
|---|---|---|---|
| Recente | ✅ valida | ✅ confermato | ✅ verde |
| Primo periodo | ✅ valida | ✅ confermato | ✅ verde |
| Ancoraggio maturo | ✅ valida | ✅ confermato | ✅ verde |

**3/3 campioni verificati con esito positivo.** Il ciclo backup→ripristino
è valido: i certificati tornano identici e restano verificabili con gli
strumenti pubblici standard, senza bisogno di procedure speciali.

## Correzione emersa durante la prova

Il primo tentativo sul campione "recente" ha dato un falso allarme (firma
"non valida"): lo strumento di estrazione usato per il drill non stava
ancora leggendo i metadati facoltativi (titolo/autore/anno/note) dichiarati
su quel certificato, e la firma li vincola — senza di essi il confronto non
poteva tornare. Corretto lo strumento nel corso della prova; ripetuta la
verifica con i metadati inclusi, esito positivo. Il certificato non aveva
mai avuto alcun problema: era il tooling del drill, non ancora completo,
a doverlo essere. Annotato come promemoria per la prossima esecuzione:
lo strumento di estrazione va tenuto aggiornato insieme al formato del
certificato.

## Durata

Fase di verifica (dai file già ripristinati alla conclusione dei tre
controlli): circa 4 minuti e mezzo. Il tempo complessivo della prima
esecuzione in assoluto è stato più lungo per via della predisposizione
iniziale degli strumenti (che non si ripete alle prossime esecuzioni).

## Note

Nessun file ripristinato è stato conservato: i campioni scaricati dal
backup per la prova sono stati cancellati subito dopo la verifica (sono
certificati di opere reali). Il verbale non riporta nomi di bucket,
account o endpoint: quei dettagli restano nella documentazione operativa
interna.
