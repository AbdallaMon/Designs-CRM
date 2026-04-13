import { TelegramClient, Api } from "telegram";

import { AppError } from "../../../shared/errors/AppError.js";
import { env } from "../../../config/env.js";
import { StringSession } from "telegram/sessions/StringSession.js";

class TelegramManager {
  constructor() {
    const apiId = env.TELE_API_ID;
    const apiHash = env.TELE_API_HASH;
    this.client = null;
    this.config = {
      apiId,
      apiHash,
      sessionString: null,
    };
    this.connectingPromise = null;
  }

  setConfig({ sessionString }) {
    this.config = { ...this.config, sessionString };
    this.client = new TelegramClient(
      new StringSession(sessionString || ""),
      this.config.apiId,
      this.config.apiHash,
      { connectionRetries: 5 },
    );
  }
  async connect() {
    if (!this.client) {
      throw new AppError("Telegram config is not set", 500);
    }
    if (this.client.connected) return this.client;
    if (!this.connectingPromise) {
      this.connectingPromise = this.client.connect().finally(() => {
        this.connectingPromise = null;
      });
    }
    await this.connectingPromise;
    return this.client;
  }
  async checkHealth() {
    if (!this.client) {
      throw new AppError("Telegram config is not set", 500);
    }

    try {
      await this.connect();

      const authorized = await this.client.checkAuthorization();
      if (!authorized) {
        return {
          ok: false,
          connected: this.client.connected,
          authorized: false,
          user: null,
        };
      }

      const me = await this.client.getMe();

      return {
        ok: true,
        connected: this.client.connected,
        authorized: true,
        // user: {
        //   id: me?.id?.toString?.() || null,
        //   username: me?.username || null,
        //   phone: me?.phone || null,
        //   firstName: me?.firstName || null,
        //   lastName: me?.lastName || null,
        // },
      };
    } catch (error) {
      return {
        ok: false,
        connected: this.client?.connected ?? false,
        authorized: false,
        user: null,
        error: error.message,
      };
    }
  }
  getClient() {
    if (!this.client) throw new Error("Telegram client not initialized");
    return this.client;
  }

  getSessionString() {
    if (!this.client) {
      throw new AppError("Telegram client not initialized", 500);
    }
    const sessionString = this.client.session.save();
    return sessionString;
  }

  async sendCode(phoneNumber) {
    const result = await this.client.sendCode(
      {
        apiId: this.config.apiId,
        apiHash: this.config.apiHash,
      },
      phoneNumber,
    );
    return {
      phoneNumber,
      phoneCodeHash: result.phoneCodeHash,
      isCodeViaApp: result.isCodeViaApp,
    };
  }
  async verifyCode({ phoneNumber, phoneCodeHash, phoneCode }) {
    const result = await this.client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      }),
    );
    return { ...result, phoneNumber, phoneCodeHash, phoneCode };
  }

  async verifyPassword(password) {
    const user = await this.client.signInWithPassword(
      {
        apiId: this.config.apiId,
        apiHash: this.config.apiHash,
      },
      {
        password: async () => password,
        onError: async (err) => {
          throw err;
        },
      },
    );
    return user;
  }
}
let telegramManager = null;

export function getTelegramManager() {
  if (!telegramManager) {
    telegramManager = new TelegramManager();
  }
  return telegramManager;
}
