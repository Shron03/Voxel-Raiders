/**
 * Voxel Raiders - Authoritative Server Simulation Engine
 * Handles 30Hz game tick, Day/Night engine, mob spawns, boss phases,
 * drop rate calculations, anchor respawns, and permadeath rules.
 */

export const RARITY_TIERS = {
  COMMON: { name: 'Common', color: '#9E9E9E', dropRate: 0.80, despawnsOnDeath: true, shatters: false },
  RARE: { name: 'Rare', color: '#2196F3', dropRate: 0.50, despawnsOnDeath: false, shatters: false },
  UNIQUE: { name: 'Unique', color: '#9C27B0', dropRate: 0.10, despawnsOnDeath: false, shatters: false },
  LEGENDARY: { name: 'Legendary', color: '#FFC107', dropRate: 0.01, despawnsOnDeath: false, shatters: false },
  MYTHICAL: { name: 'Mythical', color: '#E91E63', dropRate: 0.0001, despawnsOnDeath: false, shatters: true },
  VOID: { name: 'Void', color: '#00E5FF', dropRate: 0.00000001, despawnsOnDeath: false, shatters: true }
};

export const BOSS_PORTAL_SCHEDULE = {
  1: { naturalDay: 110, name: 'The Sunken Warden of the Deep Vault', baseHp: 5000, multiplier: 1 },
  2: { naturalDay: 310, name: 'The Colossus of Ancient Pyres', baseHp: 5000 * 50, multiplier: 50 },
  3: { naturalDay: 510, name: 'The Hollow Necrolord', baseHp: 5000 * 2500, multiplier: 2500 },
  4: { naturalDay: 710, name: 'The Celestial Void Drake', baseHp: 5000 * 125000, multiplier: 125000 },
  5: { naturalDay: 910, name: 'The Primordial Reality Eater', baseHp: 5000 * 6250000, multiplier: 6250000 }
};

export class GameSimulation {
  constructor(roomCode, gameMode = 'AGENDA_FFA', initialSave = null) {
    this.roomCode = roomCode;
    this.gameMode = gameMode; // 'AGENDA_FFA' or 'FRIENDLY'
    this.pvpActive = false;
    this.isPausedForStory = false;
    this.storyDialogue = null;
    this.storyVotes = new Set();

    // World & Calendar
    this.worldSeed = initialSave?.worldSeed || Math.floor(Math.random() * 10000000);
    this.calendarDays = initialSave?.calendarDays || 1;
    this.timeOfDaySec = initialSave?.timeOfDaySec || 0; // 0 to 360
    this.dayDurationSec = 240; // 4 minutes
    this.nightDurationSec = 120; // 2 minutes
    this.totalCycleSec = this.dayDurationSec + this.nightDurationSec; // 360s = 6 mins
    this.worldExpanded3x = Boolean(initialSave?.worldExpanded3x);

    // Progression & Bosses
    this.bossesDefeated = initialSave?.bossesDefeated || [];
    this.bossKeyDropsCount = initialSave?.bossKeyDropsCount || 0;
    this.bossPortalsOpened = initialSave?.bossPortalsOpened || [];
    this.activeBoss = null;
    this.chestSpawnedFinalKey = false;
    this.finalChestKeyDestroyed = false;

    // Entities & Anchors
    this.players = new Map(); // id -> PlayerState
    this.mobs = new Map(); // id -> MobState
    this.groundDrops = new Map(); // id -> ItemDrop
    this.anchors = new Map(); // id -> AnchorState
    this.structures = [];

    // Initialize Default Starting Anchor
    this.anchors.set('anchor_sanctuary', {
      id: 'anchor_sanctuary',
      name: 'Sanctuary of the First Dawn',
      x: 0,
      y: 0,
      unlocked: true
    });

    this.tickInterval = null;
    this.lastTickTime = Date.now();
    this.simulatedTimeScale = 1.0;
    this.listeners = new Set();
  }

