# Rollback & Safety Net

> Confidence to make changes comes from knowing exactly how to reverse them (Habit 09).
> Always know the last known good commit before starting risky work.

## Checkpoint Baseline
- **Last Known Good Commit SHA:** `a8d5fc6` (Slice 11 Customs Pre-Clearance Redline Audit & 3-Way Reconciliation Engine)
- **Previous Checkpoint SHA:** `efb814e` (Slice 10 Hick's Law Product Design Standard Refactor)
- **Last Good Release Tag:** `v2.1.0` (Production Master Milestone)

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
