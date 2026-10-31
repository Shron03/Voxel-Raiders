/**
 * Voxel Raiders: Dimensional Rift - PC Standalone Launcher & LAN Hub
 * Manages local world saves in %APPDATA%/VoxelRaiders/saves/ and handles UDP LAN broadcasting.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fork } from 'child_process';
import { LanDiscoveryHost, LanDiscoveryClient } from '../server/lanDiscovery.js';

const APPDATA_DIR = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Preferences') : path.join(os.homedir(), '.local', 'share'));
const SAVES_DIR = path.join(APPDATA_DIR, 'VoxelRaiders', 'saves');

// Ensure local save folder exists
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
  console.log(`[VoxelRaiders Desktop] Initialized local save directory at: ${SAVES_DIR}`);
}

export function getLocalSaves() {
  if (!fs.existsSync(SAVES_DIR)) return [];
  const files = fs.readdirSync(SAVES_DIR);
  return files.filter(f => f.endsWith('.vrsave')).map(f => {
    const fullPath = path.join(SAVES_DIR, f);
    const stats = fs.statSync(fullPath);
    return {
      fileName: f,
      filePath: fullPath,
      sizeBytes: stats.size,
      lastModified: stats.mtime
    };
  });
}

export function saveWorldLocally(roomCode, savePackage) {
  const fileName = `${roomCode}_world.vrsave`;
  const filePath = path.join(SAVES_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(savePackage, null, 2), 'utf-8');
  console.log(`[VoxelRaiders Desktop] World saved locally to: ${filePath}`);
  return filePath;
}

export function startLocalServer(port = 10000) {
  const serverPath = path.join(process.cwd(), 'server', 'index.js');
  const child = fork(serverPath, [], {
    env: { ...process.env, PORT: String(port) }
  });

  child.on('message', (msg) => {
    console.log('[Local Server]:', msg);
  });

  return child;
}

// Self-test execution when run directly
if (process.argv[1]?.endsWith('desktop/main.js') || process.argv[1]?.endsWith('desktop\\main.js')) {
  console.log('=== VOXEL RAIDERS PC STANDALONE LAN LAUNCHER ===');
  console.log(`Local Saves Directory: ${SAVES_DIR}`);
  const existingSaves = getLocalSaves();
  console.log(`Discovered ${existingSaves.length} existing local world save(s).`);
}
