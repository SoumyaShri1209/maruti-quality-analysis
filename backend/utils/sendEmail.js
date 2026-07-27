const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_LOGIN,
    to,
    subject,
    html,
  });
  console.log(`✅ Email sent to ${to}, messageId: ${result.messageId}`);
  return result;
};

module.exports = sendEmail;