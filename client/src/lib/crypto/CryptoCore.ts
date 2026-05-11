/**
 * Enterprise-Grade CryptoCore
 * Wrapper for Web Crypto API with high-level primitives for E2EE.
 */

export class CryptoCore {
  private static readonly ALGORITHM_AES = 'AES-GCM';
  private static readonly ALGORITHM_KDF = 'HKDF';
  private static readonly ALGORITHM_SIGN = 'ECDSA';
  private static readonly HASH_SHA256 = 'SHA-256';

  /**
   * Generates a Signing key pair (P-256 ECDSA)
   */
  static async generateSigningKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );
  }

  /**
   * Generates a DH key pair (P-256)
   */
  static async generateDHKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  }

  /**
   * Exports a public key to raw format (Uint8Array)
   */
  static async exportPublicKey(key: CryptoKey): Promise<Uint8Array> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return new Uint8Array(exported);
  }

  /**
   * Imports a public key from raw format
   */
  static async importPublicKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  }

  /**
   * Derives a shared secret using ECDH
   */
  static async deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<ArrayBuffer> {
    return await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: publicKey,
      },
      privateKey,
      256
    );
  }

  /**
   * HKDF Extract-and-Expand
   */
  static async hkdf(
    salt: Uint8Array | ArrayBuffer,
    ikm: Uint8Array | ArrayBuffer,
    info: Uint8Array | ArrayBuffer,
    length: number = 32
  ): Promise<Uint8Array> {
    const key = await window.crypto.subtle.importKey(
      'raw',
      ikm,
      'HKDF',
      false,
      ['deriveBits']
    );

    const derived = await window.crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: this.HASH_SHA256,
        salt,
        info,
      },
      key,
      length * 8
    );

    return new Uint8Array(derived);
  }

  /**
   * AES-256-GCM Encryption
   */
  static async encrypt(
    key: Uint8Array,
    data: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key,
      this.ALGORITHM_AES,
      false,
      ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM_AES,
        iv,
        additionalData: associatedData,
      },
      cryptoKey,
      data
    );

    return {
      ciphertext: new Uint8Array(encrypted),
      iv,
    };
  }

  /**
   * AES-256-GCM Decryption
   */
  static async decrypt(
    key: Uint8Array,
    ciphertext: Uint8Array,
    iv: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<Uint8Array> {
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key,
      this.ALGORITHM_AES,
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM_AES,
        iv,
        additionalData: associatedData,
      },
      cryptoKey,
      ciphertext
    );

    return new Uint8Array(decrypted);
  }

  /**
   * Signs data using ECDSA
   */
  static async sign(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
    const signature = await window.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      privateKey,
      data
    );
    return new Uint8Array(signature);
  }

  /**
   * Verifies data using ECDSA
   */
  static async verify(publicKey: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<boolean> {
    return await window.crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      signature,
      data
    );
  }

  /**
   * Exports a key to SPKI format (for public keys)
   */
  static async exportKeySPKI(key: CryptoKey): Promise<Uint8Array> {
    const exported = await window.crypto.subtle.exportKey('spki', key);
    return new Uint8Array(exported);
  }

  /**
   * Imports a key from SPKI format
   */
  static async importSigningPublicKey(spkiKey: Uint8Array): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
      'spki',
      spkiKey,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['verify']
    );
  }


  /**
   * Utility to convert string to Uint8Array
   */
  static encode(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * Utility to convert Uint8Array to string
   */
  static decode(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  /**
   * Generates random bytes
   */
  static randomBytes(length: number): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
}
