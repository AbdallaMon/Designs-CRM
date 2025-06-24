CREATE TABLE `AvailableDay` (
`id` INT NOT NULL AUTO_INCREMENT,
`date` DATETIME NOT NULL,
`userId` INT NOT NULL,
`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
UNIQUE KEY `unique_user_date` (`userId`, `date`),
KEY `fk_available_day_userId` (`userId`),
CONSTRAINT `fk_available_day_user` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
);

CREATE TABLE `AvailableSlot` (
`id` INT NOT NULL AUTO_INCREMENT,
`startTime` DATETIME NOT NULL,
`endTime` DATETIME NOT NULL,
`availableDayId` INT NOT NULL,
`isBooked` BOOLEAN NOT NULL DEFAULT FALSE,
`meetingReminderId` INT DEFAULT NULL UNIQUE, -- ✅ enforce one-to-one
PRIMARY KEY (`id`),
KEY `fk_slot_dayId` (`availableDayId`),
CONSTRAINT `fk_slot_day` FOREIGN KEY (`availableDayId`) REFERENCES `AvailableDay` (`id`) ON DELETE CASCADE,
CONSTRAINT `fk_slot_meetingReminder` FOREIGN KEY (`meetingReminderId`) REFERENCES `MeetingReminder` (`id`) ON DELETE SET NULL
);

ALTER TABLE `MeetingReminder`
ADD COLUMN `availableSlotId` INT UNIQUE DEFAULT NULL,
ADD CONSTRAINT `fk_meeting_slot`
FOREIGN KEY (`availableSlotId`) REFERENCES `AvailableSlot` (`id`)
ON DELETE SET NULL;

ALTER TABLE MeetingReminder
MODIFY COLUMN time DATETIME NULL;

ALTER TABLE MeetingReminder
ADD COLUMN token VARCHAR(191) UNIQUE NULL;

ALTER TABLE AvailableSlot
ADD COLUMN userTimezone VARCHAR(100) NULL;

ALTER TABLE MeetingReminder
ADD COLUMN userTimezone VARCHAR(100) NULL;
