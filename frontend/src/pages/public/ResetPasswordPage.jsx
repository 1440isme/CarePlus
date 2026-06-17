import { useSearchParams } from 'react-router-dom';
import ResetPasswordForm from '../../features/auth/components/ResetPasswordForm.jsx';
import './register-page.css';

const logoIcon = 'https://www.figma.com/api/mcp/asset/87f58041-bd76-4ab3-8e01-b43927d8aa68';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

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

          <h1 className="auth-page-title">Đặt lại mật khẩu</h1>
          <p className="auth-page-subtitle">
            {token
              ? 'Tạo mật khẩu mới để tiếp tục đăng nhập vào CarePlus'
              : 'Nhập thông tin để đặt lại mật khẩu tài khoản của bạn'}
          </p>
        </header>

        <section className="auth-page-form-card">
          <ResetPasswordForm
            defaultValues={{
              email,
              token,
              newPassword: '',
              confirmPassword: '',
            }}
          />
        </section>
      </div>
    </div>
  );
}
