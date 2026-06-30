import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useClinicInfo } from '../../features/admin/clinic-settings/hooks/useClinicInfo.js';

const faqTemplates = [
  { q: 'Làm thế nào để hủy lịch hẹn?', a: 'Bạn có thể hủy lịch hẹn trong trang "Lịch hẹn của tôi" nếu còn đủ thời gian trước giờ hẹn (thường là 2 giờ). Nếu đã quá thời hạn, vui lòng liên hệ phòng khám qua hotline {hotline}.' },
  { q: 'No-show là gì? Có ảnh hưởng gì không?', a: 'No-show là khi bạn đặt lịch nhưng không đến khám và không thông báo hủy. Nếu có quá nhiều lần no-show, tài khoản đặt lịch của bạn có thể bị khóa tạm thời. Admin sẽ xem xét và mở khóa sau khi liên hệ.' },
  { q: 'Tôi cần xác minh email sau khi đăng ký không?', a: 'Có, sau khi đăng ký bạn sẽ nhận được email xác minh. Bạn cần nhập mã OTP được gửi vào email để kích hoạt tài khoản trước khi có thể đặt lịch khám.' },
  { q: 'Quy trình khám bệnh tại CarePlus như thế nào?', a: 'Bước 1: Đặt lịch online và nhận email xác nhận. Bước 2: Đến phòng khám trước giờ hẹn 10-15 phút. Bước 3: Check-in tại quầy lễ tân. Bước 4: Chờ được gọi tên và vào khám. Bước 5: Nhận kết quả và đơn thuốc (nếu có).' },
  { q: 'Tôi có thể đặt lịch cho người thân không?', a: 'Có, sau khi đăng nhập bạn có thể đặt lịch cho người thân bằng cách thêm hồ sơ người thân trong mục "Hồ sơ người thân" và chọn người khám trong quá trình đặt lịch.' },
  { q: 'Phòng khám có nhận thanh toán online không?', a: 'Hiện tại CarePlus Clinic chưa hỗ trợ thanh toán online. Giá khám trên website chỉ mang tính chất tham khảo. Bạn sẽ thanh toán trực tiếp tại phòng khám sau khi khám xong.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState(0);
  const { data: response } = useClinicInfo({
    staleTime: 10 * 60 * 1000,
  });
  const hotline = response?.data?.hotline || '1900 1234';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Câu hỏi thường gặp</h1>
      <div className="w-16 h-1 bg-cyan-600 rounded mb-8" />
      <div className="space-y-3">
        {faqTemplates.map((faq, i) => (
          <div key={i} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors hover:bg-gray-50/50"
            >
              <span className="font-bold text-gray-800 text-sm pr-4">{faq.q}</span>
              {open === i ? <ChevronUp className="w-5 h-5 text-cyan-600 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                {faq.a.replace('{hotline}', hotline)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
