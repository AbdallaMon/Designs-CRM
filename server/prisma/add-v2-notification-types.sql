-- Migration: Add v2 booking lead notification types to NotificationType enum
-- Run this on your MySQL database after updating schema.prisma
-- Command: npx prisma migrate dev --name add_v2_notification_types
--
-- If running manually, execute the ALTER TABLE below:

ALTER TABLE `Notification`
  MODIFY COLUMN `type` ENUM(
    'NEW_LEAD',
    'LEAD_ASSIGNED',
    'LEAD_STATUS_CHANGE',
    'LEAD_TRANSFERRED',
    'LEAD_UPDATED',
    'LEAD_CONTACT',
    'NOTE_ADDED',
    'NEW_NOTE',
    'NEW_FILE',
    'CALL_REMINDER_CREATED',
    'CALL_REMINDER_STATUS',
    'PRICE_OFFER_SUBMITTED',
    'PRICE_OFFER_UPDATED',
    'FINAL_PRICE_ADDED',
    'FINAL_PRICE_CHANGED',
    'PAYMENT_ADDED',
    'PAYMENT_STATUS_UPDATED',
    'EXTRA_FINAL_PRICE_ADDED',
    'EXTRA_FINAL_PRICE_EDITED',
    'WORK_STAGE_UPDATED',
    'OTHER',
    'TEST_FINISHED',
    'ATTEMPT_PASSED',
    'ATTEMPT_FAILED',
    'NEW_ATTEMPT_CREATED',
    'NEW_ATTEMPT_ADDED',
    'NEW_CHAT_MESSAGE',
    'CHAT_MENTION',
    'CHAT_ROOM_CREATED',
    'CHAT_MEMBER_ADDED',
    'CHAT_CALL_INCOMING',
    'CHAT_CALL_MISSED',
    -- New v2 values:
    'LEAD_CREATED',
    'LEAD_SUBMITTED',
    'LEAD_STATUS_CHANGED'
  ) NOT NULL;
