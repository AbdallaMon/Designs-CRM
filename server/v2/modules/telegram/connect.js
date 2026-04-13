import { env } from "../../config/env.js";
import {
  CONTENT_TYPES,
  NOTIFICATION_TYPES,
} from "../../shared/notifications/notification.constants.js";
import { sendToAdmins } from "../../shared/notifications/notification.service.js";
import { TelegramAuthEmails } from "./auth/telegram.emails.js";
import { telegramAuthRepo } from "./auth/telegram.repository.js";
import { TelegramAuthusecase } from "./auth/telegram.usecase.js";
import { getTelegramManager } from "./manager/telegram.manager.js";
async function initTelegram() {
  return await TelegramAuthusecase.updateTelegramAuthConnection({
    apiId: env.TELE_API_ID,
    apiHash: env.TELE_API_HASH,
    status: "DISCONNECTED",
    updatedByUserId: null,
  });
}
export async function coonnectToTelegramV2() {
  try {
    const telegramManager = getTelegramManager();
    telegramManager.setConfig({
      sessionString: "",
    });
    await telegramManager.connect();

    let telegramAuth = await TelegramAuthusecase.getActiveAuth(false);
    if (!telegramAuth) {
      await initTelegram();
      telegramAuth = await TelegramAuthusecase.getActiveAuth(false);
    }
    if (telegramAuth.sessionString) {
      telegramManager.setConfig({
        sessionString: telegramAuth.sessionString,
      });
      await telegramManager.connect();
    }
    const health = await telegramManager.checkHealth();
    console.log("Telegram health check result:", health);

    if (!health.authorized && !telegramAuth.notifiedOfDisconnection) {
      const reauthEmail = TelegramAuthEmails.reAuthAlert();
      await sendToAdmins({
        content: reauthEmail.html,
        type: NOTIFICATION_TYPES.TELEGRAM_REAUTH_NEEDED,
        isEmailOnly: true,
        options: {
          contentType: CONTENT_TYPES.HTML,
          emailSubject: reauthEmail.subject,
        },
      });
      await telegramAuthRepo.markNotifiedOfDisconnection();
    }

    return {
      ok: true,
      ...health,
    };
  } catch (e) {
    console.log("Telegram error. Skipping Telegram connection.", e.message);
  }
}
