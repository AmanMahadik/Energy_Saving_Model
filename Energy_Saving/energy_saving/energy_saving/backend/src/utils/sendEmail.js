const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (to, subject, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Use this deep link if you're integrating with a mobile app
  const resetLink = `myapp://reset-password/${token}`;

  // Or use this for local testing with React Native web/Expo
  // Replace with your actual local IP and Metro port
  // const resetLink = `http://192.168.233.130:19006/reset-password/${token}`;

  const message = `
    You requested a password reset.

    Click the link below to reset your password:
    ${resetLink}

    If you did not request this, you can ignore this email.
  `;

  await transporter.sendMail({
    from: `"Energy App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: message,
  });
};

module.exports = sendEmail;
