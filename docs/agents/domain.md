# Domain Docs

This is a single-context repository.

## Before working

- Read the root `CONTEXT.md`.
- Read relevant decisions under `docs/adr/`.
- Proceed silently when a particular domain document does not exist; the domain-modeling workflow creates documentation lazily.

## Use the glossary's vocabulary

Use the canonical terminology from `CONTEXT.md` in tickets, code, tests, and documentation. Avoid synonyms that the glossary explicitly rejects.

If a needed concept is absent, reconsider whether it belongs to the domain or note the genuine gap for the domain-modeling workflow.

## Flag ADR conflicts

Surface any conflict with an existing ADR instead of silently overriding the recorded decision.
