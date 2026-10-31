/**
 * 3D Voxel Mesh Generator for Voxel Raiders (Unreal Engine 5.8 & 3D Web Engine)
 * Generates clean, textured .obj/.mtl 3D blocky models for players, 5 bosses, blocks, and items.
 */

import fs from 'fs';
import path from 'path';

const MODELS_DIR = path.join(process.cwd(), 'unreal_project', 'Content', 'Models');
const WEB_ASSETS_DIR = path.join(process.cwd(), 'client', 'public', 'models');

[MODELS_DIR, WEB_ASSETS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

class ObjBuilder {
  constructor(name) {
    this.name = name;
    this.vertices = [];
    this.uvs = [];
    this.normals = [];
    this.faces = [];
  }

  addBox(minX, minY, minZ, maxX, maxY, maxZ) {
    const vStart = this.vertices.length + 1;

    // 8 Vertices
    this.vertices.push(
      [minX, minY, minZ], [maxX, minY, minZ], [maxX, maxY, minZ], [minX, maxY, minZ], // Front
      [minX, minY, maxZ], [maxX, minY, maxZ], [maxX, maxY, maxZ], [minX, maxY, maxZ]  // Back
    );

    // 6 Normals
    this.normals.push(
      [0, 0, -1], [0, 0, 1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]
    );

    // 4 standard UVs
    this.uvs.push([0, 0], [1, 0], [1, 1], [0, 1]);

    // 6 Faces (quads as two triangles)
    const addQuad = (v1, v2, v3, v4, nIdx) => {
      this.faces.push(`f ${vStart + v1}/1/${nIdx} ${vStart + v2}/2/${nIdx} ${vStart + v3}/3/${nIdx}`);
      this.faces.push(`f ${vStart + v1}/1/${nIdx} ${vStart + v3}/3/${nIdx} ${vStart + v4}/4/${nIdx}`);
    };

    addQuad(0, 1, 2, 3, 1); // Front
    addQuad(5, 4, 7, 6, 2); // Back
    addQuad(3, 2, 6, 7, 3); // Top
    addQuad(4, 5, 1, 0, 4); // Bottom
    addQuad(1, 5, 6, 2, 5); // Right
    addQuad(4, 0, 3, 7, 6); // Left
  }

  buildObj() {
    let out = `# Voxel Raiders 3D Model: ${this.name}\no ${this.name}\n`;
    for (const v of this.vertices) out += `v ${v[0].toFixed(3)} ${v[1].toFixed(3)} ${v[2].toFixed(3)}\n`;
    for (const uv of this.uvs) out += `vt ${uv[0]} ${uv[1]}\n`;
    for (const n of this.normals) out += `vn ${n[0]} ${n[1]} ${n[2]}\n`;
    for (const f of this.faces) out += `${f}\n`;
    return out;
  }

  save(fileName) {
    const objContent = this.buildObj();
    fs.writeFileSync(path.join(MODELS_DIR, `${fileName}.obj`), objContent, 'utf-8');
    fs.writeFileSync(path.join(WEB_ASSETS_DIR, `${fileName}.obj`), objContent, 'utf-8');
    console.log(`[3D Assets] Generated: ${fileName}.obj`);
  }
}

// 1. Generate Player Raider (Classic blocky proportions: Head, Torso, Arms, Legs)
const raider = new ObjBuilder('PlayerRaider');
raider.addBox(-4, 12, -2, 4, 24, 2);   // Torso (8x12x4)
raider.addBox(-4, 24, -4, 4, 32, 4);   // Head (8x8x8)
raider.addBox(-8, 12, -2, -4, 24, 2);  // Left Arm (4x12x4)
raider.addBox(4, 12, -2, 8, 24, 2);    // Right Arm (4x12x4)
raider.addBox(-4, 0, -2, 0, 12, 2);    // Left Leg (4x12x4)
raider.addBox(0, 0, -2, 4, 12, 2);     // Right Leg (4x12x4)
raider.save('PlayerRaider');

// 2. Boss 1: The Sunken Warden (Massive 3x scaled stone monolith)
const boss1 = new ObjBuilder('Boss1_SunkenWarden');
boss1.addBox(-12, 0, -8, 12, 36, 8);   // Heavy stone torso
boss1.addBox(-8, 36, -8, 8, 48, 8);    // Crowned Warden Head
boss1.addBox(-22, 10, -6, -12, 40, 6); // Massive Left Stone Fist
boss1.addBox(12, 10, -6, 22, 40, 6);   // Massive Right Stone Fist
boss1.save('Boss1_SunkenWarden');

// 3. Boss 2: Colossus of Ancient Pyres (Magma shoulders & lava horns)
const boss2 = new ObjBuilder('Boss2_ColossusPyres');
boss2.addBox(-16, 0, -10, 16, 42, 10); // Magma Core Torso
boss2.addBox(-10, 42, -10, 10, 56, 10);// Obsidian Horned Skull
boss2.addBox(-26, 16, -8, -16, 46, 8); // Magma Hammer Arm
boss2.addBox(16, 16, -8, 26, 46, 8);   // Flame Spire Arm
boss2.save('Boss2_ColossusPyres');

// 4. Boss 3: The Hollow Necrolord (Skeletal lich king with floating ribcage)
const boss3 = new ObjBuilder('Boss3_HollowNecrolord');
boss3.addBox(-8, 14, -4, 8, 34, 4);    // Ribcage
boss3.addBox(-6, 34, -6, 6, 46, 6);    // Skull with crown
boss3.addBox(-14, 14, -2, -8, 38, 2);  // Skeletal Staff Arm
boss3.addBox(8, 14, -2, 14, 38, 2);    // Bone Claws
boss3.addBox(-4, 46, -4, 4, 52, 4);    // Dark Halo / Crown
boss3.save('Boss3_HollowNecrolord');

// 5. Boss 4: The Celestial Void Drake (Winged Block Dragon)
const boss4 = new ObjBuilder('Boss4_VoidDrake');
boss4.addBox(-8, 8, -20, 8, 20, 20);   // Dragon Body (long)
boss4.addBox(-6, 14, 20, 6, 26, 34);   // Dragon Head & Jaws
boss4.addBox(-40, 16, -5, -8, 20, 15); // Left Wing Blade
boss4.addBox(8, 16, -5, 40, 20, 15);   // Right Wing Blade
boss4.addBox(-4, 10, -40, 4, 16, -20); // Spiked Tail
boss4.save('Boss4_VoidDrake');

// 6. Boss 5: The Primordial Reality Eater (Dimensional Cataclysm Titan)
const boss5 = new ObjBuilder('Boss5_RealityEater');
boss5.addBox(-20, 20, -20, 20, 60, 20); // Reality Core Singularity
boss5.addBox(-32, 10, -32, -20, 70, -20);// Fractured Dimension Pillar 1
boss5.addBox(20, 10, -32, 32, 70, -20); // Fractured Dimension Pillar 2
boss5.addBox(-32, 10, 20, -20, 70, 32); // Fractured Dimension Pillar 3
boss5.addBox(20, 10, 20, 32, 70, 32);   // Fractured Dimension Pillar 4
boss5.save('Boss5_RealityEater');

// 7. World Blocks & Props
const grassBlock = new ObjBuilder('Block_Grass');
grassBlock.addBox(-8, -8, -8, 8, 8, 8);
grassBlock.save('Block_Grass');

const chest = new ObjBuilder('Block_Chest');
chest.addBox(-7, 0, -7, 7, 10, 7);   // Chest Base
chest.addBox(-7, 10, -7, 7, 14, 7);  // Chest Lid
chest.addBox(-2, 8, 7, 2, 11, 8);    // Gold Latch
chest.save('Block_Chest');

const anchor = new ObjBuilder('Block_SanctuaryAnchor');
anchor.addBox(-10, 0, -10, 10, 8, 10); // Pedestal
anchor.addBox(-6, 8, -6, 6, 24, 6);    // Obelisk Core
anchor.addBox(-3, 24, -3, 3, 32, 3);   // Radiant Crystal Apex
anchor.save('Block_SanctuaryAnchor');

const sword = new ObjBuilder('Weapon_Sword');
sword.addBox(-1, 0, -1, 1, 6, 1);    // Hilt
sword.addBox(-4, 6, -1.5, 4, 8, 1.5);// Crossguard
sword.addBox(-2, 8, -0.5, 2, 28, 0.5);// Blade
sword.save('Weapon_Sword');

console.log('[3D Assets] All 3D meshes generated successfully for Unreal Engine and WebGL engine.');
