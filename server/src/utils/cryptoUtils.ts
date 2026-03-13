import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token.
 * @param bytes Number of bytes to generate (default 32)
 * @returns Hex string token
 */
export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hashes a token using SHA-256 for secure database storage.
 * @param token The raw token string
 * @returns SHA-256 Hex hash
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
