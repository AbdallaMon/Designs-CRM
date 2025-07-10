SELECT CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'ClientImageSession'
AND COLUMN_NAME = 'materialId'
AND CONSTRAINT_SCHEMA = 'your_database_name';

ALTER TABLE ClientImageSession DROP FOREIGN KEY clientimagesession_ibfk_5;
ALTER TABLE ClientImageSession DROP COLUMN materialId;

CREATE TABLE MaterialOnClientImageSession (
clientImageSessionId INT NOT NULL,
materialId INT NOT NULL,
PRIMARY KEY (clientImageSessionId, materialId),
FOREIGN KEY (clientImageSessionId) REFERENCES ClientImageSession(id) ON DELETE CASCADE,
FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE CASCADE
);
