ALTER TABLE ClientLead
ADD COLUMN leadType ENUM('NORMAL', 'CONVERTED') NOT NULL DEFAULT 'NORMAL';

ALTER TABLE ClientLead
ADD COLUMN previousLeadId INT NULL;

-- Drop threeDDesigner relation and column
ALTER TABLE ClientLead
DROP FOREIGN KEY fk_threeDDesigner,
DROP COLUMN threeDDesignerId;

-- Drop twoDDesigner relation and column
ALTER TABLE ClientLead
DROP FOREIGN KEY fk_twoDDesigner,
DROP COLUMN twoDDesignerId;

-- Drop twoDExacuter relation and column
ALTER TABLE ClientLead
DROP FOREIGN KEY fk_twoDExacuter,
DROP COLUMN twoDExacuterId;

ALTER TABLE ClientLead DROP FOREIGN KEY ClientLead_twoDExacuterId_fkey;

ALTER TABLE ClientLead DROP COLUMN twoDExacuterId;

ALTER TABLE ClientLead DROP FOREIGN KEY ClientLead_threeDDesignerId_fkey;
-- Repeat if needed (if MySQL says it still exists)

ALTER TABLE ClientLead DROP COLUMN threeDDesignerId;
