# gtf — Genesis Trust Framework

[![Genesis Trust Score](https://trust.spaziogenesi.org/badge.svg)](https://trust.spaziogenesi.org)

*[Versione italiana](./README.it.md) — the Italian README is the original and is kept in sync.*

A framework that turns a project's claims about its own trustworthiness into
**records anyone can verify**: an engine (schemas, validator, generators) plus
one data package per project it is applied to. Every page, compliance matrix and
score is **generated** from the registry — never written by hand — and the score
can be recomputed offline from a clone of this repository, with no network calls
and without trusting whoever published it.

Today it is applied to one project: the digital-work attestation service of
Spazio Genesi ETS. It is built to be applied to more than one.

## Ownership and licences

This repository contains two parts with **distinct copyright holders**, both
MIT-licensed:

- the generic engine in `core/` is a product of **Tangram.page** — see
  [core/LICENSE](./core/LICENSE);
- the registries, tenant packages, content and configuration are **© Spazio
  Genesi ETS** — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

Spazio Genesi ETS applies the engine to its own services and maintains their
registries; Tangram.page maintains the engine. Because both parts are MIT, no
party can strand the result: anyone may fork and continue.

## Why it exists

Trust in a piece of software is usually asserted — in a policy page, a
questionnaire, a self-assessment nobody can check. This framework takes the
opposite route: every claim must point to a record, every record to dated
evidence, and the evidence must be collected from public endpoints by a
scheduled job rather than typed in by the maintainer.

Three properties follow, and they are the point of the whole design:

- **Reproducible.** `npm run build` from a clean clone recomputes the published
  score from the committed registry alone. A reviewer needs no credentials — the
  entire audit perimeter is public by design.
- **Falsifiable.** Controls that are not yet active say so; the score fluctuates
  honestly with the freshness of real evidence instead of being pinned to a
  flattering number.
- **Anchored.** A monthly bundle of the registry is attested with the very
  service the registry describes, so what the record claimed at a given date can
  be shown later.

Read [ARCHITECTURE.md](./ARCHITECTURE.md) first: it does not document the
service, it is the design of the system that produces the record.

## Structure

- **`core/`** — the engine, generic for any project. It contains **no project
  name at all**, and that is enforced by a CI guard rather than by good
  intentions (`npm run check-core`).
  - `schemas/` — one JSON Schema per record type: principles, requirements,
    controls, implementations, evidence, processes, decisions, risks, data,
    metrics, glossary, actions.
  - `generators/` — Node scripts: `validate.mjs` (schema plus graph integrity),
    `collect-evidence.mjs` (weekly snapshot from public endpoints),
    `check-cadences.mjs` (alerts when a recurring process exceeds its declared
    cadence), `anchor-monthly.mjs`, `score.mjs`, `build-site.mjs`,
    `build-changelog.mjs`, `check-core-isolation.mjs`.
- **`tenants/<id>/`** — the data of one project: `registry/` (the YAML records),
  `snapshots/` (weekly evidence), `tenant.config.json` (identity, domains,
  endpoints, repositories, score formulas), `site/` (that project's generated
  Trust Center). One tenant exists today: `tenants/attestazione/`.
- **`content/`** — curated product text that is not derived from a registry.
- **`site/`** — the generated output of the framework's own page.

## Two sites, one engine

- `site/` → [trust.spaziogenesi.org](https://trust.spaziogenesi.org), the
  framework's page, with a summary of its tenants.
- `tenants/<id>/site/` → a thin per-tenant Pages repository, because GitHub
  Pages allows only one custom domain per repository. For the attestation
  service that is
  [attestazione.trust.spaziogenesi.org](https://attestazione.trust.spaziogenesi.org).

## Running it

```bash
npm install
GTF_TENANT=attestazione npm run validate   # schemas, reference integrity, secret scan
GTF_TENANT=attestazione npm run build      # validate + core guard + score + sites + changelog
```

`GTF_TENANT` is optional while a single tenant exists, but should always be
passed explicitly once there is more than one.

## Independent review

The framework's obvious objection is self-reference: who checks the project that
grades itself? Three answers, none of them a promise:

1. The score is **recomputable offline by anyone** from the committed registry.
2. An **independent external review** is planned with a written scope, entirely
   over public material, with no access to grant — see
   [docs/piano-review-esterna-2026.md](./docs/piano-review-esterna-2026.md). The
   resulting report is public by default, findings included.
3. Findings become corrective actions with deadlines, recorded in the registry
   like everything else.

## Status and roadmap

The engine and the project data were separated in August 2026, and each tenant
now has its own domain, package version and score. The next steps — extracting
the engine as a standalone versioned package, onboarding an adopter outside the
organisation, and mapping the registry's evidence onto regulatory requirements —
are described in
[docs/ROADMAP-trust-multiprogetto.md](./docs/ROADMAP-trust-multiprogetto.md),
which also measures the starting point in the code rather than estimating it.

Current score: 91–94/100 with 10/10 indicators available, fluctuating with the
freshness of collected evidence.

## Contact

`it@spaziogenesi.org` — Spazio Genesi ETS, Italy.
