import { describe, it, expect, vi, beforeEach } from "vitest";

// createNotification is the single choke point every sender funnels through. This suite
// pins the queue split: createNotification ENQUEUES a BullMQ job (no inline delivery),
// and deliverNotification (the worker's processor body) performs the legacy fan-out
// verbatim — recipient resolution, DB row, socket emit, deferred email.

const { addMock, emitMock, toMock } = vi.hoisted(() => {
  const emitMock = vi.fn();
  return {
    addMock: vi.fn(),
    emitMock,
    toMock: vi.fn(() => ({ emit: emitMock })),
  };
});

vi.mock("../../../infra/queues/notification.queue.js", () => ({
  getNotificationQueue: () => ({ add: addMock }),
}));

vi.mock("../../../infra/socket/index.js", () => ({
  getIo: () => ({ to: toMock }),
}));

vi.mock("../../../infra/mail/send-mail.js", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("../notification.repo.js", async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    notificationRepository: {
      list: vi.fn(),
      markAllReadForUser: vi.fn(),
      findFirstAdmin: vi.fn(),
      findSubAdmins: vi.fn(),
      findActiveUsersByRoles: vi.fn(),
      findActiveDefaultRecipients: vi.fn(),
      createNotificationRow: vi.fn(),
      findUserEmailById: vi.fn(),
    },
  };
});

import { createNotification, deliverNotification } from "../notification.usecase.js";
import { notificationRepository } from "../notification.repo.js";
import { sendEmail } from "../../../infra/mail/send-mail.js";

// legacy `subAdmins.forEach(async ...)` / deferred email are fire-and-forget — flush them
const tick = () => new Promise((r) => setImmediate(r));

beforeEach(() => {
  vi.clearAllMocks();
  notificationRepository.createNotificationRow.mockResolvedValue({ id: 1, userId: 7 });
});

describe("createNotification — enqueue side", () => {
  it("enqueues ONE job carrying all args as a named payload and does NOT deliver inline", async () => {
    await createNotification(7, false, "<div>hi</div>", "/x", "NEW_LEAD", "Subject", true, "HTML", 12, 3);

    expect(addMock).toHaveBeenCalledTimes(1);
    const [jobName, payload] = addMock.mock.calls[0];
    expect(jobName).toBe("deliver");
    expect(payload).toEqual({
      userId: 7,
      isAdmin: false,
      content: "<div>hi</div>",
      href: "/x",
      type: "NEW_LEAD",
      emailSubject: "Subject",
      withEmail: true,
      contentType: "HTML",
      clientLeadId: 12,
      staffId: 3,
      role: ["STAFF"],
      specifiRole: undefined,
    });

    // nothing delivered inline — that is the worker's job now
    expect(notificationRepository.createNotificationRow).not.toHaveBeenCalled();
    expect(toMock).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("applies the legacy defaults into the payload (contentType TEXT, role [STAFF])", async () => {
    await createNotification(7, false, "c", null, "T", "S", false);
    const [, payload] = addMock.mock.calls[0];
    expect(payload.contentType).toBe("TEXT");
    expect(payload.role).toEqual(["STAFF"]);
  });
});

describe("deliverNotification — worker-side fan-out (legacy behavior preserved)", () => {
  it("single-user: writes the row and emits the socket event to user:<id>, no email when withEmail=false", async () => {
    await deliverNotification({
      userId: 7,
      isAdmin: false,
      content: "c",
      href: null,
      type: "NEW_LEAD",
      emailSubject: "S",
      withEmail: false,
      contentType: "TEXT",
      clientLeadId: null,
      staffId: null,
      role: ["STAFF"],
    });

    expect(notificationRepository.createNotificationRow).toHaveBeenCalledTimes(1);
    const { data } = notificationRepository.createNotificationRow.mock.calls[0][0];
    expect(data.userId).toBe(7);
    expect(data.content).toBe("c");
    expect(toMock).toHaveBeenCalledWith("user:7");
    expect(emitMock).toHaveBeenCalledWith("notification", { id: 1, userId: 7 });
    await tick();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("isAdmin: fans out to the first admin AND every sub-admin", async () => {
    notificationRepository.findFirstAdmin.mockResolvedValue({ id: 1 });
    notificationRepository.findSubAdmins.mockResolvedValue([{ id: 2 }, { id: 3 }]);

    await deliverNotification({
      userId: null,
      isAdmin: true,
      content: "c",
      href: null,
      type: "NEW_NOTE",
      emailSubject: "S",
      withEmail: false,
    });
    await tick();

    const targets = notificationRepository.createNotificationRow.mock.calls.map(
      (c) => c[0].data.userId,
    );
    expect(targets.sort()).toEqual([1, 2, 3]);
  });

  it("withEmail: sends the email on the deferred (setImmediate) path with the legacy HTML wrapper", async () => {
    notificationRepository.findUserEmailById.mockResolvedValue({ email: "u@x.com" });
    sendEmail.mockResolvedValue();

    await deliverNotification({
      userId: 7,
      content: "the-content",
      emailSubject: "Subj",
      withEmail: true,
    });
    await tick();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [toEmail, subject, html] = sendEmail.mock.calls[0];
    expect(toEmail).toBe("u@x.com");
    expect(subject).toBe("Subj");
    expect(html).toContain("the-content");
  });
});
