import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { APP_ROUTES } from '../../constants/routes.js';
import './layout.css';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/bac-si?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const portalPath = role === 'DOCTOR'
    ? APP_ROUTES.doctorRoot
    : role === 'RECEPTIONIST'
      ? APP_ROUTES.receptionistRoot
      : role === 'ADMIN'
        ? APP_ROUTES.adminRoot
        : APP_ROUTES.patientRoot;

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={() => setIsMenuOpen(false)}>
          <span className="logo-icon">+</span>
          <span className="brand-text">
            Care<span className="text-cyan">Plus</span>
          </span>
        </Link>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="header-search-form">
          <input
            type="text"
            placeholder="Tìm bác sĩ, chuyên khoa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-search-input"
          />
          <button type="submit" className="header-search-btn" aria-label="Tìm kiếm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        {/* Navigation Menu */}
        <nav className={`main-nav ${isMenuOpen ? 'is-open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            Trang chủ
          </NavLink>
          <NavLink to="/chuyen-khoa" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            Chuyên khoa
          </NavLink>
          <NavLink to="/bac-si" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            Bác sĩ
          </NavLink>
          <NavLink to="/cam-nang" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            Cẩm nang
          </NavLink>
          <NavLink to="/ve-chung-toi" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            Về chúng tôi
          </NavLink>
          <NavLink to="/lien-he" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            Liên hệ
          </NavLink>

          {/* Search bar inside navigation (only visible on mobile) */}
          <form onSubmit={handleSearchSubmit} className="mobile-search-form">
            <input
              type="text"
              placeholder="Tìm bác sĩ, chuyên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input"
            />
            <button type="submit" className="mobile-search-btn">Tìm kiếm</button>
          </form>

          {/* Auth buttons inside navigation (only visible on mobile) */}
          <div className="mobile-auth-buttons">
            {isAuthenticated ? (
              <Link to={portalPath} className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Vào portal</Link>
            ) : (
              <>
                <Link to="/dang-nhap" className="btn btn-outline" onClick={() => setIsMenuOpen(false)}>Đăng nhập</Link>
                <Link to="/dang-ky" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Đăng ký</Link>
              </>
            )}
          </div>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="desktop-auth-actions">
          {isAuthenticated ? (
            <Link to={portalPath} className="btn btn-outline">Vào portal</Link>
          ) : (
            <Link to="/dang-nhap" className="btn btn-outline">Đăng nhập</Link>
          )}
          <Link to="/dat-lich" className="btn btn-primary">Đặt lịch ngay</Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className={`hamburger-btn ${isMenuOpen ? 'is-active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
