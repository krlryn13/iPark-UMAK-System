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
    to: toEmail,
    subject: 'iPark UMAK — Account Verification Code',
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

module.exports = { sendVerificationEmail };
