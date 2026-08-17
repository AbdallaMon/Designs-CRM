import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../admin-leads.repo.js", () => ({
  adminLeadsRepository: {
    findLastClient: vi.fn(),
    createClient: vi.fn(),
    createClientLead: vi.fn(),
    createNote: vi.fn(),
  },
}));

vi.mock("../../../leads/lead/lead.repo.js", () => ({
  leadRepository: {},
}));

vi.mock("../../../../infra/notifications/index.js", () => ({
  consultedLeadNotification: vi.fn(),
  newLeadNotification: vi.fn(),
}));

vi.mock("../../../../infra/telegram/telegram-functions.js", () => ({
  addUsersToATeleChannelUsingQueue: vi.fn(),
  createChannelAndAddUsers: vi.fn(),
}));

import { adminLeadsUsecase } from "../admin-leads.usecase.js";
import { adminLeadsRepository } from "../admin-leads.repo.js";

describe("AdminLeadsUsecase spreadsheet import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminLeadsRepository.findLastClient.mockResolvedValue(null);
    adminLeadsRepository.createClient.mockResolvedValue({ id: 1 });
    adminLeadsRepository.createClientLead.mockResolvedValue({ id: 9 });
    adminLeadsRepository.createNote.mockResolvedValue({ id: 3 });
  });

  it("imports an xlsx row without changing the legacy lead mapping", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leads");
    worksheet.addRow([
      "Phone",
      "Unused",
      "Name",
      "Description",
      "Price",
      "Note A",
      "Note B",
      "Unused 2",
      "Note C",
      "Created",
    ]);
    worksheet.addRow([
      "0501234567",
      null,
      "Test Client",
      "Imported lead",
      1250,
      "First note",
      null,
      null,
      "Last note",
      new Date("2026-08-10T00:00:00.000Z"),
    ]);
    const buffer = await workbook.xlsx.writeBuffer();

    await adminLeadsUsecase.importLeadsFromExcel({
      file: {
        buffer: Buffer.from(buffer),
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        originalname: "leads.xlsx",
      },
    });

    expect(adminLeadsRepository.createClient).toHaveBeenCalledWith({
      data: {
        phone: "0501234567",
        name: "Test Client",
        email: "fakeEmail1@example.com",
      },
    });
    expect(adminLeadsRepository.createClientLead).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: 1,
        selectedCategory: "OLDLEAD",
        description: "Imported lead",
        price: "1250",
        priceWithOutDiscount: 1250,
        averagePrice: 1250,
        createdAt: new Date("2026-08-10T00:00:00.000Z"),
      }),
    });
    expect(adminLeadsRepository.createNote).toHaveBeenCalledTimes(2);
  });
});
