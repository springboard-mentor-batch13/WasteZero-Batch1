const path = require('path');
const fs = require('fs');
const { createTransporter, getFromEmail } = require('../config/email');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const sendOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();
  const fromEmail = getFromEmail();

  const html = loadTemplate('verifyEmail.html', otp);

  await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    subject: 'Verify Your Email — WasteZero',
    html
  });

  logger.info('Verification email dispatched successfully');
};

const loadTemplate = (filename, otp) => {
  const filePath = path.join(TEMPLATES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(500, `Email template not found: ${filename}`);
  }

  let html = fs.readFileSync(filePath, 'utf-8');
  html = html.replace('{{otp}}', otp);
  return html;
};

module.exports = { sendOtpEmail };
