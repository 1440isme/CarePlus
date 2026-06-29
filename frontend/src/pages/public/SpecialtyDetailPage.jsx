import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, MapPin, Star, Calendar, Clock } from 'lucide-react';
import { useDoctorList } from '../../features/doctor/index.js';
import { useBookingRules } from '../../features/admin/clinic-settings/hooks/useBookingRules.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { buildVirtualSlotsForSchedules, filterSlotGroupsBySchedules, mergePersistedSlots } from '../../features/timeslot/virtual-slot.service.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { useClinicInfo } from '../../features/admin/clinic-settings/hooks/useClinicInfo.js';

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
}

// ── Per-doctor slot widget ────────────────────────────────────────────────────
function DoctorSlots({ doctorId, selectedDate, onBook, bookingRulesData }) {
  const { data: tsData, isLoading } = useTimeSlots({ doctorId, date: selectedDate });

  const slotGroups = useMemo(() => {
    const slotData = tsData?.data;
    const schedules = slotData?.schedules || [];
    if (schedules.length === 0) return { morning: [], afternoon: [] };

    return mergePersistedSlots(
      filterSlotGroupsBySchedules(buildVirtualSlotsForSchedules(bookingRulesData, schedules), schedules),
      slotData?.slots || [],
    );
  }, [tsData, bookingRulesData]);

  const allSlots = useMemo(() => {
    return [
      ...(slotGroups.morning || []),
      ...(slotGroups.afternoon || []),
    ];
  }, [slotGroups]);

  const availableCount = useMemo(() => {
    return allSlots.filter(s => {
      const isBooked = s.status === 'BOOKED' || s.status === 'LOCKED';
      const isExpired = s.status === 'EXPIRED' || (() => {
        const now = new Date();
        const [year, month, day] = selectedDate.split('-').map(Number);
        const [hours, minutes] = s.endTime.split(':').map(Number);
        const slotEndTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
        return now > slotEndTime;
      })();
      return !isBooked && !isExpired;
    }).length;
  }, [allSlots, selectedDate]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (allSlots.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        Bác sĩ chưa có lịch khám ngày này
      </div>
    );
  }

  return (
    <>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        LỊCH KHÁM CÒN TRỐNG ({availableCount} khung)
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
        {allSlots.slice(0, 8).map(slot => {
          const isBooked = slot.status === 'BOOKED' || slot.status === 'LOCKED';
          const isExpired = slot.status === 'EXPIRED' || (() => {
            const now = new Date();
            const [year, month, day] = selectedDate.split('-').map(Number);
            const [hours, minutes] = slot.endTime.split(':').map(Number);
            const slotEndTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
            return now > slotEndTime;
          })();
          const isDisabled = isBooked || isExpired;
          const slotTime = `${slot.startTime}-${slot.endTime}`;
          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={isDisabled}
              onClick={() => onBook(doctorId, slotTime)}
              className={`py-1.5 px-1 text-[11px] rounded-lg text-center font-medium border transition-all shadow-sm whitespace-nowrap ${
                isBooked
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                  : isExpired
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-500 hover:text-cyan-600 cursor-pointer'
              }`}
            >
              {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
            </button>
          );
        })}
      </div>
      <div className="text-xs text-gray-500">
        Chọn giờ và đặt <span className="text-green-600 font-bold">(Phí đặt lịch 0đ)</span>
      </div>
    </>
  );
}

