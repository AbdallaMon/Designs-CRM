/\*\*

- NOTIFICATION SYSTEM USAGE GUIDE
- ===============================
-
- This guide explains how to use the v2 notification system in your features.
-
- Location: v2/shared/notifications/
- Files:
- - notification.constants.js - Types, roles, and email templates
- - notification.service.js - Core notification functions
- - index.js - Module exports
-
- ============================================================================
  \*/

/\*\*

- QUICK START
- ============================================================================
-
- Import the notification service in your usecase file:
  \*/

// In your-feature.usecase.js
import {
sendToAdmins,
sendToUser,
sendToRoles,
sendToAll,
builder,
NOTIFICATION_TYPES,
CONTENT_TYPES,
} from "../../shared/notifications/index.js";

/\*\*

- BASIC EXAMPLES
- ============================================================================
  \*/

// Example 1: Send to all admins
export async function exampleSendToAdmins() {
await sendToAdmins({
content: "<div>A new booking lead has been submitted!</div>",
type: NOTIFICATION_TYPES.LEAD_SUBMITTED,
options: {
contentType: CONTENT_TYPES.HTML,
link: "/leads/123", // Optional: link to the lead
clientLeadId: 123, // Optional: associate with a lead
},
});
}

// Example 2: Send to specific user
export async function exampleSendToUser() {
await sendToUser({
userId: 456,
content: "Your lead status has been updated",
type: NOTIFICATION_TYPES.LEAD_STATUS_CHANGED,
options: {
link: "/leads/123",
},
});
}

// Example 3: Send to users with specific roles
export async function exampleSendToRoles() {
await sendToRoles({
roles: ["STAFF", "THREE_D_DESIGNER"], // Target these roles
content: "New lead available for assignment",
type: NOTIFICATION_TYPES.LEAD_CREATED,
options: {
contentType: CONTENT_TYPES.HTML,
},
});
}

// Example 4: Send to all active staff
export async function exampleSendToAll() {
await sendToAll({
content: "System notification for all staff",
type: NOTIFICATION_TYPES.LEAD_CREATED,
});
}

/\*\*

- BUILDER PATTERN (For Complex Scenarios)
- ============================================================================
-
- Use the builder for sending to multiple recipient types in one call:
  \*/

export async function exampleBuilderPattern() {
// Send same notification to admins AND certain staff roles
await builder()
.withContent("<div><strong>New Lead Alert</strong><br>A booking lead was just submitted</div>")
.withType(NOTIFICATION_TYPES.LEAD_SUBMITTED)
.withOptions({
contentType: CONTENT_TYPES.HTML,
link: "/leads/123",
clientLeadId: 123,
})
.toAdmins() // Add admins as recipients
.toRoles(["STAFF"]) // Also add staff
.toUser(789) // Also add a specific user
.send();
}

/\*\*

- REAL-WORLD EXAMPLE: Create Booking Lead Notification
- ============================================================================
  \*/

import prisma from "../../infra/prisma.js";

export async function createBookingLeadWithNotification(payload) {
// 1. Create the booking lead in database
const bookingLead = await prisma.bookingLead.create({
data: {
location: payload.location,
projectType: payload.projectType,
// ... other fields
},
include: {
client: true,
},
});

// 2. Build notification content (can be HTML)
const notificationContent = `    <div style="font-family: Arial, sans-serif; color: #333;">
      <h3 style="color: #1a73e8;">New Booking Lead Created</h3>
      <p><strong>Lead ID:</strong> #${bookingLead.id}</p>
      <p><strong>Location:</strong> ${bookingLead.location || "N/A"}</p>
      <p><strong>Project Type:</strong> ${bookingLead.projectType || "N/A"}</p>
      ${
        bookingLead.client?.name
          ?`<p><strong>Client Name:</strong> ${bookingLead.client.name}</p>`
          : ""
      }
      <p>
        <a href="/leads/${bookingLead.id}" style="color: #1a73e8; text-decoration: none;">
View Lead Details →
</a>
</p>
</div>
`;

// 3. Send notification to admins
await sendToAdmins({
content: notificationContent,
type: NOTIFICATION_TYPES.LEAD_CREATED,
options: {
contentType: CONTENT_TYPES.HTML,
link: `/leads/${bookingLead.id}`,
clientLeadId: bookingLead.id,
},
});

// 4. Also notify relevant staff roles
await sendToRoles({
roles: ["STAFF", "THREE_D_DESIGNER"],
content: `New booking lead #${bookingLead.id} from ${bookingLead.location}`,
type: NOTIFICATION_TYPES.LEAD_CREATED,
options: {
link: `/leads/${bookingLead.id}`,
clientLeadId: bookingLead.id,
},
});

return bookingLead;
}

