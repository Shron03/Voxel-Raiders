# CHANGELOG: VOXEL RAIDERS
All notable changes to this project are documented here.

## [1.0.0-release] - 2026-10-31
### Added
- Complete authoritative multiplayer backend (`server/index.js`, `roomManager.js`, `gameSimulation.js`, `cryptoSave.js`, `lanDiscovery.js`).
- Complete cross-platform isometric voxel client (`client/public/index.html`, `styles.css`, `main.js`).
- Pinned top boss healthbar (only visible for bosses; hidden for mobs).
- 35% bottom screen synchronized story dialogue overlay with unanimous vote skip/forward.
- Altar of Eclipse allowing players to skip daylight and trigger night immediately.
- Boss Portals opening schedule: Days 110, 310, 510, 710, 910, with early summoning restricted strictly to multiples of 10.
- 50x exponential Boss stat ladder with Boss 5 triggering 3x world expansion upon defeat.
- 6 Rarity tiers with exact drop probabilities: Common (80%), Rare (50%), Unique (10%), Legendary (1%), Mythical (0.01%), Void (0.000001%).
- Death inventory rules: Common despawns, high tiers stay on ground, Mythical/Void shatter into fractured cores.
- Teammate revival within 60s window, 30s Anchor respawn, and team wipe permadeath.
- Tamper-proof `.vrsave` format with SHA-256 and HMAC-SHA256 signatures.
- Local PC standalone launcher with UDP port 48888 auto-discovery and `%APPDATA%/VoxelRaiders/saves/` storage.
- Render Blueprint deployment configuration (`render.yaml`).
- 50-Cycle automated test harness (`tests/cycleRunner.js`) with 100% pass rate.
