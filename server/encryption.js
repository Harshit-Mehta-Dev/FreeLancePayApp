const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY = crypto.scryptSync(process.env.JWT_SECRET || 'fallback-secret-for-encryption', 'cyber-salt', 32);

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format iv:tag:content (hex)
 */
const encrypt = (text) => {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (err) {
        console.error('Encryption Failure:', err.message);
        return text; 
    }
};

/**
 * Decrypts data encrypted with the above encrypt function
 * @param {string} cipherText - Encrypted string
 * @returns {string} - Decrypted plain text
 */
const decrypt = (cipherText) => {
    if (!cipherText || !cipherText.includes(':')) return cipherText;
    try {
        const [ivHex, tagHex, content] = cipherText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        return cipherText;
    }
};

module.exports = { encrypt, decrypt };
