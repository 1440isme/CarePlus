import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Menu, X, Phone, Calendar, User, LogOut, ChevronDown, Stethoscope
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { clearAuth } from '../../../features/auth/store/auth.slice.js';
import { useClinicInfo } from '../../../features/admin/clinic-settings/hooks/useClinicInfo.js';

const navItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Chuyên khoa', href: '/chuyen-khoa' },
  { label: 'Bác sĩ', href: '/bac-si' },
  { label: 'Cẩm nang', href: '/cam-nang' },
  { label: 'Liên hệ', href: '/lien-he' },
];

export default function Header() {
  const { data: response } = useClinicInfo({
    staleTime: 10 * 60 * 1000,
  });
  const clinicInfo = response?.data;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user: currentUser, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const isActive = (href) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const getPortalLink = () => {
    if (!currentUser) return '/dang-nhap';
    switch (role) {
      case 'PATIENT': return '/benh-nhan';
      case 'DOCTOR': return '/portal/bac-si';
      case 'RECEPTIONIST': return '/portal/le-tan';
      case 'ADMIN': return '/portal/admin';
      default: return '/benh-nhan';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    dispatch(clearAuth());
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Care<span className="text-cyan-600">Plus</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-cyan-600 bg-cyan-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <a href={`tel:${clinicInfo?.hotline?.replace(/\s/g, '') || '19001234'}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-cyan-600">
              <Phone className="w-4 h-4" />
              {clinicInfo?.hotline || '1900 1234'}
            </a>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-cyan-300 text-sm transition-colors"
                >
                  <div className="w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-cyan-700" />
                  </div>
                  <span className="text-gray-700 max-w-32 truncate">{currentUser?.name || 'Bệnh nhân'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      to={getPortalLink()}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Calendar className="w-4 h-4" />
                      Trang cá nhân
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/dang-nhap"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-cyan-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dat-lich"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  Đặt lịch khám
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          <nav className="flex flex-col gap-1 mt-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-cyan-600 bg-cyan-50 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
            {isAuthenticated ? (
              <>
                <Link
                  to={getPortalLink()}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-center text-sm border border-cyan-600 text-cyan-600 rounded-lg"
                >
                  Trang cá nhân
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 text-center text-sm text-red-600 border border-red-200 rounded-lg"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dang-nhap"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-center text-sm border border-gray-200 rounded-lg text-gray-700"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dat-lich"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-center text-sm bg-amber-500 text-white rounded-lg"
                >
                  Đặt lịch khám
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
