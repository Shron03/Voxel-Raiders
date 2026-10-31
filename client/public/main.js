/**
 * Voxel Raiders: Dimensional Rift - Client Core Engine
 */

import { GameSimulation } from './gameSimulation.js';

// Procedural Retro Audio Synthesizer
class SoundFX {
  constructor() {
    this.ctx = null;
    this.bgmNode = null;
    this.sfxVolume = 0.8;
    this.bgmVolume = 0.65;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSwing() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playRoll() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(this.sfxVolume * 0.35, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playBossAlarm() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(120, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playLootFanfare() {
    if (!this.ctx) return;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + idx * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.15);
    });
  }
}

// 3D Isometric Procedural Canvas Engine
class VoxelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileWidth = 44;
    this.tileHeight = 22;
    this.blockHeight = 16;
    this.cameraX = 0;
    this.cameraY = 0;
    this.graphicsProfile = 'PC_HIGH';
    this.particles = [];
    this.lootBeacons = [];
    this.attackAnim = 0;
    this.rollAnim = 0;

    // Seeded Noise for Infinite Procedural Generation
    this.worldSeed = 94817;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7 + this.worldSeed) * 43758.5453123;
    return s - Math.floor(s);
  }

  getElevation(x, y) {
    // Sanctuary Sanctuary is flattened
    const distFromOrigin = Math.sqrt(x * x + y * y);
    if (distFromOrigin < 4) return 2;

    // Multi-octave Perlin-style wave elevation
    const w1 = Math.sin(x * 0.12) * Math.cos(y * 0.12) * 3;
    const w2 = Math.sin(x * 0.04 + y * 0.05) * 4;
    const raw = Math.floor(w1 + w2 + 3);
    return Math.max(1, Math.min(8, raw));
  }

  toIso(x, y, z = 0) {
    const screenX = (x - y) * (this.tileWidth / 2) + this.canvas.width / 2 - this.cameraX;
    const screenY = (x + y) * (this.tileHeight / 2) - (z * this.blockHeight) + this.canvas.height / 2 - this.cameraY;
    return { x: screenX, y: screenY };
  }

  render(worldSnapshot, localPlayerId) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isNight = worldSnapshot?.isNight;
    // Dynamic Sky / Atmosphere
    ctx.fillStyle = isNight ? '#080a12' : '#223022';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera follow local player
    const localPlayer = worldSnapshot?.players?.find(p => p.id === localPlayerId) || { x: 0, y: 0 };
    const playerElevation = this.getElevation(Math.round(localPlayer.x), Math.round(localPlayer.y));
    const targetIso = {
      x: (localPlayer.x - localPlayer.y) * (this.tileWidth / 2),
      y: (localPlayer.x + localPlayer.y) * (this.tileHeight / 2) - (playerElevation * this.blockHeight)
    };
    this.cameraX += (targetIso.x - this.cameraX) * 0.15;
    this.cameraY += (targetIso.y - this.cameraY) * 0.15;

    // Render Procedural 3D Depth-Sorted Voxel World
    this.renderProceduralWorld(localPlayer, isNight);

    // Render Boss
    if (worldSnapshot?.activeBoss) {
      this.renderBoss(worldSnapshot.activeBoss);
    }

    // Render Other Players
    if (worldSnapshot?.players) {
      for (const p of worldSnapshot.players) {
        if (p.id !== localPlayerId) {
          this.renderPlayer(p, false);
        }
      }
    }

    // Render Local Player with Animations
    if (localPlayer) {
      this.renderPlayer(localPlayer, true);
    }

    // Render Particle Systems & Floating Beacons
    this.updateAndRenderParticles();
    this.updateAndRenderLootBeacons();
  }

  renderProceduralWorld(centerPlayer, isNight) {
    const radius = 14;
    const cx = Math.round(centerPlayer.x);
    const cy = Math.round(centerPlayer.y);

    const sunTop = isNight ? '#1b232b' : '#4c703f';
    const sunSide = isNight ? '#121820' : '#304727';
    const dirtColor = isNight ? '#1c1511' : '#4e3629';
    const stoneColor = isNight ? '#22262c' : '#595e69';

    // Depth Sorting: Render back-to-front by summing (x + y)
    for (let d = -radius * 2; d <= radius * 2; d++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dy = d - dx;
        if (dy < -radius || dy > radius) continue;

        const wx = cx + dx;
        const wy = cy + dy;
        const elev = this.getElevation(wx, wy);
        const iso = this.toIso(wx, wy, elev);

        // Frustum Culling
        if (iso.x < -60 || iso.x > this.canvas.width + 60 || iso.y < -100 || iso.y > this.canvas.height + 100) {
          continue;
        }

        // Draw Layered 3D Voxel Ground
        const topShade = (elev > 5) ? stoneColor : sunTop;
        const sideShade = (elev > 5) ? '#383b42' : dirtColor;
        this.drawVoxelBlock(iso.x, iso.y, this.tileWidth, this.tileHeight, this.blockHeight, topShade, sideShade);

        // Procedural Features: Trees, Ancient Monuments, Chests
        const propHash = this.hash(wx, wy);

        // Oak Tree Generation
        if (propHash > 0.90 && (wx !== 0 || wy !== 0) && elev <= 5) {
          this.drawTree(wx, wy, elev, isNight);
        }

        // Ancient Monument & Chests
        if (propHash > 0.84 && propHash <= 0.87) {
          this.drawChestMonument(wx, wy, elev, isNight);
        }

        // Sanctuary Anchor at Origin
        if (wx === 0 && wy === 0) {
          this.drawSanctuaryAnchor(wx, wy, elev);
        }

        // Eclipse Altar at (2, 0)
        if (wx === 2 && wy === 0) {
          this.drawEclipseAltar(wx, wy, elev);
        }
      }
    }
  }

  drawTree(wx, wy, elev, isNight) {
    const trunkColor = isNight ? '#2b1b11' : '#5d4037';
    const leafColor = isNight ? '#0d2b14' : '#2e7d32';
    const leafTop = isNight ? '#15401e' : '#43a047';

    // Trunk
    for (let tz = 1; tz <= 3; tz++) {
      const isoTrunk = this.toIso(wx, wy, elev + tz);
      this.drawVoxelBlock(isoTrunk.x, isoTrunk.y, 22, 11, this.blockHeight, trunkColor, '#3e2723');
    }

    // Leaf Canopy
    const isoCanopy = this.toIso(wx, wy, elev + 4);
    this.drawVoxelBlock(isoCanopy.x, isoCanopy.y, 44, 22, 24, leafTop, leafColor);
  }

  drawChestMonument(wx, wy, elev, isNight) {
    const isoRuin = this.toIso(wx, wy, elev + 1);
    // Mossy Stone Pedestal
    this.drawVoxelBlock(isoRuin.x, isoRuin.y, 32, 16, 10, '#78909c', '#455a64');
    // Golden Dungeon Chest
    this.drawVoxelBlock(isoRuin.x, isoRuin.y - 10, 24, 12, 12, '#ffb300', '#ff8f00');

    // Floating interaction prompt
    this.ctx.fillStyle = '#ffca28';
    this.ctx.font = '7px monospace';
    this.ctx.fillText('[E] CHEST', isoRuin.x - 20, isoRuin.y - 24);
  }

  drawSanctuaryAnchor(wx, wy, elev) {
    const iso = this.toIso(wx, wy, elev + 1);
    const ctx = this.ctx;

    // Glowing Sky Beacon Beam
    const grad = ctx.createLinearGradient(iso.x, iso.y - 250, iso.x, iso.y);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(iso.x - 14, iso.y - 250, 28, 250);

    // Radiant Cyan Anchor Block
    this.drawVoxelBlock(iso.x, iso.y, 36, 18, 20, '#00e5ff', '#0097a7');

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText('SANCTUARY ANCHOR', iso.x - 42, iso.y - 24);
  }

  drawEclipseAltar(wx, wy, elev) {
    const iso = this.toIso(wx, wy, elev + 1);
    this.drawVoxelBlock(iso.x, iso.y, 30, 15, 16, '#9c27b0', '#6a1b9a');
    this.ctx.fillStyle = '#e1bee7';
    this.ctx.font = '7px monospace';
    this.ctx.fillText('[E] ECLIPSE ALTAR', iso.x - 36, iso.y - 18);
  }

  drawVoxelBlock(x, y, w, h, depth, topColor, sideColor) {
    const ctx = this.ctx;
    // Top Face
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left Side Face
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h + depth);
    ctx.lineTo(x - w / 2, y + h / 2 + depth);
    ctx.closePath();
    ctx.fillStyle = sideColor;
    ctx.fill();
    ctx.stroke();

    // Right Side Face (Darker Shading)
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x + w / 2, y + h / 2 + depth);
    ctx.lineTo(x, y + h + depth);
    ctx.closePath();
    ctx.fillStyle = sideColor;
    ctx.fill();
    ctx.stroke();
  }

  renderPlayer(p, isLocal) {
    const elev = this.getElevation(Math.round(p.x), Math.round(p.y));
    const iso = this.toIso(p.x, p.y, elev);
    const ctx = this.ctx;

    // Contact Shadow
    ctx.beginPath();
    ctx.ellipse(iso.x, iso.y + 6, 16, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    const colorMap = {
      hero_red: '#e53935',
      hero_blue: '#1e88e5',
      hero_green: '#43a047',
      hero_gold: '#fbc02d',
      hero_purple: '#8e24aa',
      hero_dark: '#37474f'
    };
    const playerColor = colorMap[p.avatar] || '#e53935';

    // 3D Voxel Torso
    this.drawVoxelBlock(iso.x, iso.y - 14, 22, 12, 18, playerColor, '#1a1a1a');

    // 3D Voxel Head
    this.drawVoxelBlock(iso.x, iso.y - 32, 16, 9, 12, '#ffe082', '#ffb74d');

    // Weapon Swing Slash Arc
    if (this.attackAnim > 0) {
      ctx.beginPath();
      ctx.arc(iso.x + 20, iso.y - 10, 28, -Math.PI / 3, Math.PI / 3);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      this.attackAnim -= 0.1;
    }

    // Nameplate
    ctx.fillStyle = isLocal ? '#fbc02d' : '#ffffff';
    ctx.font = '8px monospace';
    const name = p.name || 'Raider';
    ctx.fillText(name, iso.x - name.length * 2.5, iso.y - 40);
  }

  renderBoss(boss) {
    const elev = this.getElevation(Math.round(boss.x), Math.round(boss.y));
    const iso = this.toIso(boss.x, boss.y, elev);
    const ctx = this.ctx;

    // Giant Boss Shadow Aura
    ctx.beginPath();
    ctx.ellipse(iso.x, iso.y + 20, 52, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(213, 0, 0, 0.35)';
    ctx.fill();

    // 4x Scaled Boss Monolith Body
    this.drawVoxelBlock(iso.x, iso.y - 40, 68, 34, 48, '#b71c1c', '#4a0000');
    // Glowing Singularity Eye
    this.drawVoxelBlock(iso.x, iso.y - 65, 28, 16, 18, '#ffd600', '#ff6f00');

    ctx.fillStyle = '#ff1744';
    ctx.font = '10px monospace';
    ctx.fillText(`[BOSS] ${boss.name.toUpperCase()}`, iso.x - 85, iso.y - 80);
  }

  triggerAttackEffect(x, y) {
    this.attackAnim = 1.0;
    // Add swing sparks
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 0.3,
        color: '#00e5ff'
      });
    }
  }

  triggerLootDrop(x, y, itemName, rarityColor) {
    this.lootBeacons.push({
      x, y,
      name: itemName,
      color: rarityColor,
      life: 3.5,
      alpha: 1.0
    });
  }

  updateAndRenderParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.016;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, 3, 3);
    }
  }

  updateAndRenderLootBeacons() {
    const ctx = this.ctx;
    for (let i = this.lootBeacons.length - 1; i >= 0; i--) {
      const b = this.lootBeacons[i];
      b.life -= 0.016;
      if (b.life <= 0) {
        this.lootBeacons.splice(i, 1);
        continue;
      }
      const iso = this.toIso(b.x, b.y, 4);
      // Beacon Light Column
      const grad = ctx.createLinearGradient(iso.x, iso.y - 180, iso.x, iso.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, b.color);
      ctx.fillStyle = grad;
      ctx.fillRect(iso.x - 6, iso.y - 180, 12, 180);

      // Floating Badge
      ctx.fillStyle = b.color;
      ctx.font = '9px monospace';
      ctx.fillText(`✨ ${b.name}`, iso.x - 30, iso.y - 190);
    }
  }
}

