const EXACT_REJECTED_SUBURBS = ['auckland', 'city', 'council'];

const BANNED_SUBURB_PHRASES = ['auckland council', 'auckland city'];

/**
 * Suburb names that also exist outside Auckland — chatbot confirms "Auckland" on selection.
 */
export const AMBIGUOUS_SUBURB_NAMES = new Set([
  'avondale',
  'belmont',
  'brookfield',
  'clinton',
  'fairfield',
  'gladstone',
  'highbury',
  'highland park',
  'hillcrest',
  'morningside',
  'northcote',
  'omaha',
  'portland',
  'richmond',
  'rosebank',
  'silverdale',
  'waihi',
  'windsor',
]);

/**
 * Validates freestyle (catch-all) suburb input on final submission only.
 * Do not call while the user is actively typing — short prefixes must remain allowed for autocomplete.
 */
export function validateFreestyleSuburb(input) {
  const trimmed = (input || '').trim();

  if (!trimmed) {
    return { valid: false, error: 'Please enter a suburb name.' };
  }

  const lower = trimmed.toLowerCase();

  if (EXACT_REJECTED_SUBURBS.includes(lower)) {
    return {
      valid: false,
      error: 'Please enter a specific suburb name, not a city or region.',
    };
  }

  for (const phrase of BANNED_SUBURB_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        valid: false,
        error: `Please enter a specific suburb name. Entries like "${phrase}" are not accepted.`,
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

export function findZoneBySuburbInput(input, zoneData) {
  if (!input || !Array.isArray(zoneData)) return null;
  const lower = input.trim().toLowerCase();
  return (
    zoneData.find(
      (zone) =>
        zone.suburb.toLowerCase() === lower ||
        (zone.altName && zone.altName.toLowerCase() === lower)
    ) || null
  );
}

/**
 * Chatbot confirmation for suburbs that share names with other regions.
 * Returns null when no special confirmation is needed.
 */
export function getSuburbConfirmationMessage(suburb) {
  const trimmed = (suburb || '').trim();
  if (!trimmed) return null;

  if (AMBIGUOUS_SUBURB_NAMES.has(trimmed.toLowerCase())) {
    return `Great, ${trimmed}, Auckland!`;
  }

  return null;
}
