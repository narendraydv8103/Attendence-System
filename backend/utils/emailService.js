const nodemailer = require('nodemailer');

const sendLowAttendanceWarning = async (studentEmail, studentName, courseName, percentage) => {
  try {
    // Standard SMTP or test account
    let transporter;
    
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Ethereal / Test Transporter fallback
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: '"Smart QR Attendance System" <noreply@attendance.edu>',
      to: studentEmail,
      subject: `⚠️ Low Attendance Warning: ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #dc2626;">Attendance Alert System</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>This is an automated notification regarding your attendance in <strong>${courseName}</strong>.</p>
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 15px 0;">
            <p style="margin: 0; font-size: 16px; color: #991b1b;">
              Current Attendance: <strong>${percentage}%</strong> (Required Minimum: 75%)
            </p>
          </div>
          <p>Please meet your course teacher and improve your attendance to satisfy university compliance criteria.</p>
          <br/>
          <p>Best regards,<br/>Academic Administration</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Low attendance warning sent to ${studentEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    return false;
  }
};

module.exports = { sendLowAttendanceWarning };
