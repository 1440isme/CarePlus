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

function createBookingSuccessTemplate({ name, code, doctorName, specialtyName, date, time, fee }) {
  const formattedFee = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee);
  return {
    subject: `Xác nhận đặt lịch khám thành công — Mã số ${code}`,
    ...createEmailLayout({
      title: 'Đăng Ký Khám Bệnh Thành Công',
      greeting: `Xin chào ${name || 'bạn'},`,
      bodyLines: [
        `CarePlus xác nhận bạn đã đặt lịch khám thành công với thông tin chi tiết như sau:`,
        `<strong>Mã lịch hẹn:</strong> ${code}`,
        `<strong>Bác sĩ:</strong> ${doctorName}`,
        `<strong>Chuyên khoa:</strong> ${specialtyName}`,
        `<strong>Thời gian:</strong> ${time} ngày ${date}`,
        `<strong>Phí khám tham khảo:</strong> ${formattedFee}`,
        `Vui lòng đến trước giờ hẹn 10-15 phút để làm thủ tục check-in tại quầy lễ tân.`
      ],
      footer: 'Cảm ơn bạn đã tin tưởng dịch vụ của CarePlus Clinic.',
    }),
  };
}

function createBookingCancellationTemplate({ name, code, doctorName, date, time, reason }) {
  return {
    subject: `Thông báo hủy lịch hẹn — Mã số ${code}`,
    ...createEmailLayout({
      title: 'Thông Báo Hủy Lịch Hẹn',
      greeting: `Xin chào ${name || 'bạn'},`,
      bodyLines: [
        `Lịch hẹn mã số <strong>${code}</strong> của bạn đã bị hủy thành công.`,
        `<strong>Bác sĩ:</strong> ${doctorName}`,
        `<strong>Thời gian khám dự kiến ban đầu:</strong> ${time} ngày ${date}`,
        reason ? `<strong>Lý do hủy:</strong> ${reason}` : 'Lịch hẹn được hủy theo yêu cầu.',
        `Nếu bạn muốn đăng ký lại, vui lòng thực hiện đặt lịch khám mới trên trang web của chúng tôi.`
      ],
      footer: 'Chúng tôi rất tiếc vì sự bất tiện này.',
    }),
  };
}

function createNoShowLockTemplate({ name, maxNoShow }) {
  return {
    subject: 'Cảnh báo: Tài khoản CarePlus đã bị khóa',
    ...createEmailLayout({
      title: 'Tài Khoản Đã Bị Khóa',
      greeting: `Xin chào ${name || 'bạn'},`,
      bodyLines: [
        `Tài khoản CarePlus của bạn đã bị tạm khóa chức năng đặt lịch online do bạn đã vắng mặt (No-show) ${maxNoShow} lần mà không thực hiện hủy lịch hẹn trước.`,
        `Để mở khóa tài khoản, vui lòng liên hệ trực tiếp với quầy Lễ tân của phòng khám CarePlus hoặc gọi hotline hỗ trợ.`
      ],
      footer: 'Trân trọng, Ban quản lý CarePlus Clinic.',
    }),
  };
}

module.exports = {
  createVerificationOtpTemplate,
  createPasswordResetTemplate,
  createPasswordResetSuccessTemplate,
  createBookingSuccessTemplate,
  createBookingCancellationTemplate,
  createNoShowLockTemplate,
};
