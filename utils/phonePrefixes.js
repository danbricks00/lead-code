export const PHONE_PREFIX_OPTIONS = [
  { label: 'NZ Mobile (+64 21)', value: '+6421', group: 'NZ Mobile' },
  { label: 'NZ Mobile (+64 22)', value: '+6422', group: 'NZ Mobile' },
  { label: 'NZ Mobile (+64 27)', value: '+6427', group: 'NZ Mobile' },
  { label: 'NZ Mobile (+64 28)', value: '+6428', group: 'NZ Mobile' },
  { label: 'NZ Mobile (+64 29)', value: '+6429', group: 'NZ Mobile' },
  { label: 'Auckland/Northland (+64 9)', value: '+649', group: 'Auckland/Northland Landline' },
  { label: 'Rest of NZ (+64 3)', value: '+643', group: 'Rest of NZ Landlines' },
  { label: 'Rest of NZ (+64 4)', value: '+644', group: 'Rest of NZ Landlines' },
  { label: 'Rest of NZ (+64 7)', value: '+647', group: 'Rest of NZ Landlines' },
  { label: 'AU Mobile (+61 4)', value: '+614', group: 'Australian Mobile' },
  { label: 'AU Mobile (+61 5)', value: '+615', group: 'Australian Mobile' },
];

export const DEFAULT_PHONE_PREFIX = '+6421';

export function combinePhoneNumber(prefix, number) {
  const cleaned = (number || '').replace(/[\s\-().]/g, '');
  if (!prefix || !cleaned) return '';
  return `${prefix}${cleaned}`;
}

export function validatePhoneWithPrefix(prefix, number) {
  if (!prefix || !PHONE_PREFIX_OPTIONS.some((opt) => opt.value === prefix)) {
    return { valid: false, error: 'Please select a valid phone prefix.' };
  }

  const cleaned = (number || '').replace(/[\s\-().]/g, '');
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Phone number must contain digits only.' };
  }

  if (cleaned.length < 6 || cleaned.length > 10) {
    return { valid: false, error: 'Please enter a valid phone number (6–10 digits after the prefix).' };
  }

  return { valid: true, fullNumber: combinePhoneNumber(prefix, cleaned) };
}
