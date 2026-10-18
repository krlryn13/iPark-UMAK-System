const nodemailer = require('nodemailer');

const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || '').trim();

const sendMail = async (mailOptions) => {
  const fetchApi = globalThis.fetch || fetch;
  const brevoApiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';

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

const formatDateClean = (rawDate) => {
  if (!rawDate) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let d;
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    d = rawDate;
  } else if (typeof rawDate === 'string') {
    const s = rawDate.trim();
    const matchYMD = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchYMD) {
      d = new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10));
    } else {
      d = new Date(s);
    }
  } else {
    d = new Date(rawDate);
  }

  if (!d || isNaN(d.getTime())) return String(rawDate);
  return `${daysOfWeek[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * Base Email Wrapper for Premium Responsive Brand Design (No generic emojis, pure SVG vector marks)
 */
const wrapEmailTemplate = ({ headerTitle, headerSubtitle, contentHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:36px 16px;background-color:#F8FAFC;">
    <tr>
      <td align="center">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 12px 30px -8px rgba(10,31,92,0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0A1F5C 0%, #061339 100%);padding:26px 32px;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">iPark <span style="color:#F5821F;">UMAK</span></span>
                    <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1.5px;">${headerSubtitle || 'Official Campus Parking & Access Management'}</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;padding:5px 12px;background:rgba(245,130,31,0.18);border:1px solid rgba(245,130,31,0.4);border-radius:16px;color:#F5821F;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">OHSO Verified</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:32px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer Notice -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#0A1F5C;text-transform:uppercase;letter-spacing:1px;">University of Makati — Office of Higher Safety & Security (OHSO)</p>
              <p style="margin:0;font-size:10px;color:#94A3B8;line-height:1.5;">This is an automated security system notification from iPark UMAK. Please do not reply directly to this message.</p>
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
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0A1F5C;">Account Verification Code</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#475569;line-height:1.6;">
      Hello <strong>${name}</strong>, thank you for registering with iPark UMAK. Please use the security PIN below to verify your account.
    </p>
    <div style="background:#F0F4FF;border:1px solid #C7D2EE;border-radius:16px;padding:22px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:800;color:#0A1F5C;text-transform:uppercase;letter-spacing:1.5px;">One-Time Security PIN</p>
      <p style="margin:0;font-size:34px;font-weight:900;color:#F5821F;letter-spacing:8px;font-family:monospace;">${code}</p>
    </div>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 16px;font-size:11px;color:#64748B;">
      <strong style="color:#0A1F5C;">SECURITY NOTICE:</strong> Code expires in 15 minutes. Never share this PIN with anyone.
    </div>
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
 * 2. Sends Vehicle Sticker Application Status Notification Email (Approved / Rejected)
 */
const sendStickerStatusEmail = async (toEmail, applicantName, status, stickerNumber, vehicleType, plateNumber, claimDate, rejectionReason) => {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#059669' : '#DC2626';
  const statusBg = isApproved ? '#ECFDF5' : '#FEF2F2';
  const statusBorder = isApproved ? '#A7F3D0' : '#FECACA';
  const statusText = isApproved ? 'APPLICATION APPROVED — PROCEED TO PAYMENT' : 'APPLICATION REJECTED';

  const formattedClaimDate = claimDate ? formatDateClean(claimDate) : 'Upon payment verification';

  const contentHtml = `
    <div style="background:${statusBg};border:1px solid ${statusBorder};border-radius:16px;padding:18px;text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;padding:5px 14px;background:${statusColor};color:#ffffff;font-size:11px;font-weight:800;border-radius:16px;text-transform:uppercase;letter-spacing:1px;">
        ${statusText}
      </span>
      <h2 style="margin:12px 0 4px;font-size:20px;font-weight:800;color:#0A1F5C;">
        ${isApproved ? 'Documents Verified & Approved!' : 'Application Requires Attention'}
      </h2>
      <p style="margin:0;font-size:12px;color:#475569;">
        Application Status: <strong style="color:${statusColor};">${status.toUpperCase()}</strong>
      </p>
    </div>

    <p style="margin:0 0 18px;font-size:13px;color:#475569;line-height:1.6;">
      Hello <strong>${applicantName || 'Applicant'}</strong>, your vehicle sticker requirements have been officially reviewed by the Office of Higher Safety & Security (OHSO).
    </p>

    <!-- Digital Card Summary -->
    <div style="background:linear-gradient(135deg, #0A1F5C 0%, #1E293B 100%);border-radius:16px;padding:22px;color:#ffffff;margin-bottom:22px;box-shadow:0 8px 20px rgba(10,31,92,0.12);">
      <p style="margin:0 0 4px;font-size:9px;font-weight:800;color:#F5821F;text-transform:uppercase;letter-spacing:1.5px;">UMak Vehicle Sticker Registration</p>
      <p style="margin:0 0 14px;font-size:20px;font-weight:900;color:#FBBF24;font-family:monospace;letter-spacing:1px;">
        ${stickerNumber || 'OFFICIAL UMak STICKER'}
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.15);padding-top:12px;font-size:12px;">
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Plate / MV File No:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;font-family:monospace;">${plateNumber ? plateNumber.toUpperCase() : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Vehicle Category:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;text-transform:uppercase;">${vehicleType || 'CAR'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Sticker Fee:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#FBBF24;">₱200.00</td>
        </tr>
        ${claimDate ? `
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Scheduled Pickup Date:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#38BDF8;">${formattedClaimDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${isApproved ? `
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:16px;margin-bottom:18px;">
        <h4 style="margin:0 0 6px;font-size:12px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Next Step: Pay ₱200 & Upload Proof of Payment</h4>
        <p style="margin:0 0 10px;font-size:12px;color:#15803D;line-height:1.5;">
          Your submitted documents (LTO OR/CR, Driver's License, Student ID) are fully verified! Please log in to your iPark UMAK dashboard to pay the ₱200 sticker fee and upload your payment proof screenshot.
        </p>
        <p style="margin:0;font-size:11px;color:#166534;font-weight:700;">
          Pickup Schedule: <strong>${formattedClaimDate}</strong> at the OHSO Security Office (HPSB Building Ground Floor).
        </p>
      </div>
    ` : `
      <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:14px;padding:16px;margin-bottom:18px;">
        <h4 style="margin:0 0 4px;font-size:12px;font-weight:800;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;">Reason for Rejection</h4>
        <p style="margin:0 0 8px;font-size:12px;color:#B91C1C;line-height:1.5;">
          ${rejectionReason || 'Uploaded documents did not meet verification standards. Please verify the photos are clear, legible, and match your registered vehicle details.'}
        </p>
        <p style="margin:0;font-size:11px;color:#7F1D1D;">
          Please log into your iPark UMAK account to resubmit clear copies of your documents.
        </p>
      </div>
    `}
  `;

  const mailOptions = {
    to: toEmail,
    subject: `UMak Vehicle Sticker ${isApproved ? 'APPROVED — Pay Online & Claim Date Set' : 'REJECTED — Resubmission Required'} (${plateNumber})`,
    text: `Hi ${applicantName},\n\nYour UMak Vehicle Sticker application status is: ${status.toUpperCase()}.\nPlate Number: ${plateNumber}\nPickup Date: ${formattedClaimDate}\n${rejectionReason ? `Reason: ${rejectionReason}\n` : ''}\nUniversity of Makati OHSO Security`,
    html: wrapEmailTemplate({
      headerTitle: `UMak Vehicle Sticker ${status.toUpperCase()}`,
      headerSubtitle: 'OHSO Vehicle Sticker Verification',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

/**
 * 2B. Sends Sticker Ready For Release Notification Email (After admin verifies proof of payment)
 */
const sendStickerReadyForReleaseEmail = async ({
  toEmail,
  applicantName,
  studentIdNum,
  stickerNumber,
  vehicleType,
  plateNumber,
  claimDate
}) => {
  if (!toEmail) return;

  const formattedClaimDate = claimDate ? formatDateClean(claimDate) : 'Today / During Office Hours';

  const contentHtml = `
    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:16px;padding:18px;text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;padding:5px 14px;background:#059669;color:#ffffff;font-size:11px;font-weight:800;border-radius:16px;text-transform:uppercase;letter-spacing:1px;">
        PAYMENT VERIFIED — STICKER READY FOR RELEASE
      </span>
      <h2 style="margin:12px 0 4px;font-size:20px;font-weight:800;color:#0A1F5C;">
        Your Sticker is Ready for Pickup!
      </h2>
      <p style="margin:0;font-size:12px;color:#166534;">
        Official Hologram Sticker Issued: <strong style="font-family:monospace;">${stickerNumber || 'UMK-STICKER-OFFICIAL'}</strong>
      </p>
    </div>

    <p style="margin:0 0 18px;font-size:13px;color:#475569;line-height:1.6;">
      Hello <strong>${applicantName || 'Applicant'}</strong>, your proof of payment (₱200.00) has been officially verified by the OHSO team. Your physical vehicle hologram sticker is ready for claiming!
    </p>

    <!-- Sticker Card Summary -->
    <div style="background:linear-gradient(135deg, #0A1F5C 0%, #1E293B 100%);border-radius:16px;padding:22px;color:#ffffff;margin-bottom:22px;box-shadow:0 8px 20px rgba(10,31,92,0.12);">
      <p style="margin:0 0 4px;font-size:9px;font-weight:800;color:#F5821F;text-transform:uppercase;letter-spacing:1.5px;">Official Campus Vehicle Sticker</p>
      <p style="margin:0 0 14px;font-size:24px;font-weight:900;color:#FBBF24;font-family:monospace;letter-spacing:2px;">
        ${stickerNumber || 'UMK-STICKER-READY'}
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.15);padding-top:12px;font-size:12px;">
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Student / Faculty ID:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;font-family:monospace;">${studentIdNum || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Plate / MV File No:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;font-family:monospace;">${plateNumber ? plateNumber.toUpperCase() : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Vehicle Category:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;text-transform:uppercase;">${vehicleType || 'CAR'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Payment Status:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#34D399;">₱200.00 VERIFIED PAID</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Pickup Schedule:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#38BDF8;">${formattedClaimDate}</td>
        </tr>
      </table>
    </div>

    <!-- Instructions Box -->
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;padding:16px;margin-bottom:18px;">
      <h4 style="margin:0 0 6px;font-size:12px;font-weight:800;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px;">Claiming Guidelines</h4>
      <p style="margin:0 0 6px;font-size:12px;color:#1E3A8A;line-height:1.5;">
        1. Bring your physical <strong>UMak Student/Faculty ID</strong>.<br/>
        2. Visit the <strong>OHSO Security Office, Ground Floor, HPSB Building</strong>.<br/>
        3. Show this email or your Digital Pass from your iPark UMAK dashboard.
      </p>
    </div>
  `;

  const mailOptions = {
    to: toEmail,
    subject: `UMak Vehicle Sticker READY FOR RELEASE — ${stickerNumber || plateNumber}`,
    text: `Hi ${applicantName},\n\nYour payment has been verified! Your UMak Vehicle Sticker is READY FOR RELEASE.\nSticker No: ${stickerNumber}\nPlate: ${plateNumber}\nClaim Date: ${formattedClaimDate}\nLocation: OHSO Security Office (HPSB Ground Floor)\n\nUniversity of Makati OHSO Security`,
    html: wrapEmailTemplate({
      headerTitle: 'UMak Vehicle Sticker Ready for Release',
      headerSubtitle: 'OHSO Sticker Releasing',
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
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;padding:18px;text-align:center;margin-bottom:22px;">
      <span style="display:inline-block;padding:5px 14px;background:#059669;color:#ffffff;font-size:11px;font-weight:800;border-radius:16px;text-transform:uppercase;letter-spacing:1px;">
        CONFIRMED PARKING E-PASS
      </span>
      <h2 style="margin:10px 0 4px;font-size:20px;font-weight:800;color:#0A1F5C;">UMak Visitor Parking E-Pass</h2>
      <p style="margin:0;font-size:12px;color:#166534;">Present this digital ticket at HPSB Gate Security</p>
    </div>

    <!-- Pass Reference Box -->
    <div style="background:#0A1F5C;border-radius:16px;padding:22px;color:#ffffff;text-align:center;margin-bottom:22px;box-shadow:0 8px 20px rgba(10,31,92,0.12);">
      <p style="margin:0 0 4px;font-size:9px;font-weight:800;color:#F5821F;text-transform:uppercase;letter-spacing:1.5px;">E-Pass Reference Code</p>
      <p style="margin:0;font-size:26px;font-weight:900;color:#FBBF24;font-family:monospace;letter-spacing:3px;">${passCode}</p>
    </div>

    <!-- Pass Details Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:18px;margin-bottom:22px;font-size:12px;">
      <tr>
        <td style="padding:5px 0;color:#64748B;">Guest Name:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;">${guestName}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Vehicle Plate:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;font-family:monospace;">${plateNumber ? plateNumber.toUpperCase() : 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Event / Purpose:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0A1F5C;">${eventName}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Assigned Level:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#F5821F;">${parkingFloor}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Event Date:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Schedule:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;">${timeStart} - ${timeEnd}</td>
      </tr>
    </table>

    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px;font-size:11px;color:#1E40AF;line-height:1.5;">
      <strong style="color:#0A1F5C;">CAMPUS ENTRY GUIDELINES:</strong> Please show this digital email pass or screenshot to OHSO Security Officers at the HPSB Building gate.
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
  const statusColor = isApproved ? '#059669' : '#DC2626';
  const statusBg = isApproved ? '#ECFDF5' : '#FEF2F2';
  const statusBorder = isApproved ? '#A7F3D0' : '#FECACA';

  const contentHtml = `
    <div style="background:${statusBg};border:1px solid ${statusBorder};border-radius:16px;padding:18px;text-align:center;margin-bottom:22px;">
      <span style="display:inline-block;padding:5px 14px;background:${statusColor};color:#ffffff;font-size:11px;font-weight:800;border-radius:16px;text-transform:uppercase;letter-spacing:1px;">
        ${isApproved ? 'VISITOR PASS APPROVED' : 'VISITOR PASS REJECTED'}
      </span>
      <h2 style="margin:10px 0 4px;font-size:20px;font-weight:800;color:#0A1F5C;">Guest Reservation ${status.toUpperCase()}</h2>
      <p style="margin:0;font-size:12px;color:#475569;">Pass Reference Code: <strong style="font-family:monospace;color:#0A1F5C;">${passCode}</strong></p>
    </div>

    <p style="margin:0 0 18px;font-size:13px;color:#475569;line-height:1.6;">
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
    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:16px;padding:18px;text-align:center;margin-bottom:22px;">
      <span style="display:inline-block;padding:5px 14px;background:#059669;color:#ffffff;font-size:11px;font-weight:800;border-radius:16px;text-transform:uppercase;letter-spacing:1px;">
        ACCOUNT RESTORED
      </span>
      <h2 style="margin:10px 0 4px;font-size:20px;font-weight:800;color:#0A1F5C;">Account Unlocked Successfully</h2>
    </div>

    <p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.6;">
      Hello <strong>${userName || 'User'}</strong>, your iPark UMAK account (<strong>${toEmail}</strong>) has been unlocked by an OHSO Administrator.
    </p>
    <p style="margin:0 0 20px;font-size:12px;color:#64748B;line-height:1.5;">
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
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0A1F5C;">Password Reset Request</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#475569;line-height:1.6;">
      Hello <strong>${name || 'User'}</strong>, we received a request to reset your password. Use the security PIN below to proceed with resetting your password.
    </p>
    <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:16px;padding:22px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:800;color:#9A3412;text-transform:uppercase;letter-spacing:1.5px;">Password Reset Security Code</p>
      <p style="margin:0;font-size:34px;font-weight:900;color:#F5821F;letter-spacing:8px;font-family:monospace;">${otp}</p>
    </div>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 16px;font-size:11px;color:#64748B;">
      <strong style="color:#0A1F5C;">SECURITY NOTICE:</strong> If you did not request a password reset, please ignore this email.
    </div>
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

/**
 * 7. Sends Official Payment Confirmation & Application Receipt Email
 */
const sendPaymentConfirmationEmail = async ({
  toEmail,
  applicantName,
  studentIdNum,
  paymentRefNo,
  paymentMethod,
  amountPaid,
  vehicleType,
  vehicleMake,
  plateNumber
}) => {
  if (!toEmail) return;

  const formattedDate = formatDateClean(new Date());
  const formattedAmount = Number(amountPaid || 200.00).toFixed(2);
  const formattedMethod = String(paymentMethod || 'PayMongo').toUpperCase();

  const contentHtml = `
    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:16px;padding:18px;text-align:center;margin-bottom:22px;">
      <span style="display:inline-block;padding:5px 14px;background:#059669;color:#ffffff;font-size:11px;font-weight:800;border-radius:16px;text-transform:uppercase;letter-spacing:1px;">
        PAYMENT RECORDED & VERIFIED
      </span>
      <h2 style="margin:10px 0 4px;font-size:20px;font-weight:800;color:#0A1F5C;">Official Electronic Receipt</h2>
      <p style="margin:0;font-size:12px;color:#166534;">Vehicle Sticker Application Fee — University of Makati</p>
    </div>

    <!-- Payment Reference Box -->
    <div style="background:linear-gradient(135deg, #0A1F5C 0%, #1E293B 100%);border-radius:16px;padding:22px;color:#ffffff;margin-bottom:22px;box-shadow:0 8px 20px rgba(10,31,92,0.12);">
      <p style="margin:0 0 4px;font-size:9px;font-weight:800;color:#F5821F;text-transform:uppercase;letter-spacing:1.5px;">PayMongo Transaction Reference</p>
      <p style="margin:0 0 14px;font-size:20px;font-weight:900;color:#FBBF24;font-family:monospace;letter-spacing:1px;">${paymentRefNo || 'PAY-PENDING'}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.15);padding-top:12px;font-size:12px;">
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Total Amount Paid:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#34D399;font-family:monospace;">₱${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Payment Channel:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;">${formattedMethod}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:rgba(255,255,255,0.7);">Payment Date:</td>
          <td align="right" style="padding:4px 0;font-weight:800;color:#ffffff;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <!-- Application Details Table -->
    <h3 style="margin:0 0 10px;font-size:13px;font-weight:800;color:#0A1F5C;text-transform:uppercase;letter-spacing:1px;">Application Summary</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:18px;margin-bottom:22px;font-size:12px;">
      <tr>
        <td style="padding:5px 0;color:#64748B;">Applicant Name:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;">${applicantName || 'Applicant'}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Student / Faculty ID:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;font-family:monospace;">${studentIdNum || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Vehicle Details:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;text-transform:uppercase;">${vehicleType || 'CAR'} (${vehicleMake || 'Standard'})</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Plate / MV File No:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0A1F5C;font-family:monospace;">${plateNumber ? plateNumber.toUpperCase() : 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">OHSO Review Status:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#D97706;">PENDING OHSO REVIEW</td>
      </tr>
    </table>

    <!-- Next Steps Box -->
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px;margin-bottom:18px;">
      <h4 style="margin:0 0 4px;font-size:12px;font-weight:800;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px;">Next Steps & Document Review</h4>
      <p style="margin:0;font-size:11px;color:#1E3A8A;line-height:1.5;">
        Your payment has been successfully recorded. The <strong>Office of Higher Safety & Security (OHSO)</strong> will review your submitted documents (Student ID, LTO OR/CR, Driver's License). You will receive another email once your physical hologram sticker is ready for pickup.
      </p>
    </div>
  `;

  const mailOptions = {
    to: toEmail,
    subject: `iPark UMAK — Payment & Application Receipt (${paymentRefNo})`,
    text: `Hi ${applicantName},\n\nYour payment of ₱${formattedAmount} for your UMak Vehicle Sticker application has been received.\nPayment Ref: ${paymentRefNo}\nPlate Number: ${plateNumber}\nStatus: Pending OHSO Approval.\n\nUniversity of Makati OHSO Security`,
    html: wrapEmailTemplate({
      headerTitle: 'iPark UMAK Payment Confirmation',
      headerSubtitle: 'Official Electronic Receipt',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

/**
 * 8. Sends Notification Email when Payment Proof is Placed on Hold
 */
const sendPaymentHoldEmail = async ({
  toEmail,
  applicantName,
  studentIdNum,
  paymentRefNo,
  paymentMethod,
  vehicleType,
  vehicleMake,
  plateNumber,
  holdReason,
  claimDate
}) => {
  if (!toEmail) return;

  const formattedClaimDate = claimDate ? formatDateClean(claimDate) : 'Scheduled with OHSO';

  const contentHtml = `
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:16px;padding:20px;text-align:center;margin-bottom:22px;">
      <span style="display:inline-block;padding:5px 14px;background:#D97706;color:#ffffff;font-size:11px;font-weight:800;border-radius:16px;text-transform:uppercase;letter-spacing:1px;">
        ACTION REQUIRED • PAYMENT PROOF ON HOLD
      </span>
      <h2 style="margin:12px 0 4px;font-size:20px;font-weight:800;color:#0A1F5C;">Payment Verification On Hold</h2>
      <p style="margin:0;font-size:12px;color:#92400E;">Your sticker release requires an updated payment proof</p>
    </div>

    <!-- Reason Box -->
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:14px;padding:18px;margin-bottom:22px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:800;color:#DC2626;text-transform:uppercase;letter-spacing:1px;">Feedback / Hold Reason from OHSO Admin:</p>
      <p style="margin:0;font-size:13px;font-weight:700;color:#991B1B;line-height:1.5;">"${holdReason || 'Proof of payment was unclear or incomplete. Please re-upload your valid payment screenshot.'}"</p>
    </div>

    <!-- Transaction Summary -->
    <h3 style="margin:0 0 10px;font-size:13px;font-weight:800;color:#0A1F5C;text-transform:uppercase;letter-spacing:1px;">Application Summary</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:18px;margin-bottom:22px;font-size:12px;">
      <tr>
        <td style="padding:5px 0;color:#64748B;">Applicant Name:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;">${applicantName || 'Applicant'}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Student / Employee ID:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;font-family:monospace;">${studentIdNum || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Vehicle:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0F172A;text-transform:uppercase;">${vehicleType || 'CAR'} (${plateNumber || 'N/A'})</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Payment Reference:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#0A1F5C;font-family:monospace;">${paymentRefNo || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#64748B;">Scheduled Pickup Date:</td>
        <td align="right" style="padding:5px 0;font-weight:800;color:#059669;">${formattedClaimDate}</td>
      </tr>
    </table>

    <!-- Instructions / Next Steps -->
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;padding:18px;margin-bottom:18px;">
      <h4 style="margin:0 0 6px;font-size:12px;font-weight:800;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px;">How to resolve this:</h4>
      <ol style="margin:0;padding-left:18px;font-size:12px;color:#1E3A8A;line-height:1.6;">
        <li>Log in to your <strong>iPark UMAK Portal</strong> at your student dashboard.</li>
        <li>Locate your vehicle sticker application and click <strong>"Re-upload Payment Proof"</strong>.</li>
        <li>Attach a clear, uncropped screenshot or photo of your official payment receipt showing the Reference Number and Amount.</li>
        <li>Submit your updated proof. OHSO will review it promptly so you can claim your sticker.</li>
      </ol>
    </div>
  `;

  const mailOptions = {
    to: toEmail,
    subject: `iPark UMAK — Payment Verification Action Required (On Hold)`,
    text: `Hi ${applicantName},\n\nYour vehicle sticker payment verification has been placed on hold by OHSO Admin.\nReason: ${holdReason}\nPayment Ref: ${paymentRefNo}\nPlate Number: ${plateNumber}\n\nPlease log in to iPark UMAK to re-upload your valid payment screenshot.\n\nUniversity of Makati OHSO Security`,
    html: wrapEmailTemplate({
      headerTitle: 'iPark UMAK Payment Verification',
      headerSubtitle: 'Action Required',
      contentHtml
    })
  };

  return sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendGuestPassEmail,
  sendStickerStatusEmail,
  sendStickerReadyForReleaseEmail,
  sendGuestPassStatusEmail,
  sendAccountUnlockedEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendPaymentHoldEmail
};
