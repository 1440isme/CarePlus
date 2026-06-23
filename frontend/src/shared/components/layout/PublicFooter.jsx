import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Stethoscope } from 'lucide-react';
import { useClinicInfo } from '../../../features/admin/clinic-settings/hooks/useClinicInfo.js';

export function PublicFooter() {
  const { data: response } = useClinicInfo({
    staleTime: 10 * 60 * 1000,
  });
  const clinicInfo = response?.data;

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
                {clinicInfo?.name || (
                  <>Care<span className="text-cyan-400">Plus</span> Clinic</>
                )}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              {clinicInfo?.description || 'Phòng khám đa khoa CarePlus — Nơi bạn tin tưởng đặt lịch khám trực tuyến nhanh chóng, tiết kiệm thời gian.'}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-cyan-600 rounded-lg flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-cyan-600 rounded-lg flex items-center justify-center transition-colors" aria-label="Youtube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
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
                <span className="text-sm">{clinicInfo?.address || '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh'}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{clinicInfo?.hotline || '1900 1234 (Miễn phí)'}</span>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{clinicInfo?.email || 'lienhe@careplus.vn'}</span>
              </li>
              <li className="flex gap-3">
                <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm whitespace-pre-line">
                  {clinicInfo?.workingHours || (
                    <>
                      <div>Thứ 2 – Thứ 6: 7:30 – 17:00</div>
                      <div>Thứ 7: 7:30 – 12:00</div>
                      <div>Chủ nhật: Nghỉ</div>
                    </>
                  )}
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
