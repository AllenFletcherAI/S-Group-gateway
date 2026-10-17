# Test Checklist & Verification

> Concrete commands and expected outputs (Habit 08).
> An AI claiming success and code actually working are two different facts. Paste real output.

## Automated Verification Suite
```bash
# 1. Typecheck & Linter
npm run lint

# 2. Automated Test Suite (Unit, Integration, Security Regression)
npm test

# 3. Security Vulnerability Scan (Strix)
# Run strix_probe_target on updated routes
```

## Mandatory Customer Path (Tested by Hand End-to-End)
1. Launch clean local development server.
2. Log in as an authenticated customer.
3. Perform the complete core user journey (create, read, update, delete).
4. Verify database state directly to confirm persistence.
5. Verify response status codes and headers in browser network tab.
