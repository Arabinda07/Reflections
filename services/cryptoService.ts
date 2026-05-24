export interface EncryptionAad {
  table: string;
  rowId: string;
  userId: string;
}

export interface EncryptedEnvelope {
  v: 1;
  alg: 'AES-GCM-256';
  kid: string;
  iv: string;
  ciphertext: string;
}

export interface KeyWrapper {
  alg: 'PBKDF2-SHA256+A256GCM';
  salt: string;
  iterations: number;
  iv: string;
  ciphertext: string;
}

export interface UserEncryptionKeyBundle {
  userId: string;
  keyId: string;
  passphraseWrapper: KeyWrapper;
  recoveryWrapper: KeyWrapper;
  recoveryKey: string;
}

export interface PersistedUserEncryptionKeyBundle {
  userId: string;
  keyId: string;
  passphraseWrapper: KeyWrapper;
  recoveryWrapper: KeyWrapper;
}

export interface CryptoSession {
  userId: string;
  keyId: string;
  dataKey: CryptoKey;
}

const ENVELOPE_VERSION = 1;
const ENVELOPE_ALG = 'AES-GCM-256';
const WRAPPER_ALG = 'PBKDF2-SHA256+A256GCM';
const AES_KEY_LENGTH = 256;
const IV_BYTE_LENGTH = 12;
const SALT_BYTE_LENGTH = 16;
const RECOVERY_KEY_BYTE_LENGTH = 32;
const DEFAULT_PBKDF2_ITERATIONS = 210_000;
const CALIBRATION_SAMPLE_ITERATIONS = 25_000;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getCrypto = (): Crypto => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is not available in this runtime.');
  }
  return globalThis.crypto;
};

const randomBytes = (byteLength: number) => {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytes;
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const toBase64Url = (bytes: Uint8Array) =>
  toBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

const aadBytes = (aad: EncryptionAad, version: number) =>
  textEncoder.encode(`${version}:${aad.table}:${aad.rowId}:${aad.userId}`);

const importRawAesKey = (rawKey: Uint8Array) =>
  getCrypto().subtle.importKey('raw', rawKey, { name: 'AES-GCM', length: AES_KEY_LENGTH }, true, [
    'encrypt',
    'decrypt',
  ]);

const deriveWrappingKey = async (secret: string, salt: Uint8Array, iterations: number) => {
  const baseKey = await getCrypto().subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return getCrypto().subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
};

const wrapDataKey = async (rawDataKey: Uint8Array, secret: string, iterations: number): Promise<KeyWrapper> => {
  const salt = randomBytes(SALT_BYTE_LENGTH);
  const iv = randomBytes(IV_BYTE_LENGTH);
  const wrappingKey = await deriveWrappingKey(secret, salt, iterations);
  const ciphertext = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    rawDataKey,
  );

  return {
    alg: WRAPPER_ALG,
    salt: toBase64(salt),
    iterations,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
};

const unwrapDataKey = async (wrapper: KeyWrapper, secret: string) => {
  if (wrapper.alg !== WRAPPER_ALG) {
    throw new Error(`Unsupported key wrapper: ${wrapper.alg}`);
  }

  try {
    const wrappingKey = await deriveWrappingKey(secret, fromBase64(wrapper.salt), wrapper.iterations);
    const rawDataKey = await getCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(wrapper.iv) },
      wrappingKey,
      fromBase64(wrapper.ciphertext),
    );
    return importRawAesKey(new Uint8Array(rawDataKey));
  } catch {
    throw new Error('Unable to unlock encryption key.');
  }
};

const encryptBytesWithKey = async (
  session: CryptoSession,
  aad: EncryptionAad,
  plaintext: Uint8Array,
): Promise<EncryptedEnvelope> => {
  const iv = randomBytes(IV_BYTE_LENGTH);
  const ciphertext = await getCrypto().subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: aadBytes(aad, ENVELOPE_VERSION),
    },
    session.dataKey,
    plaintext,
  );

  return {
    v: ENVELOPE_VERSION,
    alg: ENVELOPE_ALG,
    kid: session.keyId,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
};

