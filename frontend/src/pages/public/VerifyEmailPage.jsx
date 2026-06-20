import { useSearchParams } from 'react-router-dom';
import VerifyEmailForm from '../../features/auth/components/VerifyEmailForm.jsx';
import './register-page.css';

const logoIcon = 'https://www.figma.com/api/mcp/asset/852fd75b-9694-4a78-a12f-1557cef742d4';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

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

          <h1 className="auth-page-title">Xác minh email</h1>
          <p className="auth-page-subtitle">
            {email
              ? `Tài khoản ${email} đã được tạo. Vui lòng nhập mã OTP để hoàn tất xác minh email`
              : 'Nhập email và mã OTP để hoàn tất xác minh tài khoản'}
          </p>
        </header>

        <section className="auth-page-form-card auth-page-form-card-compact">
          <VerifyEmailForm defaultValues={{ email, otp: '' }} />
        </section>
      </div>
    </div>
  );
}
