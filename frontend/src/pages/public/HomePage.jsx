import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, CheckCircle, Star, ChevronRight, ChevronLeft,
  Calendar, Clock, Shield, Mail, Stethoscope, Users, BookOpen
} from 'lucide-react';
import axiosInstance from '../../shared/services/axios.instance';
import { useQuery } from '@tanstack/react-query';
import { SpecialtyCard } from '../../shared/components/shared/SpecialtyCard';
import { DoctorCard } from '../../shared/components/shared/DoctorCard';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList';
import { usePublicBlogs } from '../../features/blog/hooks/useBlog';

const services = [
  { icon: <Stethoscope className="w-7 h-7" />, label: 'Khám chuyên khoa', desc: '8 chuyên khoa đa dạng', color: 'bg-cyan-50 text-cyan-600', href: '/chuyen-khoa' },
  { icon: <Users className="w-7 h-7" />, label: 'Bác sĩ nổi bật', desc: 'Đội ngũ giàu kinh nghiệm', color: 'bg-blue-50 text-blue-600', href: '/bac-si' },
  { icon: <Calendar className="w-7 h-7" />, label: 'Đặt lịch trong ngày', desc: 'Slot còn trống ngay hôm nay', color: 'bg-amber-50 text-amber-600', href: '/dat-lich' },
  { icon: <BookOpen className="w-7 h-7" />, label: 'Hỏi đáp & Hướng dẫn', desc: 'Giải đáp thắc mắc nhanh', color: 'bg-green-50 text-green-600', href: '/faq' },
];

const steps = [
  { num: '01', title: 'Chọn chuyên khoa hoặc bác sĩ', desc: 'Tìm kiếm theo chuyên khoa hoặc tên bác sĩ phù hợp với nhu cầu của bạn.' },
  { num: '02', title: 'Chọn ngày và khung giờ còn trống', desc: 'Xem lịch rảnh của bác sĩ và chọn khung giờ thuận tiện trong vòng 7 ngày tới.' },
  { num: '03', title: 'Điền thông tin và xác nhận lịch hẹn', desc: 'Nhập thông tin người khám và nhận email xác nhận lịch hẹn ngay lập tức.' },
];

const benefits = [
  { icon: <Clock className="w-5 h-5 text-cyan-600" />, title: 'Giảm thời gian chờ', desc: 'Biết trước lịch hẹn, không phải đợi xếp hàng.' },
  { icon: <Shield className="w-5 h-5 text-cyan-600" />, title: 'Biết trước giá khám', desc: 'Giá khám tham khảo minh bạch cho từng bác sĩ.' },
  { icon: <Mail className="w-5 h-5 text-cyan-600" />, title: 'Nhận email xác nhận', desc: 'Hệ thống tự động gửi email xác nhận sau khi đặt thành công.' },
  { icon: <Calendar className="w-5 h-5 text-cyan-600" />, title: 'Chủ động quản lý lịch', desc: 'Xem, hủy hoặc thay đổi lịch hẹn mọi lúc mọi nơi.' },
];