const decryptBytesWithKey = async (
  session: CryptoSession,
  aad: EncryptionAad,
  envelope: EncryptedEnvelope,
) => {
  if (envelope.v !== ENVELOPE_VERSION || envelope.alg !== ENVELOPE_ALG) {
    throw new Error('Unsupported encrypted payload envelope.');
  }

  try {
    const plaintext = await getCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromBase64(envelope.iv),
        additionalData: aadBytes(aad, envelope.v),
      },
      session.dataKey,
      fromBase64(envelope.ciphertext),
    );
    return new Uint8Array(plaintext);
  } catch {
    throw new Error('Unable to decrypt encrypted payload.');
  }
};

export const isEncryptedEnvelope = (value: unknown): value is EncryptedEnvelope => {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<EncryptedEnvelope>;
  return (
    envelope.v === ENVELOPE_VERSION &&
    envelope.alg === ENVELOPE_ALG &&
    typeof envelope.kid === 'string' &&
    typeof envelope.iv === 'string' &&
    typeof envelope.ciphertext === 'string'
  );
};

export const cryptoService = {
  async calibratePbkdf2Iterations(targetMs = 500): Promise<number> {
    const start = performance.now();
    await deriveWrappingKey('calibration', randomBytes(SALT_BYTE_LENGTH), CALIBRATION_SAMPLE_ITERATIONS);
    const elapsedMs = Math.max(performance.now() - start, 1);
    const estimatedIterations = Math.round((CALIBRATION_SAMPLE_ITERATIONS * targetMs) / elapsedMs);
    return Math.max(DEFAULT_PBKDF2_ITERATIONS, estimatedIterations);
  },

  async createKeyBundle(input: {
    userId: string;
    passphrase: string;
    iterations?: number;
  }): Promise<UserEncryptionKeyBundle> {
    const keyId = crypto.randomUUID();
    const rawDataKey = randomBytes(32);
    const recoveryKey = toBase64Url(randomBytes(RECOVERY_KEY_BYTE_LENGTH));
    const iterations = input.iterations ?? DEFAULT_PBKDF2_ITERATIONS;

    return {
      userId: input.userId,
      keyId,
      passphraseWrapper: await wrapDataKey(rawDataKey, input.passphrase, iterations),
      recoveryWrapper: await wrapDataKey(rawDataKey, recoveryKey, iterations),
      recoveryKey,
    };
  },

  async unlockWithPassphrase(input: {
    userId: string;
    passphrase: string;
    bundle: PersistedUserEncryptionKeyBundle;
  }): Promise<CryptoSession> {
    return {
      userId: input.userId,
      keyId: input.bundle.keyId,
      dataKey: await unwrapDataKey(input.bundle.passphraseWrapper, input.passphrase),
    };
  },

  async unlockWithRecoveryKey(input: {
    userId: string;
    recoveryKey: string;
    bundle: PersistedUserEncryptionKeyBundle;
  }): Promise<CryptoSession> {
    return {
      userId: input.userId,
      keyId: input.bundle.keyId,
      dataKey: await unwrapDataKey(input.bundle.recoveryWrapper, input.recoveryKey),
    };
  },

  encryptJson: async <T>(session: CryptoSession, aad: EncryptionAad, payload: T) =>
    encryptBytesWithKey(session, aad, textEncoder.encode(JSON.stringify(payload))),

  async decryptJson<T>(session: CryptoSession, aad: EncryptionAad, envelope: EncryptedEnvelope): Promise<T> {
    const plaintext = await decryptBytesWithKey(session, aad, envelope);
    return JSON.parse(textDecoder.decode(plaintext)) as T;
  },

  encryptBytes: encryptBytesWithKey,
  decryptBytes: decryptBytesWithKey,
};
