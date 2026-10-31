# VOXEL RAIDERS: DIMENSIONAL RIFT
## Official Game Design Document (GDD) — Version 1.0.0
**Project Codename**: VoxelRaiders  
**Genre**: Isometric Action-Sandbox Dungeon-Crawler  
**Target Platforms**: Windows PC (Desktop & Web) & Android (Touchscreen & Web)  
**Multiplayer**: 2 to 8 Players (Cross-Platform Online & Local LAN)  
**Engine & Tech**: 3D Isometric Stylized Voxel Engine + Authoritative Cloud State Server (Render) + PC Standalone Desktop Client  

---

## 1. Executive Summary & Core Pillars
*Voxel Raiders: Dimensional Rift* is a fast-paced, high-stakes isometric action-sandbox dungeon-crawler inspired by the tactical fluid combat and visual charm of *Minecraft Dungeons* fused with the exploration, gathering, crafting, and escalating survival tension of *Minecraft*.

### The Four Pillars
1. **Dynamic Isometric Action-Combat**: Fast, fluid melee combos, precision ranged archery, and responsive dodging (roll) combined with 3 customizable artifact power slots.
2. **Exploration, Raiding & Sandbox Gathering**: Players raid sprawling procedural ruins, monuments, sunken vaults, and corrupted citadels to discover loot chests, harvest rare materials with pickaxes/axes, and forge defensive tactical fortifications.
3. **Escalating Day/Night Cycle & The 100-Night Gauntlet**: Linear difficulty scaling with every passing night. Surviving 100 days unlocks the key to the first boss, kicking off an exponential ladder of 5 world-shattering bosses.
4. **Twisted Social Agendas & Dual Game Modes**: Seamless transition between collaborative dungeon delving and cutthroat PvP betrayals in the default "Agenda + Free-For-All" mode, or pure cooperative camaraderie in "Friendly Mode".

---

## 2. World Structure, Biomes & Exploration
The initial world is bounded to an expansive procedural territory bordered by mystical dimensional rifts. Upon slaying Boss 5 (The Primordial Reality Eater), the rift shatters and expands the world to **300% (3x) its original size**, unlocking post-game infinite sandbox exploration.

### Biomes & Monuments
- **Verdant Strongholds**: Overgrown stone ruins, crumbling watchtowers, and iron deposits.
- **Sunken Crypts**: Subterranean waterlogged catacombs guarded by skeletal guardians and hidden trapdoors.
- **Scorched Caldera**: Basalt pillars, magma vents, and fire-resistant obsidian chests.
- **Soul Blight Marshes**: Misty swamps with slowing mud, toxic spores, and corrupted monuments.
- **The Dimensional Threshold**: Floating fractured islands holding the 5 Boss Summoning Chambers.

---

## 3. The Day / Night Cycle & Timeline Engine
- **Day Duration**: 4 minutes real-time.
- **Night Duration**: 2 minutes real-time.
- **Full Cycle**: 6 minutes real-time.
- **Nightfall Mechanism**: As dusk falls, ambient light dims to atmospheric moonlit shadows. Mobs become aggressive, gain damage buffs, and actively hunt down players near monuments.
- **Altar of the Eclipse**: Players can interact with the Eclipse Altar at any unlocked Anchor during the day to trigger nightfall immediately, awarding bonus XP and rare drop multipliers.

---

## 4. Item Rarity Tiers & Death Drop System

### Rarity Hierarchy & Drop Rates
| Tier | Color Code | Mob/Destructible Drop Rate | Death Behavior | Notes |
|---|---|---|---|---|
| **Common** | Gray (`#9E9E9E`) | **80.0%** | **Despawns immediately** upon death | Basic sticks, raw stone, scrap iron, wood clubs |
| **Rare** | Blue (`#2196F3`) | **50.0%** | Drops on ground (persists permanently) | Refined steel blades, composite bows, iron armor |
| **Unique** | Purple (`#9C27B0`) | **10.0%** | Drops on ground (beacon light on mini-map) | Enchanted gear with 1 built-in perk slot |
| **Legendary** | Gold (`#FFC107`) | **1.0%** | Drops on ground (golden map beacon) | Named weapons with 2 enchantment slots |
| **Mythical** | Crimson (`#E91E63`) | **0.01%** | **Shatters into Fractured Shards** upon death | Boss-tier relics; requires Blacksmith repair fee |
| **Void** | Cosmic Cyan (`#00E5FF`) | **0.000001%** | **Shatters into Fractured Shards** upon death | Reality-warping artifacts; supreme difficulty to forge |

