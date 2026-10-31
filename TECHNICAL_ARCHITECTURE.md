# VOXEL RAIDERS: DIMENSIONAL RIFT
## Technical Architecture & Network Infrastructure — Version 1.0.0

---

## 1. System Architecture Overview

Voxel Raiders employs a high-performance **Hybrid Client-Server Architecture** designed for ultra-low latency, cross-platform PC/Android compatibility, and zero-configuration player matchmaking:

```
                  +----------------------------------------------+
                  |           Render Cloud Deployment            |
                  |  - Express / HTTPS Landing & Download Page   |
                  |  - Authoritative WebSocket Game Server       |
                  |  - Room & Lobby Matchmaking Engine (Codes)   |
                  |  - 24-Hour Ephemeral Cloud Auto-Save Cache   |
                  +----------------------------------------------+
                                         ^
                                         | Secure WebSockets (WSS)
                                         v
         +-------------------------------+-------------------------------+
         |                                                               |
+-----------------------+                                       +-----------------------+
|  PC Game Client       |                                       | Android Mobile Client |
|  - Standalone Desktop |                                       | - Touchscreen Virtual |
|    (LAN Auto-Discover)|                                       |   Thumbsticks & Pads  |
|  - Direct Local Save  |                                       | - WebGL / Mobile View |
|  - WebGL / Canvas / 3D|                                       | - Low-Power Profile   |
+-----------------------+                                       +-----------------------+
```

---

## 2. Server Architecture (Render Deployment)

### Core Technologies
- **Runtime**: Node.js v20+ with ES modules.
- **Protocol**: HTTP/2 & WebSocket (ws) for high-frequency low-overhead binary/JSON packet interchange.
- **Tick Rate**: 30 Hz server simulation tick rate with client-side 60 FPS interpolation and dead-reckoning.
- **Hosting**: Deployed seamlessly to Render's Web Service tier with healthcheck endpoints (`/healthz`).

### Room & Lobby Lifecycle
1. **Lobby Generation**: Creates a cryptographically unique 6-character room code (e.g., `VR-7892`) and a direct shareable URI (`https://voxel-raiders.onrender.com/join/VR-7892`).
2. **Player Cap**: 2 to 8 concurrent players per room.
3. **Session Recovery**: Heartbeat tracking detects disconnections. A disconnected player has 60 seconds to reconnect with their original session token before their slot is freed.
4. **State Machine**:
   - `LOBBY`: Character customization, ready checks, game mode selection (Friendly vs. Agenda+FFA), world save upload.
   - `STORY_PAUSE`: Synchronous narrative freeze; gameplay simulation halted; collects player votes to advance/skip.
   - `IN_GAME`: Authoritative movement validation, mob AI routing, projectile collision, loot drop rolls, day/night clock.
   - `BOSS_CHAMBER`: Dedicated boss room instance with synchronized phase triggers and 50x scaled attributes.
   - `GAME_OVER`: Team-wipe resolution or Victory screen.

---

## 3. Cryptographic Save System & Anti-Cheat

### Save File Structure
To satisfy the user requirement that the cloud does not retain player saves permanently, the server generates an encrypted `.vrsave` (Voxel Raiders Save) file:
- **Server Auto-Save**: Auto-saves every quest completion and every in-game morning (every 6 minutes).
- **24-Hour Server Purge**: Server retains the auto-save in memory/ephemeral disk for 24 hours only. Players can download their `.vrsave` file to their local machine at any time.
- **Anti-Tamper Signature**:
  ```json
  {
    "version": "1.0.0",
    "worldSeed": 94827104,
    "calendarDays": 104,
    "bossesDefeated": [1],
    "bossKeyDropsCount": 1,
    "inventory": [...],
    "anchorsUnlocked": [...],
    "gameMode": "AGENDA_FFA",
    "timestamp": 1793448000,
    "checksum": "d5a8b792...",
    "signature": "HMAC_SHA256(payload, SECRET_SALT)"
  }
  ```
  If any player attempts to edit the JSON file to inject Void items or modify calendar days, the HMAC checksum validation fails upon upload, rejecting corrupted or hacked files.

---

## 4. Local PC Desktop Client & LAN Discovery Protocol

For players playing in the same room without internet latency:
- **Native PC App**: Packages the full game with a local server engine and offline storage.
- **Local World Directory**: Automatically reads from and writes to `%APPDATA%/VoxelRaiders/saves/` without requiring manual file uploads.
- **UDP LAN Broadcast**:
  - The hosting PC broadcasts a UDP beacon on port `48888` every 1.5 seconds:
    `{"service": "VOXEL_RAIDERS_LAN", "host": "Player1", "port": 7777, "players": "2/8", "days": 42}`
  - All PC clients on the same local subnet listen on port `48888` and instantly display available LAN games in the "Local Games" browser tab with 1-click joining.

---

## 5. Graphics & Performance Specifications

### PC Performance Profile
- **Target**: 1080p @ 60 FPS on Intel UHD/Iris Xe graphics or AMD Vega integrated mobile APUs.
- **Render Engine**: Stylized 3D voxel renderer utilizing instanced mesh rendering for voxel blocks and batched draw calls for mobs.
- **Lighting**: Pre-baked ambient occlusion + dynamic directional sun/moon light with soft shadow mapping.

### Android Performance Profile
- **Target**: 60 FPS on mid-range Android devices (Snapdragon 680 / Helio G99 / Mali GPUs).
- **Optimizations**:
  - Half-resolution shadow buffers.
  - Reduced particle emitter density.
  - Aggressive view frustum culling (only rendering visible isometric tiles).
  - Virtual dual-stick touchscreen controls with tactile feedback and customizable UI scaling.

---

## 6. Combat & Simulation Engine

- **Authoritative Combat Loop**:
  - Player sends: `InputIntent { moveVector, attackAngle, rollTrigger, artifactSlot }`
  - Server validates cooldowns, stamina, collision bounds, and calculates damage and knockback.
  - Server broadcasts: `DeltaState { entityId, position, health, animationState, effects }`
- **Hit Detection**: Server-side sphere/box sweeps prevent speed-hacking and desync.
