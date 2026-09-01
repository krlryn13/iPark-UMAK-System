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
 * Sends a 6-digit verification code email to new user.
 */
const sendVerificationEmail = async (toEmail, name, code) => {
  const mailOptions = {
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
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #DDE3EE;">
          <tr>
            <td style="background:#0A1F5C;padding:24px 32px;color:#ffffff;">
              <span style="font-size:20px;font-weight:900;">iPark <span style="color:#F5821F;">UMAK</span></span>
              <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">Account Verification Notice</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 10px;font-size:20px;color:#0A1F5C;">Verify Your Account</h2>
              <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
                Hello <strong>${name}</strong>, enter the code below to activate your account.
              </p>
              <div style="background:#F0F4FF;border:1.5px solid #C7D2EE;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#0A1F5C;text-transform:uppercase;letter-spacing:1px;">One-Time Verification Code</p>
                <p style="margin:0;font-size:32px;font-weight:900;color:#F5821F;letter-spacing:6px;font-family:monospace;">${code}</p>
              </div>
              <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;">
                This code expires in 15 minutes. Do not share this code with anyone.
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

  return sendMail(mailOptions);
};

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

const sendGuestPassEmail = async (toEmail, guestName, passCode, eventName, eventDate, timeStart, timeEnd, venue, plateNumber, preferredLevel = 'HPSB Level 2') => {
  const formattedDate = formatDateClean(eventDate);
  const parkingFloor = preferredLevel || 'HPSB Level 2';
  const mailOptions = {
    to: toEmail,
    subject: `UMak Visitor Parking E-Pass Confirmation — ${passCode}`,
    html: `<h2>UMak Visitor Parking E-Pass</h2><p>Pass Code: <strong>${passCode}</strong></p><p>Floor: ${parkingFloor}</p><p>Date: ${formattedDate}</p>`
  };
  return sendMail(mailOptions);
};

const sendStickerStatusEmail = async (toEmail, applicantName, status, stickerNumber, vehicleType, plateNumber) => {
  const isApproved = status === 'approved' || status === 'issued';
  const mailOptions = {
    to: toEmail,
    subject: `UMak Vehicle Sticker ${isApproved ? 'APPROVED' : status.toUpperCase()} — ${stickerNumber || plateNumber}`,
    html: `<h2>Sticker Application ${status.toUpperCase()}</h2><p>Sticker No: <strong>${stickerNumber || 'N/A'}</strong></p>`
  };
  return sendMail(mailOptions);
};

const sendGuestPassStatusEmail = async (toEmail, guestName, status, passCode, eventName, eventDate, timeStart, timeEnd, venue, plateNumber, vehicleDetails) => {
  const mailOptions = {
    to: toEmail,
    subject: `UMak Visitor Pass Status: ${status.toUpperCase()} — ${passCode}`,
    html: `<h2>Visitor Pass ${status.toUpperCase()}</h2><p>Pass Code: <strong>${passCode}</strong></p>`
  };
  return sendMail(mailOptions);
};

const sendAccountUnlockedEmail = async (toEmail, userName) => {
  const mailOptions = {
    to: toEmail,
    subject: `iPark UMAK — Account Unlocked Notice`,
    html: `<h2>Account Unlocked</h2><p>Your account ${toEmail} has been unlocked by OHSO Admin.</p>`
  };
  return sendMail(mailOptions);
};

const sendPasswordResetEmail = async (toEmail, name, otp) => {
  const mailOptions = {
    to: toEmail,
    subject: 'iPark UMAK — Password Reset Verification Code',
    html: `<h2>Password Reset</h2><p>OTP: <strong>${otp}</strong></p>`
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
