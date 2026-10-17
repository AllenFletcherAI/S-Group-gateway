# Architectural Alternatives & Rejected Options

> For every significant choice, write down the options you rejected and why (Habit 17).
> Without alternatives, every choice sounds like the only possible one, and that is a red flag.

## Decision D-001: Architectural Governance & Toolchain Strategy
- **Option 1:** Unstructured AI coding without persistent documentation
  - *Cost / Risk:* High risk of technical debt, context amnesia between sessions, inability to defend code at whiteboard.
  - *Why rejected:* Fails customer safety standards and creates unmaintainable software.
- **Option 2:** Heavy manual documentation outside the repository (Confluence / Notion)
  - *Cost / Risk:* Quickly diverges from codebase; AI cannot read or update it during sessions.
  - *Why rejected:* High friction, guaranteed drift from actual source code.
- **Option 3:** In-repo Defend What You Ship docs/ suite + Senior Toolchain (Chosen)
  - *Cost / Risk:* Modest upfront documentation discipline before code changes.
  - *Why chosen:* Keeps code and rationale coupled in git; persists context across sessions; enables whiteboard readiness.
  - *Revisit if:* Project becomes an unmaintained, throwaway single-run script.
