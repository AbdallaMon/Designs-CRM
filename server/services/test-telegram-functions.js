import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import dotenv from "dotenv";
import { teleClient } from "./connectToTelegram";
dotenv.config();
const apiId = process.env.TELE_API_ID;
const apiHash = process.env.TELE_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION;


export async function createChannelAndAddUsers({
  channelTitle,
  channelAbout,
  userUsername,
  botUsername,
}) {
  await connect();

  // Step 1: Create a private channel
  const { chats } = await teleClient.invoke(
    new Api.channels.CreateChannel({
      title: channelTitle,
      about: channelAbout,
      megagroup: false,
    })
  );
  const channel = chats[0];
  console.log(`✅ Channel created: ${channel.title}`);

  // Step 2: Get user entity
  const userEntity = await teleClient.getEntity(userUsername);
  const botEntity = await teleClient.getEntity(botUsername);

  // Step 3: Invite both to channel
  await client.invoke(
    new Api.channels.InviteToChannel({
      channel,
      users: [userEntity, botEntity],
    })
  );
  const exportedInvite = await teleClient.invoke(
  new Api.messages.ExportChatInvite({
    peer: channel,
  })
);

const inviteLink = exportedInvite.link;
  console.log("👥 Added user and bot to channel");

  // Step 4: Promote user as admin
  //   await client.invoke(
  //     new Api.channels.EditAdmin({
  //       channel,
  //       userId: userEntity,
  //       adminRights: new Api.ChatAdminRights({
  //         changeInfo: true,
  //         postMessages: true,
  //         editMessages: true,
  //         deleteMessages: true,
  //         banUsers: true,
  //         inviteUsers: true,
  //         pinMessages: true,
  //         addAdmins: false,
  //         manageCall: false,
  //       }),
  //       rank: "Admin",
  //     })
  //   );

  // Step 5: Promote bot (limited rights)
  await client.invoke(
    new Api.channels.EditAdmin({
      channel,
      userId: botEntity,
      adminRights: new Api.ChatAdminRights({
        changeInfo: false,
        postMessages: true,
        editMessages: false,
        deleteMessages: false,
        banUsers: false,
        inviteUsers: false,
        pinMessages: true,
        addAdmins: false,
        manageCall: false,
      }),
      rank: "Bot",
    })
  );

  console.log("✅ Admin privileges assigned.");
  return channel;
}
