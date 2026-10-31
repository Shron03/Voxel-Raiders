/**
 * Voxel Raiders: Dimensional Rift
 * Procedural Infinite Chunk Engine & 100GB World Storage System
 * Implements chunked spatial partitioning (16x16x64), 3D multi-octave noise,
 * biome distribution, structures, monuments, and region file streaming.
 */

import fs from 'fs';
import path from 'path';

export const CHUNK_WIDTH = 16;
export const CHUNK_LENGTH = 16;
export const CHUNK_HEIGHT = 64;

export const BLOCK_TYPES = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  OAK_WOOD: 4,
  OAK_LEAVES: 5,
  IRON_ORE: 6,
  OBSIDIAN: 7,
  MAGMA: 8,
  ANCIENT_STONE: 9,
  CHEST_DUNGEON: 10,
  SANCTUARY_ANCHOR: 11,
  ECLIPSE_ALTAR: 12
};

// Deterministic Pseudo-Random Noise Generator (Perlin / Hash-based)
class ProceduralNoise {
  constructor(seed = 1337) {
    this.seed = seed;
  }

  hash(x, z) {
    let n = Math.sin(x * 12.9898 + z * 78.233 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  smoothNoise(x, z) {
    const corners = (this.hash(x - 1, z - 1) + this.hash(x + 1, z - 1) + this.hash(x - 1, z + 1) + this.hash(x + 1, z + 1)) / 16;
    const sides = (this.hash(x - 1, z) + this.hash(x + 1, z) + this.hash(x, z - 1) + this.hash(x, z + 1)) / 8;
    const center = this.hash(x, z) / 4;
    return corners + sides + center;
  }

  interpolate(a, b, t) {
    const ft = t * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }

  interpolatedNoise(x, z) {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intZ = Math.floor(z);
    const fracZ = z - intZ;

    const v1 = this.smoothNoise(intX, intZ);
    const v2 = this.smoothNoise(intX + 1, intZ);
    const v3 = this.smoothNoise(intX, intZ + 1);
    const v4 = this.smoothNoise(intX + 1, intZ + 1);

    const i1 = this.interpolate(v1, v2, fracX);
    const i2 = this.interpolate(v3, v4, fracX);

    return this.interpolate(i1, i2, fracZ);
  }

  octaveNoise(x, z, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 0.05;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.interpolatedNoise(x * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

export class VoxelWorldStorage {
  constructor(worldDir, seed = 42817) {
    this.worldDir = worldDir;
    this.regionDir = path.join(worldDir, 'regions');
    this.seed = seed;
    this.noise = new ProceduralNoise(seed);
    this.loadedChunks = new Map(); // "cx,cz" -> ChunkData

    if (!fs.existsSync(this.regionDir)) {
      fs.mkdirSync(this.regionDir, { recursive: true });
    }
  }

  getChunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  getRegionFileName(cx, cz) {
    const rx = Math.floor(cx / 32);
    const rz = Math.floor(cz / 32);
    return path.join(this.regionDir, `r.${rx}.${rz}.vrchunk`);
  }

  /**
   * Procedurally generates a chunk if not found on disk
   */
  getOrGenerateChunk(cx, cz) {
    const key = this.getChunkKey(cx, cz);
    if (this.loadedChunks.has(key)) {
      return this.loadedChunks.get(key);
    }

    // Try reading from disk
    const diskChunk = this.loadChunkFromDisk(cx, cz);
    if (diskChunk) {
      this.loadedChunks.set(key, diskChunk);
      return diskChunk;
    }

    // Generate fresh chunk
    const chunk = this.generateProceduralChunk(cx, cz);
    this.loadedChunks.set(key, chunk);
    this.saveChunkToDisk(cx, cz, chunk);
    return chunk;
  }

  generateProceduralChunk(cx, cz) {
    // 16 x 16 x 64 block array
    const blocks = new Uint8Array(CHUNK_WIDTH * CHUNK_LENGTH * CHUNK_HEIGHT);
    const structures = [];

    const getIndex = (x, y, z) => (y * CHUNK_WIDTH * CHUNK_LENGTH) + (z * CHUNK_WIDTH) + x;

    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_LENGTH; z++) {
        const worldX = cx * CHUNK_WIDTH + x;
        const worldZ = cz * CHUNK_LENGTH + z;

        // Base height calculation using multi-octave noise
        const n = this.noise.octaveNoise(worldX, worldZ, 4, 0.5);
        const surfaceHeight = Math.floor(18 + n * 24); // Height between 18 and 42

        // Biome determination
        const biomeNoise = this.noise.octaveNoise(worldX * 0.1, worldZ * 0.1, 2, 0.3);

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const idx = getIndex(x, y, z);
          if (y === 0) {
            blocks[idx] = BLOCK_TYPES.OBSIDIAN; // Bedrock
          } else if (y < surfaceHeight - 4) {
            // Underground stone & ores
            const oreRoll = this.noise.hash(worldX * 3 + y, worldZ * 3 + y);
            if (oreRoll > 0.92) {
              blocks[idx] = BLOCK_TYPES.IRON_ORE;
            } else {
              blocks[idx] = BLOCK_TYPES.STONE;
            }
          } else if (y < surfaceHeight) {
            blocks[idx] = BLOCK_TYPES.DIRT;
          } else if (y === surfaceHeight) {
            if (biomeNoise > 0.65) {
              blocks[idx] = BLOCK_TYPES.MAGMA;
            } else {
              blocks[idx] = BLOCK_TYPES.GRASS;
            }
          } else {
            blocks[idx] = BLOCK_TYPES.AIR;
          }
        }

        // Spawn Oak Trees occasionally on grass
        if (blocks[getIndex(x, surfaceHeight, z)] === BLOCK_TYPES.GRASS) {
          const treeRoll = this.noise.hash(worldX * 7, worldZ * 7);
          if (treeRoll > 0.96 && x > 2 && x < 13 && z > 2 && z < 13 && surfaceHeight < 55) {
            // Trunk
            for (let ty = 1; ty <= 4; ty++) {
              blocks[getIndex(x, surfaceHeight + ty, z)] = BLOCK_TYPES.OAK_WOOD;
            }
            // Leaves canopy
            for (let lx = -2; lx <= 2; lx++) {
              for (let lz = -2; lz <= 2; lz++) {
                for (let ly = 3; ly <= 5; ly++) {
                  if (Math.abs(lx) + Math.abs(lz) <= 3) {
                    const leafIdx = getIndex(x + lx, surfaceHeight + ly, z + lz);
                    if (blocks[leafIdx] === BLOCK_TYPES.AIR) {
                      blocks[leafIdx] = BLOCK_TYPES.OAK_LEAVES;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Spawn Sanctuary Anchor at origin chunk (0,0)
    if (cx === 0 && cz === 0) {
      const anchorIdx = getIndex(8, 26, 8);
      blocks[anchorIdx] = BLOCK_TYPES.SANCTUARY_ANCHOR;
      blocks[getIndex(8, 26, 10)] = BLOCK_TYPES.ECLIPSE_ALTAR;
    }

    // Procedural Monument & Dungeon Chest Placement
    const monumentRoll = this.noise.hash(cx * 19, cz * 19);
    if (monumentRoll > 0.88 && (cx !== 0 || cz !== 0)) {
      structures.push({
        type: 'ANCIENT_MONUMENT',
        worldX: cx * CHUNK_WIDTH + 8,
        worldZ: cz * CHUNK_LENGTH + 8,
        chestRarity: this.determineChestRarity(cx, cz)
      });
    }

    return { cx, cz, blocks, structures, generatedAt: Date.now() };
  }

  determineChestRarity(cx, cz) {
    const roll = this.noise.hash(cx * 37, cz * 37);
    if (roll < 0.000001) return 'Void';
    if (roll < 0.0001) return 'Mythical';
    if (roll < 0.01) return 'Legendary';
    if (roll < 0.10) return 'Unique';
    if (roll < 0.50) return 'Rare';
    return 'Common';
  }

  saveChunkToDisk(cx, cz, chunk) {
    const regionFile = this.getRegionFileName(cx, cz);
    try {
      const data = {
        cx,
        cz,
        blocksBase64: Buffer.from(chunk.blocks).toString('base64'),
        structures: chunk.structures,
        generatedAt: chunk.generatedAt
      };
      const line = JSON.stringify(data) + '\n';
      fs.appendFileSync(regionFile, line, 'utf-8');
    } catch (e) {
      // Handle disk errors gracefully
    }
  }

  loadChunkFromDisk(cx, cz) {
    const regionFile = this.getRegionFileName(cx, cz);
    if (!fs.existsSync(regionFile)) return null;

    try {
      const content = fs.readFileSync(regionFile, 'utf-8');
      const lines = content.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const item = JSON.parse(lines[i]);
        if (item.cx === cx && item.cz === cz) {
          return {
            cx,
            cz,
            blocks: new Uint8Array(Buffer.from(item.blocksBase64, 'base64')),
            structures: item.structures,
            generatedAt: item.generatedAt
          };
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  }
}