  start() {
    if (this.tickInterval) return;
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(), 1000 / 30); // 30 Hz
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Main 30Hz Simulation Tick
   */
  tick() {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    if (this.isPausedForStory) {
      // Background simulation frozen during synchronized story dialogue
      return;
    }

    // Advance Day/Night Cycle
    this.timeOfDaySec += dt * this.simulatedTimeScale;
    if (this.timeOfDaySec >= this.totalCycleSec) {
      this.timeOfDaySec -= this.totalCycleSec;
      this.calendarDays += 1;
      this.onNewDayDawned();
    }

    const isNight = this.timeOfDaySec >= this.dayDurationSec;

    // Update Mob AI and check proximity to players
    this.updateMobs(dt, isNight);

    // Update Boss Mechanics
    if (this.activeBoss) {
      this.updateBoss(dt);
    }

    // Update Player Downed Timers and Check Team Wipe Permadeath
    this.updatePlayerStates(dt);

    // Broadcast Delta Snapshot
    this.emitStateDelta();
  }

  isNight() {
    return this.timeOfDaySec >= this.dayDurationSec;
  }

  /**
   * Altar of the Eclipse: Skip rest of day and initiate night immediately
   */
  triggerEclipseAltar(playerId) {
    if (this.isNight()) {
      return { success: false, reason: 'ALREADY_NIGHT' };
    }
    this.timeOfDaySec = this.dayDurationSec; // Advance directly to night
    return { success: true, message: 'The Eclipse Altar was activated! Night descends immediately.' };
  }

  onNewDayDawned() {
    // Mob scaling increases linearly each night
    const scalingFactor = 1.0 + (this.calendarDays - 1) * 0.05;

    // Check natural boss portal opening schedule
    for (const [bossRank, info] of Object.entries(BOSS_PORTAL_SCHEDULE)) {
      const rankNum = Number(bossRank);
      if (this.calendarDays === info.naturalDay && !this.bossPortalsOpened.includes(rankNum)) {
        this.openBossPortal(rankNum, 'NATURAL_CALENDAR');
      }
    }

    // Spawn daily monument chests and passive mobs
    this.populateWorldEntities(scalingFactor);
  }

  /**
   * Can open portal early on any day that is a multiple of 10
   */
  canOpenPortalEarly(bossRank) {
    const isMultipleOf10 = this.calendarDays % 10 === 0;
    if (!isMultipleOf10) {
      return {
        allowed: false,
        reason: `Portal can only be opened on days that are a multiple of 10 (Current Day: ${this.calendarDays}). Try on Day ${Math.ceil(this.calendarDays / 10) * 10}.`
      };
    }
    return { allowed: true };
  }

  openBossPortal(bossRank, source = 'PLAYER_KEY') {
    if (source === 'PLAYER_KEY') {
      const check = this.canOpenPortalEarly(bossRank);
      if (!check.allowed) return check;
    }

    if (!this.bossPortalsOpened.includes(bossRank)) {
      this.bossPortalsOpened.push(bossRank);
    }

    const bossData = BOSS_PORTAL_SCHEDULE[bossRank];
    this.activeBoss = {
      rank: bossRank,
      name: bossData.name,
      maxHp: bossData.baseHp,
      hp: bossData.baseHp,
      phase: 1,
      x: 0,
      y: 50,
      attackCooldown: 2.0
    };

    return {
      success: true,
      boss: this.activeBoss,
      message: `PORTAL UNLOCKED: ${bossData.name} has awakened!`
    };
  }

  /**
   * Roll drop from mob or destructible object using exact specified probabilities
   */
  rollDrop(isHostileMobArmed = false) {
    const roll = Math.random();
    let rarity = RARITY_TIERS.COMMON;

    if (roll < RARITY_TIERS.VOID.dropRate) {
      rarity = RARITY_TIERS.VOID;
    } else if (roll < RARITY_TIERS.MYTHICAL.dropRate) {
      rarity = RARITY_TIERS.MYTHICAL;
    } else if (roll < RARITY_TIERS.LEGENDARY.dropRate) {
      rarity = RARITY_TIERS.LEGENDARY;
    } else if (roll < RARITY_TIERS.UNIQUE.dropRate) {
      rarity = RARITY_TIERS.UNIQUE;
    } else if (roll < RARITY_TIERS.RARE.dropRate) {
      rarity = RARITY_TIERS.RARE;
    }

    // If armed hostile mob, chance to drop their equipped weapon/armor
    let droppedGear = null;
    if (isHostileMobArmed && Math.random() < 0.15) {
      droppedGear = {
        name: `Hostile Guard Plate (Day ${this.calendarDays})`,
        type: 'ARMOR',
        defense: 10 + Math.floor(this.calendarDays * 0.5),
        rarity: rarity.name
      };
    }

    return { rarity, droppedGear };
  }

