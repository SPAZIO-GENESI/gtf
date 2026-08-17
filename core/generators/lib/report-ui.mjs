// Le 10 etichette dei MET- dell'Open Trust Score: stesso schema per ogni
// tenant (è la metodologia comune del framework, non contenuto di un
// progetto), quindi la traduzione vive qui e non in un tenant.config.json.
// Le note dei singoli indicatori (score.json → indicators[].note) restano
// in italiano: sono prosa generata da score.mjs con dati interpolati,
// fuori dallo scope di questa prima versione inglese.
export const METRIC_LABELS_EN = {
  Trasparenza: "Transparency",
  Integrità: "Integrity",
  Tracciabilità: "Traceability",
  Documentazione: "Documentation",
  Automazione: "Automation",
  Audit: "Audit",
  Conservazione: "Preservation",
  Riproducibilità: "Reproducibility",
  Privacy: "Privacy",
  Governance: "Governance",
};

// Stringhe fisse del report (Trust Center di un tenant): struttura del
// documento, non contenuto di un progetto specifico — per questo vivono in
// core/, non in un tenant.config.json (check-core-isolation.mjs le
// lascerebbe comunque passare: nessun nome di progetto qui dentro).
export const REPORT_UI = {
  it: {
    navMissione: "Missione",
    navEidas: "Posizionamento eIDAS",
    navCompliance: "Compliance Map",
    navRischi: "Rischi",
    navDecisioni: "Decisioni",
    footerNavLabel: "Collegamenti del footer",
    ledgerAriaLabel: "Punteggio di maturità calcolato dal registro pubblico",
    ledgerSaldo: "Saldo",
    ledgerNote: (available, total) =>
      `${available} di ${total} indicatori disponibili — i restanti non sono stimati: restano `,
    ledgerNoteNd: "n/d",
    ledgerNoteEnd: " finché non esisteranno i dati per calcolarli davvero.",
    ledgerPartialNote: " * = valore parziale, passa il mouse per i dettagli.",
    ledgerFormula: "Formula di ciascuno",
    missioneHeading: "Missione e principi",
    regolaVerificabile: "Regola verificabile: ",
    eidasHeading: "Cosa NON è questo servizio",
    complianceHeading: "Compliance Map",
    comeVerificare: "come verificare",
    nessunControllo: "nessun controllo collegato ancora",
    rischiHeading: "Rischi",
    probabilita: "probabilità: ",
    impatto: "impatto: ",
    mitigatoDa: "Mitigato da",
    nessunaMitigazione: "nessuna mitigazione collegata ancora",
    decisioniHeading: "Decisioni",
    engine: "motore",
    package: "pacchetto",
    statusLabels: { active: "attivo", draft: "bozza", stale: "da rivedere", retired: "superato" },
  },
  en: {
    navMissione: "Mission",
    navEidas: "eIDAS positioning",
    navCompliance: "Compliance Map",
    navRischi: "Risks",
    navDecisioni: "Decisions",
    footerNavLabel: "Footer links",
    ledgerAriaLabel: "Maturity score computed from the public registry",
    ledgerSaldo: "Total",
    ledgerNote: (available, total) =>
      `${available} of ${total} indicators available — the rest are not estimated: they stay `,
    ledgerNoteNd: "n/a",
    ledgerNoteEnd: " until the data to compute them actually exists.",
    ledgerPartialNote: " * = partial value, hover for details.",
    ledgerFormula: "Formula for each",
    missioneHeading: "Mission and principles",
    regolaVerificabile: "Verifiable rule: ",
    eidasHeading: "What this service is NOT",
    complianceHeading: "Compliance Map",
    comeVerificare: "how to verify",
    nessunControllo: "no control linked yet",
    rischiHeading: "Risks",
    probabilita: "likelihood: ",
    impatto: "impact: ",
    mitigatoDa: "Mitigated by",
    nessunaMitigazione: "no mitigation linked yet",
    decisioniHeading: "Decisions",
    engine: "engine",
    package: "package",
    statusLabels: { active: "active", draft: "draft", stale: "needs review", retired: "retired" },
  },
};
