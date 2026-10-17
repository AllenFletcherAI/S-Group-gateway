# Data Structures & Schemas

> Record core structures, access patterns, scale, and permissions (Habit 20).
> The AI picked a data structure. You need to know why it was a good pick.

## Core Data Models
### Model: PrimaryEntity
- **Shape & Invariants:**
  - Unique ID (UUIDv4)
  - CreatedAt / UpdatedAt timestamps
  - TenantID (Partition key, non-nullable)
  - State (Enum: DRAFT, ACTIVE, ARCHIVED)
- **Access Pattern:** Read-heavy (90% read / 10% write). Queries filter by TenantID and State.
- **Expected Size & Growth:** 50,000 to 1,000,000 rows in year one.
- **Indexing & Trade-Offs:** Composite B-Tree index on `(TenantID, State, CreatedAt)` provides sub-millisecond filtering at the cost of 15% insert overhead.
- **Read / Write Permissions:** Written exclusively by DomainService; read by authorized tenant members.
