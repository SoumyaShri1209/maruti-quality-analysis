const axios = require('axios');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: process.env.EMAIL_FROM },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Email sent to ${to}, messageId: ${response.data.messageId}`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    console.error(`❌ Email failed to ${to}: ${errMsg}`);
    throw error;
  }
};

module.exports = sendEmail;