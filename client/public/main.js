/**
 * Voxel Raiders: Dimensional Rift - Client Core Engine
 */

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

// Isometric Canvas Renderer
class VoxelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileWidth = 48;
    this.tileHeight = 24;
    this.cameraX = 0;
    this.cameraY = 0;
    this.graphicsProfile = 'PC_HIGH';
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  toIso(x, y) {
    const screenX = (x - y) * (this.tileWidth / 2) + this.canvas.width / 2 - this.cameraX;
    const screenY = (x + y) * (this.tileHeight / 2) + this.canvas.height / 2 - this.cameraY;
    return { x: screenX, y: screenY };
  }

  render(worldSnapshot, localPlayerId) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isNight = worldSnapshot?.isNight;
    // Ambient Lighting
    ctx.fillStyle = isNight ? '#0b0d18' : '#283628';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center camera on local player
    const localPlayer = worldSnapshot?.players?.find(p => p.id === localPlayerId);
    if (localPlayer) {
      const targetIso = {
        x: (localPlayer.x - localPlayer.y) * (this.tileWidth / 2),
        y: (localPlayer.x + localPlayer.y) * (this.tileHeight / 2)
      };
      this.cameraX += (targetIso.x - this.cameraX) * 0.1;
      this.cameraY += (targetIso.y - this.cameraY) * 0.1;
    }

    // Draw Isometric Voxel Grid
    this.renderGrid(isNight);

    // Draw Anchor Sanctuary
    this.renderAnchor(0, 0);

    // Draw Entities
    if (worldSnapshot?.players) {
      for (const p of worldSnapshot.players) {
        this.renderPlayer(p, p.id === localPlayerId);
      }
    }

    // Draw Boss
    if (worldSnapshot?.activeBoss) {
      this.renderBoss(worldSnapshot.activeBoss);
    }
  }

  renderGrid(isNight) {
    const radius = 18;
    const baseColor = isNight ? '#161d24' : '#3b5335';
    const topColor = isNight ? '#1f2933' : '#4f6d47';

    for (let x = -radius; x <= radius; x += 2) {
      for (let y = -radius; y <= radius; y += 2) {
        const iso = this.toIso(x, y);
        if (iso.x < -100 || iso.x > this.canvas.width + 100 || iso.y < -100 || iso.y > this.canvas.height + 100) {
          continue;
        }
        this.drawVoxelBlock(iso.x, iso.y, this.tileWidth, this.tileHeight, 14, topColor, baseColor);
      }
    }
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
    ctx.strokeStyle = '#222';
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

    // Right Side Face
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

  renderAnchor(x, y) {
    const iso = this.toIso(x, y);
    const ctx = this.ctx;
    // Radiant beacon beam
    const gradient = ctx.createLinearGradient(iso.x, iso.y - 120, iso.x, iso.y);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0.45)');
    ctx.fillStyle = gradient;
    ctx.fillRect(iso.x - 12, iso.y - 120, 24, 120);

    this.drawVoxelBlock(iso.x, iso.y, 40, 20, 16, '#00e5ff', '#0097a7');
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText('SANCTUARY ANCHOR', iso.x - 38, iso.y - 10);
  }

  renderPlayer(p, isLocal) {
    const iso = this.toIso(p.x, p.y);
    const ctx = this.ctx;

    // Shadow
    ctx.beginPath();
    ctx.ellipse(iso.x, iso.y + 10, 14, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Blocky Player Body
    const colorMap = {
      hero_red: '#e53935',
      hero_blue: '#1e88e5',
      hero_green: '#43a047',
      hero_gold: '#fbc02d',
      hero_purple: '#8e24aa',
      hero_dark: '#37474f'
    };
    const playerColor = colorMap[p.avatar] || '#e53935';

    if (p.state === 'DOWNED') {
      // Downed / incapacitated raider
      this.drawVoxelBlock(iso.x, iso.y + 6, 26, 14, 8, '#757575', '#424242');
      ctx.fillStyle = '#ff1744';
      ctx.font = '8px monospace';
      ctx.fillText(`DOWNED (${p.downedTimer}s)`, iso.x - 24, iso.y - 8);
      return;
    }

    // Standing Raider Voxel Body
    this.drawVoxelBlock(iso.x, iso.y - 12, 20, 12, 18, playerColor, '#1a1a1a');

    // Head
    this.drawVoxelBlock(iso.x, iso.y - 28, 14, 8, 10, '#ffd54f', '#d7ccc8');

    // Nameplate
    ctx.fillStyle = isLocal ? '#fbc02d' : '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(p.name, iso.x - p.name.length * 2.5, iso.y - 38);
  }

  renderBoss(boss) {
    const iso = this.toIso(boss.x, boss.y);
    const ctx = this.ctx;

    // Massive Boss Aura
    ctx.beginPath();
    ctx.ellipse(iso.x, iso.y + 20, 48, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 23, 68, 0.35)';
    ctx.fill();

    // Giant Voxel Boss Body
    this.drawVoxelBlock(iso.x, iso.y - 30, 60, 32, 45, '#d50000', '#4a0000');
    // Glowing Core
    this.drawVoxelBlock(iso.x, iso.y - 50, 24, 16, 18, '#ffeb3b', '#f57f17');

    ctx.fillStyle = '#ff5252';
    ctx.font = '10px monospace';
    ctx.fillText(`[BOSS] ${boss.name}`, iso.x - 70, iso.y - 75);
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

    // Lobby actions
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
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'TRIGGER_ECLIPSE_ALTAR' }));
    }
  }

  voteStory() {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'STORY_VOTE' }));
    }
  }

  sendAction(action) {
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

      if ((vx !== 0 || vy !== 0) && this.ws && this.ws.readyState === WebSocket.OPEN) {
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
