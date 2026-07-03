const path = require('path');
const fs = require('fs');
const { createTransporter, getFromEmail } = require('../config/email');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const SUBJECTS = {
  verifyEmail: 'Verify Your Email — WasteZero',
  forgotPassword: 'Reset Your Password — WasteZero'
};

const sendOtpEmail = async (toEmail, otp, templateName = 'verifyEmail') => {
  const transporter = createTransporter();
  const fromEmail = getFromEmail();

  const filename = `${templateName}.html`;
  const html = loadTemplate(filename, otp);
  const subject = SUBJECTS[templateName] || SUBJECTS.verifyEmail;

  await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    subject,
    html
  });

  logger.info(`${templateName} email dispatched successfully to ${maskEmail(toEmail)}`);
};

const maskEmail = (email) => {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
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
