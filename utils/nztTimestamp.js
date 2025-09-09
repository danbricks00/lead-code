/**
 * NZT Timestamp Utility
 * Provides Pacific/Auckland timezone timestamps in human-readable format
 */

/**
 * Get current timestamp in Pacific/Auckland timezone
 * @returns {string} Timestamp in format "yyyy-MM-dd HH:mm:ss"
 */
export function getNZTTimestamp() {
  const now = new Date();
  const nztTime = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);
  
  const year = nztTime.find(part => part.type === 'year').value;
  const month = nztTime.find(part => part.type === 'month').value;
  const day = nztTime.find(part => part.type === 'day').value;
  const hour = nztTime.find(part => part.type === 'hour').value;
  const minute = nztTime.find(part => part.type === 'minute').value;
  const second = nztTime.find(part => part.type === 'second').value;
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Get current timestamp in Pacific/Auckland timezone with timezone info
 * @returns {string} Timestamp in format "yyyy-MM-dd HH:mm:ss NZT"
 */
export function getNZTTimestampWithTZ() {
  return `${getNZTTimestamp()} NZT`;
}
