import { projectLink, taskLink } from "../../config/links.js";
import { createNotification } from "../../../modules/notifications/notification.usecase.js";

export async function newTaskCreatedNotification(
  taskId,
  userId,
  projectId,
  title,
  isAdmin,
  isModifcationTask,
) {
  const name = isModifcationTask ? "Modification" : "Task";

  const extra = projectId
    ? `With projectId <a href="${
        projectLink + "/" + projectId
      }" >#${projectId}</a> `
    : "";
  const notificationHtml = `<div>
       <strong>New ${name} created</strong><a href="${
         taskLink + "/" + taskId
       }" >#${taskId}</a> 
       <div class="sub-text">
  A ${name} with title ${title} has been created with ${extra}
</div>
    </div>`;
  await createNotification(
    userId,
    !isAdmin,
    notificationHtml,
    null,
    "OTHER",
    `New ${name} created`,
    true,
    "HTML",
    null,
    !isAdmin && userId ? userId : null,
    null,
    false,
  );
}

export async function updateTaskNotification(
  taskId,
  userId,
  projectId,
  title,
  isAdmin,
  isModifcationTask,
) {
  const name = isModifcationTask ? "Modification" : "Task";

  const extra = projectId
    ? `With projectId <a href="${
        projectLink + "/" + projectId
      }" >#${projectId}</a> `
    : "";
  const notificationHtml = `<div>
     <strong>A ${name} has been updated</strong>${name} with id <a href="${
       taskLink + "/" + taskId
     }" >#${taskId}</a> 
     <div class="sub-text">
and with title ${title} has been updated ${extra}
</div>
  </div>`;

  await createNotification(
    userId,
    !isAdmin,
    notificationHtml,
    null,
    "OTHER",
    "Task updated",
    true,
    "HTML",
    null,
    !isAdmin && userId ? userId : null,
    null,
    false,
  );
}

export async function updateProjectNotification(
  projectId,
  userId,
  content,
  isAdmin,
) {
  const notificationHtml = `<div>
     <strong>A Project has been updated</strong> Project with id <a href="${
       projectLink + "/" + projectId
     }" >#${projectId}</a> 
     <div class="sub-text">
     ${content}
</div>
  </div>`;

  await createNotification(
    userId,
    !isAdmin,
    notificationHtml,
    null,
    "OTHER",
    "Project updated",
    true,
    "HTML",
    null,
    !isAdmin && userId ? userId : null,
    null,
    false,
  );
}

export async function newProjectAssingmentNotification(
  projectId,
  userId,
  content,
) {
  const notificationHtml = `<div>
     <strong>A Project has been assigned</strong> Project with id <a href="${
       projectLink + "/" + projectId
     }" >#${projectId}</a> 
     <div class="sub-text">
     ${content}
</div>
  </div>`;

  await createNotification(
    userId,
    false,
    notificationHtml,
    null,
    "OTHER",
    "Project updated",
    true,
    "HTML",
    null,
    null,
    null,
    false,
  );
}