### Death, Anchor Respawn & Permadeath Rules
1. **Respawn Anchors**: Players discover and activate Anchors throughout monuments. When a player falls, they become incapacitated:
   - **Teammate Revive Window**: Fallen allies can be revived on the spot by an ally interacting with them for 4 seconds within a **60-second window**.
   - **Anchor Respawn Timer**: If not revived, the player waits **30 seconds** before respawning at their last activated Anchor.
2. **Team Wipe Permadeath**: If **all living players are eliminated simultaneously**, the expedition fails catastrophically: the world save resets to the last checkpoint or ends the hardcore run.
3. **Mythical Shard Repair**: Shattered Mythical and Void weapons drop into the player's inventory as fractured cores. They cannot be wielded until repaired at the Blacksmith Anvil using Gold/Emeralds and Boss Essences.

---

## 5. The 5 Bosses & Exponential 50x Progression

### Boss Portal Schedules & Summoning Rules
- **Natural Portal Opening Days**:
  - **Boss 1**: Day **110**
  - **Boss 2**: Day **310**
  - **Boss 3**: Day **510**
  - **Boss 4**: Day **710**
  - **Boss 5**: Day **910**
- **Early Portal Activation Rule**:
  - Once players have obtained the required key item (which can drop during the 50 to 200 day gap following the previous gate), players have the option to manually open the boss portal on **any day that is a multiple of 10** (e.g., Day 120, 130, 150, 160, 270, 280, etc.). Portal opening is strictly blocked on days that are not multiples of 10.

| Boss Rank | Name | Unlock Condition | Stat Multiplier | Difficulty (With Max Tier Gear) | Signature Arena Mechanics |
|---|---|---|---|---|---|
| **Boss 1** | **The Sunken Warden of the Deep Vault** | Survived to Day 110 (or multiple of 10 with key) + *Heart of Stone* | **1x (Base Tier)** | Medium (at Day 100) | Ground slams, shockwave rings, rising water hazards |
| **Boss 2** | **The Colossus of Ancient Pyres** | Day 310 (or multiple of 10 with key) + Boss 1 Relic | **50x** | Hard (at Day 200) | Magma fissures, heat radiance, summoning fire elementals |
| **Boss 3** | **The Hollow Necrolord** | Day 510 (or multiple of 10 with key) + Boss 2 Relic | **2,500x** | **Easy** | Soul siphoning, horde summoning, bone cage traps |
| **Boss 4** | **The Celestial Void Drake** | Day 710 (or multiple of 10 with key) + Boss 3 Relic | **125,000x** | **Normal** | Airborne strafes, cosmic breath beams, arena platform destruction |
| **Boss 5** | **The Primordial Reality Eater** | Day 910 (or multiple of 10 with key) + Boss 4 Relic | **6,250,000x** | **HARD** | Dimensional fractures, reality inversion, bullet-hell block shards |

### Mob Scaling, Gear Upgrades & Healthbar Visibility
- **Boss Healthbar**: Pinned prominently at the **top of the screen** with segmented boss phases and title.
- **Normal & Passive Mobs**: **No healthbars are shown** on hostile or passive mobs, maintaining a clean, nostalgic retro aesthetic. Mobs possess fixed, calibrated base health points.
- **Hostile Mob Gear Evolution**: As the in-game calendar progresses and difficulty scales linearly each night, hostile mobs spawn wearing increasingly powerful armor and wielding upgraded weapons.
- **Mob Gear Drop Rate**: Defeating armed hostile mobs has a low chance to drop their equipped armor or weapons directly, providing an alternative path to intermediate gear upgrades.

