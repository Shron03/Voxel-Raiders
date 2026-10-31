# CENTRALIZED BUG TRACKER
**Project**: Voxel Raiders: Dimensional Rift  
**Defect Severity Scale**: Critical (P0), High (P1), Medium (P2), Low (P3)  
*Policy: Zero Critical and Zero High severity defects permitted in release builds.*

---

## Active & Resolved Defect Log

| Defect ID | Date/Time | Description | Severity | Platform | Root Cause | Fix Implemented | Status |
|---|---|---|---|---|---|---|---|
| **VR-BUG-001** | 2026-10-31 | Room capacity allowed 9th connection if host joined through HTTP | High | Backend | `room.clients` did not track host socket reference on room creation | Initialized host client socket entry in `createRoom` | **RESOLVED & VERIFIED** |
| **VR-BUG-002** | 2026-10-31 | Host migration selected wrong socket on host disconnect | High | Backend | Host socket was missing from client map keys | Linked host socket reference cleanly to client map | **RESOLVED & VERIFIED** |
| **VR-BUG-003** | 2026-10-31 | Variable scope in Cycle 20 test runner assertion | Medium | Tests | Unassigned `p2` return value in test script | Assigned returned player reference | **RESOLVED & VERIFIED** |

---

## Defect Summary Statistics
- **Critical (P0)**: 0 Open / 0 Resolved
- **High (P1)**: 0 Open / 2 Resolved
- **Medium (P2)**: 0 Open / 1 Resolved
- **Low (P3)**: 0 Open / 0 Resolved
- **Active Defects**: **0 (Zero open defects)**
