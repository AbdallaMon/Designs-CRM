import prisma from "./prisma/prisma.js";
import bcrypt from 'bcrypt';

async function main() {
    await prisma.user.create({
        data: {
            email: 'admin@dreamstudiio.com',
            name: 'Admin User',
            password: await bcrypt.hash('anything', 10),
            role: 'ADMIN',
        },
    });
}

main()
      .catch((e) => {
          console.error(e);
          process.exit(1);
      })
      .finally(async () => {
          await prisma.$disconnect();
      });