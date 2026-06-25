import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import {
  ChevronRight, Star, Briefcase, MapPin, Phone, Clock, Calendar,
  ArrowRight, Info, CheckCircle, MessageSquare
} from 'lucide-react';
import { useDoctorDetail } from '../../features/doctor/index.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import { useBookingRules } from '../../features/admin/clinic-settings/hooks/useBookingRules.js';
import {
  buildVirtualSlotsForSchedules,
  filterSlotGroupsBySchedules,
  mergePersistedSlots,
} from '../../features/timeslot/virtual-slot.service.js';
import { useDoctorReviews } from '../../features/review/hooks/useReview.js';
import { useAuth } from '../../shared/hooks/useAuth.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { useClinicInfo } from '../../features/admin/clinic-settings/hooks/useClinicInfo.js';

function getDefaultDate(searchParams) {
  return searchParams.get('date') || new Date().toLocaleDateString('sv').slice(0, 10);
}

function buildDateOptions(count = 7) {
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = date.toLocaleDateString('sv').slice(0, 10);

    return {
      value,
      weekday: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      day: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    };
  });
}

function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className="text-amber-400 fill-amber-400"
          style={{ 
            width: size, 
            height: size, 
            color: s <= Math.round(rating) ? '#F59E0B' : '#E5E5E5', 
            fill: s <= Math.round(rating) ? '#F59E0B' : '#E5E5E5' 
          }}
        />
      ))}
    </div>
  );
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = getDefaultDate(searchParams);
  
  const { data: doctorResponse, isLoading, error } = useDoctorDetail(id);
  const doctor = doctorResponse?.data;
  const { data: bookingRulesResponse } = useBookingRules();
  const { data: slotResponse, isLoading: isLoadingSlots } = useTimeSlots({ doctorId: id, date: selectedDate });
  const slotData = slotResponse?.data;
  
  const { isAuthenticated, role } = useAuth();
  const { data: clinicResponse } = useClinicInfo({
    staleTime: 10 * 60 * 1000,
  });
  const clinicInfo = clinicResponse?.data;
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('lich');
  const [reviewPage, setReviewPage] = useState(1);
  const [loadedReviews, setLoadedReviews] = useState([]);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  // Fetch reviews using react-query hook
  const { data: reviewsResponse, isLoading: isLoadingReviews } = useDoctorReviews(id, { 
    page: reviewPage, 
    limit: 5 
  });

  // Reset review state on doctor ID change
  useEffect(() => {
    setLoadedReviews([]);
    setReviewPage(1);
    setHasMoreReviews(false);
  }, [id]);

  // Load more reviews effect
  useEffect(() => {
    if (reviewsResponse?.data) {
      const newReviews = reviewsResponse.data;
      setLoadedReviews((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const filtered = newReviews.filter((r) => !existingIds.has(r.id));
        return [...prev, ...filtered];
      });

      const pagination = reviewsResponse.pagination || {};
      const total = pagination.total || 0;
      const page = pagination.page || 1;
      const limit = pagination.limit || 5;
      setHasMoreReviews(page * limit < total);
    }
  }, [reviewsResponse]);

  const dateOptions = useMemo(() => buildDateOptions(bookingRulesResponse?.data?.maxBookingDaysAhead || 7), [bookingRulesResponse?.data?.maxBookingDaysAhead]);
  
  const slotGroups = useMemo(() => {
    const schedules = slotData?.schedules || [];
    if (schedules.length === 0) {
      return { morning: [], afternoon: [] };
    }

    return mergePersistedSlots(
      filterSlotGroupsBySchedules(buildVirtualSlotsForSchedules(bookingRulesResponse?.data, schedules), schedules),
      slotData.slots || [],
    );
  }, [slotData, bookingRulesResponse?.data]);
  
  const visibleSlotCount = slotGroups.morning.length + slotGroups.afternoon.length;

  const handleDateSelect = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', value);
    setSearchParams(next);
  };

  const handleBook = (doctorId, slotTime) => {
    navigate(`/dat-lich?doctorId=${doctorId}&date=${selectedDate}&slot=${encodeURIComponent(slotTime)}`);
  };

  const handleChatWithDoctor = () => {
    if (!isAuthenticated) {
      navigate(`/dang-nhap?redirect=/bac-si/${id}`);
      return;
    }

    if (role !== 'PATIENT') {
      alert('Chỉ bệnh nhân mới có thể chat trực tiếp với bác sĩ.');
      return;
    }

    // Dispatch the custom event to trigger ChatWidget
    const event = new CustomEvent('open-doctor-chat', {
      detail: { doctorId: id, doctorName: doctor ? `${doctor.title} ${doctor.name}` : '' }
    });
    window.dispatchEvent(event);
  };

  // Generate realistic score distribution based on doctor's aggregated rating
  const distribution = useMemo(() => {
    if (!doctor?.rating || !doctor?.reviewCount) return [0, 0, 0, 0, 0];
    
    const distFromMeta = reviewsResponse?.meta?.ratingDistribution;
    if (distFromMeta) {
      const total = Object.values(distFromMeta).reduce((sum, v) => sum + v, 0);
      if (total > 0) {
        return [
          Math.round((distFromMeta[5] || 0) / total * 105) > 100 
            ? Math.round((distFromMeta[5] || 0) / total * 100)
            : Math.round((distFromMeta[5] || 0) / total * 100),
          Math.round((distFromMeta[4] || 0) / total * 100),
          Math.round((distFromMeta[3] || 0) / total * 100),
          Math.round((distFromMeta[2] || 0) / total * 100),
          Math.round((distFromMeta[1] || 0) / total * 100),
        ];
      }
    }

    const r = doctor.rating;
    
    const d5 = Math.min(100, Math.round(Math.max(0, (r - 3.5) * 2) * 45 + 10)); 
    const d4 = Math.min(100 - d5, Math.round(Math.max(0, (r - 2) * 8)));
    const d3 = Math.min(100 - d5 - d4, Math.round(Math.max(0, (5 - r) * 12)));
    const d2 = Math.min(100 - d5 - d4 - d3, Math.round(Math.max(0, (5 - r) * 3)));
    const d1 = Math.max(0, 100 - d5 - d4 - d3 - d2);
    
    return [d5, d4, d3, d2, d1];
  }, [doctor?.rating, doctor?.reviewCount, reviewsResponse?.meta?.ratingDistribution]);

  const tabs = [
    { id: 'gioi-thieu', label: 'Giới thiệu' },
    { id: 'lich', label: 'Lịch khám' },
    { id: 'phong-kham', label: 'Phòng khám' },
    { id: 'huong-dan', label: 'Hướng dẫn' },
    { id: 'danh-gia', label: 'Đánh giá' },
  ];

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const docAvatar = doctor?.avatar || (doctor?.gender === 'FEMALE' 
    ? 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=256&h=256&q=80'
    : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80'
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? <LoadingBlock label="Đang tải hồ sơ bác sĩ..." /> : null}
        {error ? <StateBlock variant="error" title="Không thể tải hồ sơ bác sĩ" description={error.message} /> : null}

        {doctor ? (
          <>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link to="/" className="hover:text-cyan-600 font-medium">Trang chủ</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/bac-si" className="hover:text-cyan-600 font-medium">Bác sĩ</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-semibold">{doctor.title} {doctor.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Profile card */}
                <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-cyan-600 to-teal-500 h-24" />
                  <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-12 mb-4">
                      <img
                        src={docAvatar}
                        alt={doctor.name}
                        className="w-24 h-24 rounded-2xl border-4 border-white object-cover object-top shadow-sm flex-shrink-0"
                      />
                      <div className="pb-1">
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm">{doctor.rating ? Number(doctor.rating).toFixed(1) : '5.0'}</span>
                          <span className="text-xs text-gray-400 font-normal">({doctor.reviewCount || 0} đánh giá)</span>
                        </div>
                      </div>
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900">{doctor.title} {doctor.name}</h1>
                    <div className="text-sm text-cyan-600 font-bold mt-1">{doctor.specialtyName}</div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span>{doctor.experience} năm kinh nghiệm</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>30 phút/lượt</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Panel */}
                <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                  <div className="flex border-b border-gray-150 overflow-x-auto">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                          activeTab === tab.id
                            ? 'text-cyan-600 border-cyan-600 bg-cyan-50/10'
                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50/50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    
                    {/* Tab: Giới thiệu */}
                    {activeTab === 'gioi-thieu' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Giới thiệu về bác sĩ</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {doctor.description || 'Chưa có thông tin giới thiệu chi tiết cho bác sĩ này.'}
                        </p>
                        <div className="pt-4 border-t border-gray-100 grid gap-3 text-sm text-gray-700">
                          <div><strong>Chức vụ:</strong> {doctor.position || 'Bác sĩ điều trị'}</div>
                          <div><strong>Chuyên khoa:</strong> {doctor.specialtyName}</div>
                          <div><strong>Kinh nghiệm:</strong> {doctor.experience} năm công tác chuyên khoa</div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Lịch khám */}
                    {activeTab === 'lich' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-gray-900">Chọn ngày và giờ khám</h3>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            Cập nhật thời gian thực
                          </span>
                        </div>

                        {/* Date Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {dateOptions.map(option => {
                            const isSelected = option.value === selectedDate;
                            const isToday = option.value === new Date().toLocaleDateString('sv').slice(0, 10);
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleDateSelect(option.value)}
                                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-cyan-300 text-gray-700'
                                }`}
                              >
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-cyan-100' : 'text-gray-400'}`}>
                                  {isToday ? 'Hôm nay' : option.weekday}
                                </span>
                                <span className="text-lg font-bold mt-0.5">{option.day.split('/')[0]}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isLoadingSlots ? (
                          <LoadingBlock label="Đang tải lịch khám..." />
                        ) : visibleSlotCount > 0 ? (
                          <div className="space-y-6 pt-4">
                            {/* Morning */}
                            {slotGroups.morning.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-amber-500 text-sm">☀</span>
                                  <span className="text-sm font-semibold text-gray-700">Buổi sáng</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                  {slotGroups.morning.map(slot => {
                                    const isBooked = ['BOOKED', 'EXPIRED'].includes(slot.status);
                                    const slotTimeStr = `${slot.startTime}-${slot.endTime}`;
                                    const isNotPatient = isAuthenticated && role && role !== 'PATIENT';
                                    return (
                                      <button
                                        key={slot.startTime}
                                        type="button"
                                        disabled={isBooked || isNotPatient}
                                        onClick={() => handleBook(doctor.id, slotTimeStr)}
                                        className={`py-2 px-2 text-[11px] rounded-xl text-center font-medium border transition-all whitespace-nowrap ${
                                          isBooked
                                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                            : isNotPatient
                                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-500 hover:text-cyan-600 cursor-pointer shadow-sm'
                                        }`}
                                      >
                                        {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Afternoon */}
                            {slotGroups.afternoon.length > 0 && (
                              <div className="pt-2">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-orange-500 text-sm">🌤</span>
                                  <span className="text-sm font-semibold text-gray-700">Buổi chiều</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                  {slotGroups.afternoon.map(slot => {
                                    const isBooked = ['BOOKED', 'EXPIRED'].includes(slot.status);
                                    const slotTimeStr = `${slot.startTime}-${slot.endTime}`;
                                    const isNotPatient = isAuthenticated && role && role !== 'PATIENT';
                                    return (
                                      <button
                                        key={slot.startTime}
                                        type="button"
                                        disabled={isBooked || isNotPatient}
                                        onClick={() => handleBook(doctor.id, slotTimeStr)}
                                        className={`py-2 px-2 text-[11px] rounded-xl text-center font-medium border transition-all whitespace-nowrap ${
                                          isBooked
                                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                            : isNotPatient
                                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-500 hover:text-cyan-600 cursor-pointer shadow-sm'
                                        }`}
                                      >
                                        {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {!isAuthenticated && (
                              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-700 flex items-start gap-2 mt-4">
                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>Bạn cần đăng nhập và xác minh tài khoản email để hoàn tất đặt hẹn.</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 text-sm">
                            Bác sĩ chưa mở lịch vào ngày này. Vui lòng chọn ngày khác.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Phòng khám */}
                    {activeTab === 'phong-kham' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Địa điểm & liên hệ</h3>
                        <div className="space-y-4 text-sm text-gray-600">
                          <div className="flex gap-3">
                            <MapPin className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-gray-900">CarePlus Clinic</div>
                              <div className="mt-1 text-gray-500">{clinicInfo?.address || '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh'}</div>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <Clock className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-gray-900">Giờ làm việc chung</div>
                              <div className="mt-1 text-gray-500">{clinicInfo?.workingHours || 'Thứ 2 – Thứ 6: 7:30 – 17:00 | Thứ 7: 7:30 – 12:00'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Hướng dẫn */}
                    {activeTab === 'huong-dan' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Hướng dẫn đặt khám</h3>
                        <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 leading-relaxed">
                          <li>Lựa chọn ngày khám và một khung giờ trống trên tab <strong>Lịch khám</strong>.</li>
                          <li>Nhập triệu chứng của bạn hoặc người khám.</li>
                          <li>Nhấn nút <strong>Đặt lịch hẹn</strong> để gửi thông tin lên hệ thống.</li>
                          <li>Nhận email xác nhận lịch khám tự động ngay lập tức từ hệ thống CarePlus.</li>
                          <li>Đến phòng khám đúng giờ để check-in nhanh tại quầy lễ tân.</li>
                        </ol>
                      </div>
                    )}

                    {/* Tab: Đánh giá */}
                    {activeTab === 'danh-gia' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Phản hồi từ bệnh nhân</h3>
                        
                        {/* Rating Summary Card */}
                        <div className="flex flex-col sm:flex-row gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-150 items-center justify-between">
                          <div className="text-center flex-shrink-0">
                            <div className="text-5xl font-extrabold text-cyan-600 leading-tight">
                              {doctor.rating ? Number(doctor.rating).toFixed(1) : '5.0'}
                            </div>
                            <div className="flex justify-center mt-1">
                              <StarRow rating={doctor.rating || 5} size={15} />
                            </div>
                            <div className="text-xs text-gray-400 mt-2 font-medium">
                              {doctor.reviewCount || 0} đánh giá thực tế
                            </div>
                          </div>
                          
                          <div className="flex-1 w-full flex flex-col gap-2 max-w-sm">
                            {[5, 4, 3, 2, 1].map((stars, idx) => {
                              const pct = distribution[idx] || 0;
                              return (
                                <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                                  <span className="w-10 text-right">{stars} sao</span>
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="w-8 text-gray-400 font-normal">{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Review Items */}
                        {loadedReviews.length === 0 ? (
                          isLoadingReviews ? (
                            <LoadingBlock label="Đang tải đánh giá..." />
                          ) : (
                            <div className="py-8 text-center text-sm text-gray-400 bg-white border border-gray-100 rounded-2xl">
                              Bác sĩ chưa nhận được lượt đánh giá nào.
                            </div>
                          )
                        ) : (
                          <div className="space-y-4 pt-2">
                            {loadedReviews.map((rev) => {
                              const initials = rev.patientName ? rev.patientName.trim().split(' ').pop().charAt(0) : 'P';
                              const formattedDate = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : '';
                              return (
                                <div key={rev.id} className="p-4 bg-white border border-gray-150 rounded-xl shadow-sm space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold">
                                        {initials}
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-gray-900">{rev.patientName}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{formattedDate}</div>
                                      </div>
                                    </div>
                                    <StarRow rating={rev.rating} size={11} />
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{rev.comment}</p>
                                </div>
                              );
                            })}

                            {hasMoreReviews && (
                              <button
                                type="button"
                                onClick={() => setReviewPage((prev) => prev + 1)}
                                disabled={isLoadingReviews}
                                className="w-full py-2.5 mt-2 border border-cyan-400 text-cyan-600 hover:bg-cyan-50 rounded-xl text-xs font-semibold cursor-pointer text-center transition-colors"
                              >
                                {isLoadingReviews ? 'Đang tải...' : 'Tải thêm đánh giá'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm">Thông tin khám</h3>
                    
                    <div className="space-y-3 text-xs text-gray-600 font-medium">
                      <div className="flex justify-between">
                        <span>Giá khám tham khảo</span>
                        <span className="font-bold text-cyan-600 text-sm">{formatPrice(doctor.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thời gian/lượt</span>
                        <span className="text-gray-800">30 phút</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đặt trước tối đa</span>
                        <span className="text-gray-800">7 ngày</span>
                      </div>
                    </div>
                    
                    <hr className="border-gray-100" />
                    
                    <button
                      type="button"
                      disabled={isAuthenticated && role && role !== 'PATIENT'}
                      onClick={() => setActiveTab('lich')}
                      className={`w-full py-3 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                        isAuthenticated && role && role !== 'PATIENT'
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 cursor-pointer'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Đặt lịch ngay
                    </button>
                    
                    <button
                      type="button"
                      disabled={isAuthenticated && role && role !== 'PATIENT'}
                      onClick={handleChatWithDoctor}
                      className={`w-full py-2.5 border text-xs font-bold transition-colors flex items-center justify-center gap-2 rounded-xl ${
                        isAuthenticated && role && role !== 'PATIENT'
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-cyan-400 text-cyan-600 hover:bg-cyan-50 cursor-pointer'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Nhắn tin với bác sĩ
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-600" />
                      Địa chỉ phòng khám
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {clinicInfo?.address || '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh'}
                    </p>
                    <hr className="border-gray-100" />
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-600" />
                      Hỗ trợ đặt lịch
                    </h3>
                    <a href={`tel:${clinicInfo?.hotline?.replace(/\s+/g, '') || '19001234'}`} className="text-cyan-600 text-xs font-bold hover:underline">
                      {clinicInfo?.hotline || '1900 1234'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
