// Web Crypto Implementation for Cloudflare Workers
async function getEncryptionKey(secret) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('cyber-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(text, secret) {
  if (!text) return null;
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey(secret);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const content = new Uint8Array(encrypted);
  const tag = content.slice(-16);
  const body = content.slice(0, -16);
  
  const tagHex = Array.from(tag).map(b => b.toString(16).padStart(2, '0')).join('');
  const bodyHex = Array.from(body).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${ivHex}:${tagHex}:${bodyHex}`;
}

export async function decrypt(cipherText, secret) {
  if (!cipherText || !cipherText.includes(':')) return cipherText;
  try {
    const [ivHex, tagHex, bodyHex] = cipherText.split(':');
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const tag = new Uint8Array(tagHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const body = new Uint8Array(bodyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const key = await getEncryptionKey(secret);
    const combined = new Uint8Array([...body, ...tag]);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combined
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    return cipherText;
  }
}
