import { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Heart, MapPin, Star, Clock, Calendar } from 'lucide-react';
import { useDoctorList } from '../../features/doctor/index.js';
import { useBookingRules } from '../../features/admin/clinic-settings/hooks/useBookingRules.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { buildVirtualSlots, flattenSlotGroups } from '../../features/timeslot/virtual-slot.service.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { useClinicInfo } from '../../features/admin/clinic-settings/hooks/useClinicInfo.js';

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
}

export default function DoctorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [specFilter, setSpecFilter] = useState(searchParams.get('specialty') || '');

  // Fetch specialties using hook
  const { data: specialtiesData } = useSpecialties({});
  const specialties = specialtiesData?.data || [];

  // Generate 7 days for the schedule filter
  const today = new Date();
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  }), []);

  const dayVi = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dateLabels = useMemo(() => {
    const labels = {};
    dates.forEach(d => {
      const dt = new Date(d);
      labels[d] = `${dayVi[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}`;
    });
    return labels;
  }, [dates]);

  const [selectedDate, setSelectedDate] = useState(dates[0]);

  const query = useMemo(() => {
    const q = {
      page: Number(searchParams.get('page') || 1),
      limit: 50,
      active: true,
    };
    const search = searchParams.get('search');
    if (search?.trim()) {
      q.search = search.trim();
    }
    const specialtyId = searchParams.get('specialty');
    if (specialtyId) {
      q.specialtyId = specialtyId;
    }
    return q;
  }, [searchParams]);

  const { data, isLoading, error } = useDoctorList(query);
  const { data: bookingRulesResponse } = useBookingRules();
  const { data: clinicResponse } = useClinicInfo({
    staleTime: 10 * 60 * 1000,
  });
  const clinicInfo = clinicResponse?.data;
  const doctors = data?.data || [];

  // Generate virtual slots based on clinic settings rules
  const slots = useMemo(
    () => flattenSlotGroups(buildVirtualSlots(bookingRulesResponse?.data)).map(s => ({
      time: `${s.startTime}-${s.endTime}`,
      avail: true, // simplified availability check
    })),
    [bookingRulesResponse?.data]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set('search', searchInput.trim());
    } else {
      next.delete('search');
    }
    if (specFilter) {
      next.set('specialty', specFilter);
    } else {
      next.delete('specialty');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSpecFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('specialty', value);
    } else {
      next.delete('specialty');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleBook = (doctorId, slotTime) => {
    navigate(`/dat-lich?doctorId=${doctorId}&date=${selectedDate}&slot=${encodeURIComponent(slotTime)}`);
  };

  // Mock heart favorites
  const [favorites, setFavorites] = useState({});
  const toggleFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đội ngũ bác sĩ</h1>
          <p className="text-sm text-gray-500 mt-2">Tìm kiếm và đặt lịch khám với các bác sĩ chuyên khoa của CarePlus Clinic</p>
        </div>

        {/* Filter bar */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-150 p-4 mb-8 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 flex gap-4 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={searchInput} 
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Tìm tên bác sĩ, chuyên khoa..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" 
              />
            </div>

            {/* Specialty filter */}
            <select 
              value={specFilter} 
              onChange={handleFilterChange}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Tất cả chuyên khoa</option>
              {specialties.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date dropdown */}
          <div className="flex gap-2">
            <select 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {dates.map(d => (
                <option key={d} value={d}>
                  {d === dates[0] ? `Hôm nay - ${dateLabels[d]}` : d === dates[1] ? `Ngày mai - ${dateLabels[d]}` : dateLabels[d]}
                </option>
              ))}
            </select>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Tìm kiếm
            </button>
          </div>
        </form>

        {/* Count */}
        <div className="text-sm text-gray-500 mb-4">
          Tìm thấy <strong className="text-gray-900">{doctors.length}</strong> bác sĩ
          {query.specialtyName ? ` chuyên khoa ${query.specialtyName}` : ''}
        </div>

        {/* Status Blocks */}
        {isLoading ? <LoadingBlock label="Đang tải danh sách bác sĩ..." /> : null}
        {error ? <StateBlock variant="error" title="Không thể tải danh sách bác sĩ" description={error.message} /> : null}

        {/* Doctor List */}
        {!isLoading && !error ? (
          doctors.length === 0 ? (
            <StateBlock title="Không có bác sĩ phù hợp" description="Hãy thử đổi từ khóa tìm kiếm hoặc quay lại sau." />
          ) : (
            <div className="space-y-4">
              {doctors.map((doctor) => {
                const isFav = !!favorites[doctor.id];
                // Fallback avatar
                const docAvatar = doctor.avatar || (doctor.gender === 'FEMALE' 
                  ? 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=256&h=256&q=80'
                  : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80'
                );

                return (
                  <div key={doctor.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row">
                      
                      {/* Left: Doctor Profile */}
                      <div className="flex-1 p-6 border-b border-gray-100 md:border-b-0 md:border-r md:border-gray-100">
                        <div className="flex gap-4 mb-4">
                          <div className="relative flex-shrink-0">
                            <img 
                              src={docAvatar} 
                              alt={doctor.name}
                              className="w-20 h-20 rounded-full object-cover object-top border-2 border-gray-150" 
                            />
                            <button 
                              type="button"
                              onClick={() => toggleFavorite(doctor.id)}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-gray-200 flex items-center justify-center cursor-pointer shadow-sm"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                            </button>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{doctor.title} {doctor.name}</h3>
                            <div className="text-sm text-cyan-600 font-semibold mt-0.5">{doctor.specialtyName}</div>
                            <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{doctor.rating ? Number(doctor.rating).toFixed(1) : '5.0'}</span>
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

                          {slots.length > 0 ? (
                            <>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">LỊCH KHÁM CÒN TRỐNG</div>
                              <div className="grid grid-cols-4 gap-2 mb-4">
                                {slots.slice(0, 8).map(slot => (
                                  <button 
                                    key={slot.time}
                                    type="button"
                                    onClick={() => handleBook(doctor.id, slot.time)}
                                    className="py-1.5 px-2 text-xs rounded-lg text-center font-medium border border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-500 hover:text-cyan-600 transition-all shadow-sm"
                                  >
                                    {slot.time}
                                  </button>
                                ))}
                              </div>
                              <div className="text-xs text-gray-500">
                                Chọn giờ và đặt <span className="text-green-600 font-bold">(Phí đặt lịch 0đ)</span>
                              </div>
                            </>
                          ) : (
                            <div className="py-4 text-center text-xs text-gray-400">
                              Bác sĩ chưa mở lịch vào ngày này. Vui lòng chọn ngày khác.
                            </div>
                          )}
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
          )
        ) : null}

      </div>
    </div>
  );
}
