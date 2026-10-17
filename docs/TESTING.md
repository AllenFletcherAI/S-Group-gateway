# Test Checklist & Verification

> Concrete commands and expected outputs (Habit 08).
> An AI claiming success and code actually working are two different facts. Paste real output.

## Automated Verification Suite
```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Automated Test Suite (Slice 1 Layout & Navigation)
npm test

# 3. Security Vulnerability Scan (npm audit)
npm audit
```

## Slice 1 Verification Receipts (Real Screen Output)
```text
> npx tsc --noEmit
(exited with code 0 - 0 errors)

> npm test
✔ Slice 1: Health check endpoint returns operational and safety invariants (207.9798ms)
✔ Slice 1: Root path redirects to /portal (5.8342ms)
✔ Slice 1: Portal renders S-Group branding, tenant indicator, and nav header (DE) (6.343ms)
✔ Slice 1: Portal renders English labels when requested with ?lang=en (5.2981ms)
✔ Slice 1: Static layout.css stylesheet is served correctly (12.1221ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 689.9492

> npm audit
found 0 vulnerabilities
```

## Mandatory Customer Path (Tested by Hand End-to-End)
1. Launch local gateway server: `npm run dev`
2. Open `http://localhost:3000/portal` in browser.
3. Verify top status bar displays `Gateway: Betriebsbereit`, `DE-SIS-8921` tenant chip, and DSGVO badge.
4. Verify navigation links: `Sendungen`, `Live-Tracking`, `Disposition`, `Dokumente & Zoll`, `Datenschutz (DSGVO)`.
5. Click `EN` language toggle to confirm English rendering.
6. Click user profile button (`dispatcher@schaefer-sis.de`) to verify dropdown menu.
7. Shrink viewport below 992px to confirm mobile hamburger drawer toggles cleanly.

