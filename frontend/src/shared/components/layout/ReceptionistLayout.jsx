import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogout } from '../../../features/auth/hooks/useLogout.js';
import { APP_ROUTES } from '../../constants/routes.js';
import './receptionist-layout.css';

const navigationItems = [
  { to: APP_ROUTES.receptionistRoot, label: 'Tổng quan', icon: DashboardIcon },
  { to: `${APP_ROUTES.receptionistRoot}/lich-hen`, label: 'Quản lý lịch hẹn', icon: AppointmentIcon },
  { to: `${APP_ROUTES.receptionistRoot}/dat-lich`, label: 'Đặt lịch khám', icon: BookingIcon },
  { to: `${APP_ROUTES.receptionistRoot}/lich-bac-si`, label: 'Lịch bác sĩ', icon: DoctorScheduleIcon },
  { to: `${APP_ROUTES.receptionistRoot}/tin-nhan`, label: 'Tin nhắn', icon: ChatIcon },
  { to: `${APP_ROUTES.receptionistRoot}/thong-tin-ca-nhan`, label: 'Thông tin cá nhân', icon: ProfileIcon },
];

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3.75 3.75h5.5v5.5h-5.5zm7 0h5.5v3.5h-5.5zm0 5h5.5v7.5h-5.5zm-7 7h5.5v-3.5h-5.5z" />
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

function BookingIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.25 2.75a.75.75 0 0 1 .75.75v.75h8v-.75a.75.75 0 0 1 1.5 0v.75h.75a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-9.5a1.5 1.5 0 0 1 1.5-1.5h.75v-.75a.75.75 0 0 1 .75-.75Zm11.5 5H3.75v7.5h13ZM8 10.75h1.5v1.5H8v-1.5Zm0 3.25h1.5v1.5H8v-1.5Zm3.5-3.25H13v1.5h-1.5v-1.5Zm0 3.25H13v1.5h-1.5v-1.5Z" />
    </svg>
  );
}

function DoctorScheduleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.25a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM5 14.5a3.5 3.5 0 0 1 7 0v.75H5v-.75Zm9.5-6h2v1.5h-2v1.5h-1.5V10h-2V8.5h2V7h1.5v1.5Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 0 1-4.083-.98L2 17l1.338-3.123C2.514 12.742 2 11.417 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.25a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-5 11a5 5 0 0 1 10 0v1H5Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.75a3 3 0 0 0-3 3v1.1c0 .58-.16 1.14-.46 1.63L5.4 10.3A2 2 0 0 0 7.1 13.25h5.8a2 2 0 0 0 1.7-2.95l-1.15-1.82A3.13 3.13 0 0 1 13 6.85v-1.1a3 3 0 0 0-3-3Zm0 14.5a2.13 2.13 0 0 1-2-1.5h4a2.13 2.13 0 0 1-2 1.5Z" />
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

export default function ReceptionistLayout() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
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

  const displayName = authUser?.name ?? 'Lễ tân CarePlus';
  const displayRole = 'Lễ tân';
  const avatarLetter = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className="receptionist-portal-layout">
      <aside className="receptionist-portal-sidebar">
        <div className="receptionist-portal-brand">
          <span className="receptionist-portal-brand-mark">C</span>
          <span className="receptionist-portal-brand-text">CarePlus</span>
        </div>

        <div className="receptionist-portal-profile-card">
          <span className="receptionist-portal-profile-avatar">
            {avatarLetter}
          </span>
          <div className="receptionist-portal-profile-copy">
            <p className="receptionist-portal-profile-name" title={displayName}>{displayName}</p>
            <p className="receptionist-portal-profile-role">{displayRole}</p>
          </div>
        </div>

        <nav className="receptionist-portal-nav" aria-label="Receptionist navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === APP_ROUTES.receptionistRoot}
              className={({ isActive }) => `receptionist-portal-nav-link ${isActive ? 'is-active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <item.icon />
                  <span>{item.label}</span>
                  {isActive ? <span className="receptionist-portal-nav-arrow" aria-hidden="true">›</span> : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="receptionist-portal-sidebar-footer">

          <button
            className="receptionist-portal-sidebar-logout"
            type="button"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogoutIcon />
            <span>{logoutMutation.isPending ? 'Đang đăng xuất' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>

      <div className="receptionist-portal-shell">
        <header className="receptionist-portal-header">
          <div className="receptionist-portal-header-divider" />

          <div className="receptionist-portal-header-actions">
            <button className="receptionist-portal-icon-button" type="button" aria-label="Thông báo">
              <BellIcon />
              <span className="receptionist-portal-notification-dot" aria-hidden="true" />
            </button>
            <button
              className="receptionist-portal-logout-link"
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogoutIcon />
              <span>{logoutMutation.isPending ? 'Đang đăng xuất' : 'Đăng xuất'}</span>
            </button>
          </div>
        </header>

        <main className="receptionist-portal-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
