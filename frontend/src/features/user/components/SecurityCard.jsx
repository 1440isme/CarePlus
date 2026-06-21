function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.2 4.2 4.5v4.2c0 3.5 2.2 6.7 5.8 8.6 3.6-1.9 5.8-5.1 5.8-8.6V4.5Z" />
      <path d="m7.9 9.9 1.4 1.4 3-3.2" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m8 5 5 5-5 5" />
    </svg>
  );
}

export default function SecurityCard({ onChangePassword }) {
  return (
    <article className="patient-profile-card patient-security-card">
      <div className="patient-security-card-header">
        <div>
          <p className="patient-security-card-eyebrow">Bảo mật tài khoản</p>
          <h3 className="patient-security-card-title">Mật khẩu đăng nhập</h3>
        </div>
      </div>

      <div className="patient-security-card-body">
        <div className="patient-security-card-row">
          <div className="patient-security-card-icon">
            <ShieldIcon />
          </div>

          <div className="patient-security-card-copy">
            <p className="patient-security-card-mask">••••••••••</p>
            <p className="patient-security-card-helper">
              Đổi mật khẩu định kỳ để bảo vệ tài khoản và thông tin khám bệnh của bạn.
            </p>
          </div>

          <button className="patient-profile-toolbar-button patient-security-card-button" type="button" onClick={onChangePassword}>
            <span>Đổi mật khẩu</span>
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </article>
  );
}