// Main Client Application Controller
class VoxelRaidersApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new VoxelRenderer(this.canvas);
    this.sound = new SoundFX();
    this.ws = null;
    this.localPlayerId = null;
    this.roomCode = null;
    this.isHost = false;
    this.worldSnapshot = null;
    this.selectedSkin = 'hero_red';

    this.keys = {};
    this.touchJoystick = { active: false, vx: 0, vy: 0 };

    this.initDOM();
    this.initInput();
    this.checkURLParams();
    this.startLoop();
  }

  initDOM() {
    // Skin selection
    document.querySelectorAll('.skin-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        document.querySelectorAll('.skin-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.selectedSkin = opt.dataset.skin;
      });
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // Direct Instant 3D World Launch
    const btnInstant = document.getElementById('btn-play-instant');
    if (btnInstant) {
      btnInstant.addEventListener('click', () => this.enter3DWorldInstant());
    }

    // Lobby actions
    const btnHost = document.getElementById('btn-host-device');
    if (btnHost) btnHost.addEventListener('click', () => this.hostOnThisDevice());
    document.getElementById('btn-create-lobby').addEventListener('click', () => this.createLobby());
    document.getElementById('btn-join-lobby').addEventListener('click', () => this.joinLobby());
    document.getElementById('btn-copy-invite').addEventListener('click', () => this.copyInviteLink());
    document.getElementById('btn-toggle-ready').addEventListener('click', () => this.toggleReady());
    document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
    document.getElementById('btn-download-lobby-save').addEventListener('click', () => this.downloadSave());

    // In-game buttons
    document.getElementById('btn-eclipse-altar').addEventListener('click', () => this.triggerEclipse());
    document.getElementById('btn-advance-story').addEventListener('click', () => this.voteStory());

    // Settings
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.remove('hidden');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.add('hidden');
    });

    // Save upload
    document.getElementById('btn-upload-save').addEventListener('click', () => this.uploadSave());
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.sound.init();
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space') {
        this.sendAction('ATTACK');
        this.sound.playSwing();
      }
      if (e.key === 'Shift') {
        this.sendAction('ROLL');
        this.sound.playRoll();
      }
      if (e.key.toLowerCase() === 'e') {
        this.interactWorld();
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.target.id === 'game-canvas') {
        this.sound.init();
        this.sendAction('ATTACK');
        this.sound.playSwing();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Virtual Joystick for Mobile
    const joyBase = document.getElementById('joystick-base');
    const joyThumb = document.getElementById('joystick-thumb');

    if (joyBase) {
      joyBase.addEventListener('touchstart', (e) => {
        this.sound.init();
        this.touchJoystick.active = true;
      });

      joyBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joyBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 40;

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        joyThumb.style.transform = `translate(${dx}px, ${dy}px)`;
        this.touchJoystick.vx = dx / maxDist;
        this.touchJoystick.vy = dy / maxDist;
      });

      const resetJoy = () => {
        this.touchJoystick.active = false;
        this.touchJoystick.vx = 0;
        this.touchJoystick.vy = 0;
        joyThumb.style.transform = 'translate(0px, 0px)';
      };

      joyBase.addEventListener('touchend', resetJoy);
      joyBase.addEventListener('touchcancel', resetJoy);
    }

    // Touch Action Buttons
    const btnAttack = document.getElementById('btn-touch-attack');
    if (btnAttack) {
      btnAttack.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.sound.init();
        this.sendAction('ATTACK');
        this.sound.playSwing();
      });
    }

    const btnRoll = document.getElementById('btn-touch-roll');
    if (btnRoll) {
      btnRoll.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.sound.init();
        this.sendAction('ROLL');
        this.sound.playRoll();
      });
    }
  }

  checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      document.getElementById('input-room-code').value = code.toUpperCase();
    }
  }

  connectWS() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[VoxelRaiders] Connected to multiplayer state server.');
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleServerMessage(msg);
    };

    this.ws.onclose = () => {
      console.warn('[VoxelRaiders] Connection lost. Reconnecting...');
      setTimeout(() => this.connectWS(), 2000);
    };
  }

  handleServerMessage(msg) {
    switch (msg.type) {
      case 'JOINED_SUCCESS':
        this.localPlayerId = msg.playerId;
        this.roomCode = msg.roomCode;
        this.isHost = msg.isHost;
        document.getElementById('lobby-staging').classList.remove('hidden');
        document.getElementById('display-room-code').innerText = this.roomCode;
        if (this.isHost) {
          document.getElementById('btn-start-game').classList.remove('hidden');
        }
        break;

      case 'LOBBY_UPDATE':
        this.renderRoster(msg.players);
        break;

      case 'GAME_STARTED':
        document.getElementById('menu-overlay').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        break;

      case 'WORLD_DELTA':
        this.worldSnapshot = msg.snapshot;
        this.updateHUD(msg.snapshot);
        break;

      case 'SYSTEM_NOTIFICATION':
        console.log('[System]:', msg.message);
        break;
    }
  }

  enter3DWorldInstant() {
    this.sound.init();
    this.sound.playLootFanfare();
    const raiderName = document.getElementById('input-player-name').value || 'Host Raider';
    const gameMode = document.getElementById('select-game-mode').value;

    console.log('[VoxelRaiders 3D] Generating Infinite Procedural Voxel World...');
    this.startInBrowserSimulation(raiderName, gameMode);

    // Also register on local/cloud network so LAN and web players can join the host
    fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: raiderName, gameMode })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this.roomCode = data.roomCode;
          document.getElementById('display-room-code').innerText = this.roomCode;
          console.log(`[VoxelRaiders 3D] Multiplayer session active. Room Code: ${this.roomCode}`);
        }
      })
      .catch(() => {});
  }

  hostOnThisDevice() {
    this.sound.init();
    const hostName = document.getElementById('input-player-name').value || 'Host Raider';
    const gameMode = document.getElementById('select-game-mode').value;

    // Check if local/cloud server is available
    fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, gameMode })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this.roomCode = data.roomCode;
          this.connectAndJoin(this.roomCode, hostName);
          // Directly launch game onto host canvas
          setTimeout(() => {
            this.startGame();
          }, 350);
        } else {
          this.startInBrowserSimulation(hostName, gameMode);
        }
      })
      .catch(() => {
        // Run in-browser authoritative simulation directly on this host device
        this.startInBrowserSimulation(hostName, gameMode);
      });
  }

  startInBrowserSimulation(hostName, gameMode) {
    console.log('[Host Engine] Initializing in-browser authoritative simulation on this device...');
    this.isLocalSimulation = true;
    this.localSim = new GameSimulation('HOST-LOCAL', gameMode);
    this.localPlayerId = 'host_player';
    this.localSim.addPlayer(this.localPlayerId, hostName, this.selectedSkin);
    this.localSim.start();

    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');

    // 30Hz Simulation-to-HUD sync
    setInterval(() => {
      if (this.isLocalSimulation && this.localSim) {
        this.worldSnapshot = this.localSim.getPublicSnapshot();
        this.updateHUD(this.worldSnapshot);
      }
    }, 1000 / 30);
  }

  createLobby() {
    this.sound.init();
    const hostName = document.getElementById('input-player-name').value || 'Raid Leader';
    const gameMode = document.getElementById('select-game-mode').value;

    fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, gameMode })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this.roomCode = data.roomCode;
          this.connectAndJoin(this.roomCode, hostName);
        }
      });
  }

  joinLobby() {
    this.sound.init();
    const name = document.getElementById('input-player-name').value || 'Raider';
    const code = document.getElementById('input-room-code').value.trim().toUpperCase();
    if (code) {
      this.connectAndJoin(code, name);
    }
  }

  connectAndJoin(code, name) {
    this.connectWS();
    const tryJoin = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'JOIN_LOBBY',
          roomCode: code,
          playerName: name,
          avatar: this.selectedSkin
        }));
      } else {
        setTimeout(tryJoin, 150);
      }
    };
    tryJoin();
  }

  toggleReady() {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'TOGGLE_READY' }));
    }
  }

  startGame() {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'START_GAME' }));
    }
  }

  triggerEclipse() {
    if (this.isLocalSimulation && this.localSim) {
      this.localSim.triggerEclipseAltar(this.localPlayerId);
      return;
    }
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'TRIGGER_ECLIPSE_ALTAR' }));
    }
  }

  voteStory() {
    if (this.isLocalSimulation && this.localSim) {
      this.localSim.voteAdvanceStory(this.localPlayerId);
      return;
    }
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'STORY_VOTE' }));
    }
  }

  interactWorld() {
    const me = this.worldSnapshot?.players?.find(p => p.id === this.localPlayerId) || { x: 0, y: 0 };
    const distToAltar = Math.hypot(me.x - 2, me.y - 0);
    const distToAnchor = Math.hypot(me.x - 0, me.y - 0);

    if (distToAltar < 3.5) {
      this.triggerEclipse();
      return;
    }

    if (distToAnchor < 3.5) {
      this.sound.playLootFanfare();
      if (this.isLocalSimulation && this.localSim) {
        const p = this.localSim.players.get(this.localPlayerId);
        if (p) p.hp = p.maxHp;
      }
      return;
    }

    // Roll Loot Chest at nearby monument
    const rarityTiers = [
      { name: 'Common Scrap Iron', color: '#9e9e9e', rate: 0.80 },
      { name: 'Rare Obsidian Blade', color: '#2196f3', rate: 0.50 },
      { name: 'Unique Storm Amulet', color: '#9c27b0', rate: 0.10 },
      { name: 'Legendary Phoenix Bow', color: '#ffc107', rate: 0.01 },
      { name: 'Mythical Sunken Relic', color: '#e91e63', rate: 0.0001 },
      { name: 'Void Reality Shard', color: '#00e5ff', rate: 0.00000001 }
    ];

    const roll = Math.random();
    let won = rarityTiers[0];
    if (roll < rarityTiers[5].rate) won = rarityTiers[5];
    else if (roll < rarityTiers[4].rate) won = rarityTiers[4];
    else if (roll < rarityTiers[3].rate) won = rarityTiers[3];
    else if (roll < rarityTiers[2].rate) won = rarityTiers[2];
    else if (roll < rarityTiers[1].rate) won = rarityTiers[1];

    this.sound.playLootFanfare();
    this.renderer.triggerLootDrop(me.x, me.y, won.name, won.color);
  }

  sendAction(action) {
    if (action === 'ATTACK') {
      const me = this.worldSnapshot?.players?.find(p => p.id === this.localPlayerId) || { x: 0, y: 0 };
      this.renderer.triggerAttackEffect(me.x, me.y);
    }

    if (this.isLocalSimulation && this.localSim) {
      const p = this.localSim.players.get(this.localPlayerId);
      if (p && p.state === 'ALIVE') {
        if (action === 'ATTACK' && this.localSim.activeBoss) {
          this.localSim.damageBoss(150);
        }
        if (action === 'ROLL' && p.stamina >= 25) {
          p.stamina -= 25;
          p.x += (this.touchJoystick.active ? this.touchJoystick.vx : 0) * 15;
          p.y += (this.touchJoystick.active ? this.touchJoystick.vy : 0) * 15;
        }
      }
      return;
    }
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'PLAYER_INPUT',
      action,
      vx: this.touchJoystick.active ? this.touchJoystick.vx : 0,
      vy: this.touchJoystick.active ? this.touchJoystick.vy : 0
    }));
  }

  copyInviteLink() {
    const link = `${window.location.origin}/?code=${this.roomCode}`;
    navigator.clipboard.writeText(link).then(() => {
      alert(`Copied lobby link: ${link}`);
    });
  }

  downloadSave() {
    if (!this.roomCode) return;
    window.location.href = `/api/rooms/${this.roomCode}/save`;
  }

  uploadSave() {
    const fileInput = document.getElementById('file-save-input');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        fetch('/api/save/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        })
          .then(r => r.json())
          .then(data => {
            const statusBox = document.getElementById('save-status-msg');
            if (data.success) {
              statusBox.innerText = `Save Verified: Day ${data.payload.calendarDays}, Seed ${data.payload.worldSeed}`;
              statusBox.style.color = '#43a047';
              // Host verified world
              const hostName = document.getElementById('input-player-name').value;
              fetch('/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostName, initialSaveData: json })
              })
                .then(r => r.json())
                .then(roomData => {
                  if (roomData.success) {
                    this.connectAndJoin(roomData.roomCode, hostName);
                  }
                });
            } else {
              statusBox.innerText = `REJECTED: ${data.error}`;
              statusBox.style.color = '#e53935';
            }
          });
      } catch (err) {
        alert('Invalid save file JSON');
      }
    };
    reader.readAsText(file);
  }

  renderRoster(players) {
    const tbody = document.getElementById('roster-tbody');
    tbody.innerHTML = '';
    players.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.name}</td>
        <td><span style="display:inline-block;width:12px;height:12px;background:#e53935;border-radius:2px;"></span></td>
        <td>${p.isHost ? '👑 HOST' : 'MEMBER'}</td>
        <td>${p.ready ? '✅ READY' : '⏳ WAITING'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  updateHUD(snapshot) {
    // Boss Healthbar Pinned to Top
    const bossHud = document.getElementById('boss-hud');
    if (snapshot.activeBoss) {
      bossHud.classList.remove('hidden');
      document.getElementById('boss-name').innerText = snapshot.activeBoss.name.toUpperCase();
      document.getElementById('boss-phase').innerText = `PHASE ${snapshot.activeBoss.phase}`;
      const pct = (snapshot.activeBoss.hp / snapshot.activeBoss.maxHp) * 100;
      document.getElementById('boss-health-fill').style.width = `${Math.max(0, pct)}%`;
    } else {
      bossHud.classList.add('hidden');
    }

    // Day/Night Celestial Clock
    document.getElementById('day-counter').innerText = `DAY ${snapshot.calendarDays}`;
    document.getElementById('time-icon').innerText = snapshot.isNight ? '🌙' : '☀️';
    document.getElementById('cycle-phase').innerText = snapshot.isNight ? 'NIGHT (2m)' : 'DAY (4m)';

    // Player HP and Stamina
    const me = snapshot.players?.find(p => p.id === this.localPlayerId);
    if (me) {
      const hpPct = (me.hp / me.maxHp) * 100;
      document.getElementById('hp-bar-fill').style.width = `${hpPct}%`;
    }

    // Story Dialogue (35% bottom screen)
    const storyScreen = document.getElementById('story-dialogue-screen');
    if (snapshot.isPausedForStory && snapshot.storyDialogue) {
      storyScreen.classList.remove('hidden');
      document.getElementById('dialogue-speaker').innerText = snapshot.storyDialogue.speaker;
      document.getElementById('dialogue-text').innerText = snapshot.storyDialogue.text;
      document.getElementById('story-vote-counter').innerText = `VOTES: ${snapshot.storyVotesCount}/${snapshot.totalPlayers}`;
    } else {
      storyScreen.classList.add('hidden');
    }
  }

  startLoop() {
    const loop = () => {
      // Process Keyboard Movement
      let vx = 0;
      let vy = 0;
      if (this.keys['w'] || this.keys['arrowup']) vy -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) vy += 1;
      if (this.keys['a'] || this.keys['arrowleft']) vx -= 1;
      if (this.keys['d'] || this.keys['arrowright']) vx += 1;

      if (this.touchJoystick.active) {
        vx = this.touchJoystick.vx;
        vy = this.touchJoystick.vy;
      }

      if (this.isLocalSimulation && this.localSim) {
        const p = this.localSim.players.get(this.localPlayerId);
        if (p && p.state === 'ALIVE') {
          p.x += vx * 12 * 0.033;
          p.y += vy * 12 * 0.033;
        }
      } else if ((vx !== 0 || vy !== 0) && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'PLAYER_INPUT',
          vx,
          vy
        }));
      }

      // Render 3D Isometric View
      this.renderer.render(this.worldSnapshot, this.localPlayerId);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Bootstrap Application on Window Load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new VoxelRaidersApp();
});
