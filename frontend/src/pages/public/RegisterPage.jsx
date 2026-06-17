import RegisterForm from '../../features/auth/components/RegisterForm.jsx';
import './register-page.css';

const logoIcon = 'https://www.figma.com/api/mcp/asset/852fd75b-9694-4a78-a12f-1557cef742d4';

export default function RegisterPage() {
  return (
    <div className="auth-page auth-page-register">
      <div className="auth-page-card">
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

          <h1 className="auth-page-title">Tạo tài khoản</h1>
          <p className="auth-page-subtitle">Đăng ký để đặt lịch khám tại CarePlus</p>
        </header>

        <section className="auth-page-form-card">
          <RegisterForm />
        </section>
      </div>
    </div>
  );
}

