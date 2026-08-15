# content/ — testi curati del prodotto Trust

Contenuti che **non** sono record del registro ma che il sito pubblica: sono
scritti a mano qui, e da qui **generati** nelle loro rese — mai scritti
direttamente in `site/` (che è output, vedi `site/README.md`).

| File | Cos'è | Rese generate |
|---|---|---|
| `changelog.yaml` | sorgente unica del changelog | `CHANGELOG.md` (tutte le voci) · `site/changelog.html` (solo `public: true`) |

I contenuti specifici di un singolo progetto non stanno qui ma nel pacchetto
del tenant (`tenants/<id>/content/`): questa cartella è del **prodotto**, non
di una sua applicazione.