  /**
   * Player management
   */
  addPlayer(id, name, avatar = 'hero_red') {
    const player = {
      id,
      name,
      avatar,
      x: 0,
      y: 0,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      state: 'ALIVE', // 'ALIVE', 'DOWNED', 'RESPAWNING', 'DEAD'
      downedTimer: 0, // 60s window for revive
      respawnTimer: 0, // 30s wait before anchor spawn
      inventory: [
        { id: 'wood_sword', name: 'Oak Blade', rarity: 'Common', damage: 15 },
        { id: 'pickaxe', name: 'Iron Pickaxe', rarity: 'Rare', harvestPower: 20 }
      ],
      artifacts: [
        { id: 'boots_speed', name: 'Boots of Swiftness', cooldown: 12, ready: true },
        { id: 'iron_amulet', name: 'Ironhide Medallion', cooldown: 20, ready: true },
        { id: 'firework_arrow', name: 'Fireworks Arrow', cooldown: 15, ready: true }
      ],
      equippedArmor: null,
      lastAnchorId: 'anchor_sanctuary'
    };
    this.players.set(id, player);
    return player;
  }

  removePlayer(id) {
    this.players.delete(id);
    this.checkTeamWipe();
  }

  handlePlayerDamage(targetPlayerId, damage, attackerId = null) {
    const player = this.players.get(targetPlayerId);
    if (!player || player.state !== 'ALIVE') return;

    if (attackerId && attackerId !== targetPlayerId) {
      // Friendly fire check
      if (this.gameMode === 'FRIENDLY' || !this.pvpActive) {
        return; // No friendly fire allowed
      }
    }

    player.hp = Math.max(0, player.hp - damage);

    if (player.hp === 0) {
      this.handlePlayerDowned(player);
    }
  }

  handlePlayerDowned(player) {
    player.state = 'DOWNED';
    player.downedTimer = 60; // 60 seconds for teammates to revive

    // Inventory drop handling on death:
    // Common items despawn immediately
    // Rare, Unique, Legendary stay on ground
    // Mythical and Void shatter into fractured pieces
    const remainingInventory = [];
    player.inventory.forEach(item => {
      const tier = RARITY_TIERS[item.rarity?.toUpperCase()] || RARITY_TIERS.COMMON;
      if (tier.despawnsOnDeath) {
        // Despawns immediately!
      } else if (tier.shatters) {
        // Shatters into fractured relic core
        remainingInventory.push({
          id: `fractured_${item.id}`,
          name: `Fractured Core: ${item.name}`,
          rarity: item.rarity,
          shattered: true,
          repairCost: 500
        });
      } else {
        // Drops onto the ground permanently
        const dropId = `drop_${Date.now()}_${Math.random()}`;
        this.groundDrops.set(dropId, {
          id: dropId,
          item,
          x: player.x + (Math.random() * 2 - 1),
          y: player.y + (Math.random() * 2 - 1)
        });
      }
    });

    player.inventory = remainingInventory;
    this.checkTeamWipe();
  }

  revivePlayer(reviverId, targetId) {
    const reviver = this.players.get(reviverId);
    const target = this.players.get(targetId);
    if (!reviver || !target || reviver.state !== 'ALIVE' || target.state !== 'DOWNED') {
      return { success: false, reason: 'CANNOT_REVIVE' };
    }

    target.state = 'ALIVE';
    target.hp = Math.floor(target.maxHp * 0.4); // Revive with 40% HP
    target.downedTimer = 0;
    return { success: true, message: `${reviver.name} revived ${target.name}!` };
  }

  updatePlayerStates(dt) {
    for (const player of this.players.values()) {
      if (player.state === 'DOWNED') {
        player.downedTimer -= dt;
        if (player.downedTimer <= 0) {
          player.state = 'RESPAWNING';
          player.respawnTimer = 30; // 30s respawn wait
          this.checkTeamWipe();
        }
      } else if (player.state === 'RESPAWNING') {
        player.respawnTimer -= dt;
        if (player.respawnTimer <= 0) {
          // Respawn at unlocked anchor
          const anchor = this.anchors.get(player.lastAnchorId) || this.anchors.get('anchor_sanctuary');
          player.x = anchor.x;
          player.y = anchor.y;
          player.hp = player.maxHp;
          player.state = 'ALIVE';
        }
      }
    }
  }

