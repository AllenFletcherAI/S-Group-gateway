# Rollback & Safety Net

> Confidence to make changes comes from knowing exactly how to reverse them (Habit 09).
> Always know the last known good commit before starting risky work.

## Checkpoint Baseline
- **Last Known Good Commit SHA:** `c034af093475c404642ea869382f6e9bc35a98bf` (Slice 3 Timeline & Documents)
- **Last Good Release Tag:** `v1.0.0`

## Rollback Execution Runbook
1. **Revert Git Commit:**
   ```bash
   git revert <commit-sha> --no-edit
   git push origin main
   ```
2. **Database Downward Migration:**
   - Run migration down-step if database schema was altered.
   - Verify table structure matches previous schema version.
3. **Feature Flag Disablement:**
   - If feature is behind a flag, disable flag in remote config to immediately cut off traffic without deploying.
4. **Smoke Test Customer Path:**
   - Execute the verification check in docs/TESTING.md to confirm service recovery.
