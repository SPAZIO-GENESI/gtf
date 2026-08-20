# Contributing

This project has **one maintainer**. Said openly, not hidden: response times
reflect that.

## Reporting a bug

Open a GitHub issue with steps to reproduce. For security vulnerabilities, do
not open an issue — see [SECURITY.md](./SECURITY.md).

## Proposing a change

Open an issue first for anything beyond a trivial fix, so the approach can be
agreed before code is written. Pull requests are welcome; keep them small and
focused, and expect CI (`validate.yml`) to run before review.

This repository has **two distinct copyright holders** — see
[NOTICE](./NOTICE). Any change under `core/` must pass `npm run check-core`,
which fails if a project-specific name appears there: `core/` is the generic
engine, shared across every tenant, and must stay free of references to any
one of them.

## What to expect

Best-effort review within a couple of weeks. This is a non-profit project run
by a single maintainer alongside other responsibilities, so response times
are not guaranteed.

## Licence

Contributions are accepted under the project's licence, MIT (see
[LICENSE](./LICENSE) and [NOTICE](./NOTICE) for the ownership split).
