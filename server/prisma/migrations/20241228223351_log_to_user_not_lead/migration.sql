/*
  Warnings:

  - You are about to drop the column `clientLeadId` on the `log` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `log` DROP FOREIGN KEY `Log_clientLeadId_fkey`;

-- DropIndex
DROP INDEX `Log_clientLeadId_idx` ON `log`;

-- AlterTable
ALTER TABLE `log` DROP COLUMN `clientLeadId`,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `Log_userId_idx` ON `Log`(`userId`);

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
