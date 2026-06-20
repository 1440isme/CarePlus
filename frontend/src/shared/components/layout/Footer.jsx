import { Link } from 'react-router-dom';
import './layout.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* About / Brand Section */}
        <div className="footer-section footer-about">
          <Link to="/" className="footer-logo">
            <span className="logo-icon">+</span>
            <span className="brand-text">Care<span className="text-cyan">Plus</span></span>
          </Link>
          <p className="footer-desc">
            Hệ thống đặt lịch khám trực tuyến hàng đầu, kết nối bệnh nhân với đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm và tận tâm.
          </p>
          <div className="footer-social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Youtube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
            <a href="mailto:info@careplus.vn" className="social-icon-link" aria-label="Email">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Operating Hours Section */}
        <div className="footer-section footer-hours">
          <h3>Giờ Làm Việc</h3>
          <ul className="footer-list">
            <li>
              <span className="day">Thứ Hai - Thứ Bảy:</span>
              <span className="time">08:00 - 17:00</span>
            </li>
            <li>
              <span className="shift-detail">☀️ Ca Sáng:</span>
              <span className="time-detail">08:00 - 11:30</span>
            </li>
            <li>
              <span className="shift-detail">🌤️ Ca Chiều:</span>
              <span className="time-detail">13:30 - 17:00</span>
            </li>
            <li>
              <span className="day text-muted">Chủ Nhật & Ngày lễ:</span>
              <span className="time text-muted">Nghỉ</span>
            </li>
          </ul>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section footer-links">
          <h3>Liên Kết Nhanh</h3>
          <ul className="footer-list">
            <li><Link to="/chuyen-khoa">Chuyên khoa</Link></li>
            <li><Link to="/bac-si">Đội ngũ bác sĩ</Link></li>
            <li><Link to="/cam-nang">Cẩm nang sức khỏe</Link></li>
            <li><Link to="/ve-chung-toi">Về chúng tôi</Link></li>
            <li><Link to="/faq">Câu hỏi thường gặp (FAQ)</Link></li>
            <li><Link to="/lien-he">Liên hệ hỗ trợ</Link></li>
          </ul>
        </div>

        {/* Contact Info Section */}
        <div className="footer-section footer-contact">
          <h3>Liên Hệ</h3>
          <ul className="footer-list">
            <li className="contact-item">
              <span className="contact-icon">📍</span>
              <span className="contact-text">Lầu 2, Tòa nhà CarePlus, 107 Nguyễn Văn Trỗi, P. 11, Q. Phú Nhuận, TP. Hồ Chí Minh</span>
            </li>
            <li className="contact-item">
              <span className="contact-icon">📞</span>
              <span className="contact-text">Hotline: <strong>1800 6116</strong></span>
            </li>
            <li className="contact-item">
              <span className="contact-icon">✉️</span>
              <span className="contact-text">Email: info@careplus.vn</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright-text">
            &copy; {currentYear} CarePlus Clinic. Bảo lưu mọi quyền.
          </p>
          <div className="footer-bottom-links">
            <Link to="/ve-chung-toi">Về chúng tôi</Link>
            <span className="divider">|</span>
            <Link to="/faq">Câu hỏi thường gặp</Link>
            <span className="divider">|</span>
            <Link to="/lien-he">Liên hệ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
