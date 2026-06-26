const BANNED_SUBURB_WORDS = ['auckland', 'council', 'city'];

/**
 * Validates freestyle (catch-all) suburb input when the suburb is not in the preset list.
 */
export function validateFreestyleSuburb(input) {
  const trimmed = (input || '').trim();

  if (!trimmed) {
    return { valid: false, error: 'Please enter a suburb name.' };
  }

  const lower = trimmed.toLowerCase();

  for (const word of BANNED_SUBURB_WORDS) {
    if (lower.includes(word)) {
      return {
        valid: false,
        error: `Please enter a specific suburb name. Entries containing "${word}" are not accepted.`,
      };
    }
  }

  if (trimmed.length <= 3 && lower !== 'cbd') {
    return {
      valid: false,
      error: 'For short entries, only "CBD" is accepted. Please enter your full suburb name.',
    };
  }

  return { valid: true };
}

export function isSuburbInZoneList(input, zoneData) {
  if (!input || !Array.isArray(zoneData)) return false;
  const lower = input.trim().toLowerCase();
  return zoneData.some(
    (zone) =>
      zone.suburb.toLowerCase() === lower ||
      (zone.altName && zone.altName.toLowerCase() === lower)
  );
}
