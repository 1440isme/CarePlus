import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useClinicInfo } from '../../features/admin/clinic-settings/hooks/useClinicInfo.js';

export default function ContactPage() {
  const { data: response } = useClinicInfo({
    staleTime: 10 * 60 * 1000,
  });
  const clinicInfo = response?.data;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất qua email của bạn.');
  };

  const contactItems = [
    { icon: <MapPin className="w-5 h-5 text-cyan-600" />, title: 'Địa chỉ', content: clinicInfo?.address || '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh' },
    { icon: <Phone className="w-5 h-5 text-cyan-600" />, title: 'Hotline', content: clinicInfo?.hotline || '1900 1234 (Thứ 2 – Thứ 7: 7:30–17:00)' },
    { icon: <Mail className="w-5 h-5 text-cyan-600" />, title: 'Email', content: clinicInfo?.email || 'lienhe@careplus.vn' },
    { icon: <Clock className="w-5 h-5 text-cyan-600" />, title: 'Giờ làm việc', content: clinicInfo?.workingHours || 'Thứ 2 – Thứ 6: 7:30 – 17:00 | Thứ 7: 7:30 – 12:00 | Chủ nhật: Nghỉ' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Liên hệ với chúng tôi</h1>
        <div className="w-16 h-1 bg-cyan-600 rounded mx-auto mb-8" />

        <div className="space-y-4 text-left">
          {contactItems.map(item => (
            <div key={item.title} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-150 shadow-sm transition-shadow hover:shadow-md">
              <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">{item.content}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white border border-gray-150 rounded-2xl h-64 flex items-center justify-center shadow-sm">
          <div className="text-center text-gray-500 p-6">
            <MapPin className="w-10 h-10 mx-auto mb-2 text-cyan-600" />
            <h4 className="font-bold text-gray-900 text-sm mb-1">Bản đồ CarePlus</h4>
            <p className="text-xs text-gray-500">{clinicInfo?.address || '123 Nguyễn Thị Minh Khai, Quận 3, TP.HCM'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
