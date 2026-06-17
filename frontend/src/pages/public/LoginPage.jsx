import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginForm from '../../features/auth/components/LoginForm.jsx';
import { AUTH_ROLE_DEFAULT_ROUTES } from '../../features/auth/types/auth.types.js';
import './register-page.css';

const logoIcon = 'https://www.figma.com/api/mcp/asset/1f17b9ca-2d33-4300-891c-4d825ba188a2';

function isSafeInternalRedirect(pathname) {
  return typeof pathname === 'string'
    && pathname.startsWith('/')
    && !pathname.startsWith('//')
    && !pathname.includes('://');
}

function getDefaultRouteByRole(role) {
  return AUTH_ROLE_DEFAULT_ROUTES[role] ?? '/benh-nhan';
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectParam = searchParams.get('redirect');
  const hasResetSuccess = searchParams.get('reset') === 'success';

  const handleLoginSuccess = (response) => {
    const role = response?.data?.user?.role;
    const fallbackPath = getDefaultRouteByRole(role);
    const nextPath = isSafeInternalRedirect(redirectParam) ? redirectParam : fallbackPath;

    navigate(nextPath, { replace: true });
  };

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

          <h1 className="auth-page-title">Đăng nhập</h1>
          <p className="auth-page-subtitle">Chào mừng bạn trở lại CarePlus Clinic</p>
        </header>

        <section className="auth-page-form-card auth-page-form-card-compact">
          {hasResetSuccess ? (
            <p className="auth-submit-success auth-submit-success-banner">
              Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.
            </p>
          ) : null}
          <LoginForm onSuccess={handleLoginSuccess} />
        </section>
      </div>
    </div>
  );
}