### Boss Key Drop Scaling Rules
- Starting at the minimum day threshold for Bosses 2–5, the drop rate increases exponentially at a daily rate of $P(d) = 1.5^{(d - d_{\text{start}})} \times P_0$ until reaching an **80% drop rate** between days 150–200 of that gate window.
- The mob-dropped key item will never despawn naturally, but can be accidentally destroyed by environmental hazards or PvP.
- The item can drop up to **6 times** from mobs.
- If destroyed all 6 times or if the calendar surpasses the maximum day threshold (e.g. Day 300 for Boss 2), the **7th and final key** spawns inside a locked dungeon chest.
- **Ultimate Permadeath Clause**: If this 7th chest key is destroyed, the dimensional rift collapses, the save file is corrupted, and players must restart the entire game!

---

## 6. Combat, Equipment & Enchantments

### Equipment Slots
- **Mainhand Melee**: Swords (balanced), Battleaxes (high cleave), Daggers (rapid combo), Halberds (reach).
- **Offhand Ranged**: Bows (charged power shot), Crossbows (high velocity, multishot), Slingshots (stuns).
- **Armor Set**: Helm, Chestplate, Greaves, Boots (determines base health, armor mitigation, and roll cooldown).
- **3 Artifact Slots**: Active equipment on cooldowns:
  - *Wind Cloak*: 200% movement speed boost and dodge roll invulnerability frames.
  - *Solar Beacon*: Blinds nearby enemies and heals allies in a radiant perimeter.
  - *Dimensional Quiver*: Charges next 3 shots with explosive void shards.
  - *Ironhide Medallion*: Grants +75% damage resistance for 8 seconds.
  - *Totem of Reanimation*: Self-revives player once with 50% health.

### Enchantment & Socketing System
Weapons and armor possess up to 3 enchantment sockets, forged using Enchanting Runes discovered in boss chambers and high-level monument vaults:
- **Tier 1 (Common)**: Sharpness (+% Physical Damage), Protection (+% Armor), Quickdraw (+% Arrow Speed).
- **Tier 2 (Rare)**: Poison Strike (DoT ticks), Leeching (heals on kill), Thorns (reflects damage).
- **Tier 3 (Unique)**: Chain Lightning (arcs between 5 targets), Frost Nova (slows in AoE), Radiance (burst heal aura).
- **Tier 4 (Legendary)**: Critical Surge (triple damage on 4th hit), Shockwave (ground tremor cone on roll).
- **Tier 5 (Mythical / Boss Chamber Only)**: Void Siphon (converts 10% of dealt damage to shield), Gravity Pull (drags mobs into vortex), Phoenix Rebirth (prevents death once per night).

---

## 7. Game Modes & Narrative Delivery

### Mode 1: Friendly Mode (Cooperative)
- Friendly fire disabled.
- Shared objective tracking and anchor respawning.
- Relaxed difficulty scaling.

### Mode 2: Agenda + Free-For-All (Default Mode)
- **Phase 1 (The Co-op Agenda)**: Players must work together to locate monuments, collect key relics, and survive the grueling night cycles.
- **Phase 2 (The Cursed Contract & Betrayal)**: Upon completing a major storyline milestone or slaying a guardian, the **Synchronized Dialogue Banner** activates:
  - Covers **35% of the bottom screen** across all player displays.
  - Background simulation freezes.
  - The storyline narrator reveals a dark twist: the dimensional seal requires blood sacrifice or only 1 player can claim the relic.
  - Unanimous voting is required to skip/forward text.
  - When the narrative completes, a 10-second warning siren sounds, and **Free-For-All PvP is unleashed**! Survivors claim the ultimate loot cache.

---

## 8. User Interface & Audio Aesthetics
- **Visuals**: Pixelated, nostalgic, chunky Minecraft-inspired voxel art with modern dynamic shadows and bloom.
- **HUD**: Retro health hearts, stamina pips, 3 artifact diamonds, hotbar inventory grid, day/night celestial clock, and minimap with anchor beacons.
- **Audio**: Melodic 16-bit chiptune ambient themes during the day; tense synthesized battle drums at night; ominous orchestral dissonance during boss fights; crisp retro sounds for block breaking, chest opening, and loot pickup.
