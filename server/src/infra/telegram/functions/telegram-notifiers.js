import { uploadANote } from "./telegram-uploads.js";

export async function notifyUsersThatAClientHasSubmittedAPdf({ clientLeadId }) {
  const link = `${process.env.LEGACY_DASHBOARD_ORIGIN}/dashboard/deals/${clientLeadId}`;
  const note = {
    id: `style-${clientLeadId}`,
    clientLeadId: Number(clientLeadId),
    content: `A client has completed their style selection for lead #${clientLeadId}. You can preview the lead here: ${link}`,
  };
  await uploadANote(note);
}

export async function notifyUsersThatAContractWasSigned({ clientLeadId }) {
  const dashboardLink = `${process.env.LEGACY_DASHBOARD_ORIGIN}/dashboard/deals/${clientLeadId}`;
  const note = {
    id: `contract-signed-${clientLeadId}`,
    clientLeadId: Number(clientLeadId),
    content:
      `A client has signed a contract for lead #${clientLeadId}. ` +
      `Open the lead: ${dashboardLink}`,
  };
  await uploadANote(note);
}

export async function notifyUsersAddedToProject({
  projectId,
  clientLeadId,
  type,
  username,
}) {
  const link = `${process.env.LEGACY_DASHBOARD_ORIGIN}/dashboard/projects/${projectId}`;
  const note = {
    id: `${projectId}-${clientLeadId}`,
    clientLeadId: Number(clientLeadId),
    content: `👤 User @${username} has been assigned to Project ${type} for lead ${clientLeadId}. You can preview the project here: ${link}`,
  };
  await uploadANote(note);
}

export async function notifyUsersWithTheNewProjectStatus({
  projectId,
  clientLeadId,
  type,
}) {
  const link = `${process.env.LEGACY_DASHBOARD_ORIGIN}/dashboard/projects/${projectId}`;
  const note = {
    id: `${projectId}-${clientLeadId}`,
    clientLeadId: Number(clientLeadId),
    content: `✅ Project ${type} for lead ${clientLeadId} is Completed. You can preview the project here: ${link}`,
  };
  await uploadANote(note);
}

export async function handleProjectReminder({
  notifiedKey,
  timeLeft,
  projectId,
  clientLeadId,
  type,
}) {
  try {
    // ✅ Do your action here (e.g., send notification)
    console.log(
      `Sending ${timeLeft}-day reminder to clientLeadId: ${clientLeadId}`,
    );
    const note = {
      id: `${projectId}-${clientLeadId}-${notifiedKey}`,
      clientLeadId: Number(clientLeadId),
      content: `⏳ Project ${type} delivery time : ` + timeLeft,
      binMessage: true,
      update: {
        where: {
          id: Number(projectId),
        },
        key: "project",
        data: {
          [notifiedKey]: true,
        },
      },
    };
    await uploadANote(note);
  } catch (error) {
    console.error(
      `❌ Failed to handle reminder for project ${projectId}:`,
      error,
    );
  }
}
