CREATE TABLE Contract (
id INT AUTO_INCREMENT PRIMARY KEY,
clientLeadId INT NOT NULL,
contractLevel ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6', 'LEVEL_7') NOT NULL,
title VARCHAR(255),
startDate DATETIME,
endDate DATETIME,
FOREIGN KEY (clientLeadId) REFERENCES ClientLead(id) ON DELETE CASCADE
);

-- Step 3: Update Note Table
ALTER TABLE Note
ADD COLUMN contractId INT,
ADD INDEX contractId_index (contractId),
ADD CONSTRAINT fk_note_contract FOREIGN KEY (contractId) REFERENCES Contract(id) ON DELETE SET NULL;

ALTER TABLE Contract
ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE Contract
ADD COLUMN purpose VARCHAR(255),
ADD CONSTRAINT unique_contract_combo UNIQUE (clientLeadId, contractLevel, purpose);
