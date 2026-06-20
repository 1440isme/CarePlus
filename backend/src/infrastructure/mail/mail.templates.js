function createEmailLayout({ title, greeting, bodyLines, footer }) {
  const htmlBodyLines = bodyLines.map((line) => `<p style="margin: 0 0 12px; color: #334155; line-height: 1.6;">${line}</p>`).join('');
  const textBodyLines = bodyLines.join('\n');

  return {
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px;">${title}</h1>
          <p style="margin: 0 0 16px; color: #0f172a; line-height: 1.6;">${greeting}</p>
          ${htmlBodyLines}
          <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">${footer}</p>
        </div>
      </div>
    `,
    text: `${title}\n\n${greeting}\n\n${textBodyLines}\n\n${footer}`,
  };
}

function createVerificationOtpTemplate({ name, otp, expiresInMinutes }) {
  return {
    subject: 'Xác minh tài khoản CarePlus',
    ...createEmailLayout({
      title: 'Xác minh tài khoản CarePlus',
      greeting: `Xin chào ${name || 'bạn'},`,
      bodyLines: [
        `Mã xác minh tài khoản CarePlus của bạn là: ${otp}`,
        `Mã này có hiệu lực trong ${expiresInMinutes} phút.`,
      ],
      footer: 'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.',
    }),
  };
}

function createPasswordResetTemplate({ name, resetUrl, expiresInMinutes }) {
  return {
    subject: 'Đặt lại mật khẩu CarePlus',
    ...createEmailLayout({
      title: 'Đặt lại mật khẩu CarePlus',
      greeting: `Xin chào ${name || 'bạn'},`,
      bodyLines: [
        'Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản CarePlus.',
        `Vui lòng sử dụng liên kết sau để đặt lại mật khẩu: ${resetUrl}`,
        `Liên kết này có hiệu lực trong ${expiresInMinutes} phút.`,
      ],
      footer: 'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.',
    }),
  };
}

function createPasswordResetSuccessTemplate({ name }) {
  return {
    subject: 'Mật khẩu CarePlus đã được đặt lại',
    ...createEmailLayout({
      title: 'Mật khẩu CarePlus đã được đặt lại',
      greeting: `Xin chào ${name || 'bạn'},`,
      bodyLines: [
        'Mật khẩu tài khoản CarePlus của bạn vừa được đặt lại thành công.',
      ],
      footer: 'Nếu bạn không thực hiện thao tác này, vui lòng liên hệ bộ phận hỗ trợ ngay.',
    }),
  };
}

module.exports = {
  createVerificationOtpTemplate,
  createPasswordResetTemplate,
  createPasswordResetSuccessTemplate,
};
