import { useState, useMemo, useEffect } from 'react';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import { useSchedules } from '../../features/schedule/hooks/useSchedules.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function ReceptionistDoctorSchedulePage() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorSearchText, setDoctorSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 0. Fetch Specialties list for selector
  const specialtiesQuery = useSpecialties();
  const specialtiesList = specialtiesQuery.data?.data || [];

  // 1. Fetch All Doctors list for selector and search autocomplete
  const doctorsQuery = useDoctorList({ limit: 100 });
  const allDoctors = doctorsQuery.data?.data || [];

  // Filter doctors for the dropdown based on selected specialty
  const visibleDoctorsList = useMemo(() => {
    if (!selectedSpecialtyId) return allDoctors;
    return allDoctors.filter(d => d.specialtyId === selectedSpecialtyId);
  }, [allDoctors, selectedSpecialtyId]);

  // Reset selectedDoctorId if it is not in the filtered doctors list anymore
  useEffect(() => {
    if (selectedDoctorId) {
      const exists = visibleDoctorsList.some(d => d.id === selectedDoctorId);
      if (!exists) {
        setSelectedDoctorId('');
      }
    }
  }, [visibleDoctorsList, selectedDoctorId]);

  const handleSpecialtyChange = (e) => {
    setSelectedSpecialtyId(e.target.value);
    setSelectedDoctorId('');
  };

  // Autocomplete suggestion list matching name or specialty
  const suggestionsList = useMemo(() => {
    if (!doctorSearchText.trim()) return [];
    const searchLower = doctorSearchText.toLowerCase();
    return allDoctors.filter(d =>
      d.name.toLowerCase().includes(searchLower) ||
      (d.specialtyName && d.specialtyName.toLowerCase().includes(searchLower))
    );
  }, [allDoctors, doctorSearchText]);

  const handleSelectSuggestion = (d) => {
    setSelectedSpecialtyId(d.specialtyId || '');
    setSelectedDoctorId(d.id);
    setDoctorSearchText('');
    setShowSuggestions(false);
  };

  // Calculate Monday and Sunday for the baseDate week
  const { weekdaysDates, startDateStr, endDateStr, weekLabel } = useMemo(() => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);

    const dates = [];
    const weekdaysNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(d);
      dayDate.setDate(d.getDate() + i);
      dates.push({
        date: dayDate,
        dateStr: dayDate.toLocaleDateString('sv').slice(0, 10),
        dayName: weekdaysNames[i],
        dayNumStr: `${dayDate.getDate()}/${dayDate.getMonth() + 1}`,
        isToday: new Date().toLocaleDateString('sv').slice(0, 10) === dayDate.toLocaleDateString('sv').slice(0, 10)
      });
    }

    const mondayStr = dates[0].dateStr;
    const sundayStr = dates[6].dateStr;

    const startLabel = `${dates[0].date.getDate()}/${dates[0].date.getMonth() + 1}`;
    const endLabel = `${dates[6].date.getDate()}/${dates[6].date.getMonth() + 1}/${dates[6].date.getFullYear()}`;

    return {
      weekdaysDates: dates,
      startDateStr: mondayStr,
      endDateStr: sundayStr,
      weekLabel: `${startLabel} – ${endLabel}`
    };
  }, [baseDate]);

  // 2. Fetch Schedules
  const schedulesQuery = useSchedules({
    startDate: startDateStr,
    endDate: endDateStr,
    doctorId: selectedDoctorId || undefined,
    specialtyId: selectedSpecialtyId || undefined,
    limit: 500
  });

  const schedulesList = schedulesQuery.data?.data || [];

  const handlePrevWeek = () => {
    setBaseDate((prev) => {
      const newD = new Date(prev);
      newD.setDate(prev.getDate() - 7);
      return newD;
    });
  };

  const handleNextWeek = () => {
    setBaseDate((prev) => {
      const newD = new Date(prev);
      newD.setDate(prev.getDate() + 7);
      return newD;
    });
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  // Find schedule records for a specific date YYYY-MM-DD
  const getDaySchedules = (dateStr) => {
    return schedulesList.filter((s) => {
      const workingDateStr = s.workingDate ? s.workingDate.slice(0, 10) : '';
      return workingDateStr === dateStr;
    });
  };

  // Summary counts
  const workingDoctorIds = new Set(
    schedulesList.filter(s => s.status === 'WORKING').map(s => s.doctor?.id).filter(Boolean)
  );
  const workingShiftCount = schedulesList.filter(s => s.status === 'WORKING').length;

  const getShiftCardStyle = (status) => {
    if (status === 'WORKING') {
      return 'bg-blue-50 border border-[#49BCE2]/40 text-[#1e7fa3]';
    }
    if (status === 'APPROVED_OFF') {
      return 'bg-red-50 border border-red-200 text-red-700';
    }
    if (status === 'PENDING') {
      return 'bg-amber-50 border border-amber-200 text-amber-800';
    }
    if (status === 'CANCELLED') {
      return 'bg-gray-50 border border-gray-200 text-gray-500';
    }
    if (status === 'REJECTED') {
      return 'bg-rose-50 border border-rose-200 text-rose-700';
    }
    return 'bg-gray-50 border border-gray-200 text-gray-500';
  };

  const renderShiftCell = (dayInfo, shiftType) => {
    const daySchedules = getDaySchedules(dayInfo.dateStr);

    const activeSchedulesForShift = daySchedules.filter((s) => {
      const shift = s.workingShift || s.shift;
      if (shiftType === 'MORNING') {
        return shift === 'MORNING' || shift === 'ALL_DAY';
      }
      if (shiftType === 'AFTERNOON') {
        return shift === 'AFTERNOON' || shift === 'ALL_DAY';
      }
      return false;
    });

    const cellBase = `p-1.5 min-h-[100px] border-r border-b border-gray-100 ${dayInfo.isToday ? 'bg-[#49BCE2]/5' : ''}`;

    if (activeSchedulesForShift.length === 0) {
      return (
        <div key={`${dayInfo.dateStr}-${shiftType}-empty`} className={`${cellBase} flex items-center justify-center`}>
          <span className="text-xs text-gray-300 italic">Nghỉ</span>
        </div>
      );
    }

    return (
      <div key={`${dayInfo.dateStr}-${shiftType}`} className={`${cellBase} flex flex-col gap-1.5 overflow-y-auto`}>
        {activeSchedulesForShift.map((s) => {
          const doctorName = s.doctor?.name || 'Bác sĩ';
          const specialtyName = s.doctor?.specialtyName || 'Chuyên khoa';
          const bookedCount = typeof s.bookedSlots === 'number'
            ? s.bookedSlots
            : (Array.isArray(s.timeSlots)
              ? s.timeSlots.filter((slot) => slot.status === 'BOOKED').length
              : 0);

          return (
            <div
              key={s.id}
              className={`rounded-md px-2 py-1.5 text-[0.72rem] flex flex-col gap-0.5 ${getShiftCardStyle(s.status)}`}
            >
              <div className="font-bold truncate">{doctorName}</div>
              <div className="opacity-80 truncate">{specialtyName}</div>
              <div className="font-semibold mt-0.5">Đặt: {bookedCount} slot</div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedDoctor = allDoctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Lịch làm việc bác sĩ</h1>
        <p className="text-sm text-gray-400 mt-1">Theo dõi lịch trực và ca trực của các bác sĩ theo tuần</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
        {/* Left: Week Navigator */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="h-9 px-2.5 bg-white hover:bg-gray-50 text-gray-600 transition border-r border-gray-200 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
              {weekLabel}
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="h-9 px-2.5 bg-white hover:bg-gray-50 text-gray-600 transition border-l border-gray-200 flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="h-9 px-3 text-sm font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition shadow-xs cursor-pointer"
          >
            Tuần này
          </button>
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Doctor Search Autocomplete */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm bác sĩ hoặc chuyên khoa..."
              value={doctorSearchText}
              onChange={(e) => {
                setDoctorSearchText(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
              style={{ width: '240px' }}
            />
            {showSuggestions && suggestionsList.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-[998]"
                  onClick={() => setShowSuggestions(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[999] max-h-52 overflow-y-auto">
                  {suggestionsList.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleSelectSuggestion(d)}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 transition"
                    >
                      <div className="font-semibold text-gray-800">{d.name}</div>
                      <div className="text-xs text-gray-400">{d.specialtyName || d.specialty?.name || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Specialty Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Chuyên khoa:</label>
            {specialtiesQuery.isLoading ? (
              <span className="text-xs text-gray-400">Đang tải...</span>
            ) : (
              <select
                value={selectedSpecialtyId}
                onChange={handleSpecialtyChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
                style={{ minWidth: '160px' }}
              >
                <option value="">-- Tất cả chuyên khoa --</option>
                {specialtiesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Doctor Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Bác sĩ:</label>
            {doctorsQuery.isLoading ? (
              <span className="text-xs text-gray-400">Đang tải...</span>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
                style={{ minWidth: '180px' }}
              >
                <option value="">-- Tất cả bác sĩ --</option>
                {visibleDoctorsList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-4">
        <span className="text-sm text-gray-600">
          <span className="font-bold text-gray-800">{workingDoctorIds.size}</span> bác sĩ làm việc
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-600">
          <span className="font-bold text-gray-800">{workingShiftCount}</span> ca làm việc tuần này
        </span>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-100 border border-[#49BCE2]/40 inline-block" />
            <span className="text-xs text-gray-500">Làm việc</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200 inline-block" />
            <span className="text-xs text-gray-500">Nghỉ phép đã duyệt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block" />
            <span className="text-xs text-gray-500">Chờ phê duyệt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-50 border border-rose-200 inline-block" />
            <span className="text-xs text-gray-500">Từ chối</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200 inline-block" />
            <span className="text-xs text-gray-500">Đã hủy</span>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {schedulesQuery.isLoading ? (
          <div className="p-8">
            <LoadingBlock label={selectedDoctorId ? `Đang tải lịch bác sĩ ${selectedDoctor?.name || ''}...` : 'Đang tải lịch trực bác sĩ...'} />
          </div>
        ) : schedulesQuery.error ? (
          <div className="p-8">
            <StateBlock
              variant="error"
              title="Lỗi tải lịch trực"
              description={schedulesQuery.error.message}
            />
          </div>
        ) : (
          <>
            {/* Desktop Grid */}
            <div className="hidden md:block overflow-x-auto">
              {/* Grid: 9 columns = [row-header] + [Mon..Sun] */}
              <div
                className="grid"
                style={{ gridTemplateColumns: '90px repeat(7, minmax(0, 1fr))' }}
              >
                {/* Header row */}
                <div className="bg-gray-50 px-3 py-2.5 border-b border-r border-gray-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ca trực</span>
                </div>
                {weekdaysDates.map((dayInfo) => (
                  <div
                    key={dayInfo.dateStr}
                    className={`px-2 py-2.5 border-b border-r border-gray-100 text-center ${
                      dayInfo.isToday ? 'bg-[#49BCE2]/10' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-bold uppercase tracking-wide ${dayInfo.isToday ? 'text-[#49BCE2]' : 'text-gray-600'}`}>
                      {dayInfo.dayName}
                    </div>
                    <div className={`text-xs mt-0.5 ${dayInfo.isToday ? 'font-semibold text-[#49BCE2]' : 'text-gray-400'}`}>
                      {dayInfo.dayNumStr}{dayInfo.isToday && <span className="ml-1 text-[9px] font-bold">(Hôm nay)</span>}
                    </div>
                  </div>
                ))}

                {/* Morning shift row */}
                <div className="border-r border-b border-gray-100 bg-orange-50/50 flex items-center justify-center px-2 py-3">
                  <div className="text-center">
                    <div className="text-base">☀️</div>
                    <div className="text-xs font-semibold text-orange-700 mt-0.5">Ca sáng</div>
                  </div>
                </div>
                {weekdaysDates.map((dayInfo) => renderShiftCell(dayInfo, 'MORNING'))}

                {/* Afternoon shift row */}
                <div className="border-r border-b border-gray-100 bg-blue-50/50 flex items-center justify-center px-2 py-3">
                  <div className="text-center">
                    <div className="text-base">🌤️</div>
                    <div className="text-xs font-semibold text-sky-700 mt-0.5">Ca chiều</div>
                  </div>
                </div>
                {weekdaysDates.map((dayInfo) => renderShiftCell(dayInfo, 'AFTERNOON'))}
              </div>
            </div>

            {/* Mobile: vertical day-by-day list */}
            <div className="md:hidden divide-y divide-gray-100">
              {weekdaysDates.map((dayInfo) => {
                const daySchedules = getDaySchedules(dayInfo.dateStr);
                return (
                  <div key={dayInfo.dateStr} className={`p-4 ${dayInfo.isToday ? 'bg-[#49BCE2]/5' : ''}`}>
                    <div className={`text-sm font-bold mb-2 ${dayInfo.isToday ? 'text-[#49BCE2]' : 'text-gray-700'}`}>
                      {dayInfo.dayName} — {dayInfo.dayNumStr}
                      {dayInfo.isToday && <span className="ml-2 text-xs font-semibold">(Hôm nay)</span>}
                    </div>
                    {daySchedules.length === 0 ? (
                      <p className="text-xs text-gray-300 italic">Không có lịch</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {daySchedules.map((s) => {
                          const shift = s.workingShift || s.shift;
                          const shiftLabel = shift === 'MORNING' ? '☀️ Sáng' : shift === 'AFTERNOON' ? '🌤️ Chiều' : '🌞 Cả ngày';
                          const bookedCount = typeof s.bookedSlots === 'number'
                            ? s.bookedSlots
                            : (Array.isArray(s.timeSlots) ? s.timeSlots.filter(sl => sl.status === 'BOOKED').length : 0);

                          return (
                            <div key={s.id} className={`rounded-lg px-3 py-2 text-xs flex flex-col gap-0.5 ${getShiftCardStyle(s.status)}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold truncate">{s.doctor?.name || 'Bác sĩ'}</span>
                                <span className="text-[10px] font-semibold opacity-70 flex-shrink-0">{shiftLabel}</span>
                              </div>
                              <div className="opacity-75">{s.doctor?.specialtyName || 'Chuyên khoa'}</div>
                              <div className="font-semibold">Đặt: {bookedCount} slot</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
