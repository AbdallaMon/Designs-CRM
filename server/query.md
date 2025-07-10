SELECT CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'ClientImageSession'
AND COLUMN_NAME = 'materialId'
AND CONSTRAINT_SCHEMA = 'your_database_name';