  checkTeamWipe() {
    if (this.players.size === 0) return false;

    // Check if ALL players are not alive (either DOWNED, RESPAWNING, or DEAD)
    const anyAlive = Array.from(this.players.values()).some(p => p.state === 'ALIVE');
    if (!anyAlive) {
      // TOTAL TEAM WIPE: PERMADEATH RUN FAILURE
      this.triggerTeamWipePermadeath();
      return true;
    }
    return false;
  }

  triggerTeamWipePermadeath() {
    this.isPausedForStory = true;
    this.storyDialogue = {
      speaker: 'The Rift Arbiter',
      text: 'ALL RAIDERS HAVE FALLEN! The dimensional rift collapses and swallows the expedition into the void. Permadeath wipe.',
      isPermadeathGameOver: true
    };
  }

  /**
   * Synchronized Story Dialogue (35% bottom screen)
   */
  triggerStoryDialogue(speaker, text, triggersPvpAfter = false) {
    this.isPausedForStory = true;
    this.storyDialogue = { speaker, text, triggersPvpAfter };
    this.storyVotes.clear();
  }

  voteAdvanceStory(playerId) {
    this.storyVotes.add(playerId);
    // Unanimous vote check
    if (this.storyVotes.size >= this.players.size) {
      const wasPvpTrigger = this.storyDialogue?.triggersPvpAfter;
      this.isPausedForStory = false;
      this.storyDialogue = null;
      this.storyVotes.clear();

      if (wasPvpTrigger && this.gameMode === 'AGENDA_FFA') {
        this.pvpActive = true;
      }
    }
  }

  updateMobs(dt, isNight) {
    // Mob positions and interactions
  }

  updateBoss(dt) {
    if (!this.activeBoss) return;
    this.activeBoss.attackCooldown -= dt;
    if (this.activeBoss.attackCooldown <= 0) {
      this.activeBoss.attackCooldown = 3.0;
      // Boss AoE shockwave
    }
  }

  damageBoss(damage) {
    if (!this.activeBoss) return;
    this.activeBoss.hp = Math.max(0, this.activeBoss.hp - damage);

    if (this.activeBoss.hp === 0) {
      const defeatedRank = this.activeBoss.rank;
      if (!this.bossesDefeated.includes(defeatedRank)) {
        this.bossesDefeated.push(defeatedRank);
      }

      if (defeatedRank === 5) {
        // FINAL BOSS DEFEATED: EXPAND WORLD TO 3X
        this.worldExpanded3x = true;
        this.triggerStoryDialogue(
          'Primordial Echo',
          'The Reality Eater has fallen! The dimensional bounds shatter, expanding the world to 300% size for eternal exploration!'
        );
      }

      this.activeBoss = null;
    }
  }

  populateWorldEntities(scaling) {
    // Generate passive mobs (sheep, pig, blocky rabbit) with NO healthbars
    // Generate hostile mobs with scaling gear and NO overhead healthbars
  }

  emitStateDelta() {
    // Listeners update hook
  }

  getPublicSnapshot() {
    return {
      roomCode: this.roomCode,
      calendarDays: this.calendarDays,
      timeOfDaySec: Math.floor(this.timeOfDaySec),
      isNight: this.isNight(),
      gameMode: this.gameMode,
      pvpActive: this.pvpActive,
      isPausedForStory: this.isPausedForStory,
      storyDialogue: this.storyDialogue,
      storyVotesCount: this.storyVotes.size,
      totalPlayers: this.players.size,
      activeBoss: this.activeBoss,
      bossesDefeated: this.bossesDefeated,
      worldExpanded3x: this.worldExpanded3x,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        x: p.x,
        y: p.y,
        hp: p.hp,
        maxHp: p.maxHp,
        state: p.state,
        downedTimer: Math.ceil(p.downedTimer),
        respawnTimer: Math.ceil(p.respawnTimer)
      }))
    };
  }
}
