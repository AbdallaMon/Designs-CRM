import { PROFILES } from "@dms/shared";
// Morning digest — 08:00 Asia/Dubai, personal queues only (spec 2026-07-15 §6.3, user
// decision D3): every active holder of a personal My Day queue with a non-empty queue
// gets an in-app notification + email with their top items. Supervisors/admins are NOT
// digested (they have the live Team lens; admins have no personal queue at all — the
// usecase throws for them and they're skipped).
//
// Single-instance ownership comes from the `env.RUN_CRON` gate at the startCron() call
// site (same as every other cron here).
import cron from "node-cron";
import prisma from "../../../prisma/prisma.js";
import { myDayUsecase } from "../../modules/my-day/my-day.usecase.js";
import { sendToUser } from "../../shared/notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../../shared/notifications/notification.constants.js";

export const DIGEST_CRON = "0 8 * * *";
export const DIGEST_TZ = "Asia/Dubai";
export const DIGEST_TOP_N = 5;

// Roles that can hold a personal queue — mirrors the my_day.view grants. This only
// pre-filters the candidate list; the per-user PROFILE dispatch inside getMyQueue is the
// real gate (an admin-profiled user throws MY_DAY_PROFILE_UNSUPPORTED and is skipped).
const DIGEST_PROFILE_KEYS = [
  PROFILES.NORMAL_SALES,
  PROFILES.PRIMARY_SALES,
  PROFILES.SUPER_SALES,
  PROFILES.DESIGNER_3D,
  PROFILES.DESIGNER_2D,
  PROFILES.EXECUTOR_2D,
  PROFILES.ACCOUNTANT,
  PROFILES.CONTACT_INITIATOR,
];

// One human line per queue item (notification content is prose like the other senders;
// the queue UI itself stays code-driven).
function itemLine(item) {
  const who = item.clientName || `Lead #${item.leadId}`;
  const top = item.signals?.[0]?.type ?? "needs attention";
  return `${who} — ${String(top).replaceAll("_", " ").toLowerCase()}`;
}

/**
 * Compute + send the digest for every eligible user. Exported separately from the cron
 * registration so tests can run it with an injected clock and mocked senders.
 * @returns {{ candidates: number, sent: number }}
 */
export async function runMyDayDigest({ now = new Date() } = {}) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      currentProfile: { key: { in: DIGEST_PROFILE_KEYS } },
    },
    select: {
      id: true,
      name: true,
      currentProfile: { select: { key: true } },
    },
  });

  let sent = 0;
  for (const u of users) {
    let queue;
    try {
      queue = await myDayUsecase.getMyQueue({
        authUser: {
          id: u.id,
          currentProfileKey: u.currentProfile?.key ?? null,
          isAdminTier: false,
        },
        now,
      });
    } catch {
      continue; // no personal queue for this profile (e.g. admin-profiled) — skip
    }
    if (!queue?.items?.length) continue;

    const top = queue.items.slice(0, DIGEST_TOP_N);
    const extra = queue.items.length - top.length;
    const content =
      `Morning brief: ${queue.items.length} item(s) need you today — ` +
      top.map(itemLine).join("; ") +
      (extra > 0 ? `; +${extra} more` : "");

    try {
      await sendToUser({
        userId: u.id,
        content,
        type: NOTIFICATION_TYPES.MY_DAY_DIGEST,
        options: {
          link: "/dashboard/my-day",
          emailSubject: "Your Dream Studio morning brief",
        },
      });
      sent += 1;
    } catch (e) {
      // One user's failure must never abort the whole digest run.
      console.error(`my-day digest: send failed for user ${u.id}:`, e?.message ?? e);
    }
  }
  return { candidates: users.length, sent };
}

let task = null;

export function startMyDayDigestCron() {
  if (task) return task;
  task = cron.schedule(
    DIGEST_CRON,
    async () => {
      try {
        const { sent } = await runMyDayDigest({ now: new Date() });
        console.log(`☀️ my-day digest sent to ${sent} user(s)`);
      } catch (e) {
        console.error("my-day digest run failed:", e);
      }
    },
    { timezone: DIGEST_TZ },
  );
  return task;
}
