import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AUTH_ROLE_DEFAULT_ROUTES } from '../../../features/auth/types/auth.types.js';
import { APP_ROUTES } from '../../constants/routes.js';

function AuthBootstrapFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fbff',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          border: '1px solid #e5eef5',
          borderRadius: '18px',
          background: '#ffffff',
          padding: '28px 24px',
          textAlign: 'center',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
          fontFamily: 'Inter, Roboto, Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            margin: '0 auto 16px',
            borderRadius: '999px',
            border: '3px solid #d8f0f7',
            borderTopColor: '#0092b8',
            animation: 'careplusAuthBootstrapSpin 0.9s linear infinite',
          }}
        />
        <h2
          style={{
            margin: '0 0 8px',
            color: '#101828',
            fontSize: '20px',
            lineHeight: '28px',
            fontWeight: 700,
          }}
        >
          Đang khôi phục phiên đăng nhập
        </h2>
        <p
          style={{
            margin: 0,
            color: '#667085',
            fontSize: '14px',
            lineHeight: '20px',
          }}
        >
          Hệ thống đang kiểm tra lại phiên làm việc của bạn. Vui lòng chờ trong giây lát.
        </p>
        <style>
          {`@keyframes careplusAuthBootstrapSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }`}
        </style>
      </div>
    </div>
  );
}

export default function RequireRole({ allowedRoles = [], children }) {
  const location = useLocation();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const role = useSelector((state) => state.auth.role);
  const isHydrated = useSelector((state) => state.auth.isHydrated);

  if (!isHydrated) {
    return <AuthBootstrapFallback />;
  }

  if (!accessToken) {
    const redirectPath = `${location.pathname}${location.search}`;
    return <Navigate to={`${APP_ROUTES.login}?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallbackRoute = AUTH_ROLE_DEFAULT_ROUTES[role] || '/';
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}
