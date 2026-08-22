const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends a 6-digit verification code email to the new user.
 * @param {string} toEmail
 * @param {string} name
 * @param {string} code
 */
const sendVerificationEmail = async (toEmail, name, code) => {
  const mailOptions = {
    from: `"iPark UMAK" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'iPark UMAK — Account Verification Code',
    text: `Hi ${name},\n\nYour iPark UMAK one-time verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nThank you,\nUniversity of Makati - iPark UMAK System`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>iPark UMAK Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#EEF2F7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0"
          style="max-width:540px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #DDE3EE;">

          <!-- ===== NAVY HEADER BAND ===== -->
          <tr>
            <td style="background:#0A1F5C;padding:0;">
              <!-- Top accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="background:#0A1F5C;height:4px;"></td>
                  <td width="33%" style="background:#F5821F;height:4px;"></td>
                  <td width="34%" style="background:#0A1F5C;height:4px;"></td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 24px;">

                    <!-- Brand wordmark -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <!-- Parking P icon — pure SVG, no external assets -->
                          <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;">
                            <tr>
                              <td style="background:#F5821F;border-radius:8px;padding:6px 10px;vertical-align:middle;">
                                <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="3.5" height="22" rx="1.5" fill="white"/>
                                  <rect x="3.5" width="9" height="3.5" rx="1.5" fill="white"/>
                                  <rect x="3.5" y="9" width="9" height="3.5" rx="1.5" fill="white"/>
                                  <rect x="12.5" y="3.5" width="3.5" height="9" rx="1.5" fill="white"/>
                                </svg>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1;">iPark</span>
                          <span style="font-size:13px;font-weight:700;color:#F5821F;margin-left:4px;letter-spacing:1px;text-transform:uppercase;">UMAK</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Tagline -->
                    <p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:2.5px;text-transform:uppercase;font-weight:500;">
                      Smart Campus Parking · University of Makati
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td style="padding:36px 40px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0A1F5C;line-height:1.3;">
                Verify your Heron account
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#5A6B8A;line-height:1.7;">
                Hi <strong style="color:#0f172a;">${name}</strong>, enter the code below to activate your
                iPark UMAK account. This confirms you are an official UMak student, faculty, or staff member.
              </p>

              <!-- ===== OTP BLOCK ===== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#F0F4FF;border:1.5px solid #C7D2EE;border-radius:14px;padding:30px 24px;text-align:center;">

                    <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#7B90B4;">
                      One-Time Verification Code
                    </p>

                    <!-- Code digits displayed in individual boxes -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
                      <tr>
                        ${code.split('').map(digit => `
                        <td style="padding:0 4px;">
                          <span style="display:inline-block;width:42px;height:52px;line-height:52px;text-align:center;
                            background:#ffffff;border:1.5px solid #C7D2EE;border-radius:10px;
                            font-size:28px;font-weight:900;color:#0A1F5C;font-family:'Courier New',monospace;
                            box-shadow:0 2px 6px rgba(10,31,92,0.08);">${digit}</span>
                        </td>`).join('')}
                      </tr>
                    </table>

                    <!-- Timer row using SVG clock icon -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="vertical-align:middle;padding-right:5px;">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="#94A3B8" stroke-width="2"/>
                            <path d="M12 6v6l4 2" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </td>
                        <td style="font-size:11px;color:#94a3b8;vertical-align:middle;">
                          Expires in <strong style="color:#5A6B8A;">15 minutes</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Context line -->
              <p style="margin:0 0 24px;font-size:13px;color:#5A6B8A;line-height:1.6;">
                Enter this code on the iPark UMAK registration page for:
                <br>
                <strong style="color:#0A1F5C;font-family:'Courier New',monospace;">${toEmail}</strong>
              </p>

              <!-- ===== SECURITY NOTICE — no emoji, SVG shield icon ===== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FFF8F2;border-left:3px solid #F5821F;border-radius:0 10px 10px 0;padding:13px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:10px;padding-top:1px;">
                          <svg width="15" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                              fill="#F5821F" fill-opacity="0.15" stroke="#F5821F" stroke-width="2" stroke-linejoin="round"/>
                            <path d="M12 8v4M12 16h.01" stroke="#C05600" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </td>
                        <td>
                          <p style="margin:0;font-size:12px;color:#7A3500;line-height:1.6;">
                            <strong>Security notice:</strong> Do not share this code with anyone.
                            iPark UMAK will never ask for your verification code through calls, chat, or email replies.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ===== DIVIDER ===== -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #E8EDF5;margin:0;">
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Left: campus detail -->
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;">
                      University of Makati
                    </p>
                    <p style="margin:0;font-size:11px;color:#B0BDCC;line-height:1.5;">
                      HPSB Building — Parking System<br>
                      J.P. Rizal Ext, West Rembo, Taguig
                    </p>
                  </td>
                  <!-- Right: dot status -->
                  <td style="text-align:right;vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-left:auto;">
                      <tr>
                        <td style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:20px;padding:4px 10px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:5px;vertical-align:middle;">
                                <span style="display:inline-block;width:7px;height:7px;background:#10B981;border-radius:50%;"></span>
                              </td>
                              <td style="font-size:10px;font-weight:700;color:#065F46;vertical-align:middle;letter-spacing:0.5px;">
                                SYSTEM ONLINE
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`[EMAIL SENT] Verification code ${code} sent to ${toEmail}`);
};

/**
 * Helper to format raw date (Date object or string) into clean readable date (e.g. "Wed, Aug 19, 2026")
 * MySQL returns DATE columns as JavaScript Date objects, so we must handle both.
 */
const formatDateClean = (rawDate) => {
  if (!rawDate) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // If it's already a Date object (MySQL driver returns Date for DATE columns)
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return `${daysOfWeek[rawDate.getDay()]}, ${monthNames[rawDate.getMonth()]} ${rawDate.getDate()}, ${rawDate.getFullYear()}`;
  }

  // Try parsing as "YYYY-MM-DD" string
  const dateStr = String(rawDate).split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, monthIdx, day);
    if (!isNaN(d.getTime())) {
      return `${daysOfWeek[d.getDay()]}, ${monthNames[monthIdx]} ${day}, ${year}`;
    }
  }
  return String(rawDate);
};

/**
 * Sends a confirmation email to the guest/visitor with their UMak Parking E-Pass.
 */
const sendGuestPassEmail = async (toEmail, guestName, passCode, eventName, eventDate, timeStart, timeEnd, venue, plateNumber, preferredLevel = 'HPSB Level 2') => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[EMAIL NOTICE] SMTP credentials not configured in .env. Pass ${passCode} logged for ${toEmail}.`);
      return;
    }

    const formattedDate = formatDateClean(eventDate);
    const parkingFloor = preferredLevel || 'HPSB Level 2';

    const mailOptions = {
      from: `"iPark UMAK - OHSO" <${process.env.EMAIL_USER}>`,
      replyTo: process.env.EMAIL_USER,
      to: toEmail,
      subject: `UMak Visitor Parking E-Pass Confirmation — ${passCode}`,
      text: `Hello ${guestName},\n\nYour UMak visitor parking reservation for ${eventName} on ${formattedDate} (${timeStart} - ${timeEnd}) has been received.\n\nPass Reference Code: ${passCode}\nAssigned Floor: ${parkingFloor}\nVenue: ${venue}\nPlate Number: ${plateNumber}\n\nPlease present this code or email to the OHSO Security Officer at HPSB Gate upon arrival.\n\nThank you,\nOccupational Health and Safety Office (OHSO) - University of Makati`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UMak Visitor Parking E-Pass</title>
</head>
<body style="margin:0;padding:0;background-color:#EEF2F7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #DDE3EE;">
          <tr>
            <td style="background:#0A1F5C;padding:24px 32px;color:#ffffff;">
              <span style="font-size:20px;font-weight:900;">iPark <span style="color:#F5821F;">UMAK</span></span>
              <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">OHSO Official Visitor Parking Confirmation</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 10px;font-size:20px;color:#0A1F5C;">Parking Reservation Received</h2>
              <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
                Hello <strong>${guestName}</strong>, your visitor parking reservation for <strong>${eventName}</strong> has been received and registered with campus security.
              </p>
              
              <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:14px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;">Your Pass Reference Code</p>
                <p style="margin:0;font-size:24px;font-weight:900;color:#15803D;font-family:monospace;">${passCode}</p>
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:20px;">
                <tr><td width="38%" style="color:#64748B;">Date:</td><td><strong>${formattedDate}</strong></td></tr>
                <tr><td style="color:#64748B;">Schedule:</td><td><strong>${timeStart} to ${timeEnd}</strong></td></tr>
                <tr><td style="color:#64748B;">Assigned Floor:</td><td><strong style="color:#15803D;">${parkingFloor}</strong></td></tr>
                <tr><td style="color:#64748B;">Venue:</td><td><strong>${venue}</strong></td></tr>
                <tr><td style="color:#64748B;">Plate Number:</td><td><strong style="text-transform:uppercase;font-family:monospace;">${plateNumber}</strong></td></tr>
              </table>

              <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;border-top:1px solid #E2E8F0;padding-top:16px;">
                <strong>Notice:</strong> Please present this email or your Pass Reference Code (<strong>${passCode}</strong>) to the OHSO Security Officer at HPSB Gate upon arrival.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[GUEST EMAIL SENT] Confirmation pass ${passCode} sent to ${toEmail}`);
  } catch (err) {
    console.error(`[GUEST EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message);
  }
};

