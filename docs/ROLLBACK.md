# Rollback & Safety Net

> Confidence to make changes comes from knowing exactly how to reverse them (Habit 09).
> Always know the last known good commit before starting risky work.

## Checkpoint Baseline
- **Last Known Good Commit SHA:** `40f67994083318b12607a9b46a72a42fb6f678bd` (Slice 9 Enterprise Scoped API Keys & JWT RBAC Engine)
- **Last Good Release Tag:** `v1.6.0`

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
