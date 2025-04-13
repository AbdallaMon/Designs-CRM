-- Create the Priority enum type (in MySQL this is implemented as a ENUM column constraint)

-- Create the Project table
CREATE TABLE `Project` (
`id` INT NOT NULL AUTO_INCREMENT,
`userId` INT NOT NULL,
`clientLeadId` INT NOT NULL,
`deliveryTime` DATETIME(3) NULL,
`priority` ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MEDIUM',
`area` DECIMAL(10,2) NULL,
`startedAt` DATETIME(3) NULL,
`endedAt` DATETIME(3) NULL,
`status` VARCHAR(191) NOT NULL,
`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updatedAt` DATETIME(3) NOT NULL,
`type` VARCHAR(191) NOT NULL,

PRIMARY KEY (`id`),
INDEX `Project_userId_idx` (`userId`),
INDEX `Project_clientLeadId_idx` (`clientLeadId`),

CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
CONSTRAINT `Project_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE `Task` (
`id` INTEGER NOT NULL AUTO_INCREMENT,
`title` VARCHAR(255) NOT NULL,
`description` TEXT NULL,
`status` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'TODO',
`priority` ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MEDIUM',
`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`dueDate` DATETIME(3) NULL,
`finishedAt` DATETIME(3) NULL,
`projectId` INTEGER NULL,
`userId` INTEGER NULL,

INDEX `Task_projectId_idx`(`projectId`),
INDEX `Task_userId_idx`(`userId`),
PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Note` ADD COLUMN `taskId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Note_taskId_idx` ON `Note`(`taskId`);

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `Task` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'NORMAL';

ALTER TABLE Task
ADD COLUMN createdById INT,
ADD CONSTRAINT FK_Task_CreatedBy FOREIGN KEY (createdById) REFERENCES User(id);

-- First ensure the enum type exists (if not already created)
ALTER TABLE Project
ADD COLUMN role ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN') DEFAULT 'THREE_D_DESIGNER';

ALTER TABLE Project
MODIFY COLUMN userId INT NULL;

ALTER TABLE `ClientLead`
ADD COLUMN `paymentStatus` ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID','OVERDUE') NOT NULL DEFAULT 'PENDING',
ADD COLUMN `paymentSessionId` VARCHAR(255) NULL;

ALTER TABLE Task
ADD COLUMN clientLeadId INT NULL;
ALTER TABLE Task
ADD CONSTRAINT FK_Task_ClientLead
FOREIGN KEY (clientLeadId) REFERENCES ClientLead(id)
ON DELETE SET NULL;
