-- Then drop the constraint
ALTER TABLE `Project` DROP FOREIGN KEY `Project_userId_fkey`;

-- Step 4: Remove the index on userId column
ALTER TABLE `Project` DROP INDEX `Project_userId_idx`;

-- Step 5: Drop the userId column from Project table
ALTER TABLE `Project` DROP COLUMN `userId`;

-- Add groupTitle field with default value "Initial Project"
ALTER TABLE `Project`
ADD COLUMN `groupTitle` VARCHAR(255) NOT NULL DEFAULT 'Initial Project';

-- Add groupId field with default value 1
ALTER TABLE `Project`
ADD COLUMN `groupId` INT NOT NULL DEFAULT 1;

-- Add index on groupId for better query performance
CREATE INDEX `Project_groupId_idx` ON `Project` (`groupId`);

REATE TABLE `Assignment` (
`id` INT NOT NULL AUTO_INCREMENT,
`userId` INT NOT NULL,
`projectId` INT NULL,
`type` VARCHAR(255) NULL,
`role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN') NOT NULL DEFAULT 'THREE_D_DESIGNER',
`assignedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

PRIMARY KEY (`id`),
INDEX `Assignment_userId_idx` (`userId`),
INDEX `Assignment_projectId_idx` (`projectId`),

CONSTRAINT `Assignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
CONSTRAINT `Assignment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);
