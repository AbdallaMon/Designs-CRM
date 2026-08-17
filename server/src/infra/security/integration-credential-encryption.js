import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "AES-256-GCM";
const NODE_ALGORITHM = "aes-256-gcm";
const KEY_VERSION = 1;
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const PAYLOAD_AAD = Buffer.from("dream-studio:integration-credentials:payload:v1");
const KEY_AAD = Buffer.from("dream-studio:integration-credentials:data-key:v1");

export const integrationCredentialEncryptionCodes = Object.freeze({
  MASTER_KEY_MISSING: "INTEGRATION_CREDENTIALS_MASTER_KEY_MISSING",
  MASTER_KEY_INVALID: "INTEGRATION_CREDENTIALS_MASTER_KEY_INVALID",
  ENCRYPTION_FAILED: "INTEGRATION_CREDENTIALS_ENCRYPTION_FAILED",
  DECRYPTION_FAILED: "INTEGRATION_CREDENTIALS_DECRYPTION_FAILED",
});

export class IntegrationCredentialEncryptionError extends Error {
  constructor(code) {
    super(code);
    this.name = "IntegrationCredentialEncryptionError";
    this.code = code;
  }
}

function decodeCanonicalBase64(value, expectedBytes, failureCode) {
  if (typeof value !== "string" || value.length === 0) {
    throw new IntegrationCredentialEncryptionError(failureCode);
  }

  const normalized = value.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new IntegrationCredentialEncryptionError(failureCode);
  }

  const decoded = Buffer.from(normalized, "base64");
  const canonicalInput = normalized.replace(/=+$/, "");
  const canonicalDecoded = decoded.toString("base64").replace(/=+$/, "");
  if (decoded.length !== expectedBytes || canonicalInput !== canonicalDecoded) {
    throw new IntegrationCredentialEncryptionError(failureCode);
  }
  return decoded;
}

function decodeCiphertext(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new IntegrationCredentialEncryptionError(
      integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
    );
  }
  const normalized = value.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new IntegrationCredentialEncryptionError(
      integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
    );
  }
  const decoded = Buffer.from(normalized, "base64");
  if (
    decoded.length === 0 ||
    normalized.replace(/=+$/, "") !==
      decoded.toString("base64").replace(/=+$/, "")
  ) {
    throw new IntegrationCredentialEncryptionError(
      integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
    );
  }
  return decoded;
}

function encode(value) {
  return value.toString("base64");
}

function encryptBuffer({ plaintext, key, iv, aad }) {
  const cipher = createCipheriv(NODE_ALGORITHM, key, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, authTag: cipher.getAuthTag() };
}

function decryptBuffer({ ciphertext, key, iv, authTag, aad }) {
  const decipher = createDecipheriv(NODE_ALGORITHM, key, iv);
  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export class IntegrationCredentialEncryptionService {
  constructor({ masterKey, randomBytesFn = randomBytes } = {}) {
    this.masterKey = masterKey;
    this.randomBytes = randomBytesFn;
  }

  resolveMasterKey() {
    const value = this.masterKey ?? process.env.INTEGRATION_CREDENTIALS_MASTER_KEY;
    if (!value) {
      throw new IntegrationCredentialEncryptionError(
        integrationCredentialEncryptionCodes.MASTER_KEY_MISSING,
      );
    }
    return decodeCanonicalBase64(
      value,
      KEY_BYTES,
      integrationCredentialEncryptionCodes.MASTER_KEY_INVALID,
    );
  }

  encrypt(credentials) {
    try {
      const masterKey = this.resolveMasterKey();
      const dataKey = this.randomBytes(KEY_BYTES);
      const dataIv = this.randomBytes(IV_BYTES);
      const keyIv = this.randomBytes(IV_BYTES);
      const plaintext = Buffer.from(JSON.stringify(credentials), "utf8");

      const encryptedPayload = encryptBuffer({
        plaintext,
        key: dataKey,
        iv: dataIv,
        aad: PAYLOAD_AAD,
      });
      const encryptedDataKey = encryptBuffer({
        plaintext: dataKey,
        key: masterKey,
        iv: keyIv,
        aad: KEY_AAD,
      });

      return {
        ciphertext: encode(encryptedPayload.ciphertext),
        metadata: {
          algorithm: ALGORITHM,
          keyVersion: KEY_VERSION,
          dataIv: encode(dataIv),
          dataAuthTag: encode(encryptedPayload.authTag),
          wrappedDataKey: encode(encryptedDataKey.ciphertext),
          keyIv: encode(keyIv),
          keyAuthTag: encode(encryptedDataKey.authTag),
        },
      };
    } catch (error) {
      if (error instanceof IntegrationCredentialEncryptionError) throw error;
      throw new IntegrationCredentialEncryptionError(
        integrationCredentialEncryptionCodes.ENCRYPTION_FAILED,
      );
    }
  }

  decrypt({ ciphertext, metadata }) {
    try {
      const masterKey = this.resolveMasterKey();
      if (
        metadata?.algorithm !== ALGORITHM ||
        metadata?.keyVersion !== KEY_VERSION
      ) {
        throw new IntegrationCredentialEncryptionError(
          integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
        );
      }

      const dataKey = decryptBuffer({
        ciphertext: decodeCanonicalBase64(
          metadata.wrappedDataKey,
          KEY_BYTES,
          integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
        ),
        key: masterKey,
        iv: decodeCanonicalBase64(
          metadata.keyIv,
          IV_BYTES,
          integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
        ),
        authTag: decodeCanonicalBase64(
          metadata.keyAuthTag,
          AUTH_TAG_BYTES,
          integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
        ),
        aad: KEY_AAD,
      });

      const plaintext = decryptBuffer({
        ciphertext: decodeCiphertext(ciphertext),
        key: dataKey,
        iv: decodeCanonicalBase64(
          metadata.dataIv,
          IV_BYTES,
          integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
        ),
        authTag: decodeCanonicalBase64(
          metadata.dataAuthTag,
          AUTH_TAG_BYTES,
          integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
        ),
        aad: PAYLOAD_AAD,
      });

      const parsed = JSON.parse(plaintext.toString("utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("invalid credential payload");
      }
      return parsed;
    } catch (error) {
      if (
        error instanceof IntegrationCredentialEncryptionError &&
        error.code !== integrationCredentialEncryptionCodes.DECRYPTION_FAILED
      ) {
        throw error;
      }
      throw new IntegrationCredentialEncryptionError(
        integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
      );
    }
  }
}

export const integrationCredentialEncryption =
  new IntegrationCredentialEncryptionService();
