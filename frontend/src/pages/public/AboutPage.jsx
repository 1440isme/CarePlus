export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Về CarePlus Clinic</h1>
        <div className="w-16 h-1 bg-cyan-600 rounded mb-8" />
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1761258747617-822222c941aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
              alt="CarePlus Clinic"
              className="w-full h-56 object-cover"
              onError={(e) => {
                // Fallback image if unsplash link is offline
                e.target.src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Chúng tôi là ai?</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                CarePlus Clinic là phòng khám đa khoa hiện đại tại TP. Hồ Chí Minh, được thành lập với sứ mệnh cung cấp dịch vụ khám chữa bệnh chất lượng cao, tiếp cận dễ dàng cho người dân.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Với đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm và hệ thống đặt lịch trực tuyến tiên tiến, chúng tôi cam kết mang đến trải nghiệm khám bệnh thuận tiện, nhanh chóng và hiệu quả.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: '2020', label: 'Năm thành lập' },
              { num: '8+', label: 'Chuyên khoa sâu' },
              { num: '10.000+', label: 'Bệnh nhân tin tưởng' },
            ].map(s => (
              <div key={s.label} className="bg-cyan-600 text-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl font-extrabold mb-1">{s.num}</div>
                <div className="text-cyan-100 text-xs font-semibold">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tầm nhìn & Sứ mệnh</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-cyan-50/50 rounded-xl">
                <h3 className="font-bold text-cyan-800 mb-2">Tầm nhìn</h3>
                <p className="text-xs text-cyan-700 leading-relaxed">Trở thành phòng khám đa khoa uy tín hàng đầu tại TP. HCM, ứng dụng công nghệ hiện đại để nâng cao chất lượng chăm sóc sức khỏe chủ động.</p>
              </div>
              <div className="p-4 bg-teal-50/50 rounded-xl">
                <h3 className="font-bold text-teal-800 mb-2">Sứ mệnh</h3>
                <p className="text-xs text-teal-700 leading-relaxed">Cung cấp dịch vụ khám chữa bệnh chất lượng, tận tâm và dễ tiếp cận cho mọi người dân, góp phần nâng cao sức khỏe cộng đồng.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
