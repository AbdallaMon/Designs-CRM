import { sendEmail } from "../../sendMail.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import dotenv from "dotenv";
dotenv.config();
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
export async function sendEmailToClient({
  clientName,
  clientEmail,
  pdfUrl,
  token,
}) {
  const sessionPageUrl = `${process.env.OLDORIGIN}/image-session?token=${token}`;
  const pdfDownloadUrl = pdfUrl;

  const clientHtml = `
    <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);">
      <tr>
        <td align="center" style="padding:20px;">
          <img
            src="https://dreamstudiio.com/main-logo.jpg"
            alt="Dream Studio"
            width="90"
            style="display:block; max-width:90px; height:auto; border:0; margin:0 auto;"
          />
        </td>
      </tr>
    </table>
        <div style="padding: 12px;">
          <h2 style="color: #383028;">Thank you, ${clientName}!</h2>
          <p>Your image session has been approved!</p>
          
          <div style="background: #f8f6f3; border-radius: 8px; padding: 12px; margin: 20px 0;">
            <h3 style="color: #383028; margin-top: 0;">What would you like to do next?</h3>
            <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #be975c;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #383028;">🖼️ Preview Your Session</p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Review your image selection and make any final changes before downloading</p>
              <a href="${sessionPageUrl}" style="color: #be975c; font-weight: bold; text-decoration: none; background: #f8f6f3; padding: 8px 16px; border-radius: 4px; display: inline-block;">View Session</a>
            </div>
            <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #d3ac71;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #383028;">📄 Download Your PDF Summary</p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Get instant access to your finalized image collection</p>
              <a href="${pdfDownloadUrl}" style="color: #d3ac71; font-weight: bold; text-decoration: none; background: #f8f6f3; padding: 8px 16px; border-radius: 4px; display: inline-block;">Download PDF</a>
            </div>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            💡 <em>Tip: You can always return to your session page to preview your images or downloading the PDF.</em>
          </p>
          
          <p style="margin-top: 30px;">We appreciate your trust in <strong>Dream Studio</strong> ❤️</p>
          <p>Best regards,<br/>Dream Studio Team</p>
        </div>
      </div>
    </div>
  `;
  await sendEmail(clientEmail, "✅ Your Image Session is Approved", clientHtml);
}
export async function sendEmailForStaff({
  staffs,
  clientName,
  clientLeadId,
  pdfDownloadUrl,
  token,
}) {
  const staffHtml = `
    <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);">
      <tr>
        <td align="center" style="padding:20px;">
          <img
            src="https://dreamstudiio.com/main-logo.jpg"
            alt="Dream Studio"
            width="90"
            style="display:block; max-width:90px; height:auto; border:0; margin:0 auto;"
          />
        </td>
      </tr>
    </table>
        <div style="padding: 30px;">
          <h2 style="color: #383028;">Client Image Session Approved</h2>
          <p>
            Client <strong>${clientName}</strong> (ClientLead ID: <strong>${clientLeadId}</strong>) has approved a new image session.
          </p>
                  <p>
         Session token : ${token}
          </p>
          <p>Useful links:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><a href="${pdfDownloadUrl}" style="color: #d3ac71; font-weight: bold;">📄 Download Session PDF</a></li>
            <li style="margin: 10px 0;"><a href="${process.env.OLDORIGIN}/dashboard/deals/${clientLeadId}" style="color: #d3ac71; font-weight: bold;">👤 Open lead page for more data</a></li>
          </ul>
          <p style="margin-top: 20px;">Please review the session or take follow-up actions as needed.</p>
          <p style="margin-top: 20px;">— Dream Studio System Notification</p>
        </div>
      </div>
    </div>
  `;

  for (const staff of staffs) {
    await sendEmail(
      staff.email,
      `📢 Approved Image Session for ${clientName}`,
      staffHtml
    );
  }
}

