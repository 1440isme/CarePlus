const { getTransporter, MailProviderError } = require('./mail.provider');
const { MAIL_ERROR_CODES, getMailConfig } = require('./mail.types');
const {
  createVerificationOtpTemplate,
  createPasswordResetTemplate,
  createPasswordResetSuccessTemplate,
  createAdminResetPasswordTemplate,
  createBookingSuccessTemplate,
  createBookingCancellationTemplate,
  createNoShowLockTemplate,
} = require('./mail.templates');

class MailServiceError extends Error {
  constructor({ code, message }) {
    super(message);
    this.code = code;
  }
}

class MailService {
  async sendMail({ to, subject, html, text }) {
    if (!to || !subject || (!html && !text)) {
      throw new MailServiceError({
        code: MAIL_ERROR_CODES.MAIL_VALIDATION_ERROR,
        message: 'Dữ liệu email không hợp lệ',
      });
    }

    const config = getMailConfig();

    if (!config.enabled) {
      return { mocked: true };
    }

    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromAddress}>`,
        to,
        subject,
        html,
        text,
      });

      return { mocked: false };
    } catch (error) {
      console.error('[MailService] sendMail failed', {
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode,
        message: error?.message,
      });

      if (error instanceof MailProviderError || error instanceof MailServiceError) {
        throw new MailServiceError({
          code: error.code,
          message: error.message,
        });
      }

      throw new MailServiceError({
        code: MAIL_ERROR_CODES.MAIL_SEND_FAILED,
        message: 'Gửi email thất bại',
      });
    }
  }

  async sendVerificationOtpEmail({ to, name, otp, expiresInMinutes }) {
    const template = createVerificationOtpTemplate({
      name,
      otp,
      expiresInMinutes,
    });

    return this.sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes }) {
    const template = createPasswordResetTemplate({
      name,
      resetUrl,
      expiresInMinutes,
    });

    return this.sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetSuccessEmail({ to, name }) {
    const template = createPasswordResetSuccessTemplate({ name });

    return this.sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendAdminResetPasswordEmail({ to, name, temporaryPassword }) {
    const template = createAdminResetPasswordTemplate({
      name,
      temporaryPassword,
    });

    return this.sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendBookingSuccessEmail({ to, name, code, doctorName, specialtyName, date, time, fee }) {
    const template = createBookingSuccessTemplate({
      name,
      code,
      doctorName,
      specialtyName,
      date,
      time,
      fee,
    });

    return this.sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendBookingCancellationEmail({ to, name, code, doctorName, date, time, reason }) {
    const template = createBookingCancellationTemplate({
      name,
      code,
      doctorName,
      date,
      time,
      reason,
    });

    return this.sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendNoShowLockEmail({ to, name, maxNoShow }) {
    const template = createNoShowLockTemplate({
      name,
      maxNoShow,
    });

    return this.sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

module.exports = {
  MailServiceError,
  mailService: new MailService(),
};
