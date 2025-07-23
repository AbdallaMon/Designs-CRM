import { createChannelAndAddUsers } from "./telegram/telegram-functions.js";
import dotenv from "dotenv";
dotenv.config();
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

dotenv.config();

const apiId = parseInt(process.env.TELE_API_ID);
const apiHash = process.env.TELE_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION);
const channelId = parseInt(process.env.CHANNEL_ID);
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

export const sendTelegramMessage = async () => {
  await createChannelAndAddUsers({
    channelTitle: "Lead 10 ahmed mohaded",
    channelAbout: "",
    userUsername: "@Abdalla_abdelsabor",
    botUsername: "@AbdallaMon_Bot",
  });
  // const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // const chatId = "-4835398106";
  // await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
  //   chat_id: chatId,
  //   photo:
  //     "https://panel.dreamstudiio.com/uploads/c9557ed7-6c4f-4975-84fc-f7b0e2cd5e0a.jpg",
  //   caption: "صورة ",
  // });
  // // Send text message
  // await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  //   chat_id: chatId,
  //   text: "در رسالة محمد",
  // });
};

export async function getFilePath(fileId) {
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
  );
  const data = await res.json();
  const filePath = data.result.file_path;
  console.log(data.result, "data.result");
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}

export function generateTelegramMessageLink(chatId, messageId) {
  return `https://t.me/c/${chatId}/${messageId}`;
}

export async function getMeagsses() {
  await client.connect();
  const channel = await client.getEntity(channelId);
  // const dialogs = await client.getDialogs();

  const messages = await client.getMessages(channel, { limit: 10 });
  const latest = messages[0];
  return messages;
}
