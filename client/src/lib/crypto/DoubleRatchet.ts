import { CryptoCore } from './CryptoCore';

export interface RatchetState {
  rootKey: Uint8Array;
  sendingChainKey: Uint8Array | null;
  receivingChainKey: Uint8Array | null;
  dhKeyPair: CryptoKeyPair;
  remotePublicKey: CryptoKey | null;
  sendingCount: number;
  receivingCount: number;
  previousSendingCount: number;
  skippedMessageKeys: Map<string, Uint8Array>; // key: "pubkey_index", value: messageKey
}

export class DoubleRatchet {
  private static readonly MAX_SKIP = 1000;

  /**
   * Calculates a Safety Number (Fingerprint) for identity verification
   */
  static async calculateSafetyNumber(ownId: Uint8Array, peerId: Uint8Array): Promise<string> {
    // Sort keys to ensure the fingerprint is the same for both parties
    const keys = [ownId, peerId].sort((a, b) => {
      for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
      }
      return 0;
    });

    const combined = new Uint8Array([...keys[0], ...keys[1]]);
    const hash = await window.crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hash));
    
    // Format into groups of 5 digits for human readability
    const chunks = [];
    for (let i = 0; i < 6; i++) {
      const val = (hashArray[i*2] << 8) | hashArray[i*2 + 1];
      chunks.push(val.toString().padStart(5, '0'));
    }
    return chunks.join(' ');
  }

  /**
   * Initializes a new session (Alice starts)
   */
  static async initializeAlice(
    sharedSecret: ArrayBuffer,
    remotePublicKey: CryptoKey
  ): Promise<RatchetState> {
    const dhKeyPair = await CryptoCore.generateDHKeyPair();
    
    // Root key derivation
    const rootKey = await CryptoCore.hkdf(
      new Uint8Array(32).fill(0), // initial salt
      sharedSecret,
      CryptoCore.encode('ROOT_CHAIN_SALT'),
      32
    );

    const state: RatchetState = {
      rootKey,
      sendingChainKey: null,
      receivingChainKey: null,
      dhKeyPair,
      remotePublicKey,
      sendingCount: 0,
      receivingCount: 0,
      previousSendingCount: 0,
      skippedMessageKeys: new Map(),
    };

    // First DH Ratchet
    await this.dhRatchet(state, remotePublicKey);
    
    return state;
  }

  /**
   * Initializes a new session (Bob responds)
   */
  static async initializeBob(
    sharedSecret: ArrayBuffer,
    ownDHKeyPair: CryptoKeyPair
  ): Promise<RatchetState> {
    const rootKey = await CryptoCore.hkdf(
      new Uint8Array(32).fill(0),
      sharedSecret,
      CryptoCore.encode('ROOT_CHAIN_SALT'),
      32
    );

    return {
      rootKey,
      sendingChainKey: null,
      receivingChainKey: null,
      dhKeyPair: ownDHKeyPair,
      remotePublicKey: null,
      sendingCount: 0,
      receivingCount: 0,
      previousSendingCount: 0,
      skippedMessageKeys: new Map(),
    };
  }

  /**
   * Performs a DH Ratchet step
   */
  private static async dhRatchet(state: RatchetState, remotePublicKey: CryptoKey): Promise<void> {
    state.previousSendingCount = state.sendingCount;
    state.sendingCount = 0;
    state.receivingCount = 0;
    state.remotePublicKey = remotePublicKey;

    // Derive new root key and receiving chain key
    const sharedSecret = await CryptoCore.deriveSharedSecret(state.dhKeyPair.privateKey, remotePublicKey);
    const [newRootKey, receivingChainKey] = await this.kdfRoot(state.rootKey, sharedSecret);
    state.rootKey = newRootKey;
    state.receivingChainKey = receivingChainKey;

    // Generate new ephemeral DH key for sending
    state.dhKeyPair = await CryptoCore.generateDHKeyPair();

    // Derive new root key and sending chain key
    const newSharedSecret = await CryptoCore.deriveSharedSecret(state.dhKeyPair.privateKey, remotePublicKey);
    const [finalRootKey, sendingChainKey] = await this.kdfRoot(state.rootKey, newSharedSecret);
    state.rootKey = finalRootKey;
    state.sendingChainKey = sendingChainKey;
  }

  private static async kdfRoot(rootKey: Uint8Array, sharedSecret: ArrayBuffer): Promise<[Uint8Array, Uint8Array]> {
    const derived = await CryptoCore.hkdf(rootKey, sharedSecret, CryptoCore.encode('KDF_ROOT'), 64);
    return [derived.slice(0, 32), derived.slice(32, 64)];
  }

  private static async kdfChain(chainKey: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
    const messageKey = await CryptoCore.hkdf(chainKey, CryptoCore.encode('\x01'), CryptoCore.encode('KDF_MESSAGE'), 32);
    const nextChainKey = await CryptoCore.hkdf(chainKey, CryptoCore.encode('\x02'), CryptoCore.encode('KDF_CHAIN'), 32);
    return [nextChainKey, messageKey];
  }

  /**
   * Encrypts a message
   */
  static async encrypt(state: RatchetState, plaintext: string, ad?: Uint8Array): Promise<Uint8Array> {
    if (!state.sendingChainKey) throw new Error('Sending chain not initialized');

    const [nextChainKey, messageKey] = await this.kdfChain(state.sendingChainKey);
    state.sendingChainKey = nextChainKey;

    const header = {
      dhPublicKey: await CryptoCore.exportPublicKey(state.dhKeyPair.publicKey),
      pn: state.previousSendingCount,
      n: state.sendingCount,
    };

    const headerBytes = CryptoCore.encode(JSON.stringify(header));
    const finalAd = ad ? new Uint8Array([...ad, ...headerBytes]) : headerBytes;

    const { ciphertext, iv } = await CryptoCore.encrypt(messageKey, CryptoCore.encode(plaintext), finalAd);
    
    state.sendingCount++;

    // Construct packet: IV (12) + HeaderLength (4) + Header + Ciphertext
    const packet = new Uint8Array(12 + 4 + headerBytes.length + ciphertext.length);
    packet.set(iv, 0);
    const headerLenView = new DataView(packet.buffer);
    headerLenView.setUint32(12, headerBytes.length);
    packet.set(headerBytes, 16);
    packet.set(ciphertext, 16 + headerBytes.length);

    return packet;
  }

  /**
   * Decrypts a message
   */
  static async decrypt(state: RatchetState, packet: Uint8Array, ad?: Uint8Array): Promise<string> {
    const iv = packet.slice(0, 12);
    const headerLen = new DataView(packet.buffer).getUint32(12);
    const headerBytes = packet.slice(16, 16 + headerLen);
    const ciphertext = packet.slice(16 + headerLen);

    const header = JSON.parse(CryptoCore.decode(headerBytes));
    const remotePublicKey = await CryptoCore.importPublicKey(header.dhPublicKey);

    // Try to decrypt with skipped keys first
    const skippedKey = state.skippedMessageKeys.get(`${JSON.stringify(header.dhPublicKey)}_${header.n}`);
    if (skippedKey) {
      const finalAd = ad ? new Uint8Array([...ad, ...headerBytes]) : headerBytes;
      const decrypted = await CryptoCore.decrypt(skippedKey, ciphertext, iv, finalAd);
      state.skippedMessageKeys.delete(`${JSON.stringify(header.dhPublicKey)}_${header.n}`);
      return CryptoCore.decode(decrypted);
    }

    // Check if new DH ratchet is needed
    const isNewDH = !state.remotePublicKey || 
      (await CryptoCore.exportPublicKey(state.remotePublicKey)).toString() !== header.dhPublicKey.toString();

    if (isNewDH) {
      await this.skipMessageKeys(state, header.pn);
      await this.dhRatchet(state, remotePublicKey);
    }

    await this.skipMessageKeys(state, header.n);

    if (!state.receivingChainKey) throw new Error('Receiving chain not initialized');

    const [nextChainKey, messageKey] = await this.kdfChain(state.receivingChainKey);
    state.receivingChainKey = nextChainKey;
    state.receivingCount++;

    const finalAd = ad ? new Uint8Array([...ad, ...headerBytes]) : headerBytes;
    const decrypted = await CryptoCore.decrypt(messageKey, ciphertext, iv, finalAd);

    return CryptoCore.decode(decrypted);
  }

  private static async skipMessageKeys(state: RatchetState, until: number): Promise<void> {
    if (state.receivingCount + this.MAX_SKIP < until) {
      throw new Error('Too many messages skipped');
    }

    if (state.receivingChainKey) {
      while (state.receivingCount < until) {
        const [nextChainKey, messageKey] = await this.kdfChain(state.receivingChainKey);
        state.receivingChainKey = nextChainKey;
        const pubKeyStr = state.remotePublicKey ? await CryptoCore.exportPublicKey(state.remotePublicKey) : 'initial';
        state.skippedMessageKeys.set(`${JSON.stringify(pubKeyStr)}_${state.receivingCount}`, messageKey);
        state.receivingCount++;
      }
    }
  }
}
