-- For CallReminder table
ALTER TABLE CallReminder
ADD COLUMN notified BOOLEAN NOT NULL DEFAULT FALSE;

-- For MeetingReminder table
ALTER TABLE MeetingReminder
ADD COLUMN notified BOOLEAN NOT NULL DEFAULT FALSE;
