import { beforeEach, describe, expect, it, vi } from "vitest";

const googleMocks = vi.hoisted(() => {
  const clients = [];
  const calendar = vi.fn(({ auth }) => ({ auth }));
  const OAuth2 = vi.fn(function OAuth2() {
    const client = {
      credentials: null,
      generateAuthUrl: vi.fn(() => "https://accounts.google.test/auth"),
      getToken: vi.fn(),
      refreshAccessToken: vi.fn(),
      revokeCredentials: vi.fn(),
      setCredentials: vi.fn((credentials) => {
        client.credentials = credentials;
      }),
    };
    clients.push(client);
    return client;
  });
  return { clients, calendar, OAuth2 };
});

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  meetingReminder: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  clientLead: {
    findUnique: vi.fn(),
  },
}));

const googleRepository = vi.hoisted(() => ({
  findCredentialStorage: vi.fn(),
  replaceEncryptedCredentials: vi.fn(),
  updateCalendarIdentity: vi.fn(),
  findCalendarIdentity: vi.fn(),
  clearCredentials: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: {
    auth: { OAuth2: googleMocks.OAuth2 },
    calendar: googleMocks.calendar,
  },
}));

vi.mock("../../prisma/prisma.js", () => ({
  default: prisma,
}));

vi.mock("../../../modules/calendar/google/google.repo.js", () => ({
  googleCalendarRepository: googleRepository,
}));

import {
  getCalendarClient,
  isGoogleCalendarConnected,
} from "../google-calendar.client.js";
import { IntegrationCredentialEncryptionService } from "../../security/integration-credential-encryption.js";

describe("Google Calendar OAuth client isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    googleMocks.clients.length = 0;
  });

  it("keeps concurrent users on separate OAuth clients and credentials", async () => {
    googleRepository.findCredentialStorage.mockImplementation(async ({ userId }) => ({
      googleEncryptedCredential: null,
      googleRefreshToken: `refresh-${userId}`,
      googleAccessToken: `access-${userId}`,
      googleTokenExpiresAt: new Date(Date.now() + 60_000),
    }));

    const [calendarOne, calendarTwo] = await Promise.all([
      getCalendarClient(1),
      getCalendarClient(2),
    ]);

    expect(googleMocks.OAuth2).toHaveBeenCalledTimes(2);
    expect(calendarOne.auth).not.toBe(calendarTwo.auth);
    expect(calendarOne.auth.credentials).toEqual({
      access_token: "access-1",
      refresh_token: "refresh-1",
    });
    expect(calendarTwo.auth.credentials).toEqual({
      access_token: "access-2",
      refresh_token: "refresh-2",
    });
  });

  it("decrypts encrypted credential storage without changing the OAuth client contract", async () => {
    const masterKey = Buffer.alloc(32, 17).toString("base64");
    process.env.INTEGRATION_CREDENTIALS_MASTER_KEY = masterKey;
    const encryption = new IntegrationCredentialEncryptionService({ masterKey });
    const encrypted = encryption.encrypt({
      refreshToken: "encrypted-refresh",
      accessToken: "encrypted-access",
    });
    googleRepository.findCredentialStorage.mockResolvedValue({
      googleEncryptedCredential: {
        ciphertext: encrypted.ciphertext,
        ...encrypted.metadata,
      },
      googleRefreshToken: null,
      googleAccessToken: null,
      googleTokenExpiresAt: new Date(Date.now() + 60_000),
    });

    const calendar = await getCalendarClient(1);

    expect(calendar.auth.credentials).toEqual({
      access_token: "encrypted-access",
      refresh_token: "encrypted-refresh",
    });
  });

  it("logs only a stable code when a provider error contains a token", async () => {
    googleRepository.findCredentialStorage.mockRejectedValue(
      new Error("provider rejected access_token=secret-token"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(isGoogleCalendarConnected(1)).resolves.toBe(false);

    expect(errorSpy).toHaveBeenCalledWith(
      "GOOGLE_CALENDAR_CONNECTION_CHECK_FAILED",
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("secret-token");
  });
});
