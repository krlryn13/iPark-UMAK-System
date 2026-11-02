const crypto = require('crypto');

// AES-256-GCM Encryption settings
const ALGORITHM = 'aes-256-gcm';
const RAW_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'ipark_umak_super_secret_aes_key_2026';
const SECRET_KEY = crypto.scryptSync(RAW_KEY, 'ipark_salt', 32);

/**
 * Encrypts plaintext using AES-256-GCM
 */
function encryptAES256(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[AES-256 ENCRYPT ERROR]', err.message);
    return text;
  }
}

/**
 * Decrypts AES-256-GCM ciphertext back to plaintext
 */
function decryptAES256(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText; // Return original if not AES format

    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If decryption fails, return original text safely
    return cipherText;
  }
}

module.exports = {
  encryptAES256,
  decryptAES256
};
