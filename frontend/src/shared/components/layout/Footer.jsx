import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Stethoscope } from 'lucide-react';

// Social media icons (brand icons are not available in lucide-react)
const FacebookIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YoutubeIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xl font-semibold">
                Care<span className="text-cyan-400">Plus</span> Clinic
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Phòng khám đa khoa CarePlus — Nơi bạn tin tưởng đặt lịch khám trực tuyến nhanh chóng, tiết kiệm thời gian.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-cyan-600 rounded-lg flex items-center justify-center transition-colors">
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-cyan-600 rounded-lg flex items-center justify-center transition-colors">
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              {[
                { label: 'Trang chủ', href: '/' },
                { label: 'Chuyên khoa', href: '/chuyen-khoa' },
                { label: 'Đội ngũ bác sĩ', href: '/bac-si' },
                { label: 'Cẩm nang sức khỏe', href: '/cam-nang' },
                { label: 'Về chúng tôi', href: '/ve-chung-toi' },
                { label: 'Câu hỏi thường gặp', href: '/faq' },
              ].map(item => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm hover:text-cyan-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-white font-medium mb-4">Chuyên khoa</h4>
            <ul className="space-y-2">
              {['Tim mạch', 'Cơ Xương Khớp', 'Nhi khoa', 'Da liễu', 'Tiêu hóa', 'Tai Mũi Họng', 'Sản Phụ khoa', 'Nội tổng quát'].map(s => (
                <li key={s}>
                  <Link to="/chuyen-khoa" className="text-sm hover:text-cyan-400 transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-medium mb-4">Thông tin liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">107 Nguyễn Văn Trỗi, P. 11, Q. Phú Nhuận, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">1800 6116 (Miễn phí)</span>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">info@careplus.vn</span>
              </li>
              <li className="flex gap-3">
                <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div>Thứ 2 – Thứ 6: 7:30 – 17:00</div>
                  <div>Thứ 7: 7:30 – 12:00</div>
                  <div>Chủ nhật: Nghỉ</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 CarePlus Clinic. Bảo lưu mọi quyền.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-300">Chính sách bảo mật</a>
            <a href="#" className="hover:text-gray-300">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
