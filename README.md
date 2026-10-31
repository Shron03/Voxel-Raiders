# Voxel Raiders: Dimensional Rift

[![Render Deploy](https://img.shields.io/badge/Render-Deployed-brightgreen?logo=render)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Automated%20Tests-50%2F50%20Passed-success)](#)
[![Multiplayer](https://img.shields.io/badge/Multiplayer-2--8%20Players%20Cross--Platform-blue)](#)

**Voxel Raiders: Dimensional Rift** is an online multiplayer, isometric 3D action-sandbox dungeon-crawler inspired by the tactical fluid combat and perspective of *Minecraft Dungeons* fused with the gathering, crafting, and escalating survival tension of *Minecraft*.

---

## 🌟 Key Features

- **Cross-Platform Multiplayer (2 to 8 Players)**: Real-time action synchronization across Windows PC and Android phones with zero NAT/port-forwarding headaches via Render cloud WebSockets.
- **Dynamic 3D Isometric Engine**: Nostalgic, blocky voxel aesthetics running at locked **60 FPS** with dynamic day/night ambient lighting, cast shadows, and responsive controls.
- **Day / Night Survival Cycle**:
  - **Day Phase (4 min)**: Explore monument ruins, mine ores, raid dungeon vaults, and collect rare loot chests.
  - **Night Phase (2 min)**: Linear difficulty escalation. Hostile mobs spawn with upgraded armor and weapons.
  - **Altar of the Eclipse**: Skip daylight and trigger nightfall instantly for bonus loot multipliers.
- **Anchor Respawn & Permadeath**:
  - 60-second teammate revival window.
  - 30-second Anchor respawn timer.
  - **Team Wipe Permadeath**: If all players fall simultaneously, the expedition fails catastrophically!
- **6-Tier Drop Rarity**:
  - Common (80.0%) — *Despawns immediately upon death*
  - Rare (50.0%) — *Persists permanently on ground*
  - Unique (10.0%) — *Marked on minimap*
  - Legendary (1.0%) — *Named boss weapons*
  - Mythical (0.01%) — *Shatters into fractured relic shards requiring Blacksmith repair*
  - Void (0.000001%) — *Ultra-rare reality-warping gear*
- **5 Exponential Boss Encounters (50x Stat Ladder)**:
  - **Boss 1**: Day **110** (*The Sunken Warden of the Deep Vault*, Base HP: 5,000)
  - **Boss 2**: Day **310** (*The Colossus of Ancient Pyres*, 50x HP: 250,000)
  - **Boss 3**: Day **510** (*The Hollow Necrolord*, 2,500x HP: 12,500,000 — Easy with Tier 3+ gear)
  - **Boss 4**: Day **710** (*The Celestial Void Drake*, 125,000x HP: 625,000,000 — Normal with Tier 4+ gear)
  - **Boss 5**: Day **910** (*The Primordial Reality Eater*, 6,250,000x HP: 31,250,000,000 — HARD with min-maxed Void gear)
  - *Early Portal Summoning*: Allowed on **any day that is a multiple of 10** with key item. Non-multiples are locked.
  - *World Expansion*: Slaying Boss 5 shatters the rift, expanding the world to **300% size** for post-game infinite exploration.
- **Twisted Storyline & Dual Modes**:
  - **Agenda + Free-For-All (Default)**: Cooperative dungeon delving until a synchronized 35% bottom screen dialogue pause reveals the betrayal contract, sounding an alarm klaxon and unleashing PvP friendly-fire!
  - **Friendly Mode**: Pure cooperative camaraderie with friendly fire permanently disabled.
- **Tamper-Proof Cryptographic Saves**: SHA-256 checksum + HMAC-SHA256 signature verification blocks illegal item injection or modified calendar days.

---

## 📥 Downloads & Installation

Distributable packages are included directly inside the repository under `client/public/downloads/`:

| Platform / Package | Description | Download Link |
|---|---|---|
| 🖥️ **PC Game Client (Windows)** | Standalone PC client with offline mode, keyboard/mouse controls, and LAN auto-discovery | [`client/public/downloads/VoxelRaiders-PC-Client.zip`](client/public/downloads/VoxelRaiders-PC-Client.zip) |
| ⚙️ **Dedicated Host Server (PC)** | Dedicated Windows host server with UDP port 48888 LAN discovery and local `%APPDATA%` saves | [`client/public/downloads/VoxelRaiders-Dedicated-Host-Server.zip`](client/public/downloads/VoxelRaiders-Dedicated-Host-Server.zip) |
| 📱 **Android Client Package (.apk)** | Android mobile release with touchscreen dual-stick virtual pads | [`client/public/downloads/VoxelRaiders-Android.apk`](client/public/downloads/VoxelRaiders-Android.apk) |
| 🌐 **Instant Web Play** | Zero-install instant play in any web browser | Deploy on Render or launch `npm start` |

---

## 🚀 Quick Start Guide

### Running Locally (PC & LAN)
```bash
# 1. Clone repository
git clone https://github.com/Shron03/Voxel-Raiders.git
cd Voxel-Raiders

# 2. Install dependencies
npm install

# 3. Start authoritative server
npm start
```
Open `http://localhost:10000` in your web browser. Friends on your local Wi-Fi can join via `http://<your-ip>:10000` or via the **LAN & LOCAL** tab in the desktop launcher.

### Running Automated Test Cycles
```bash
npm test
```
Executes all **50 mandatory automated test cycles** verifying functional, multiplayer, network, performance, cross-platform, security, and regression rules.

---

## ☁️ Deployment on Render

This repository includes [`render.yaml`](render.yaml) preconfigured for Render's Web Service tier:
1. Log in to [Render](https://render.com) and click **New > Blueprint**.
2. Connect `https://github.com/Shron03/Voxel-Raiders`.
3. Render automatically provisions the web service with Node.js and activates health monitoring at `/healthz`.

---

## 📚 Technical Documentation

- [GAME_DESIGN_DOCUMENT.md](GAME_DESIGN_DOCUMENT.md)
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
- [TEST_REPORT.md](TEST_REPORT.md)
- [BUG_TRACKER.md](BUG_TRACKER.md)
- [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md)
- [NETWORK_DIAGNOSTICS.md](NETWORK_DIAGNOSTICS.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📜 License
Distributed under the MIT License. Developed by Antigravity Studios.
