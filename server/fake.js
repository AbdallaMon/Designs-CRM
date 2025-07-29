import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function seedFakeNotesAndFiles() {
  const leads = await prisma.clientLead.findMany();
  const users = await prisma.user.findMany();

  if (leads.length === 0 || users.length === 0) {
    console.warn("No leads or users found.");
    return;
  }

  for (const lead of leads) {
    console.log(`Adding data to lead ID: ${lead.id}`);

    // Add 50 notes for this lead
    for (let i = 0; i < 50; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      await prisma.note.create({
        data: {
          content: faker.lorem.paragraph(),
          attachment: faker.internet.url(),
          clientLeadId: lead.id,
          userId: randomUser.id,
        },
      });
    }

    // Add 20 files for this lead
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      await prisma.file.create({
        data: {
          name: faker.system.commonFileName(),
          url: faker.internet.url(),
          description: faker.lorem.sentence(),
          clientLeadId: lead.id,
          userId: randomUser.id,
          isUserFile: true,
        },
      });
    }

    console.log(`✅ Done with lead ID: ${lead.id}`);
  }

  console.log("🎉 All leads updated with fake notes and files.");
}

seedFakeNotesAndFiles()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
