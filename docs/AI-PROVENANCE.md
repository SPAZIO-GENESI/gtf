# Provenienza del codice generato da modelli

*Convenzione adottata il **2026-10-20**. Vale per i repo pubblici del progetto
(imgauth, imgauthweb, gtf, attest-mcp, attest-mcp-remote, attest-action,
attest-bot, authart). English summary at the end.*

> **Copia canonica pubblica.** Questo è il testo di riferimento della convenzione,
> pubblicato nel repository `gtf` (licenza MIT) perché sia leggibile senza
> credenziali. Il repository di lavoro `img-auth-hub` è privato e contiene solo un
> rimando a questa pagina.

Parte del codice e della documentazione di questo progetto è stata scritta con
l'aiuto di modelli di intelligenza artificiale generativa, sotto la direzione e
la revisione del gestore, che resta l'unico responsabile di ciò che viene
pubblicato. Questa convenzione rende quel fatto **leggibile nella storia git**,
invece di lasciarlo a una dichiarazione generica nel README.

## Cosa si marca

I contributi in cui un modello ha **generato o riscritto in modo sostanziale**
codice, test, configurazione o documentazione: una funzione, un file, un
documento, una serie di modifiche coordinate.

Non si marca l'autocompletamento di una riga, la correzione di un refuso, né un
suggerimento che il gestore ha poi riscritto con parole proprie.

## Come

Con un trailer nel messaggio di commit, in fondo, separato dal corpo da una riga
vuota. Due righe:

```
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
AI-Assisted: <una riga: cosa ha fatto il modello e cosa ha fatto la persona>
```

- `Co-Authored-By` riporta **nome e versione** del modello usato. È il trailer
  già presente nella storia dei repo (per esempio `Claude Opus 5`,
  `Claude Sonnet 5`) e GitHub lo riconosce e lo mostra.
- `AI-Assisted` è la sintesi di una riga di come il modello è stato usato.
  Esempio: `AI-Assisted: il modello ha scritto il codice e i test; scelta del
  progetto, revisione e collaudo sono del gestore.`

Un commit con più modelli porta più righe `Co-Authored-By`.

## Da quando

Dalla data di adozione, **in avanti**. I commit precedenti al 2026-10-20 non
hanno un'`AI-Assisted` e **non vengono modificati**: molti hanno già il solo
`Co-Authored-By`, molti altri nessun trailer, e va detto così com'è.

## Cosa non si fa

**Non si riscrivono i messaggi dei commit passati**, né con `rebase`, né con
`filter-repo`, né con un force-push, per far apparire la storia conforme.

Motivo: riscrivere la storia di repo pubblici per sembrare in regola è peggio
del problema che risolverebbe. Cambia gli hash, rompe i riferimenti (PR, tag,
attestazioni di provenienza di build, archivi esterni come Software Heritage e
Zenodo che hanno già copiato la storia), e sostituisce un fatto — «prima del
20 ottobre 2026 questa convenzione non esisteva» — con un'apparenza. Una
convenzione datata è più credibile di una storia ripulita.

Se un commit passato va chiarito, lo si fa con una nota nuova (un commit, una
voce di changelog), mai modificando quello vecchio.

## Dove è richiamata

- `CONTRIBUTING.md` di `imgauth` e di `gtf` (una riga ciascuno, nessuna copia
  del testo, link a questa pagina);
- README di `imgauth` e di `gtf` (sezione sull'uso dell'AI generativa, versione
  inglese e italiana);
- `CLAUDE.md` del repository di lavoro privato `img-auth-hub`, per le sessioni
  assistite (rimanda a questa pagina).

## English summary

Parts of the code and documentation are written with generative AI models,
under the maintainer's direction and review; the maintainer remains solely
responsible for what is published. From **2026-10-20 onward**, commits where a
model generated or substantially rewrote content carry two trailers:
`Co-Authored-By: <model name and version>` and `AI-Assisted: <one line on how
the model was used>`. Earlier commit messages are **not rewritten**: rewriting
the history of public repositories to look compliant would change hashes, break
external references and replace a fact with an appearance.
