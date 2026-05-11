import { DoubleRatchet, RatchetState } from './DoubleRatchet';
import { CryptoCore } from './CryptoCore';

/**
 * Enterprise Secure Vault
 * Manages identity keys, session states, and E2EE messaging.
 */
export class SecureVault {
  private dbName = 'SecureVaultDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private identityKeyPair: CryptoKeyPair | null = null;
  private signingKeyPair: CryptoKeyPair | null = null;

  constructor() {}

  /**
   * Initializes the vault and identity keys
   */
  async init(): Promise<void> {
    this.db = await this.openDB();
    await this.loadIdentity();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions');
        }
        if (!db.objectStoreNames.contains('prekeys')) {
          db.createObjectStore('prekeys');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async loadIdentity(): Promise<void> {
    const stored = await this.get('identity', 'keypair');
    const storedSigning = await this.get('identity', 'signing_keypair');

    if (stored) {
      this.identityKeyPair = stored;
    } else {
      this.identityKeyPair = await CryptoCore.generateDHKeyPair();
      await this.put('identity', 'keypair', this.identityKeyPair);
    }

    if (storedSigning) {
      this.signingKeyPair = storedSigning;
    } else {
      this.signingKeyPair = await CryptoCore.generateSigningKeyPair();
      await this.put('identity', 'signing_keypair', this.signingKeyPair);
    }
  }

  /**
   * Generates a set of Pre-keys for X3DH handshake
   */
  async generatePreKeys(count: number = 100): Promise<Uint8Array[]> {
    const prekeys: Uint8Array[] = [];
    for (let i = 0; i < count; i++) {
      const keyPair = await CryptoCore.generateDHKeyPair();
      const pub = await CryptoCore.exportPublicKey(keyPair.publicKey);
      await this.put('prekeys', `prekey_${i}`, keyPair);
      prekeys.push(pub);
    }
    return prekeys;
  }

  /**
   * Starts a new secure session with a peer
   */
  async establishSession(peerId: string, peerIdentityPubKey: Uint8Array, peerPreKey: Uint8Array): Promise<void> {
    const peerIdentityKey = await CryptoCore.importPublicKey(peerIdentityPubKey);
    const peerEphemeralKey = await CryptoCore.importPublicKey(peerPreKey);

    // Initial Shared Secret derivation (simplified X3DH)
    const ss1 = await CryptoCore.deriveSharedSecret(this.identityKeyPair!.privateKey, peerEphemeralKey);
    const ss2 = await CryptoCore.deriveSharedSecret(this.identityKeyPair!.privateKey, peerIdentityKey);
    
    const sharedSecret = await CryptoCore.hkdf(
      new Uint8Array(32).fill(0),
      new Uint8Array([...new Uint8Array(ss1), ...new Uint8Array(ss2)]),
      CryptoCore.encode('X3DH_INITIAL_SECRET'),
      32
    );

    const state = await DoubleRatchet.initializeAlice(sharedSecret, peerIdentityKey);
    await this.saveSession(peerId, state);
  }

  /**
   * Processes an incoming session request
   */
  async acceptSession(peerId: string, peerIdentityPubKey: Uint8Array, ownPreKeyId: string): Promise<void> {
    const peerIdentityKey = await CryptoCore.importPublicKey(peerIdentityPubKey);
    const ownPreKeyPair = await this.get('prekeys', ownPreKeyId);

    const ss1 = await CryptoCore.deriveSharedSecret(ownPreKeyPair.privateKey, peerIdentityKey);
    const ss2 = await CryptoCore.deriveSharedSecret(this.identityKeyPair!.privateKey, peerIdentityKey);

    const sharedSecret = await CryptoCore.hkdf(
      new Uint8Array(32).fill(0),
      new Uint8Array([...new Uint8Array(ss1), ...new Uint8Array(ss2)]),
      CryptoCore.encode('X3DH_INITIAL_SECRET'),
      32
    );

    const state = await DoubleRatchet.initializeBob(sharedSecret, ownPreKeyPair);
    await this.saveSession(peerId, state);
  }

  /**
   * Encrypts a message for a peer
   */
  async encryptMessage(peerId: string, plaintext: string): Promise<Uint8Array> {
    const state = await this.getSession(peerId);
    if (!state) throw new Error('No session found for peer: ' + peerId);

    const packet = await DoubleRatchet.encrypt(state, plaintext);
    await this.saveSession(peerId, state);
    return packet;
  }

  /**
   * Decrypts a message from a peer
   */
  async decryptMessage(peerId: string, packet: Uint8Array): Promise<string> {
    const state = await this.getSession(peerId);
    if (!state) throw new Error('No session found for peer: ' + peerId);

    const plaintext = await DoubleRatchet.decrypt(state, packet);
    await this.saveSession(peerId, state);
    return plaintext;
  }

  /**
   * Generates a Safety Number for verification with a peer
   */
  async getSafetyNumber(peerId: string): Promise<string> {
    const session = await this.getSession(peerId);
    if (!session) throw new Error('No session found');

    const ownId = await CryptoCore.exportPublicKey(this.identityKeyPair!.publicKey);
    const peerIdBytes = await CryptoCore.exportPublicKey(session.remotePublicKey!);

    return await DoubleRatchet.calculateSafetyNumber(ownId, peerIdBytes);
  }

  /**
   * Marks a peer as verified
   */
  async verifyPeer(peerId: string): Promise<void> {
    await this.put('identity', `verified_${peerId}`, true);
  }

  /**
   * Checks if a peer is verified
   */
  async isPeerVerified(peerId: string): Promise<boolean> {
    return (await this.get('identity', `verified_${peerId}`)) === true;
  }

  // --- IndexedDB Helpers ---

  private async saveSession(peerId: string, state: RatchetState): Promise<void> {
    // Convert Map to plain object for IndexedDB serialization
    const stateToSave = {
      ...state,
      skippedMessageKeys: Object.fromEntries(state.skippedMessageKeys)
    };
    await this.put('sessions', peerId, stateToSave);
  }

  private async getSession(peerId: string): Promise<RatchetState | null> {
    const state = await this.get('sessions', peerId);
    if (!state) return null;
    // Convert plain object back to Map
    return {
      ...state,
      skippedMessageKeys: new Map(Object.entries(state.skippedMessageKeys))
    };
  }


  private put(storeName: string, key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not open');
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private get(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not open');
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getIdentityPublicKey(): Promise<Uint8Array> {
    if (!this.identityKeyPair) throw new Error('Identity not loaded');
    return await CryptoCore.exportPublicKey(this.identityKeyPair.publicKey);
  }
}
