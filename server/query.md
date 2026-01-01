ALTER TABLE ChatRoom MODIFY chatPasswordHash VARCHAR(255) NULL;
ALTER TABLE ChatRoom
ADD COLUMN chatAccessToken VARCHAR(255) NULL,
ADD UNIQUE KEY uq_chatroom_chatAccessToken (chatAccessToken),
DROP COLUMN chatPasswordHash;

ALTER TABLE Client ADD COLUMN lastSeenAt DATETIME NULL;
