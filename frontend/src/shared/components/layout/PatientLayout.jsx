import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogout } from '../../../features/auth/hooks/useLogout.js';
import '../../../pages/patient/patient-portal.css';

const navigationItems = [
  { to: '/benh-nhan', label: 'Tổng quan', icon: DashboardIcon },
  { to: '/benh-nhan/lich-hen', label: 'Lịch hẹn của tôi', icon: CalendarIcon },
  { to: '/benh-nhan/nguoi-than', label: 'Hồ sơ người thân', icon: UsersIcon },
  { to: '/benh-nhan/thong-tin-ca-nhan', label: 'Thông tin cá nhân', icon: ProfileIcon },
];

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3.75 3.75h5.5v5.5h-5.5zm7 0h5.5v3.5h-5.5zm0 5h5.5v7.5h-5.5zm-7 7h5.5v-3.5h-5.5z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.25 2.75a.75.75 0 0 1 .75.75v.75h8v-.75a.75.75 0 0 1 1.5 0v.75h.75a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-9.5a1.5 1.5 0 0 1 1.5-1.5h.75v-.75a.75.75 0 0 1 .75-.75Zm11.5 5H3.75v7.5h13ZM5.5 10h2v2h-2zm3.5 0h2v2H9zm3.5 0h2v2h-2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.5 9.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm6 0a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.75 15a3.75 3.75 0 0 1 7.5 0v.75h-7.5Zm8.75.75V15.5a3.2 3.2 0 0 0-.55-1.8 3.4 3.4 0 0 1 6.3 1.8v.25Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.25a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-5 11a5 5 0 0 1 10 0v1H5Zm10.85-4.6 1.65 1.65-1.65 1.65-.7-.7.45-.45H13v-1h2.6l-.45-.45Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.25a3.25 3.25 0 0 0-3.25 3.25v1.32c0 .72-.2 1.42-.56 2.03l-.9 1.47a1.5 1.5 0 0 0 1.28 2.28h7.86a1.5 1.5 0 0 0 1.28-2.28l-.9-1.47A3.95 3.95 0 0 1 13.25 7.82V6.5A3.25 3.25 0 0 0 10 3.25Z" />
      <path d="M8.25 15.5a1.75 1.75 0 0 0 3.5 0" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.4 3.5 8.6V16h4.25v-4h4.5v4h4.25V8.6Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7.75 3.5h-3a1.5 1.5 0 0 0-1.5 1.5v10a1.5 1.5 0 0 0 1.5 1.5h3v-1.5h-3V5h3Zm6.7 2.1-.95 1.05 1.7 1.6H8.5v1.5h6.7l-1.7 1.6.95 1.05 3.55-3.4Z" />
    </svg>
  );
}

export default function PatientLayout() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const hasNotifications = false;
  const logoutMutation = useLogout({
    onSuccess: () => {
      navigate('/dang-nhap', { replace: true });
    },
  });

  const handleLogout = () => {
    if (!logoutMutation.isPending) {
      logoutMutation.mutate();
    }
  };

  return (
    <div className="patient-portal-layout">
      <aside className="patient-portal-sidebar">
        <div className="patient-portal-brand">
          <span className="patient-portal-brand-mark">C</span>
          <span className="patient-portal-brand-text">CarePlus</span>
        </div>

        <div className="patient-portal-profile-tile">
          <span className="patient-portal-profile-avatar">
            {(authUser?.name ?? 'B').trim().charAt(0).toUpperCase()}
          </span>
          <div className="patient-portal-profile-copy">
            <p className="patient-portal-profile-name">{authUser?.name ?? 'Bệnh nhân'}</p>
            <p className="patient-portal-profile-role">Bệnh nhân</p>
          </div>
        </div>

        <nav className="patient-portal-nav" aria-label="Patient navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/benh-nhan'}
              className={({ isActive }) => `patient-portal-nav-link ${isActive ? 'is-active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="patient-portal-sidebar-footer">
          <Link className="patient-portal-footer-link" to="/">
            <HomeIcon />
            <span>Về trang chủ</span>
          </Link>
          <button
            className="patient-portal-footer-link is-danger"
            type="button"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogoutIcon />
            <span>{logoutMutation.isPending ? 'Đang đăng xuất' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>

      <div className="patient-portal-shell">
        <header className="patient-portal-header">
          <div className="patient-portal-header-spacer" aria-hidden="true" />

          <div className="patient-portal-header-actions">
            <button className="patient-portal-icon-button" type="button" aria-label="Thông báo">
              <BellIcon />
              {hasNotifications ? <span className="patient-portal-notification-dot" aria-hidden="true" /> : null}
            </button>
            <button
              className="patient-portal-logout-link"
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogoutIcon />
              <span>{logoutMutation.isPending ? 'Đang đăng xuất' : 'Đăng xuất'}</span>
            </button>
          </div>
        </header>

        <main className="patient-portal-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
