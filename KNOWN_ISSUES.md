# KNOWN ISSUES & LIMITATIONS
**Project**: Voxel Raiders: Dimensional Rift  
*Current Release Tier: Pre-Alpha Core Development*

---

## Active Issues
*No known defects currently recorded. The project is transitioning into Phase 2 & 3 implementation.*

---

## Approved Architectural Constraints
1. **Cloud Save Retention**: Render server auto-saves are retained in memory/ephemeral storage for a maximum of 24 hours to prevent unbounded server storage costs. Players download their `.vrsave` file locally and upload it when re-hosting.
2. **Key Item Drop Limit**: Boss summon items will drop at most 6 times from mobs. If lost/destroyed 6 times, the 7th and final key spawns inside a dungeon chest; if destroyed from the chest, it results in permadeath failure.
