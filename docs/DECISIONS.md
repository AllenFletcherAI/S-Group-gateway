# Architectural Decisions Log

> Draft every non-trivial decision BEFORE writing code (Habits 02, 11, 14, 17).
> Always record the active AI model name and version, rejected alternatives, and revisit conditions.

## D-001: Adopt Defend What You Ship Standards & Senior Tooling
Date: 2026-10-18 Model: Gemini 3.8 Flash (High)
Context: Need to eliminate blind AI code acceptance, maintain architectural defensibility, and enforce Lane B customer safety.
Options:
  1) Generate code freely without persistent documentation or review gates
  2) Defend What You Ship v2 governance integrated with Addy Osmani SDLC, Context7, Graphify, 21st MCP, and Strix
  3) Maintain ad-hoc markdown notes in scratch directories
Chosen: 2
Why: Establishes complete traceability, enforces the 14-point Pre-Ship Gate, and ensures every customer-facing feature survives whiteboard interrogation.
Trade-off: Requires deliberate documentation discipline and diff inspection before each change.
Revisit if: Project is permanently converted into a throwaway disposable prototype (Lane A).