export async function sendReminderCreatedToClient({
  clientEmail,
  clientName,
  reminderTitle,
  reminderTime,
  userTimezone = "Asia/Dubai",
}) {
  const userTime = dayjs(reminderTime)
    .tz(userTimezone) // e.g., "Africa/Cairo"
    .format("dddd, MMMM D, YYYY, h:mm A");

  const clientHtml = `
    <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);">
      <tr>
        <td align="center" style="padding:20px;">
          <img
            src="https://dreamstudiio.com/main-logo.jpg"
            alt="Dream Studio"
            width="90"
            style="display:block; max-width:90px; height:auto; border:0; margin:0 auto;"
          />
        </td>
      </tr>
    </table>
        <div style="padding: 30px;">
          <h2 style="color: #383028;">📅 Meeting Booked Successfully</h2>
          <p>Hello <strong>${clientName}</strong>,</p>
          <p>Your meeting has been created and scheduled successfully!</p>
          
          <div style="background: #f8f6f3; border-radius: 8px; padding: 20px; margin: 20px 0;">
   
            <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #d3ac71;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #383028;">⏰ Scheduled for</p>
              <p style="margin: 0; font-size: 16px; color: #be975c;">${userTime}</p>
            </div>
          </div>
          
          <div style="background: #fff; border: 1px solid #e0ddd8; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              💡 <em>You'll receive a notification when it's time for your meeting.</em>
            </p>
          </div>
          
          <p style="margin-top: 30px;">We appreciate your trust in <strong>Dream Studio</strong> ❤️</p>
          <p>Best regards,<br/>Dream Studio Team</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(clientEmail, `📅 Reminder Set: ${reminderTitle}`, clientHtml);
}

export async function sendReminderToUser({
  userEmail,
  userName,
  time,
  type = "MEETING",
  clientLeadId,
  timeLabel = "15min",
}) {
  const label = type === "MEETING" ? "Meeting" : "Call";
  const callDetails = "Scheduled " + label;
  const minutesLabel =
    {
      "15min": "15 Minutes",
      "4h": "4 Hours",
      "12h": "12 Hours",
    }[timeLabel] || "Soon";

  const userTimezone = "Asia/Dubai";
  const formattedTime = dayjs(time)
    .tz(userTimezone)
    .format("dddd, MMMM D, YYYY, h:mm A");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%); padding: 20px; text-align: center;">
          <img src="https://dreamstudiio.com/dream-logo.jpg" alt="Dream Studio" style="max-height: 60px;" />
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #383028;">📞 ${label} Reminder - ${minutesLabel}</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>This is a reminder that you have a ${label} scheduled in <strong>${minutesLabel}</strong>.</p>

          <div style="background: #f8f6f3; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #383028;">🕒 Time: <span style="color: #be975c">${formattedTime} (Dubai Time)</span></h3>
            <p style="margin-top: 10px;"><strong>Details:</strong> ${callDetails}</p>
          </div>

          <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
            <li><a href="${process.env.OLDORIGIN}/dashboard/deals/${clientLeadId}" style="color: #d3ac71; font-weight: bold;">👤 Open Lead Page</a></li>
          </ul>

          <div style="background: #fff; border: 1px solid #e0ddd8; border-radius: 6px; padding: 15px;">
            <p style="font-size: 14px; color: #666;">💡 <em>Please prepare for your ${label} and be available at the scheduled time.</em></p>
          </div>

          <p style="margin-top: 30px;">— Dream Studio System</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(
    userEmail,
    `📞 ${label} Reminder - ${minutesLabel} | ${callDetails}`,
    html
  );
}

// Function 4: Send 15-minute call notification to Client
export async function sendReminderToClient({
  clientEmail,
  clientName,
  userTimezone = "Asia/Dubai",
  type,
  time,
  timeLabel = "15min",
}) {
  const label = type === "MEETING" ? "Meeting" : "Call";
  const minutesLabel =
    {
      "15min": "15 Minutes",
      "4h": "4 Hours",
      "12h": "12 Hours",
    }[timeLabel] || "Soon";
  const callDetails = "Scheduled " + label;

  const formattedTime = dayjs(time)
    .tz(userTimezone)
    .format("dddd, MMMM D, YYYY, h:mm A");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #584d3f; background-color: #f4f2ee; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fcfbf9; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.03); overflow: hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #be975c 0%, #d3ac71 100%);">
      <tr>
        <td align="center" style="padding:20px;">
          <img
            src="https://dreamstudiio.com/main-logo.jpg"
            alt="Dream Studio"
            width="90"
            style="display:block; max-width:90px; height:auto; border:0; margin:0 auto;"
          />
        </td>
      </tr>
    </table>
        <div style="padding: 30px;">
          <h2 style="color: #383028;">📞 Your ${label} is Coming Up - ${minutesLabel}</h2>
          <p>Hello <strong>${clientName}</strong>,</p>
          <p>This is a reminder that your ${label} with Dream Studio is scheduled to begin in <strong>${minutesLabel}</strong>.</p>

          <div style="background: #f8f6f3; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #383028;">🕒 Time: <span style="color: #be975c">${formattedTime} (${userTimezone})</span></h3>
            <p><strong>Purpose:</strong> ${callDetails}</p>
          </div>

          <div style="background: #fff; border: 1px solid #e0ddd8; border-radius: 6px; padding: 15px;">
            <p style="font-size: 14px; color: #666;">📱 <strong>Preparation Tips:</strong></p>
            <ul style="padding-left: 20px; font-size: 14px; color: #666;">
              <li>Be in a quiet environment</li>
              <li>Have any documents ready</li>
              <li>Test your connection if it’s a video call</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">We appreciate your trust in <strong>Dream Studio</strong> ❤️</p>
          <p>Best regards,<br/>Dream Studio Team</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(
    clientEmail,
    `📞 ${label} Reminder - ${minutesLabel} | ${callDetails}`,
    html
  );
}
