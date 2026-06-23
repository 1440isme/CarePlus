import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import LoginForm from '../../features/auth/components/LoginForm.jsx';
import { AUTH_ROLE_DEFAULT_ROUTES } from '../../features/auth/types/auth.types.js';
import { getRememberMePreference } from '../../features/auth/store/auth.storage.js';
import { APP_ROUTES } from '../../shared/constants/routes.js';

function isSafeInternalRedirect(pathname) {
  return typeof pathname === 'string'
    && pathname.startsWith('/')
    && !pathname.startsWith('//')
    && !pathname.includes('://');
}

function getDefaultRouteByRole(role) {
  return AUTH_ROLE_DEFAULT_ROUTES[role] ?? APP_ROUTES.patientRoot;
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Care<span className="text-cyan-600">Plus</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-gray-500 mt-1 text-sm">Chào mừng bạn trở lại CarePlus Clinic</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {hasResetSuccess && (
            <p className="p-3 bg-green-50 text-green-600 rounded-lg text-sm mb-4 font-medium">
              Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.
            </p>
          )}
          <LoginForm
            defaultValues={{
              email: '',
              password: '',
              rememberMe: getRememberMePreference(),
            }}
            onSuccess={handleLoginSuccess}
          />
        </div>
      </div>
    </div>
  );
}