function DoctorSlider({ title, subtitle, items, loading }) {
  const [start, setStart] = useState(0);
  const visibleCount = 4;
  const canPrev = start > 0;
  const canNext = start + visibleCount < items.length;

  if (loading) {
    return (
      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <div className="p-8 bg-gray-50 rounded-2xl text-center text-gray-500 border border-gray-100">
          Chưa có hồ sơ bác sĩ nào hoạt động.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStart(s => Math.max(0, s - 1))}
            disabled={!canPrev}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
              canPrev ? 'border-cyan-500 bg-white hover:bg-cyan-50 text-cyan-500 cursor-pointer' : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStart(s => Math.min(items.length - visibleCount, s + 1))}
            disabled={!canNext}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
              canNext ? 'border-cyan-500 bg-white hover:bg-cyan-50 text-cyan-500 cursor-pointer' : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(calc(-${start} * (25% + 12px)))` }}
        >
          {items.map(d => (
            <div key={d.id} className="flex-none w-full sm:w-[calc(50%-8px)] md:w-[calc(25%-12px)]">
              <DoctorCard doctor={d} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [specialtyQuery, setSpecialtyQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch data using React Query hooks
  const { data: specialtiesData, isLoading: loadingSpecialties } = useSpecialties({ limit: 8 });
  const { data: expDoctorsData, isLoading: loadingExpDoctors } = useDoctorList({ sortBy: 'experience', sortOrder: 'desc', limit: 8 });
  const { data: favDoctorsData, isLoading: loadingFavDoctors } = useDoctorList({ sortBy: 'rating', sortOrder: 'desc', limit: 8 });
  const { data: blogsData, isLoading: loadingBlogs } = usePublicBlogs({ limit: 4 });

  const specialties = specialtiesData?.data || [];
  const expDoctors = expDoctorsData?.data || [];
  const favDoctors = favDoctorsData?.data || [];
  const blogs = blogsData?.data || [];

  const { data: statsResponse } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await axiosInstance.get('/clinic-settings/stats/public');
      return res.data;
    }
  });
  const publicStats = statsResponse?.data;

  const totalSpecs = publicStats?.specialtyCount || specialtiesData?.meta?.total || 0;
  const totalDocs = publicStats?.doctorCount || expDoctorsData?.meta?.total || 0;
  
  const formattedPatientCount = useMemo(() => {
    if (!publicStats || publicStats.patientCount === undefined) return '0';
    const count = publicStats.patientCount;
    return count >= 100 ? `${count}+` : `${count}`;
  }, [publicStats]);

  const avgRating = useMemo(() => {
    const doctorsWithRating = favDoctors.filter(d => d.rating > 0);
    if (!doctorsWithRating.length) return '4.8';
    const total = doctorsWithRating.reduce((sum, d) => sum + d.rating, 0);
    return (total / doctorsWithRating.length).toFixed(1);
  }, [favDoctors]);

  const homeServices = [
    { icon: <Stethoscope className="w-7 h-7" />, label: 'Khám chuyên khoa', desc: `${totalSpecs || 8} chuyên khoa đa dạng`, color: 'bg-cyan-50 text-cyan-600', href: '/chuyen-khoa' },
    { icon: <Users className="w-7 h-7" />, label: 'Bác sĩ nổi bật', desc: 'Đội ngũ giàu kinh nghiệm', color: 'bg-blue-50 text-blue-600', href: '/bac-si' },
    { icon: <Calendar className="w-7 h-7" />, label: 'Đặt lịch trong ngày', desc: 'Slot còn trống ngay hôm nay', color: 'bg-amber-50 text-amber-600', href: '/dat-lich' },
    { icon: <BookOpen className="w-7 h-7" />, label: 'Hỏi đáp & Hướng dẫn', desc: 'Giải đáp thắc mắc nhanh', color: 'bg-green-50 text-green-600', href: '/faq' },
  ];

  // Debounced search effect calling Elasticsearch API
  useEffect(() => {
    if (specialtyQuery.trim().length < 2) {
      setSearchResults(null);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const response = await axiosInstance.get(`/search?query=${encodeURIComponent(specialtyQuery.trim())}`);
        if (response.data && response.data.success) {
          setSearchResults(response.data.data);
        } else {
          setSearchResults(null);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [specialtyQuery]);

  // Handle clicking outside the search dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (specialtyQuery.trim()) {
      navigate(`/chuyen-khoa?search=${encodeURIComponent(specialtyQuery.trim())}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BS';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full">

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-cyan-700 via-cyan-600 to-teal-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-white rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-white rounded-full blur-xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              Được tin tưởng bởi hàng nghìn bệnh nhân
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Đặt lịch khám tại CarePlus<br />
              <span className="text-amber-300">nhanh chóng, đúng bác sĩ,</span><br />
              đúng giờ
            </h1>
            <p className="text-lg text-cyan-100 mb-8">
              Tìm bác sĩ, chuyên khoa và đặt lịch khám chỉ trong vài bước. Không cần xếp hàng chờ đợi.
            </p>

            {/* Debounced Search Bar */}
            <div className="relative mb-6" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleHeroSearch} className="flex bg-white rounded-2xl shadow-xl overflow-hidden mb-0">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={specialtyQuery}
                    onChange={e => setSpecialtyQuery(e.target.value)}
                    onFocus={() => {
                      if (specialtyQuery.trim().length >= 2) {
                        setShowDropdown(true);
                      }
                    }}
                    placeholder="Tìm kiếm bác sĩ, chuyên khoa hoặc cẩm nang..."
                    className="flex-1 py-4 text-gray-800 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors whitespace-nowrap"
                >
                  Tìm kiếm
                </button>
              </form>

              {/* Dropdown search results */}
              {showDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 text-gray-800 max-h-[400px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Đang tìm kiếm kết quả...
                    </div>
                  ) : (!searchResults || (searchResults.doctors.length === 0 && searchResults.blogs.length === 0)) ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Không tìm thấy kết quả nào phù hợp.
                    </div>
                  ) : (
                    <div className="p-2">
                      {searchResults.doctors && searchResults.doctors.length > 0 && (
                        <div className="mb-2">
                          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Bác sĩ & Chuyên khoa
                          </div>
                          {searchResults.doctors.slice(0, 5).map((doc) => {
                            const initials = getInitials(doc.name);
                            return (
                              <Link
                                to={`/bac-si/${doc.id}`}
                                key={doc.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{doc.title} {doc.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {doc.specialtyName} • ⭐ {doc.rating ? Number(doc.rating).toFixed(1) : '5.0'}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {searchResults.blogs && searchResults.blogs.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Cẩm nang sức khỏe
                          </div>
                          {searchResults.blogs.slice(0, 5).map((blog) => (
                            <Link
                              to={`/cam-nang/${blog.slug}`}
                              key={blog.id}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm flex-shrink-0">
                                📖
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">{blog.title}</div>
                                <div className="text-xs text-gray-500">Chuyên mục: {blog.tag}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/dat-lich"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Đặt lịch khám
              </Link>
              <Link
                to="/chuyen-khoa"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 rounded-xl font-medium transition-colors"
              >
                Xem chuyên khoa
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative border-t border-white/10 bg-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { num: `${totalSpecs || 8}+`, label: 'Chuyên khoa' },
                { num: `${totalDocs || 6}+`, label: 'Bác sĩ chuyên khoa' },
                { num: formattedPatientCount, label: 'Bệnh nhân tin tưởng' },
                { num: `${avgRating}★`, label: 'Đánh giá trung bình' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-amber-300">{s.num}</div>
                  <div className="text-sm text-cyan-100">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {homeServices.map(s => (
              <Link
                key={s.label}
                to={s.href}
                className="flex flex-col items-center text-center p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group bg-white"
              >
                <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                  {s.icon}
                </div>
                <div className="font-semibold text-gray-900 text-sm">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Chuyên khoa phổ biến</h2>
              <p className="text-gray-500 mt-1">Đội ngũ chuyên gia hàng đầu trong nhiều lĩnh vực y tế</p>
            </div>
            <Link to="/chuyen-khoa" className="hidden md:flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 font-medium">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingSpecialties ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="w-4 h-4 bg-gray-200 rounded-full" />
                  </div>
                </div>
              ))
            ) : specialties.length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                Không tìm thấy dữ liệu chuyên khoa.
              </div>
            ) : (
              specialties.map((spec, i) => (
                <SpecialtyCard key={spec.id} specialty={spec} index={i} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Experienced Doctors Slider */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DoctorSlider
            title="Đội ngũ bác sĩ kinh nghiệm"
            subtitle="Những chuyên gia y tế có nhiều năm công tác tại các bệnh viện lớn"
            items={expDoctors}
            loading={loadingExpDoctors}
          />
        </div>
      </section>

      {/* Favorite Doctors Slider */}
      <section className="py-16 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DoctorSlider
            title="Bác sĩ được yêu thích nhất"
            subtitle="Đội ngũ nhận được phản hồi tích cực nhất từ phía khách hàng"
            items={favDoctors}
            loading={loadingFavDoctors}
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Lợi ích khi đăng ký đặt lịch trước</h2>
              <p className="text-gray-500 mb-8">Chúng tôi tối ưu hóa quy trình y tế để mang lại sự tiện lợi nhất cho gia đình bạn.</p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {benefits.map((b, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      {b.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{b.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-3xl p-8 border border-cyan-100/50 flex flex-col justify-center items-center text-center py-16">
              <div className="w-16 h-16 bg-cyan-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-cyan-600/20">
                📈
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">Chăm sóc y tế chủ động</h4>
              <p className="text-sm text-gray-600 max-w-sm">
                Quản lý lịch trình y học thông minh giúp nâng cao hiệu quả phòng ngừa bệnh tật.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Handbook (Blogs) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Cẩm nang sức khỏe</h2>
              <p className="text-gray-500 mt-1">Kiến thức y tế hữu ích được tham vấn chuyên môn từ đội ngũ chuyên khoa CarePlus</p>
            </div>
            <Link to="/cam-nang" className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 font-medium">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {loadingBlogs ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="w-full h-40 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))
            ) : blogs.length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                Chưa có bài viết cẩm nang nào.
              </div>
            ) : (
              blogs.map((blog) => (
                <Link
                  to={`/cam-nang/${blog.slug}`}
                  key={blog.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group flex flex-col"
                >
                  <div className="h-40 bg-cyan-50 relative overflow-hidden flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
                    {blog.thumbnail ? (
                      <img 
                        src={blog.thumbnail} 
                        alt={blog.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{blog.icon || '📖'}</span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded text-[10px] font-semibold mb-2">
                        {blog.tag}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-cyan-600 transition-colors line-clamp-2 mb-2">
                        {blog.title}
                      </h3>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      📅 {blog.createdAt}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
