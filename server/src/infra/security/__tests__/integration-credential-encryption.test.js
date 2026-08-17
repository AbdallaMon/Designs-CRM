import { describe, expect, it } from "vitest";

import {
  IntegrationCredentialEncryptionService,
  integrationCredentialEncryptionCodes,
} from "../integration-credential-encryption.js";

const MASTER_KEY = Buffer.alloc(32, 7).toString("base64");

function tamperBase64(value) {
  const bytes = Buffer.from(value, "base64");
  bytes[0] ^= 1;
  return bytes.toString("base64");
}

describe("integration credential encryption", () => {
  it("round trips a credential payload", () => {
    const service = new IntegrationCredentialEncryptionService({ masterKey: MASTER_KEY });
    const payload = { refreshToken: "refresh-secret", accessToken: "access-secret" };

    const encrypted = service.encrypt(payload);

    expect(service.decrypt(encrypted)).toEqual(payload);
    expect(encrypted.ciphertext).not.toContain("refresh-secret");
  });

  it("produces different ciphertext and metadata for identical plaintext", () => {
    const service = new IntegrationCredentialEncryptionService({ masterKey: MASTER_KEY });

    const first = service.encrypt({ sessionString: "same-secret" });
    const second = service.encrypt({ sessionString: "same-secret" });

    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.metadata.dataIv).not.toBe(second.metadata.dataIv);
    expect(first.metadata.wrappedDataKey).not.toBe(second.metadata.wrappedDataKey);
  });

  it.each(["ciphertext", "dataAuthTag", "keyAuthTag"])(
    "rejects tampered %s",
    (field) => {
      const service = new IntegrationCredentialEncryptionService({ masterKey: MASTER_KEY });
      const encrypted = service.encrypt({ apiHash: "telegram-secret" });
      const tampered = structuredClone(encrypted);
      if (field === "ciphertext") tampered.ciphertext = tamperBase64(tampered.ciphertext);
      else tampered.metadata[field] = tamperBase64(tampered.metadata[field]);

      expect(() => service.decrypt(tampered)).toThrowError(
        expect.objectContaining({
          code: integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
        }),
      );
    },
  );

  it("fails closed when the master key is missing", () => {
    const service = new IntegrationCredentialEncryptionService({ masterKey: "" });

    expect(() => service.encrypt({ token: "secret" })).toThrowError(
      expect.objectContaining({
        code: integrationCredentialEncryptionCodes.MASTER_KEY_MISSING,
      }),
    );
  });

  it("fails closed for an invalid or wrong master key", () => {
    const service = new IntegrationCredentialEncryptionService({ masterKey: MASTER_KEY });
    const encrypted = service.encrypt({ token: "secret" });
    const invalid = new IntegrationCredentialEncryptionService({ masterKey: "not-a-key" });
    const wrong = new IntegrationCredentialEncryptionService({
      masterKey: Buffer.alloc(32, 8).toString("base64"),
    });

    expect(() => invalid.encrypt({ token: "secret" })).toThrowError(
      expect.objectContaining({
        code: integrationCredentialEncryptionCodes.MASTER_KEY_INVALID,
      }),
    );
    expect(() => wrong.decrypt(encrypted)).toThrowError(
      expect.objectContaining({
        code: integrationCredentialEncryptionCodes.DECRYPTION_FAILED,
      }),
    );
  });
});
