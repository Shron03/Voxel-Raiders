import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { RoomManager } from './roomManager.js';
import { verifyAndLoadSavePayload } from './cryptoSave.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve Static Frontend (Client & Landing Page)
app.use(express.static(path.join(__dirname, '../client/public')));

const roomManager = new RoomManager();

// Render Healthcheck Endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Voxel Raiders Game Server',
    uptime: process.uptime(),
    activeRooms: roomManager.rooms.size,
    cachedSaves: roomManager.savedWorldsCache.size,
    memoryUsage: process.memoryUsage()
  });
});

// REST: Create Room
app.post('/api/rooms/create', (req, res) => {
  try {
    const { hostName, gameMode, initialSaveData } = req.body;
    const { room, hostId } = roomManager.createRoom({ hostName, gameMode, initialSaveData });
    res.status(200).json({
      success: true,
      roomCode: room.code,
      hostId,
      joinUrl: `/join/${room.code}`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Explicit Package Download Routes
app.get('/downloads/pc-client', (req, res) => {
  res.download(path.join(__dirname, '../client/public/downloads/VoxelRaiders-PC-Client.zip'));
});
app.get('/downloads/pc-host', (req, res) => {
  res.download(path.join(__dirname, '../client/public/downloads/VoxelRaiders-Dedicated-Host-Server.zip'));
});
app.get('/downloads/android', (req, res) => {
  res.download(path.join(__dirname, '../client/public/downloads/VoxelRaiders-Android.apk'));
});

// REST: Download / Export .vrsave file
app.get('/api/rooms/:code/save', (req, res) => {
  const savePkg = roomManager.getExportableSave(req.params.code);
  if (!savePkg) {
    return res.status(404).json({ success: false, error: 'Save not found or expired' });
  }
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.code}_world.vrsave"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(savePkg, null, 2));
});

// REST: Verify uploaded save file against HMAC anti-cheat
app.post('/api/save/verify', (req, res) => {
  try {
    const validated = verifyAndLoadSavePayload(req.body);
    res.status(200).json({ success: true, payload: validated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Direct join route redirects to web client with code param
app.get('/join/:code', (req, res) => {
  res.redirect(`/?code=${encodeURIComponent(req.params.code)}`);
});

// WebSocket Protocol
wss.on('connection', (ws) => {
  let currentRoomCode = null;
  let currentClientData = null;

  ws.on('message', (messageBuffer) => {
    try {
      const msg = JSON.parse(messageBuffer.toString());

      switch (msg.type) {
        case 'JOIN_LOBBY': {
          const result = roomManager.joinRoom(msg.roomCode, ws, msg.playerName, msg.avatar);
          if (result.success) {
            currentRoomCode = result.room.code;
            currentClientData = result.clientData;
            ws.send(JSON.stringify({
              type: 'JOINED_SUCCESS',
              playerId: result.playerId,
              roomCode: currentRoomCode,
              isHost: result.playerId === result.room.hostId,
              gameState: result.room.simulation.getPublicSnapshot()
            }));
            broadcastLobbyState(result.room);
          } else {
            ws.send(JSON.stringify({ type: 'JOIN_ERROR', reason: result.reason }));
          }
          break;
        }

        case 'TOGGLE_READY': {
          if (!currentRoomCode || !currentClientData) return;
          const room = roomManager.getRoom(currentRoomCode);
          if (room) {
            currentClientData.ready = !currentClientData.ready;
            broadcastLobbyState(room);
          }
          break;
        }

        case 'START_GAME': {
          if (!currentRoomCode || !currentClientData) return;
          const result = roomManager.startGame(currentRoomCode, currentClientData.id);
          if (result.success) {
            const room = roomManager.getRoom(currentRoomCode);
            broadcastToRoom(room, { type: 'GAME_STARTED' });
          } else {
            ws.send(JSON.stringify({ type: 'START_ERROR', reason: result.reason }));
          }
          break;
        }

        case 'PLAYER_INPUT': {
          if (!currentRoomCode || !currentClientData) return;
          const room = roomManager.getRoom(currentRoomCode);
          if (room && room.state === 'PLAYING') {
            const player = room.simulation.players.get(currentClientData.id);
            if (player && player.state === 'ALIVE') {
              if (msg.vx !== undefined && msg.vy !== undefined) {
                const speed = 12; // units per second
                player.x += msg.vx * speed * 0.033;
                player.y += msg.vy * speed * 0.033;
              }
              if (msg.action === 'ATTACK') {
                handlePlayerAttack(room.simulation, player, msg);
              }
              if (msg.action === 'ROLL' && player.stamina >= 25) {
                player.stamina -= 25;
                player.x += (msg.vx || 0) * 15;
                player.y += (msg.vy || 0) * 15;
              }
            }
          }
          break;
        }

        case 'TRIGGER_ECLIPSE_ALTAR': {
          if (!currentRoomCode || !currentClientData) return;
          const room = roomManager.getRoom(currentRoomCode);
          if (room) {
            const res = room.simulation.triggerEclipseAltar(currentClientData.id);
            broadcastToRoom(room, { type: 'SYSTEM_NOTIFICATION', message: res.message });
          }
          break;
        }

        case 'OPEN_BOSS_PORTAL_EARLY': {
          if (!currentRoomCode || !currentClientData) return;
          const room = roomManager.getRoom(currentRoomCode);
          if (room) {
            const res = room.simulation.openBossPortal(msg.bossRank, 'PLAYER_KEY');
            broadcastToRoom(room, {
              type: 'SYSTEM_NOTIFICATION',
              message: res.message || res.reason,
              success: res.success
            });
          }
          break;
        }

        case 'STORY_VOTE': {
          if (!currentRoomCode || !currentClientData) return;
          const room = roomManager.getRoom(currentRoomCode);
          if (room) {
            room.simulation.voteAdvanceStory(currentClientData.id);
          }
          break;
        }

        case 'REVIVE_REQUEST': {
          if (!currentRoomCode || !currentClientData) return;
          const room = roomManager.getRoom(currentRoomCode);
          if (room) {
            const res = room.simulation.revivePlayer(currentClientData.id, msg.targetPlayerId);
            if (res.success) {
              broadcastToRoom(room, { type: 'SYSTEM_NOTIFICATION', message: res.message });
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error('WS Parse Error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode) {
      const room = roomManager.getRoom(currentRoomCode);
      roomManager.leaveRoom(currentRoomCode, ws);
      if (room) {
        broadcastLobbyState(room);
      }
    }
  });
});

function handlePlayerAttack(simulation, player, msg) {
  const attackRadius = 16;
  // If active boss, check distance to boss
  if (simulation.activeBoss) {
    const dx = simulation.activeBoss.x - player.x;
    const dy = simulation.activeBoss.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= attackRadius + 10) {
      simulation.damageBoss(150);
    }
  }

  // If PvP active, attack other players
  if (simulation.pvpActive) {
    for (const other of simulation.players.values()) {
      if (other.id !== player.id && other.state === 'ALIVE') {
        const dx = other.x - player.x;
        const dy = other.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) <= attackRadius) {
          simulation.handlePlayerDamage(other.id, 25, player.id);
        }
      }
    }
  }
}

function broadcastToRoom(room, payload) {
  const serialized = JSON.stringify(payload);
  for (const client of room.clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serialized);
    }
  }
}

function broadcastLobbyState(room) {
  const playersList = Array.from(room.clients.values()).map(c => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    ready: c.ready,
    isHost: c.id === room.hostId
  }));

  broadcastToRoom(room, {
    type: 'LOBBY_UPDATE',
    roomCode: room.code,
    hostId: room.hostId,
    gameMode: room.gameMode,
    state: room.state,
    players: playersList
  });
}

// 30Hz Server Broadcast Loop for Live Game Rooms
setInterval(() => {
  for (const room of roomManager.rooms.values()) {
    if (room.state === 'PLAYING') {
      const snapshot = room.simulation.getPublicSnapshot();
      broadcastToRoom(room, {
        type: 'WORLD_DELTA',
        snapshot
      });
    }
  }
}, 1000 / 30);

server.listen(PORT, () => {
  console.log(`[VoxelRaiders] Server active on port ${PORT}`);
  console.log(`[VoxelRaiders] Healthcheck available at http://localhost:${PORT}/healthz`);
});

export { app, server, roomManager };
