import { useState, useMemo, useEffect } from 'react';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import { useSchedules } from '../../features/schedule/hooks/useSchedules.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './receptionist.css';

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
    // Get Monday of current baseDate
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (0) to get Monday
    d.setDate(diff); // Now d is Monday
    
    const dates = [];
    const weekdaysNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(d);
      dayDate.setDate(d.getDate() + i);
      dates.push({
        date: dayDate,
        dateStr: dayDate.toLocaleDateString('sv').slice(0, 10), // YYYY-MM-DD
        dayName: weekdaysNames[i],
        dayNumStr: `${dayDate.getDate()}/${dayDate.getMonth() + 1}`,
        isToday: new Date().toLocaleDateString('sv').slice(0, 10) === dayDate.toLocaleDateString('sv').slice(0, 10)
      });
    }

    const mondayStr = dates[0].dateStr;
    const sundayStr = dates[6].dateStr;
    
    // Week label format: "8/6 - 14/6/2026"
    const startLabel = `${dates[0].date.getDate()}/${dates[0].date.getMonth() + 1}`;
    const endLabel = `${dates[6].date.getDate()}/${dates[6].date.getMonth() + 1}/${dates[6].date.getFullYear()}`;
    
    return {
      weekdaysDates: dates,
      startDateStr: mondayStr,
      endDateStr: sundayStr,
      weekLabel: `${startLabel} - ${endLabel}`
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
      // Handle date format in DB: might be ISO string or YYYY-MM-DD
      const workingDateStr = s.workingDate ? s.workingDate.slice(0, 10) : '';
      return workingDateStr === dateStr;
    });
  };

  const renderShiftCell = (dayInfo, shiftType) => {
    const daySchedules = getDaySchedules(dayInfo.dateStr);
    
    // Filter down to schedules that match the specified shiftType
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

    if (activeSchedulesForShift.length === 0) {
      return (
        <div className={`grid-cell ${dayInfo.isToday ? 'today-column-cell' : ''}`} key={dayInfo.dateStr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="grid-empty-shift">Nghỉ</div>
        </div>
      );
    }

    return (
      <div className={`grid-cell ${dayInfo.isToday ? 'today-column-cell' : ''}`} key={dayInfo.dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', minHeight: '100px', overflowY: 'auto' }}>
        {activeSchedulesForShift.map((s) => {
          const doctorName = s.doctor?.name || 'Bác sĩ';
          const specialtyName = s.doctor?.specialtyName || 'Chuyên khoa';
          const bookedCount = typeof s.bookedSlots === 'number'
            ? s.bookedSlots
            : (Array.isArray(s.timeSlots)
              ? s.timeSlots.filter((slot) => slot.status === 'BOOKED').length
              : 0);

          const status = s.status;
          let cardClass = 'grid-shift-card';

          if (status === 'WORKING') {
            cardClass += ' shift-working';
          } else if (status === 'PENDING') {
            cardClass += ' shift-pending-leave';
          } else if (status === 'APPROVED_OFF') {
            cardClass += ' shift-approved-leave';
          } else if (status === 'CANCELLED') {
            cardClass += ' shift-cancelled';
          } else if (status === 'REJECTED') {
            cardClass += ' shift-rejected-leave';
          }

          return (
            <div 
              key={s.id} 
              className={cardClass} 
              style={{ 
                padding: '6px 8px', 
                borderRadius: '6px', 
                fontSize: '0.78rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2px', 
                margin: 0,
                height: 'auto'
              }}
            >
              <div style={{ fontWeight: 700, color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {doctorName}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                {specialtyName}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '2px' }}>
                Đã đặt: {bookedCount} slot
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedDoctor = allDoctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="content-grid receptionist-page">
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '4px', fontWeight: 700 }}>Lịch làm việc bác sĩ</h2>
        <p className="helper-text">Theo dõi lịch trực và ca trực của các bác sĩ theo tuần</p>
      </div>

      {/* Week and Doctor filter toolbar */}
      <section className="surface-card toolbar-filters" style={{ padding: '16px 20px', borderRadius: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Week Navigator */}
          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              type="button"
              className="button-secondary"
              onClick={handlePrevWeek}
              style={{ minHeight: 'auto', height: '36px', padding: '0 12px', border: 'none', borderRadius: 0, backgroundColor: '#ffffff' }}
            >
              &larr;
            </button>
            <span style={{ padding: '0 14px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-h)' }}>
              {weekLabel}
            </span>
            <button
              type="button"
              className="button-secondary"
              onClick={handleNextWeek}
              style={{ minHeight: 'auto', height: '36px', padding: '0 12px', border: 'none', borderRadius: 0, backgroundColor: '#ffffff' }}
            >
              &larr;
            </button>
          </div>

          <button
            type="button"
            className="button-secondary"
            onClick={handleToday}
            style={{ minHeight: 'auto', height: '36px', padding: '0 12px', fontSize: '0.88rem', borderRadius: '8px' }}
          >
            Tuần này
          </button>
        </div>

        {/* Specialty and Doctor Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Doctor Search Autocomplete Input */}
          <div style={{ position: 'relative' }}>
            <input
              id="doctorSearchInput"
              type="text"
              placeholder="Tìm tên bác sĩ hoặc chuyên khoa..."
              value={doctorSearchText}
              onChange={(e) => {
                setDoctorSearchText(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', width: '250px' }}
            />
            {showSuggestions && suggestionsList.length > 0 && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                  onClick={() => setShowSuggestions(false)} 
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 999,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {suggestionsList.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleSelectSuggestion(d)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>{d.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#777' }}>
                        {d.specialtyName || d.specialty?.name || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Specialty Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="specialtySelect" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chuyên khoa:</label>
            {specialtiesQuery.isLoading ? (
              <span className="helper-text" style={{ fontSize: '0.85rem' }}>Đang tải chuyên khoa...</span>
            ) : (
              <select
                id="specialtySelect"
                value={selectedSpecialtyId}
                onChange={handleSpecialtyChange}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', minWidth: '180px' }}
              >
                <option value="">-- Tất cả chuyên khoa --</option>
                {specialtiesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Doctor Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="doctorSelect" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bác sĩ:</label>
            {doctorsQuery.isLoading ? (
              <span className="helper-text" style={{ fontSize: '0.85rem' }}>Đang tải bác sĩ...</span>
            ) : (
              <select
                id="doctorSelect"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', minWidth: '200px' }}
              >
                <option value="">-- Tất cả bác sĩ --</option>
                {visibleDoctorsList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* Legend Status Info */}
      <section className="surface-card" style={{ padding: '12px 18px', borderRadius: '12px' }}>
        <div className="schedule-legend">
          <div className="legend-item">
            <span className="legend-box legend-working" />
            <span>Làm việc</span>
          </div>
          <div className="legend-item">
            <span className="legend-box legend-approved-leave" />
            <span>Nghỉ phép đã duyệt</span>
          </div>
          <div className="legend-item">
            <span className="legend-box legend-pending-leave" />
            <span>Chờ phê duyệt nghỉ</span>
          </div>
          <div className="legend-item">
            <span className="legend-box legend-rejected-leave" />
            <span>Yêu cầu nghỉ bị từ chối</span>
          </div>
          <div className="legend-item">
            <span className="legend-box legend-cancelled-shift" />
            <span>Ca trực đã hủy</span>
          </div>
        </div>
      </section>

      {/* Grid Weekly Calendar */}
      <section className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        {schedulesQuery.isLoading ? (
          <LoadingBlock label={selectedDoctorId ? `Đang tải lịch bác sĩ ${selectedDoctor?.name || ''}...` : 'Đang tải lịch trực bác sĩ...'} />
        ) : schedulesQuery.error ? (
          <StateBlock
            variant="error"
            title="Lỗi tải lịch trực"
            description={schedulesQuery.error.message}
          />
        ) : (
          <div className="doctor-schedule-grid">
            {/* Header cell empty */}
            <div className="grid-header-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <strong>Ca trực</strong>
            </div>

            {/* Weekdays Headers */}
            {weekdaysDates.map((dayInfo) => (
              <div 
                className={`grid-header-cell ${dayInfo.isToday ? 'today-cell' : ''}`} 
                key={dayInfo.dateStr}
              >
                <strong>{dayInfo.dayName}</strong>
                <div className="grid-header-cell-sub">
                  {dayInfo.dayNumStr} {dayInfo.isToday && '(Hôm nay)'}
                </div>
              </div>
            ))}

            {/* MORNING SHIFT ROW */}
            <div className="grid-row-header-cell">
              <span>☀️ Sáng</span>
            </div>
            {weekdaysDates.map((dayInfo) => renderShiftCell(dayInfo, 'MORNING'))}

            {/* AFTERNOON SHIFT ROW */}
            <div className="grid-row-header-cell">
              <span>🌤️ Chiều</span>
            </div>
            {weekdaysDates.map((dayInfo) => renderShiftCell(dayInfo, 'AFTERNOON'))}
          </div>
        )}
      </section>
    </div>
  );
}
