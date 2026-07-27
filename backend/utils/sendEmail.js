const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''),
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const msg = `📧 [SENDMAIL] Sending email to: ${to}`;
    if (global.logToFile) global.logToFile(msg);
    console.log(msg);
    
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    
    const successMsg = `✅ [SENDMAIL] Email sent successfully. MessageId: ${result.messageId}`;
    if (global.logToFile) global.logToFile(successMsg);
    console.log(successMsg);
    return result;
  } catch (error) {
    const errorMsg = `❌ [SENDMAIL] Email send failed - To: ${to}, Error: ${error.message}, Code: ${error.code}`;
    if (global.logToFile) global.logToFile(errorMsg);
    console.error(errorMsg);
    throw error;
  }
};

module.exports = sendEmail;