/**
 * Sends notification email when OHSO Admin approves or rejects a Vehicle Sticker Application.
 */
const sendStickerStatusEmail = async (toEmail, applicantName, status, stickerNumber, vehicleType, plateNumber) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const isApproved = status === 'approved' || status === 'issued';
    const subject = isApproved
      ? `UMak Vehicle Sticker APPROVED — ${stickerNumber || 'Official Sticker'}`
      : `UMak Vehicle Sticker Application Status: ${status.toUpperCase()}`;

    const mailOptions = {
      from: `"iPark UMAK - OHSO" <${process.env.EMAIL_USER}>`,
      replyTo: process.env.EMAIL_USER,
      to: toEmail,
      subject,
      text: isApproved
        ? `Hello ${applicantName},\n\nGreat news! Your UMak Vehicle Sticker application for ${plateNumber} (${vehicleType}) has been APPROVED by OHSO Admin.\n\nSticker Number: ${stickerNumber}\nStatus: ${status.toUpperCase()}\n\nPlease present your E-Receipt or Student/Faculty ID at the OHSO Office (Basement, Admin Building) to collect your physical sticker.\n\nThank you,\nUniversity of Makati - OHSO`
        : `Hello ${applicantName},\n\nYour UMak Vehicle Sticker application for ${plateNumber} status has been updated to: ${status.toUpperCase()}.\n\nThank you,\nUniversity of Makati - OHSO`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Sticker Status</title></head>
<body style="margin:0;padding:0;background-color:#EEF2F7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #DDE3EE;">
          <tr>
            <td style="background:#0A1F5C;padding:24px 32px;color:#ffffff;">
              <span style="font-size:20px;font-weight:900;">iPark <span style="color:#F5821F;">UMAK</span></span>
              <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">OHSO Vehicle Sticker Verification Notice</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 10px;font-size:20px;color:${isApproved ? '#15803D' : '#B91C1C'};">
                Application ${isApproved ? 'APPROVED' : status.toUpperCase()}
              </h2>
              <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
                Hello <strong>${applicantName}</strong>, your campus vehicle sticker application for <strong>${plateNumber}</strong> (${vehicleType}) has been processed by OHSO Admin.
              </p>
              
              ${isApproved ? `
              <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:14px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;">Assigned Sticker Number</p>
                <p style="margin:0;font-size:24px;font-weight:900;color:#15803D;font-family:monospace;">${stickerNumber}</p>
              </div>
              <p style="margin:0 0 16px;font-size:13px;color:#334155;line-height:1.6;">
                <strong>Pickup Location:</strong> Occupational Health & Safety Office (OHSO) — Basement of Admin Building.
              </p>
              ` : `
              <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:14px;padding:20px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#991B1B;">Status: ${status.toUpperCase()}</p>
              </div>
              `}

              <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;border-top:1px solid #E2E8F0;padding-top:16px;">
                Thank you for supporting UMak smart campus mobility!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[STICKER EMAIL SENT] Status ${status} sent to ${toEmail}`);
  } catch (err) {
    console.error(`[STICKER EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message);
  }
};

