# Project Constraints & Guardrails

> Hard rules for AI assistants and contributors (Habit 07). Use plain words: NEVER, ALWAYS, ONLY.
> Stop and ask before breaking or altering any rule listed below.

## Off-Limits & Protected Areas
- NEVER modify authentication, token verification, password hashing, or cryptographic logic without explicit user review.
- NEVER execute destructive database commands (`DROP DATABASE`, `TRUNCATE TABLE`) or apply migrations without a verified down-step.
- NEVER add new external packages or network dependencies without vetting maintenance and recording rationale in docs/DECISIONS.md.
- NEVER hardcode secrets, API keys, private tokens, or credentials in source code or version control.
- NEVER auto-allow commands matching the "Never Auto-Allow" tier (`git push -f`, `rm -rf`, piping downloads to shell).

## Architectural Invariants
- ALWAYS validate all untrusted external input at the public API trust boundary before passing to domain services.
- ALWAYS execute tests and inspect raw terminal output before claiming a task is complete (Habit 08).
- ALWAYS trace modified execution paths in docs/FLOW.md when altering cross-module logic.
- ONLY make small, atomic changes scoped to one single behavior change per prompt and commit (Habits 12, 23).
