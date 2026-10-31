import crypto from 'crypto';

const DEFAULT_SECRET_SALT = process.env.SAVE_HMAC_SECRET || 'voxel-raiders-salt-987f6e5d4c3b2a10-2026';

/**
 * Serializes and signs world state into a tamper-proof .vrsave data package
 */
export function generateSavePayload(worldState) {
  const payloadData = {
    version: '1.0.0',
    worldSeed: worldState.worldSeed || Math.floor(Math.random() * 100000000),
    calendarDays: Math.floor(worldState.calendarDays || 1),
    timeOfDaySec: Math.floor(worldState.timeOfDaySec || 0),
    bossesDefeated: Array.isArray(worldState.bossesDefeated) ? worldState.bossesDefeated : [],
    bossKeyDropsCount: worldState.bossKeyDropsCount || 0,
    bossPortalsOpened: Array.isArray(worldState.bossPortalsOpened) ? worldState.bossPortalsOpened : [],
    anchorsUnlocked: Array.isArray(worldState.anchorsUnlocked) ? worldState.anchorsUnlocked : [],
    gameMode: worldState.gameMode || 'AGENDA_FFA',
    playersData: worldState.playersData || {},
    worldExpanded3x: Boolean(worldState.worldExpanded3x),
    timestamp: Date.now()
  };

  const serialized = JSON.stringify(payloadData);
  const checksum = crypto.createHash('sha256').update(serialized).digest('hex');
  const signature = crypto.createHmac('sha256', DEFAULT_SECRET_SALT).update(serialized).digest('hex');

  return {
    meta: 'VOXEL_RAIDERS_TAMPER_PROTECTED_SAVE',
    payload: payloadData,
    checksum,
    signature
  };
}

/**
 * Validates and decrypts/unpacks a .vrsave file
 * Rejects modified items, altered days, or forged signatures
 */
export function verifyAndLoadSavePayload(savePackage) {
  if (!savePackage || typeof savePackage !== 'object') {
    throw new Error('INVALID_SAVE_FORMAT: Save package must be an object');
  }

  if (savePackage.meta !== 'VOXEL_RAIDERS_TAMPER_PROTECTED_SAVE') {
    throw new Error('INVALID_SAVE_HEADER: Header signature missing or invalid');
  }

  const { payload, checksum, signature } = savePackage;
  if (!payload || !checksum || !signature) {
    throw new Error('CORRUPT_SAVE_PACKAGE: Missing payload, checksum, or signature');
  }

  const serialized = JSON.stringify(payload);
  const expectedChecksum = crypto.createHash('sha256').update(serialized).digest('hex');
  const expectedSignature = crypto.createHmac('sha256', DEFAULT_SECRET_SALT).update(serialized).digest('hex');

  const checksumMatch = crypto.timingSafeEqual(Buffer.from(checksum), Buffer.from(expectedChecksum));
  const signatureMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!checksumMatch || !signatureMatch) {
    throw new Error('TAMPER_DETECTED: Save file checksum or HMAC cryptographic signature does not match. Modification detected.');
  }

  // Validate internal consistency
  if (typeof payload.calendarDays !== 'number' || payload.calendarDays < 1) {
    throw new Error('INVALID_CALENDAR_DAYS: Day count must be a positive integer');
  }

  return payload;
}
