ALTER TABLE `user` ADD COLUMN `googleRefreshToken` LONGTEXT,
ADD COLUMN `googleAccessToken` LONGTEXT,
ADD COLUMN `googleTokenExpiresAt` DATETIME(3),
ADD COLUMN `googleCalendarId` VARCHAR(191),
ADD COLUMN `googleEmail` VARCHAR(255);
-- AlterTable
ALTER TABLE `meetingreminder` ADD COLUMN `googleEventId` VARCHAR(255),
ADD COLUMN `googleCalendarSynced` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `user` ADD COLUMN `profilePicture` LONGTEXT;
