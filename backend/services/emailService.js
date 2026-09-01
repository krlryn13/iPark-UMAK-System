const nodemailer = require('nodemailer');

const EMAIL_USER = (process.env.EMAIL_USER || 'iparkumak@gmail.com').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || 'pwdqxkqkpqgyqadz').trim();

/**
 * Universal Email Sender via Brevo HTTP REST API (Cloud) or Nodemailer (Localhost)
 */
const sendMail = async (mailOptions) => {
  const fetchApi = globalThis.fetch || fetch;
  const brevoApiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';

  // 1. Production Cloud Delivery via Brevo HTTPS REST API (Port 443 - Never blocked)
  if (brevoApiKey) {
    console.log(`[BREVO API DISPATCH] Sending email to ${mailOptions.to} via Brevo HTTP API...`);
    try {
      const response = await fetchApi('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'iPark UMAK System', email: EMAIL_USER },
          to: [{ email: mailOptions.to }],
          subject: mailOptions.subject,
          htmlContent: mailOptions.html
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[BREVO SUCCESS] Email delivered to ${mailOptions.to}! MessageID:`, data.messageId);
        return data;
      } else {
        console.error(`[BREVO API ERROR] Status ${response.status}:`, data);
      }
    } catch (bErr) {
      console.error(`[BREVO DISPATCH ERROR]:`, bErr.message);
    }
  }

  // 2. Localhost Delivery via Nodemailer Gmail SMTP
  console.log(`[SMTP DISPATCH] Sending email to ${mailOptions.to} via Gmail SMTP (${EMAIL_USER})...`);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const info = await transporter.sendMail({
    ...mailOptions,
    from: `"iPark UMAK System" <${EMAIL_USER}>`
  });
  console.log(`[SMTP SUCCESS] Delivered to ${mailOptions.to}! MessageId: ${info.messageId}`);
  return info;
};

/**
 * Format raw date to readable format (e.g., "Monday, Sep 1, 2026")
 */
const formatDateClean = (rawDate) => {
  if (!rawDate) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return `${daysOfWeek[rawDate.getDay()]}, ${monthNames[rawDate.getMonth()]} ${rawDate.getDate()}, ${rawDate.getFullYear()}`;
  }
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
 * Base Email Wrapper for Rich Responsive Design
 */
const wrapEmailTemplate = ({ headerTitle, headerSubtitle, contentHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background-color:#F1F5F9;">
    <tr>
      <td align="center">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0A1F5C 0%, #061339 100%);padding:28px 36px;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">iPark <span style="color:#F5821F;">UMAK</span></span>
                    <p style="margin:4px 0 0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1.5px;">${headerSubtitle || 'Official Campus Parking & Access Management'}</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;padding:6px 12px;background:rgba(245,130,31,0.2);border:1px solid rgba(245,130,31,0.4);border-radius:20px;color:#F5821F;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">OHSO Verified</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:36px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer Notice -->
          <tr>
            <td style="background:#F8FAFC;padding:24px 36px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#0A1F5C;text-transform:uppercase;letter-spacing:1px;">University of Makati — Office of Higher Safety & Security (OHSO)</p>
              <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.5;">This is an automated system notification from iPark UMAK. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * 1. Sends a 6-digit verification code email to new user.
 */
const sendVerificationEmail = async (toEmail, name, code) => {
  const contentHtml = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0A1F5C;">Account Verification Code</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
      Hello <strong>${name}</strong>, thank you for registering with iPark UMAK. Please use the verification code below to verify your email account.
    </p>
    <div style="background:#F0F4FF;border:2px dashed #C7D2EE;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;color:#0A1F5C;text-transform:uppercase;letter-spacing:1.5px;">One-Time Security PIN</p>
      <p style="margin:0;font-size:36px;font-weight:900;color:#F5821F;letter-spacing:8px;font-family:monospace;">${code}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;">
      🔒 Code expires in 15 minutes. Never share this security PIN with anyone.
    </p>
  `;

  const mailOptions = {
    to: toEmail,
    subject: 'iPark UMAK — Account Verification Code',
    text: `Hi ${name},\n\nYour iPark UMAK one-time verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nUniversity of Makati - iPark UMAK System`,
    html: wrapEmailTemplate({
      headerTitle: 'iPark UMAK Account Verification',
      headerSubtitle: 'User Account Activation',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

/**
 * 2. Sends Vehicle Sticker Application Status Notification Email (Approved / Rejected / Issued)
 */
const sendStickerStatusEmail = async (toEmail, applicantName, status, stickerNumber, vehicleType, plateNumber) => {
  const isApproved = status === 'approved' || status === 'issued';
  const statusColor = isApproved ? '#10B981' : '#EF4444';
  const statusBg = isApproved ? '#ECFDF5' : '#FEF2F2';
  const statusBorder = isApproved ? '#A7F3D0' : '#FECACA';
  const statusText = isApproved ? 'APPROVED & ISSUED' : 'APPLICATION REJECTED';

  const contentHtml = `
    <div style="background:${statusBg};border:1px solid ${statusBorder};border-radius:16px;padding:20px;text-align:center;margin-bottom:28px;">
      <span style="display:inline-block;padding:6px 16px;background:${statusColor};color:#ffffff;font-size:12px;font-weight:800;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">
        ${isApproved ? '✓ ' + statusText : '✖ ' + statusText}
      </span>
      <h2 style="margin:14px 0 4px;font-size:22px;font-weight:800;color:#0A1F5C;">
        ${isApproved ? 'Vehicle Sticker Approved!' : 'Application Update'}
      </h2>
      <p style="margin:0;font-size:13px;color:#475569;">
        Application Status: <strong style="color:${statusColor};">${status.toUpperCase()}</strong>
      </p>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      Hello <strong>${applicantName || 'Applicant'}</strong>, your UMak Vehicle Sticker application has been processed by the Office of Higher Safety & Security (OHSO).
    </p>

    <!-- Digital Sticker Card Summary -->
    <div style="background:linear-gradient(135deg, #0A1F5C 0%, #1E293B 100%);border-radius:18px;padding:24px;color:#ffffff;margin-bottom:24px;box-shadow:0 8px 20px rgba(10,31,92,0.15);">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#F5821F;text-transform:uppercase;letter-spacing:1.5px;">Official UMak Vehicle Sticker</p>
      <p style="margin:0 0 16px;font-size:24px;font-weight:900;color:#FBBF24;font-family:monospace;letter-spacing:1px;">
        ${stickerNumber || 'UMK-STICKER-PENDING'}
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.15);padding-top:14px;font-size:12px;">
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Plate Number:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;font-family:monospace;">${plateNumber ? plateNumber.toUpperCase() : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Vehicle Type:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;text-transform:uppercase;">${vehicleType || 'CAR'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Fee & Payment:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#34D399;">₱200.00 (PAID)</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Sticker Validity:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#FBBF24;">1 Academic Year</td>
        </tr>
      </table>
    </div>

    ${isApproved ? `
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:18px;margin-bottom:20px;">
        <h4 style="margin:0 0 6px;font-size:13px;font-weight:800;color:#166534;">📌 Pickup Instructions:</h4>
        <p style="margin:0;font-size:12px;color:#15803D;line-height:1.5;">
          Please present your Student/Faculty ID at the <strong>OHSO Security Office (HPSB Building Ground Floor)</strong> to claim your physical hologram vehicle sticker.
        </p>
      </div>
    ` : `
      <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:14px;padding:18px;margin-bottom:20px;">
        <h4 style="margin:0 0 6px;font-size:13px;font-weight:800;color:#991B1B;">⚠️ Application Notice:</h4>
        <p style="margin:0;font-size:12px;color:#B91C1C;line-height:1.5;">
          Your application was rejected. Please log into your iPark UMAK account to check admin remarks and re-submit valid document requirements.
        </p>
      </div>
    `}
  `;

  const mailOptions = {
    to: toEmail,
    subject: `UMak Vehicle Sticker ${isApproved ? 'APPROVED' : status.toUpperCase()} — ${stickerNumber || plateNumber}`,
    text: `Hi ${applicantName},\n\nYour UMak Vehicle Sticker application status is: ${status.toUpperCase()}.\nSticker Number: ${stickerNumber || 'N/A'}\nPlate Number: ${plateNumber}\n\nUniversity of Makati OHSO Security`,
    html: wrapEmailTemplate({
      headerTitle: `UMak Vehicle Sticker ${status.toUpperCase()}`,
      headerSubtitle: 'OHSO Vehicle Sticker Registration',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

/**
 * 3. Sends Visitor Parking E-Pass Confirmation Email
 */
const sendGuestPassEmail = async (toEmail, guestName, passCode, eventName, eventDate, timeStart, timeEnd, venue, plateNumber, preferredLevel = 'HPSB Level 2') => {
  const formattedDate = formatDateClean(eventDate);
  const parkingFloor = preferredLevel || 'HPSB Level 2';

  const contentHtml = `
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;padding:6px 16px;background:#10B981;color:#ffffff;font-size:11px;font-weight:800;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">
        ✓ CONFIRMED PARKING PASS
      </span>
      <h2 style="margin:12px 0 4px;font-size:22px;font-weight:800;color:#0A1F5C;">UMak Visitor Parking E-Pass</h2>
      <p style="margin:0;font-size:12px;color:#166534;">Present this digital ticket at HPSB Gate Security</p>
    </div>

    <!-- Pass Reference Box -->
    <div style="background:#0A1F5C;border-radius:18px;padding:24px;color:#ffffff;text-align:center;margin-bottom:24px;box-shadow:0 8px 20px rgba(10,31,92,0.15);">
      <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#F5821F;text-transform:uppercase;letter-spacing:1.5px;">E-Pass Reference Code</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#FBBF24;font-family:monospace;letter-spacing:3px;">${passCode}</p>
    </div>

    <!-- Pass Details Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin-bottom:24px;font-size:13px;">
      <tr>
        <td style="padding:6px 0;color:#64748B;">Guest Name:</td>
        <td align="right" style="padding:6px 0;font-weight:800;color:#0F172A;">${guestName}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748B;">Vehicle Plate:</td>
        <td align="right" style="padding:6px 0;font-weight:800;color:#0F172A;font-family:monospace;">${plateNumber ? plateNumber.toUpperCase() : 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748B;">Event / Purpose:</td>
        <td align="right" style="padding:6px 0;font-weight:800;color:#0A1F5C;">${eventName}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748B;">Assigned Level:</td>
        <td align="right" style="padding:6px 0;font-weight:800;color:#F5821F;">${parkingFloor}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748B;">Event Date:</td>
        <td align="right" style="padding:6px 0;font-weight:800;color:#0F172A;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748B;">Schedule:</td>
        <td align="right" style="padding:6px 0;font-weight:800;color:#0F172A;">${timeStart} - ${timeEnd}</td>
      </tr>
    </table>

    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;padding:16px;font-size:12px;color:#1E40AF;line-height:1.5;">
      ℹ️ <strong>Campus Entry Guidelines:</strong> Please show this digital email pass or screenshot to OHSO Security Officers at the HPSB Building gate.
    </div>
  `;

  const mailOptions = {
    to: toEmail,
    subject: `UMak Visitor Parking E-Pass Confirmation — ${passCode}`,
    text: `Hi ${guestName},\n\nYour UMak Visitor Parking E-Pass is confirmed.\nPass Code: ${passCode}\nEvent: ${eventName}\nAssigned Level: ${parkingFloor}\nDate: ${formattedDate} (${timeStart} - ${timeEnd})\n\nUniversity of Makati OHSO Security`,
    html: wrapEmailTemplate({
      headerTitle: 'UMak Visitor Parking E-Pass',
      headerSubtitle: 'Campus Visitor Access Pass',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

/**
 * 4. Sends Visitor Parking Pass Status Update Notification Email
 */
const sendGuestPassStatusEmail = async (toEmail, guestName, status, passCode, eventName, eventDate, timeStart, timeEnd, venue, plateNumber, vehicleDetails) => {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#10B981' : '#EF4444';
  const statusBg = isApproved ? '#ECFDF5' : '#FEF2F2';
  const statusBorder = isApproved ? '#A7F3D0' : '#FECACA';

  const contentHtml = `
    <div style="background:${statusBg};border:1px solid ${statusBorder};border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;padding:6px 16px;background:${statusColor};color:#ffffff;font-size:11px;font-weight:800;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">
        ${isApproved ? '✓ VISITOR PASS APPROVED' : '✖ VISITOR PASS REJECTED'}
      </span>
      <h2 style="margin:12px 0 4px;font-size:22px;font-weight:800;color:#0A1F5C;">Guest Reservation ${status.toUpperCase()}</h2>
      <p style="margin:0;font-size:12px;color:#475569;">Pass Reference Code: <strong style="font-family:monospace;color:#0A1F5C;">${passCode}</strong></p>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      Hello <strong>${guestName}</strong>, your guest parking reservation request for <strong>${eventName}</strong> has been updated to <strong>${status.toUpperCase()}</strong> by Campus OHSO Security.
    </p>
  `;

  const mailOptions = {
    to: toEmail,
    subject: `UMak Visitor Pass Status: ${status.toUpperCase()} — ${passCode}`,
    text: `Hi ${guestName},\n\nYour visitor parking reservation status for ${eventName} is: ${status.toUpperCase()}.\nPass Code: ${passCode}\n\nUniversity of Makati OHSO Security`,
    html: wrapEmailTemplate({
      headerTitle: `UMak Visitor Pass Status ${status.toUpperCase()}`,
      headerSubtitle: 'Guest Reservation Processing',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

/**
 * 5. Sends Account Unlocked Notice Email
 */
const sendAccountUnlockedEmail = async (toEmail, userName) => {
  const contentHtml = `
    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;padding:6px 16px;background:#10B981;color:#ffffff;font-size:11px;font-weight:800;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">
        ✓ ACCOUNT UNLOCKED
      </span>
      <h2 style="margin:12px 0 4px;font-size:22px;font-weight:800;color:#0A1F5C;">Account Restored Successfully</h2>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      Hello <strong>${userName || 'User'}</strong>, your iPark UMAK account (<strong>${toEmail}</strong>) has been unlocked by an OHSO Administrator.
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#64748B;line-height:1.5;">
      You may now log back into the iPark UMAK Portal using your credentials.
    </p>
  `;

  const mailOptions = {
    to: toEmail,
    subject: `iPark UMAK — Account Unlocked Notice`,
    text: `Hi ${userName},\n\nYour iPark UMAK account (${toEmail}) has been unlocked by OHSO Admin.\n\nUniversity of Makati`,
    html: wrapEmailTemplate({
      headerTitle: 'iPark UMAK Account Unlocked',
      headerSubtitle: 'Account Security Restored',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

/**
 * 6. Sends Password Reset OTP Verification Email
 */
const sendPasswordResetEmail = async (toEmail, name, otp) => {
  const contentHtml = `
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0A1F5C;">Password Reset Request</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
      Hello <strong>${name || 'User'}</strong>, we received a request to reset your password. Use the verification code below to proceed with resetting your account password.
    </p>
    <div style="background:#FFF7ED;border:2px dashed #FDBA74;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;color:#9A3412;text-transform:uppercase;letter-spacing:1.5px;">Password Reset Security Code</p>
      <p style="margin:0;font-size:36px;font-weight:900;color:#F5821F;letter-spacing:8px;font-family:monospace;">${otp}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;">
      🔒 If you did not request a password reset, please ignore this email.
    </p>
  `;

  const mailOptions = {
    to: toEmail,
    subject: 'iPark UMAK — Password Reset Verification Code',
    text: `Hi ${name},\n\nYour iPark UMAK password reset OTP is: ${otp}\n\nUniversity of Makati`,
    html: wrapEmailTemplate({
      headerTitle: 'iPark UMAK Password Reset',
      headerSubtitle: 'Security Code Request',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendGuestPassEmail,
  sendStickerStatusEmail,
  sendGuestPassStatusEmail,
  sendAccountUnlockedEmail,
  sendPasswordResetEmail
};
