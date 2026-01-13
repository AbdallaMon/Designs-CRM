ALTER TABLE ChatRoom MODIFY chatPasswordHash VARCHAR(255) NULL;
ALTER TABLE ChatRoom
ADD COLUMN chatAccessToken VARCHAR(255) NULL,
ADD UNIQUE KEY uq_chatroom_chatAccessToken (chatAccessToken),
DROP COLUMN chatPasswordHash;

ALTER TABLE Client ADD COLUMN lastSeenAt DATETIME NULL;

CREATE TABLE `DriveNode` (
`id` INT NOT NULL AUTO_INCREMENT,

`type` ENUM('FOLDER','FILE') NOT NULL,
`visibility` ENUM('PRIVATE','PUBLIC') NOT NULL DEFAULT 'PRIVATE',

`ownerId` INT NOT NULL,

`parentId` INT NULL,
`name` VARCHAR(255) NOT NULL,

`storageProvider` ENUM('LOCAL','GDRIVE') NOT NULL DEFAULT 'LOCAL',
`storageKey` VARCHAR(1024) NULL,
`mimeType` VARCHAR(120) NULL,
`sizeBytes` BIGINT NULL DEFAULT 0,
`checksum` VARCHAR(128) NULL,

`isDeleted` TINYINT(1) NOT NULL DEFAULT 0,
`deletedAt` DATETIME NULL,

`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

PRIMARY KEY (`id`),

INDEX `idx_DriveNode_ownerId` (`ownerId`),
INDEX `idx_DriveNode_parentId` (`parentId`),
INDEX `idx_DriveNode_visibility` (`visibility`),
INDEX `idx_DriveNode_isDeleted` (`isDeleted`),

CONSTRAINT `fk_DriveNode_owner`
FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`),

CONSTRAINT `fk_DriveNode_parent`
FOREIGN KEY (`parentId`) REFERENCES `DriveNode`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `DriveAcl` (
`id` INT NOT NULL AUTO_INCREMENT,

`nodeId` INT NOT NULL,
`userId` INT NOT NULL,

`canView` TINYINT(1) NOT NULL DEFAULT 1,
`canUpload` TINYINT(1) NOT NULL DEFAULT 0,
`canEdit` TINYINT(1) NOT NULL DEFAULT 0,
`canDelete` TINYINT(1) NOT NULL DEFAULT 0,
`canShare` TINYINT(1) NOT NULL DEFAULT 0,

`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY (`id`),

UNIQUE KEY `uq_DriveAcl_node_user` (`nodeId`, `userId`),
INDEX `idx_DriveAcl_userId` (`userId`),
INDEX `idx_DriveAcl_nodeId` (`nodeId`),

CONSTRAINT `fk_DriveAcl_node`
FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`),

CONSTRAINT `fk_DriveAcl_user`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `DrivePublicShare` (
`id` INT NOT NULL AUTO_INCREMENT,

`nodeId` INT NOT NULL,
`createdById` INT NOT NULL,

`token` VARCHAR(80) NOT NULL,
`expiresAt` DATETIME NULL,

`isRevoked` TINYINT(1) NOT NULL DEFAULT 0,
`revokedAt` DATETIME NULL,

`passwordHash` VARCHAR(255) NULL,

`canView` TINYINT(1) NOT NULL DEFAULT 1,
`canDownload` TINYINT(1) NOT NULL DEFAULT 1,

`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY (`id`),

UNIQUE KEY `uq_DrivePublicShare_token` (`token`),
INDEX `idx_DrivePublicShare_nodeId` (`nodeId`),
INDEX `idx_DrivePublicShare_createdById` (`createdById`),

CONSTRAINT `fk_DrivePublicShare_node`
FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`),

CONSTRAINT `fk_DrivePublicShare_createdBy`
FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `DriveNodeProject` (
`id` INT NOT NULL AUTO_INCREMENT,

`nodeId` INT NOT NULL,
`projectId` INT NOT NULL,

`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY (`id`),

UNIQUE KEY `uq_DriveNodeProject_node_project` (`nodeId`, `projectId`),
INDEX `idx_DriveNodeProject_nodeId` (`nodeId`),
INDEX `idx_DriveNodeProject_projectId` (`projectId`),

CONSTRAINT `fk_DriveNodeProject_node`
FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`),

CONSTRAINT `fk_DriveNodeProject_project`
FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `DriveNodeClientLead` (
`id` INT NOT NULL AUTO_INCREMENT,

`nodeId` INT NOT NULL,
`clientLeadId` INT NOT NULL,

`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY (`id`),

UNIQUE KEY `uq_DriveNodeClientLead_node_lead` (`nodeId`, `clientLeadId`),
INDEX `idx_DriveNodeClientLead_nodeId` (`nodeId`),
INDEX `idx_DriveNodeClientLead_clientLeadId` (`clientLeadId`),

CONSTRAINT `fk_DriveNodeClientLead_node`
FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`),

CONSTRAINT `fk_DriveNodeClientLead_lead`
FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
