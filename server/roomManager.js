import { GameSimulation } from './gameSimulation.js';
import { generateSavePayload, verifyAndLoadSavePayload } from './cryptoSave.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> RoomObject
    this.savedWorldsCache = new Map(); // roomCode -> { savePackage, expiresAt }
    
    // Periodically clean up saved worlds older than 24 hours (86,400,000 ms)
    setInterval(() => this.purgeExpiredSaves(), 60 * 60 * 1000); // Check hourly
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = 'VR-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom({ hostName, gameMode = 'AGENDA_FFA', initialSaveData = null, hostSocket = null }) {
    const roomCode = this.generateRoomCode();
    let validatedSave = null;

    if (initialSaveData) {
      validatedSave = verifyAndLoadSavePayload(initialSaveData);
    }

    const simulation = new GameSimulation(roomCode, gameMode, validatedSave);
    const hostId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const hostSocketRef = hostSocket || { isHostSocketRef: true, id: hostId };

    const room = {
      code: roomCode,
      hostId,
      gameMode,
      state: 'LOBBY', // 'LOBBY', 'PLAYING'
      clients: new Map(), // socket -> { id, name, ready }
      simulation,
      createdAt: Date.now(),
      lastActive: Date.now()
    };

    simulation.addPlayer(hostId, hostName || 'Raid Leader');
    room.clients.set(hostSocketRef, {
      id: hostId,
      name: hostName || 'Raid Leader',
      avatar: 'hero_red',
      ready: true,
      socket: hostSocketRef
    });

    this.rooms.set(roomCode, room);

    // Initial save cache
    this.cacheAutoSave(roomCode);

    return { room, hostId, hostSocket: hostSocketRef };
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase());
  }

  joinRoom(roomCode, clientSocket, playerName, avatar = 'hero_blue') {
    const room = this.getRoom(roomCode);
    if (!room) {
      return { success: false, reason: 'ROOM_NOT_FOUND' };
    }

    if (room.clients.size >= 8) {
      return { success: false, reason: 'ROOM_FULL' };
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const clientData = {
      id: playerId,
      name: playerName || `Raider_${room.clients.size + 1}`,
      avatar,
      ready: false,
      socket: clientSocket
    };

    room.clients.set(clientSocket, clientData);
    room.simulation.addPlayer(playerId, clientData.name, avatar);
    room.lastActive = Date.now();

    return { success: true, room, playerId, clientData };
  }

  leaveRoom(roomCode, clientSocket) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    const client = room.clients.get(clientSocket);
    if (!client) return;

    room.simulation.removePlayer(client.id);
    room.clients.delete(clientSocket);

    // Host Migration
    if (client.id === room.hostId && room.clients.size > 0) {
      const nextClient = Array.from(room.clients.values())[0];
      room.hostId = nextClient.id;
    }

    // Auto-save on leave
    this.cacheAutoSave(roomCode);

    if (room.clients.size === 0) {
      room.simulation.stop();
      // Leave room in cache for 24h, delete live room
      this.rooms.delete(roomCode);
    }
  }

  startGame(roomCode, requesterId) {
    const room = this.getRoom(roomCode);
    if (!room) return { success: false, reason: 'ROOM_NOT_FOUND' };
    if (room.hostId !== requesterId) return { success: false, reason: 'NOT_HOST' };

    room.state = 'PLAYING';
    room.simulation.start();
    return { success: true };
  }

  cacheAutoSave(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    const sim = room.simulation;
    const saveObj = generateSavePayload({
      worldSeed: sim.worldSeed,
      calendarDays: sim.calendarDays,
      timeOfDaySec: sim.timeOfDaySec,
      bossesDefeated: sim.bossesDefeated,
      bossKeyDropsCount: sim.bossKeyDropsCount,
      bossPortalsOpened: sim.bossPortalsOpened,
      anchorsUnlocked: Array.from(sim.anchors.keys()),
      gameMode: sim.gameMode,
      worldExpanded3x: sim.worldExpanded3x
    });

    this.savedWorldsCache.set(roomCode, {
      savePackage: saveObj,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours TTL
    });

    return saveObj;
  }

  getExportableSave(roomCode) {
    const room = this.getRoom(roomCode);
    if (room) {
      return this.cacheAutoSave(roomCode);
    }
    const cached = this.savedWorldsCache.get(roomCode);
    return cached ? cached.savePackage : null;
  }

  purgeExpiredSaves() {
    const now = Date.now();
    for (const [code, item] of this.savedWorldsCache.entries()) {
      if (now > item.expiresAt) {
        this.savedWorldsCache.delete(code);
      }
    }
  }
}
