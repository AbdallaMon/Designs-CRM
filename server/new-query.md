ALTER TABLE `Note`
ADD COLUMN `invoiceId` INT;

ALTER TABLE `Note`
ADD CONSTRAINT `FK_Invoice_Notes`
FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`);

CREATE INDEX `IDX_Invoice_Notes` ON `Note`(`invoiceId`);

ALTER TABLE `Note`
MODIFY COLUMN `content` TEXT NULL;

ALTER TABLE `Note`
ADD COLUMN `attachment` TEXT NULL;
