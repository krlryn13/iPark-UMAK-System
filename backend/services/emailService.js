const nodemailer = require('nodemailer');

/**
 * Send email via Resend HTTP REST API (Port 443 HTTPS - Never blocked by Render)
 * or fallback to Nodemailer SMTP
 */
const sendMailHTTP = async (mailOptions) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const fetch = (await import('node-fetch')).default || global.fetch;
    const fromSender = process.env.RESEND_FROM || 'iPark UMAK <onboarding@resend.dev>';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromSender,
        to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Resend API error');
    }
    console.log(`[RESEND EMAIL SENT] Email sent to ${mailOptions.to} via HTTPS API!`);
    return data;
  }

  // Fallback to Nodemailer SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter.sendMail(mailOptions);
};

/**
 * Sends a 6-digit verification code email to the new user.
 */
const sendVerificationEmail = async (toEmail, name, code) => {
  const mailOptions = {
    from: `"iPark UMAK" <${process.env.EMAIL_USER || 'iparkumak@gmail.com'}>`,
    replyTo: process.env.EMAIL_USER || 'iparkumak@gmail.com',
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

  return sendMailHTTP(mailOptions);
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
    from: `"iPark UMAK - OHSO" <${process.env.EMAIL_USER || 'iparkumak@gmail.com'}>`,
    to: toEmail,
    subject: `UMak Visitor Parking E-Pass Confirmation — ${passCode}`,
    html: `<h2>UMak Visitor Parking E-Pass</h2><p>Pass Code: <strong>${passCode}</strong></p><p>Floor: ${parkingFloor}</p><p>Date: ${formattedDate}</p>`
  };
  return sendMailHTTP(mailOptions);
};

const sendStickerStatusEmail = async (toEmail, applicantName, status, stickerNumber, vehicleType, plateNumber) => {
  const isApproved = status === 'approved' || status === 'issued';
  const mailOptions = {
    from: `"iPark UMAK - OHSO" <${process.env.EMAIL_USER || 'iparkumak@gmail.com'}>`,
    to: toEmail,
    subject: `UMak Vehicle Sticker ${isApproved ? 'APPROVED' : status.toUpperCase()} — ${stickerNumber || plateNumber}`,
    html: `<h2>Sticker Application ${status.toUpperCase()}</h2><p>Sticker No: <strong>${stickerNumber || 'N/A'}</strong></p>`
  };
  return sendMailHTTP(mailOptions);
};

const sendGuestPassStatusEmail = async (toEmail, guestName, status, passCode, eventName, eventDate, timeStart, timeEnd, venue, plateNumber, vehicleDetails) => {
  const mailOptions = {
    from: `"iPark UMAK - OHSO" <${process.env.EMAIL_USER || 'iparkumak@gmail.com'}>`,
    to: toEmail,
    subject: `UMak Visitor Pass Status: ${status.toUpperCase()} — ${passCode}`,
    html: `<h2>Visitor Pass ${status.toUpperCase()}</h2><p>Pass Code: <strong>${passCode}</strong></p>`
  };
  return sendMailHTTP(mailOptions);
};

const sendAccountUnlockedEmail = async (toEmail, userName) => {
  const mailOptions = {
    from: `"iPark UMAK - OHSO" <${process.env.EMAIL_USER || 'iparkumak@gmail.com'}>`,
    to: toEmail,
    subject: `iPark UMAK — Account Unlocked Notice`,
    html: `<h2>Account Unlocked</h2><p>Your account ${toEmail} has been unlocked by OHSO Admin.</p>`
  };
  return sendMailHTTP(mailOptions);
};

const sendPasswordResetEmail = async (toEmail, name, otp) => {
  const mailOptions = {
    from: `"iPark UMAK" <${process.env.EMAIL_USER || 'iparkumak@gmail.com'}>`,
    to: toEmail,
    subject: 'iPark UMAK — Password Reset Verification Code',
    html: `<h2>Password Reset</h2><p>OTP: <strong>${otp}</strong></p>`
  };
  return sendMailHTTP(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendGuestPassEmail,
  sendStickerStatusEmail,
  sendGuestPassStatusEmail,
  sendAccountUnlockedEmail,
  sendPasswordResetEmail
};
