import { NavLink, Outlet } from 'react-router-dom';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../../../features/auth/store/auth.slice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { APP_ROUTES } from '../../constants/routes.js';
import './dashboard-layout.css';

function getPortalLinksByRole(role) {
  if (role === 'DOCTOR') {
    return [
      { to: APP_ROUTES.doctorRoot, label: 'Dashboard', end: true },
      { to: `${APP_ROUTES.doctorRoot}/lich-hen`, label: 'Lịch hẹn' },
      { to: `${APP_ROUTES.doctorRoot}/lich-lam-viec`, label: 'Lịch làm việc' },
      { to: `${APP_ROUTES.doctorRoot}/tin-nhan`, label: 'Tin nhắn' },
      { to: `${APP_ROUTES.doctorRoot}/thong-tin-ca-nhan`, label: 'Thông tin cá nhân' },
    ];
  }

  if (role === 'ADMIN') {
    return [
      { to: APP_ROUTES.adminRoot, label: 'Dashboard', end: true },
      { to: `${APP_ROUTES.adminRoot}/bac-si`, label: 'Bác sĩ' },
      { to: `${APP_ROUTES.adminRoot}/lich-lam-viec`, label: 'Lịch làm việc' },
      { to: `${APP_ROUTES.adminRoot}/duyet-yeu-cau`, label: 'Duyệt yêu cầu' },
      { to: `${APP_ROUTES.adminRoot}/nguoi-dung`, label: 'Người dùng' },
      { to: `${APP_ROUTES.adminRoot}/lich-hen`, label: 'Lịch hẹn' },
    ];
  }

  if (role === 'RECEPTIONIST') {
    return [
      { to: APP_ROUTES.receptionistRoot, label: 'Dashboard', end: true },
      { to: `${APP_ROUTES.receptionistRoot}/lich-hen`, label: 'Quản lý lịch hẹn' },
      { to: `${APP_ROUTES.receptionistRoot}/dat-lich`, label: 'Đặt lịch khám' },
      { to: `${APP_ROUTES.receptionistRoot}/lich-bac-si`, label: 'Lịch bác sĩ' },
      { to: `${APP_ROUTES.receptionistRoot}/thong-tin-ca-nhan`, label: 'Thông tin cá nhân' },
    ];
  }

  return [
    { to: APP_ROUTES.patientRoot, label: 'Dashboard', end: true },
    { to: `${APP_ROUTES.patientRoot}/lich-hen`, label: 'Lịch hẹn của tôi' },
    { to: `${APP_ROUTES.patientRoot}/nguoi-than`, label: 'Hồ sơ người thân' },
    { to: `${APP_ROUTES.patientRoot}/thong-tin-ca-nhan`, label: 'Thông tin cá nhân' },
  ];
}

export default function DashboardLayout() {
  const { user, role } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const links = useMemo(() => getPortalLinksByRole(role), [role]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    dispatch(clearAuth());
    navigate(APP_ROUTES.login, { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-mark">+</span>
          <div>
            <strong>CarePlus</strong>
            <p>{role || 'Portal'}</p>
          </div>
        </div>

        <nav className="dashboard-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="dashboard-logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Portal</p>
            <h1>{user?.name || 'CarePlus User'}</h1>
          </div>
          <div className="dashboard-user-card">
            <span>{user?.email}</span>
            <strong>{role}</strong>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