export default function SpecialtyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Generate 7 days for the schedule picker
  const today = new Date();
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toLocaleDateString('sv').slice(0, 10);
  }), []);

  const dayVi = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dateLabels = useMemo(() => {
    const labels = {};
    dates.forEach(d => {
      const [year, month, day] = d.split('-').map(Number);
      const dt = new Date(year, month - 1, day);
      labels[d] = `${dayVi[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}`;
    });
    return labels;
  }, [dates]);

  const [selectedDate, setSelectedDate] = useState(dates[0]);

  // Fetch specialties and find the one matching the slug
  const { data: specialtiesData, isLoading: loadingSpecialties } = useSpecialties({});
  const specialtiesAll = specialtiesData?.data || [];

  const specialty = useMemo(() => {
    const found = specialtiesAll.find(s => s.slug === slug);
    return found || null;
  }, [specialtiesAll, slug]);

  const loadingSpecialty = loadingSpecialties;
  const specialtyError = !loadingSpecialties && !specialty;

  const query = useMemo(() => {
    const q = {
      page: 1,
      limit: 50,
      active: true,
    };
    if (specialty?.id) {
      q.specialtyId = specialty.id;
    }
    return q;
  }, [specialty]);

  const { data: doctorListResponse, isLoading: isLoadingDoctors, error: doctorsError } = useDoctorList(query);
  const { data: bookingRulesResponse } = useBookingRules();
  const { data: clinicResponse } = useClinicInfo({
    staleTime: 10 * 60 * 1000,
  });
  const clinicInfo = clinicResponse?.data;
  const doctors = doctorListResponse?.data || [];



  const handleBook = (doctorId, slotTime) => {
    navigate(`/dat-lich?doctorId=${doctorId}&date=${selectedDate}&slot=${encodeURIComponent(slotTime)}`);
  };

  // Mock heart favorites
  const [favorites, setFavorites] = useState({});
  const toggleFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loadingSpecialty) {
    return <LoadingBlock label="Đang tải thông tin chuyên khoa..." />;
  }

  if (specialtyError || !specialty) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <StateBlock variant="error" title="Không tìm thấy chuyên khoa" description="Chuyên khoa bạn đang tìm kiếm không tồn tại hoặc đã bị xóa." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-cyan-600 font-medium">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/chuyen-khoa" className="hover:text-cyan-600 font-medium">Chuyên khoa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-semibold">{specialty.name}</span>
        </nav>

        {/* Hero banner for Specialty */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-500 rounded-3xl p-8 md:p-12 text-white mb-10 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 text-9xl translate-x-1/4 translate-y-1/4 pointer-events-none select-none">
            🏥
          </div>
          <div className="max-w-2xl relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Chuyên khoa {specialty.name}</h1>
            <p className="text-cyan-50 leading-relaxed text-sm md:text-base">
              {specialty.description || `Thăm khám và chẩn đoán các bệnh lý thuộc chuyên khoa ${specialty.name} cùng đội ngũ bác sĩ chuyên gia hàng đầu.`}
            </p>
          </div>
        </div>

        {/* Main Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Danh sách bác sĩ {specialty.name}</h2>
            <p className="text-xs text-gray-500 mt-1">Đặt lịch nhanh bằng cách chọn giờ trống dưới mỗi bác sĩ</p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Chọn ngày khám:</span>
            <select 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {dates.map(d => (
                <option key={d} value={d}>
                  {d === dates[0] ? `Hôm nay - ${dateLabels[d]}` : d === dates[1] ? `Ngày mai - ${dateLabels[d]}` : dateLabels[d]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor List */}
        {isLoadingDoctors ? (
          <LoadingBlock label="Đang tải danh sách bác sĩ..." />
        ) : doctorsError ? (
          <StateBlock variant="error" title="Không thể tải danh sách bác sĩ" description={doctorsError.message} />
        ) : doctors.length === 0 ? (
          <div className="py-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-500 text-sm shadow-sm">
            Chưa có bác sĩ nào thuộc chuyên khoa này đang mở lịch hoạt động.
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => {
              const isFav = !!favorites[doctor.id];
              const docAvatar = doctor.avatar || (doctor.gender === 'FEMALE' 
                ? 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=256&h=256&q=80'
                : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80'
              );

              return (
                <div key={doctor.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="flex flex-col md:flex-row">
                    
                    {/* Left: Profile Info */}
                    <div className="flex-1 p-6 border-b border-gray-100 md:border-b-0 md:border-r md:border-gray-100">
                      <div className="flex gap-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={docAvatar} 
                            alt={doctor.name}
                            className="w-20 h-20 rounded-full object-cover object-top border-2 border-gray-150" 
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{doctor.title} {doctor.name}</h3>
                          <div className="text-sm text-cyan-600 font-semibold mt-0.5">{doctor.specialtyName}</div>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{Number(doctor.rating || 0).toFixed(1)}</span>
                            <span className="text-gray-400 font-normal">({doctor.reviewCount || 0} đánh giá)</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{doctor.position || 'Bác sĩ chuyên khoa'}</div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>Kinh nghiệm: <strong>{doctor.experience} năm</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>Khu vực khám: <strong>TP. Hồ Chí Minh</strong></span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                        {doctor.description || `Bác sĩ chuyên khoa tại CarePlus với nhiều năm kinh nghiệm, luôn tận tụy vì sức khỏe người bệnh.`}
                      </p>
                    </div>

                    {/* Right: Schedule Grid */}
                    <div className="w-full md:w-[45%] p-6 flex flex-col justify-between flex-shrink-0 bg-gray-50/50">
                      <div>
                        <div className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-cyan-600" />
                          <span>Lịch khám ngày {dateLabels[selectedDate] || selectedDate}</span>
                        </div>

                        <DoctorSlots
                          doctorId={doctor.id}
                          selectedDate={selectedDate}
                          onBook={handleBook}
                          bookingRulesData={bookingRulesResponse?.data}
                        />
                      </div>

                      <div className="border-t border-gray-150 pt-4 mt-6 flex flex-col gap-2">
                        <div className="text-xs font-bold text-gray-700">CarePlus Clinic</div>
                        <div className="text-[11px] text-gray-500 flex gap-1.5 items-start">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span>{clinicInfo?.address || '123 Nguyễn Thị Minh Khai, Quận 3, TP.HCM'}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <div className="text-[10px] text-gray-400">Giá khám tham khảo</div>
                            <div className="text-sm font-bold text-cyan-600">{formatPrice(doctor.price)}</div>
                          </div>
                          <Link 
                            to={`/bac-si/${doctor.id}`} 
                            className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
                          >
                            Xem chi tiết →
                          </Link>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