/**
 * Sends notification email when OHSO Admin approves or rejects a Guest Parking Reservation.
 */
const sendGuestPassStatusEmail = async (toEmail, guestName, status, passCode, eventName, eventDate, timeStart, timeEnd, venue, plateNumber, vehicleDetails) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const isApproved = status === 'approved';
    const formattedDate = formatDateClean(eventDate);
    
    // Extract parking floor level if present in vehicleDetails, or default to HPSB Level 2
    let floorText = 'HPSB Level 2';
    if (vehicleDetails && vehicleDetails.includes('[Floor:')) {
      const match = vehicleDetails.match(/\[Floor:\s*([^\]]+)\]/);
      if (match && match[1]) {
        floorText = match[1].trim();
      }
    }

    const subject = isApproved
      ? `UMak Visitor Parking Pass APPROVED — ${passCode}`
      : `UMak Visitor Parking Pass Status: ${status.toUpperCase()}`;

    const mailOptions = {
      from: `"iPark UMAK - OHSO" <${process.env.EMAIL_USER}>`,
      replyTo: process.env.EMAIL_USER,
      to: toEmail,
      subject,
      text: isApproved
        ? `Hello ${guestName},\n\nYour UMak visitor parking pass (${passCode}) for ${eventName} on ${formattedDate} has been APPROVED by OHSO Admin & Security.\n\nAssigned Floor: ${floorText}\nSchedule: ${timeStart || '08:00'} - ${timeEnd || '17:00'}\nVenue: ${venue || 'HPSB Building'}\nPlate Number: ${plateNumber || 'Registered Vehicle'}\n\nPlease present this email or your Pass Code (${passCode}) at HPSB Gate upon arrival.\n\nThank you,\nOccupational Health and Safety Office (OHSO) - University of Makati`
        : `Hello ${guestName},\n\nYour visitor parking reservation (${passCode}) status has been updated to: ${status.toUpperCase()}.\n\nThank you,\nUniversity of Makati - OHSO`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Guest Pass Status</title></head>
<body style="margin:0;padding:0;background-color:#EEF2F7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #DDE3EE;">
          <tr>
            <td style="background:#0A1F5C;padding:24px 32px;color:#ffffff;">
              <span style="font-size:20px;font-weight:900;">iPark <span style="color:#F5821F;">UMAK</span></span>
              <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">OHSO Visitor Pass Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 10px;font-size:20px;color:${isApproved ? '#15803D' : '#B91C1C'};">
                Visitor Pass ${isApproved ? 'APPROVED' : status.toUpperCase()}
              </h2>
              <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
                Hello <strong>${guestName}</strong>, your visitor parking pass for <strong>${eventName}</strong> on <strong>${formattedDate}</strong> has been <strong>${status.toUpperCase()}</strong> by OHSO Security Administration.
              </p>
              
              <div style="background:${isApproved ? '#F0FDF4' : '#FEF2F2'};border:1.5px solid ${isApproved ? '#BBF7D0' : '#FCA5A5'};border-radius:14px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:${isApproved ? '#166534' : '#991B1B'};text-transform:uppercase;letter-spacing:1px;">Pass Reference Code</p>
                <p style="margin:0;font-size:24px;font-weight:900;color:${isApproved ? '#15803D' : '#991B1B'};font-family:monospace;">${passCode}</p>
              </div>

              ${isApproved ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:20px;">
                <tr><td width="38%" style="color:#64748B;">Date & Schedule:</td><td><strong>${formattedDate} (${timeStart || '08:00'} - ${timeEnd || '17:00'})</strong></td></tr>
                <tr><td style="color:#64748B;">Assigned Floor:</td><td><strong style="color:#15803D;">${floorText}</strong></td></tr>
                ${venue ? `<tr><td style="color:#64748B;">Venue:</td><td><strong>${venue}</strong></td></tr>` : ''}
                ${plateNumber ? `<tr><td style="color:#64748B;">Plate Number:</td><td><strong style="text-transform:uppercase;font-family:monospace;">${plateNumber}</strong></td></tr>` : ''}
              </table>
              ` : ''}

              <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;border-top:1px solid #E2E8F0;padding-top:16px;">
                Present this code to the OHSO Security Officer at HPSB Gate upon arrival.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[GUEST STATUS EMAIL SENT] Pass ${passCode} status ${status} sent to ${toEmail}`);
  } catch (err) {
    console.error(`[GUEST STATUS EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendGuestPassEmail,
  sendStickerStatusEmail,
  sendGuestPassStatusEmail
};
