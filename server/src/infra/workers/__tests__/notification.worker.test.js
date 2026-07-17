import { describe, it, expect, vi } from "vitest";

// Wiring test: the worker must listen on the SAME queue name the lazy queue factory
// creates ("notification-queue") and delegate job.data verbatim to deliverNotification.
// bullmq is mocked so no Redis connection is opened at import time.

const { workerCtor, queueCtor } = vi.hoisted(() => ({
  workerCtor: vi.fn(),
  queueCtor: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Worker: class {
    constructor(name, processor, opts) {
      workerCtor(name, processor, opts);
      this.on = vi.fn();
    }
  },
  Queue: class {
    constructor(name, opts) {
      queueCtor(name, opts);
    }
  },
}));

vi.mock("../../../modules/notifications/notification.usecase.js", () => ({
  deliverNotification: vi.fn(),
}));

import { notificationWorker } from "../notification.worker.js";
import { getNotificationQueue } from "../../queues/notification.queue.js";
import { deliverNotification } from "../../../modules/notifications/notification.usecase.js";

describe("notification queue/worker wiring", () => {
  it("worker listens on notification-queue and delegates job.data to deliverNotification", async () => {
    expect(notificationWorker).toBeTruthy();
    expect(workerCtor).toHaveBeenCalledTimes(1);
    const [name, processor] = workerCtor.mock.calls[0];
    expect(name).toBe("notification-queue");

    const payload = { userId: 7, content: "c" };
    await processor({ data: payload });
    expect(deliverNotification).toHaveBeenCalledWith(payload);
  });

  it("getNotificationQueue creates the queue LAZILY, once, on the same queue name", () => {
    // importing the module above must NOT have constructed a Queue (no Redis at import)
    expect(queueCtor).not.toHaveBeenCalled();
    const q1 = getNotificationQueue();
    const q2 = getNotificationQueue();
    expect(q1).toBe(q2);
    expect(queueCtor).toHaveBeenCalledTimes(1);
    expect(queueCtor.mock.calls[0][0]).toBe("notification-queue");
  });
});
