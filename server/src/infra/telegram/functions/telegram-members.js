import { Api } from "telegram";
import { getTeleClient } from "../connect-to-telegram.js";
import { userLink } from "../../config/links.js";
import { telegramAddUserQueue } from "../../queues/telegram-add-user.queue.js";
import { delay } from "./util.js";
import { getChannelEntitiyByTeleRecordAndLeadId } from "./telegram-channels.js";

export async function getUserEntitiy(user) {
  if (!user.telegramUsername) {
    return null;
  }

  try {
    return await getTeleClient().getEntity(user.telegramUsername);
  } catch {
    return null;
  }
}

export async function addUsersToATeleChannel({ channel, usersList }) {
  for (const user of usersList) {
    try {
      await delay(200);
      await getTeleClient().invoke(
        new Api.channels.EditAdmin({
          channel,
          userId: user.id,
          adminRights: new Api.ChatAdminRights({
            changeInfo: false,
            postMessages: true,
            editMessages: true,
            deleteMessages: true,
            banUsers: false,
            inviteUsers: false,
            pinMessages: false,
            addAdmins: false,
            manageCall: false,
          }),
          rank: "Admin",
        }),
      );
    } catch {}
  }
}

export async function addUsersToATeleChannelUsingQueue({
  clientLeadId,
  usersList,
}) {
  const existingJob = await telegramAddUserQueue.getJob(
    `lead-${clientLeadId}-${userLink.length}`,
  );
  if (existingJob)
    throw new Error("We are added them to a queue and they will be added soon");
  await telegramAddUserQueue.add(
    "add-user-channel",
    { clientLeadId, usersList },
    {
      attempts: 10,
      backoff: {
        type: "fixed",
        delay: 30000,
      },
      jobId: `lead-${clientLeadId}-${userLink.length}`,
      removeOnComplete: true,
      removeOnFail: 10,
    },
  );
}

export async function addUserListToAChnnelUsingQueue({
  clientLeadId,
  usersList,
}) {
  const channel = await getChannelEntitiyByTeleRecordAndLeadId({
    clientLeadId: Number(clientLeadId),
  });
  if (!channel) return;
  for (const user of usersList) {
    try {
      await delay(1000);
      const userInpt = await getUserEntitiy(user);
      await getTeleClient().invoke(
        new Api.channels.EditAdmin({
          channel,
          userId: userInpt.id,
          adminRights: new Api.ChatAdminRights({
            changeInfo: false,
            postMessages: true,
            editMessages: true,
            deleteMessages: true,
            banUsers: false,
            inviteUsers: false,
            pinMessages: false,
            addAdmins: false,
            manageCall: false,
          }),
          rank: "Admin",
        }),
      );
    } catch {}
  }
}

export async function inviteUserToAChannel({ channel, user }) {
  const entity = await getUserEntitiy(user);
  if (!entity) return;
  await addUsersToATeleChannel({ channel, usersList: [entity] });
}
