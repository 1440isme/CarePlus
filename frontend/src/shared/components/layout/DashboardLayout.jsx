import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Menu, X, LogOut, User, Bell, Stethoscope, Home, Calendar,
  ClipboardList, ChevronRight, Mail
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { clearAuth } from '../../../features/auth/store/auth.slice.js';
import { APP_ROUTES } from '../../constants/routes.js';

const navConfig = {
  DOCTOR: [
    { label: 'Tổng quan', href: APP_ROUTES.doctorRoot, icon: <Home className="w-4 h-4" />, end: true },
    { label: 'Lịch hẹn', href: `${APP_ROUTES.doctorRoot}/lich-hen`, icon: <Calendar className="w-4 h-4" /> },
    { label: 'Lịch làm việc', href: `${APP_ROUTES.doctorRoot}/lich-lam-viec`, icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Tin nhắn', href: `${APP_ROUTES.doctorRoot}/tin-nhan`, icon: <Mail className="w-4 h-4" /> },
    { label: 'Thông tin cá nhân', href: `${APP_ROUTES.doctorRoot}/thong-tin-ca-nhan`, icon: <User className="w-4 h-4" /> },
  ]
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: currentUser, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!currentUser || role !== 'DOCTOR') {
      navigate('/dang-nhap');
    }
  }, [currentUser, role, navigate]);

  if (!currentUser || role !== 'DOCTOR') {
    return null;
  }

  const navItems = navConfig.DOCTOR;

  const isActive = (item) => {
    if (item.end) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    dispatch(clearAuth());
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-cyan-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">
            Care<span className="text-cyan-600">Plus</span>
          </span>
        </NavLink>
        <button className="md:hidden p-1 text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-cyan-50">
          <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</div>
            <div className="text-xs text-cyan-600">Bác sĩ</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(item => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-cyan-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.label}
                {isActive(item) && <ChevronRight className="w-3 h-3 ml-auto" />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between flex-shrink-0">
          <button
            className="md:hidden p-1.5 text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
