import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogout } from '../../../features/auth/hooks/useLogout.js';
import '../../../pages/patient/patient-portal.css';

const navigationItems = [
  { to: '/benh-nhan', label: 'Tổng quan', icon: DashboardIcon },
  { to: '/benh-nhan/lich-hen', label: 'Lịch hẹn của tôi', icon: CalendarIcon },
  { to: '/benh-nhan/nguoi-than', label: 'Hồ sơ người thân', icon: UsersIcon },
  { to: '/benh-nhan/thong-tin-ca-nhan', label: 'Thông tin cá nhân', icon: ProfileIcon },
];

const pageTitles = {
  '/benh-nhan': 'Bệnh nhân - Tổng quan',
  '/benh-nhan/lich-hen': 'Bệnh nhân - Lịch hẹn của tôi',
  '/benh-nhan/nguoi-than': 'Bệnh nhân - Hồ sơ người thân',
  '/benh-nhan/thong-tin-ca-nhan': 'Bệnh nhân - Thông tin cá nhân',
};

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
      <path d="M10 2.75a3 3 0 0 0-3 3v1.1c0 .58-.16 1.14-.46 1.63L5.4 10.3A2 2 0 0 0 7.1 13.25h5.8a2 2 0 0 0 1.7-2.95l-1.15-1.82A3.13 3.13 0 0 1 13 6.85v-1.1a3 3 0 0 0-3-3Zm0 14.5a2.13 2.13 0 0 1-2-1.5h4a2.13 2.13 0 0 1-2 1.5Z" />
      <circle cx="15.75" cy="4.25" r="1.75" />
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
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const logoutMutation = useLogout({
    onSuccess: () => {
      navigate('/dang-nhap', { replace: true });
    },
  });
  const pageTitle = pageTitles[location.pathname] ?? 'Bệnh nhân';

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
          <h1 className="patient-portal-heading">{pageTitle}</h1>

          <div className="patient-portal-header-actions">
            <button className="patient-portal-icon-button" type="button" aria-label="Thông báo">
              <BellIcon />
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
