const MAIL_ERROR_CODES = {
  MAIL_SERVICE_CONFIG_ERROR: 'MAIL_SERVICE_CONFIG_ERROR',
  MAIL_SEND_FAILED: 'MAIL_SEND_FAILED',
  MAIL_VALIDATION_ERROR: 'MAIL_VALIDATION_ERROR',
};

function getMailConfig() {
  return {
    enabled: process.env.MAIL_ENABLED === 'true',
    host: process.env.MAIL_HOST,
    port: Number.parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    fromName: process.env.MAIL_FROM_NAME || 'CarePlus',
    fromAddress: process.env.MAIL_FROM_ADDRESS,
    appFrontendUrl: process.env.APP_FRONTEND_URL || 'http://localhost:5173',
  };
}

module.exports = {
  MAIL_ERROR_CODES,
  getMailConfig,
};
