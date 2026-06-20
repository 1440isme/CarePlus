const nodemailer = require('nodemailer');
const { MAIL_ERROR_CODES, getMailConfig } = require('./mail.types');

class MailProviderError extends Error {
  constructor({ code, message }) {
    super(message);
    this.code = code;
  }
}

let transporter;

function validateMailConfig(config) {
  if (!config.host || !config.port || !config.user || !config.pass || !config.fromAddress) {
    throw new MailProviderError({
      code: MAIL_ERROR_CODES.MAIL_SERVICE_CONFIG_ERROR,
      message: 'Thiếu cấu hình SMTP cho Mail Service',
    });
  }
}

function getTransporter() {
  const config = getMailConfig();

  if (!config.enabled) {
    return null;
  }

  if (transporter) {
    return transporter;
  }

  validateMailConfig(config);

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

module.exports = {
  MailProviderError,
  getTransporter,
};
