import ForgotPasswordForm from '../../features/auth/components/ForgotPasswordForm.jsx';
import './register-page.css';

const logoIcon = 'https://www.figma.com/api/mcp/asset/87f58041-bd76-4ab3-8e01-b43927d8aa68';

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page auth-page-register">
      <div className="auth-page-card auth-page-card-compact">
        <header className="auth-page-header">
          <div className="auth-page-brand" aria-label="CarePlus">
            <div className="auth-page-brand-icon">
              <img src={logoIcon} alt="" aria-hidden="true" />
            </div>
            <div className="auth-page-brand-text">
              <span>Care</span>
              <span>Plus</span>
            </div>
          </div>

          <h1 className="auth-page-title">Quên mật khẩu</h1>
          <p className="auth-page-subtitle">Nhập email để nhận link đặt lại mật khẩu</p>
        </header>

        <section className="auth-page-form-card auth-page-form-card-compact">
          <ForgotPasswordForm />
        </section>
      </div>
    </div>
  );
}