/\*\*

- NOTIFICATION TYPES AVAILABLE
- ============================================================================
-
- From NOTIFICATION_TYPES constant:
-
- - LEAD_CREATED: When a lead is first created
- - LEAD_SUBMITTED: When a lead status changes to submitted
- - LEAD_STATUS_CHANGED: When lead status changes
- - LEAD_ASSIGNED: When lead is assigned to someone
- - LEAD_TRANSFERRED: When lead is transferred between users
-
- Add more types to notification.constants.js as needed
  \*/

/\*\*

- CONTENT TYPES
- ============================================================================
-
- - CONTENT_TYPES.TEXT: Plain text (default)
- - CONTENT_TYPES.HTML: HTML formatted content
    \*/

/\*\*

- DATABASE SCHEMA
- ============================================================================
-
- Notifications are stored in the Notification model:
-
- model Notification {
- id Int @id @default(autoincrement())
- type NotificationType // LEAD_CREATED, LEAD_SUBMITTED, etc.
- content String @db.Text
- contentType ContentType // TEXT or HTML
- link String? // Optional: URL to related resource
- isRead Boolean @default(false)
- userId Int? // Target user
- staffId Int? // Related staff member
- clientLeadId Int? // Related lead
- createdAt DateTime @default(now())
- }
-
- Notifications are automatically:
- - Saved to database
- - Emitted via Socket.IO to the target user in real-time
    \*/

/\*\*

- USER ROLES
- ============================================================================
-
- Available roles (from USER_ROLES constant):
- - ADMIN: Main admin
- - SUPER_ADMIN: Super admin privileges
- - STAFF: Regular staff members
- - CLIENT: Client users
- - THREE_D_DESIGNER: 3D design role
- - TWO_D_DESIGNER: 2D design role
-
- Note: Users can also have sub-roles. The notification system checks both.
  \*/

/\*\*

- SOCKET.IO INTEGRATION
- ============================================================================
-
- After sending a notification, it's automatically:
- 1.  Saved to database
- 2.  Emitted to user's Socket.IO room as "notification" event
-
- Frontend will receive:
- socket.on('notification', (notification) => {
- // notification = { id, type, content, link, createdAt, ... }
- });
-
- Socket rooms are named: user:<userId>
- Make sure Socket.IO is connected and users are subscribed to their room.
  \*/

/\*\*

- ERROR HANDLING
- ============================================================================
-
- The notification service includes error handling:
- - If Socket.IO is not initialized, notifications still save to DB
- - If no matching users found (e.g., no admins), operation completes safely
- - Logs warnings but doesn't throw errors
-
- Example:
- try {
- await sendToAdmins({...});
- } catch (error) {
- console.error("Notification send failed:", error.message);
- }
  \*/

/\*\*

- BEST PRACTICES
- ============================================================================
-
- 1.  Use HTML content for better UX:
- ✓ options: { contentType: CONTENT_TYPES.HTML }
- ✗ Plain text is harder to read
-
- 2.  Include relevant links:
- ✓ options: { link: "/leads/123" }
- ✗ Notifications without context
-
- 3.  Associate with related entities:
- ✓ options: { clientLeadId: 123 }
- ✗ Orphaned notifications
-
- 4.  Use proper notification types:
- ✓ type: NOTIFICATION_TYPES.LEAD_SUBMITTED
- ✗ type: "some_random_string"
-
- 5.  Test with multiple recipient scenarios:
- ✓ Send to admins AND roles for comprehensive coverage
- ✗ Only notify one group, miss important stakeholders
  \*/

export const USAGE_GUIDE = "See comments in this file for complete documentation";
