# incidents/ — Incidenti (INC)

Un file `INC-<anno>-<progressivo>.yaml` per ogni incidente rilevante
(guasto critico, degrado, violazione). Un incidente `closed` deve avere
almeno un'azione correttiva (ACT) collegata. Validato da
`schemas/incident.schema.json`. Vedi GTF-ARCH §9.4.

Popolato in fase **M4 — Ciclo vivo**, o prima al verificarsi del primo
incidente reale (vedi ARCHITECTURE.md §12).
