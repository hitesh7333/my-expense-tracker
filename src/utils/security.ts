/**
 * Security utilities for offline-first PIN protection.
 * Uses a deterministic salted hash so that the 4-digit PIN is never stored as plain text.
 */

const PIN_SALT = 'MyExpenseTracker_Salt_2026_Secure';

export function hashPin(pin: string): string {
  if (!pin) return '';
  const input = `${PIN_SALT}:${pin}:${PIN_SALT}`;
  let hash1 = 5381;
  let hash2 = 52711;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ (char * 31);
  }

  // Convert to hex-like string representation
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `pin_v1_${part1}${part2}`;
}

export function verifyPin(enteredPin: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  return hashPin(enteredPin) === storedHash;
}
