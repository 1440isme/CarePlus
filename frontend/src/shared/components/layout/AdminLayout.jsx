import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogout } from '../../../features/auth/hooks/useLogout.js';
import { APP_ROUTES } from '../../constants/routes.js';
import './admin-layout.css';

const navigationItems = [
  { to: APP_ROUTES.adminRoot, label: 'Tổng quan', icon: DashboardIcon },
  { to: `${APP_ROUTES.adminRoot}/chuyen-khoa`, label: 'Chuyên khoa', icon: SpecialtyIcon },
  { to: `${APP_ROUTES.adminRoot}/bac-si`, label: 'Bác sĩ', icon: DoctorIcon },
  { to: `${APP_ROUTES.adminRoot}/lich-lam-viec`, label: 'Lịch làm việc', icon: CalendarIcon },
  { to: `${APP_ROUTES.adminRoot}/lich-hen`, label: 'Lịch hẹn', icon: AppointmentIcon },
  { to: `${APP_ROUTES.adminRoot}/duyet-yeu-cau`, label: 'Duyệt yêu cầu', icon: ApprovalIcon },
  { to: `${APP_ROUTES.adminRoot}/nguoi-dung`, label: 'Người dùng', icon: UsersIcon },
  { to: `${APP_ROUTES.adminRoot}/blog`, label: 'Bài viết', icon: BlogIcon },
  { to: `${APP_ROUTES.adminRoot}/email-preview`, label: 'Email Preview', icon: EmailIcon },
  { to: `${APP_ROUTES.adminRoot}/phong-kham`, label: 'Thông tin phòng khám', icon: ClinicIcon },
  { to: `${APP_ROUTES.adminRoot}/cai-dat`, label: 'Cài đặt hệ thống', icon: SettingsIcon },
];

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3.75 3.75h5.5v5.5h-5.5Zm7 0h5.5v3.5h-5.5Zm0 5h5.5v7.5h-5.5Zm-7 7h5.5v-3.5h-5.5Z" />
    </svg>
  );
}

function SpecialtyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.75 4.25 5.5v5c0 3.2 2.06 5.9 5.75 6.75 3.69-.85 5.75-3.55 5.75-6.75v-5ZM10 6.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Zm0 7c-1.33 0-2.52-.5-3.25-1.29.24-1.23 1.34-2.08 3.25-2.08s3.01.85 3.25 2.08c-.73.79-1.92 1.29-3.25 1.29Z" />
    </svg>
  );
}

function DoctorIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.25a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5ZM5.25 15a4.75 4.75 0 0 1 9.5 0v.75h-9.5Zm10.5-8.25h1.5v1.5h-1.5v1.5h-1.5v-1.5h-1.5v-1.5h1.5v-1.5h1.5Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.25 2.75a.75.75 0 0 1 .75.75v.75h8v-.75a.75.75 0 0 1 1.5 0v.75h.75a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-9.5a1.5 1.5 0 0 1 1.5-1.5h.75v-.75a.75.75 0 0 1 .75-.75Zm11.5 5H3.75v7.5h13Z" />
    </svg>
  );
}

function AppointmentIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 4.25h12A1.75 1.75 0 0 1 17.75 6v9A1.75 1.75 0 0 1 16 16.75H4A1.75 1.75 0 0 1 2.25 15V6A1.75 1.75 0 0 1 4 4.25Zm0 2v2h12v-2Zm0 4v4.5h4v-4.5Z" />
    </svg>
  );
}

function ApprovalIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.75 4 5.5v4.4c0 3.06 1.96 5.64 6 6.6 4.04-.96 6-3.54 6-6.6V5.5Zm2.89 5.72-3.36 3.36a.75.75 0 0 1-1.06 0L7.11 10.47l1.06-1.06L9 10.24l2.83-2.83Z" />
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

function BlogIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 3.25h12A1.75 1.75 0 0 1 17.75 5v10A1.75 1.75 0 0 1 16 16.75H4A1.75 1.75 0 0 1 2.25 15V5A1.75 1.75 0 0 1 4 3.25Zm1.5 3.25h9m-9 3h9m-9 3h5" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3.75 5.25h12.5A1.25 1.25 0 0 1 17.5 6.5v7a1.25 1.25 0 0 1-1.25 1.25H3.75A1.25 1.25 0 0 1 2.5 13.5v-7a1.25 1.25 0 0 1 1.25-1.25Zm0 .75 6.25 4.75L16.25 6" />
    </svg>
  );
}

function ClinicIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 16.25V5.75A1.75 1.75 0 0 1 5.75 4h8.5A1.75 1.75 0 0 1 16 5.75v10.5M7 16.25v-3.5h6v3.5M7 7.25h1.5m3 0H13m-6 2.5h1.5m3 0H13" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m8.6 2.9.45 1.5a5.95 5.95 0 0 1 1.9 0l.45-1.5 2 .83-.76 1.38c.48.37.91.8 1.28 1.28l1.38-.76.83 2-1.5.45a5.95 5.95 0 0 1 0 1.9l1.5.45-.83 2-1.38-.76a5.95 5.95 0 0 1-1.28 1.28l.76 1.38-2 .83-.45-1.5a5.95 5.95 0 0 1-1.9 0l-.45 1.5-2-.83.76-1.38a5.95 5.95 0 0 1-1.28-1.28l-1.38.76-.83-2 1.5-.45a5.95 5.95 0 0 1 0-1.9l-1.5-.45.83-2 1.38.76c.37-.48.8-.91 1.28-1.28l-.76-1.38Zm1.4 4.6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
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

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7.75 3.5h-3a1.5 1.5 0 0 0-1.5 1.5v10a1.5 1.5 0 0 0 1.5 1.5h3v-1.5h-3V5h3Zm6.7 2.1-.95 1.05 1.7 1.6H8.5v1.5h6.7l-1.7 1.6.95 1.05 3.55-3.4Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4a2.75 2.75 0 1 1 0 5.5A2.75 2.75 0 0 1 10 4Zm-4.5 10.75a4.5 4.5 0 1 1 9 0" />
    </svg>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const logoutMutation = useLogout({
    onSuccess: () => {
      navigate(APP_ROUTES.login, { replace: true });
    },
  });

  const handleLogout = () => {
    if (!logoutMutation.isPending) {
      logoutMutation.mutate();
    }
  };

  const displayName = authUser?.name ?? 'Admin CarePlus';
  const displayRole = authUser?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân sự';
  return (
    <div className="admin-portal-layout">
      <aside className="admin-portal-sidebar">
        <div className="admin-portal-brand">
          <span className="admin-portal-brand-mark">C</span>
          <span className="admin-portal-brand-text">CarePlus</span>
        </div>

        <div className="admin-portal-profile-card">
          <span className="admin-portal-profile-avatar">
            <ProfileIcon />
          </span>
          <div className="admin-portal-profile-copy">
            <p className="admin-portal-profile-name">{displayName}</p>
            <p className="admin-portal-profile-role">{displayRole}</p>
          </div>
        </div>

        <nav className="admin-portal-nav" aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === APP_ROUTES.adminRoot}
              className={({ isActive }) => `admin-portal-nav-link ${isActive ? 'is-active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <item.icon />
                  <span>{item.label}</span>
                  {isActive ? <span className="admin-portal-nav-arrow" aria-hidden="true">›</span> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-portal-sidebar-footer">
          <NavLink className="admin-portal-home-link" to="/">
            <ClinicIcon />
            <span>Về trang chủ</span>
          </NavLink>

          <button
            className="admin-portal-sidebar-logout"
            type="button"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogoutIcon />
            <span>{logoutMutation.isPending ? 'Đang đăng xuất' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>

      <div className="admin-portal-shell">
        <header className="admin-portal-header">
          <div className="admin-portal-header-divider" />

          <div className="admin-portal-header-actions">
            <button className="admin-portal-icon-button" type="button" aria-label="Thông báo">
              <BellIcon />
              <span className="admin-portal-notification-dot" aria-hidden="true" />
            </button>
            <button
              className="admin-portal-logout-link"
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogoutIcon />
              <span>{logoutMutation.isPending ? 'Đang đăng xuất' : 'Đăng xuất'}</span>
            </button>
          </div>
        </header>

        <main className="admin-portal-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
