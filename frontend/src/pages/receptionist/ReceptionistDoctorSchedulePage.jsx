import { useState, useMemo, useEffect } from 'react';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import { useDoctorSchedules } from '../../features/schedule/hooks/useSchedules.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './receptionist.css';

export default function ReceptionistDoctorSchedulePage() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // 1. Fetch Doctors list for selector
  const doctorsQuery = useDoctorList({ limit: 100 });
  const doctorsList = doctorsQuery.data?.data || [];

  // Automatically select the first doctor in the list as default
  useEffect(() => {
    if (doctorsList.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctorsList[0].id);
    }
  }, [doctorsList, selectedDoctorId]);

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

  // 2. Fetch Schedules for selected doctor and week dates
  const schedulesQuery = useDoctorSchedules(selectedDoctorId, {
    startDate: startDateStr,
    endDate: endDateStr,
    limit: 100
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

  // Find schedule record for a specific date YYYY-MM-DD
  const getDaySchedule = (dateStr) => {
    return schedulesList.find((s) => {
      // Handle date format in DB: might be ISO string or YYYY-MM-DD
      const workingDateStr = s.workingDate ? s.workingDate.slice(0, 10) : '';
      return workingDateStr === dateStr;
    });
  };

  const renderShiftCell = (dayInfo, shiftType) => {
    const daySchedule = getDaySchedule(dayInfo.dateStr);
    
    if (!daySchedule) {
      return (
        <div className="grid-cell" key={dayInfo.dateStr}>
          <div className="grid-empty-shift">Nghỉ</div>
        </div>
      );
    }

    // Convert shifts field which could be array or JSON
    let shiftsArray = [];
    if (Array.isArray(daySchedule.shifts)) {
      shiftsArray = daySchedule.shifts;
    } else if (typeof daySchedule.shifts === 'string') {
      try {
        shiftsArray = JSON.parse(daySchedule.shifts);
      } catch (e) {
        shiftsArray = [];
      }
    }

    const hasShift = shiftsArray.includes(shiftType);
    if (!hasShift) {
      return (
        <div className="grid-cell" key={dayInfo.dateStr}>
          <div className="grid-empty-shift">Nghỉ</div>
        </div>
      );
    }

    const timeText = shiftType === 'MORNING' ? '08:00 - 11:30' : '13:30 - 17:00';
    const status = daySchedule.status;

    // Display Card depending on Status
    if (status === 'WORKING') {
      return (
        <div className="grid-cell" key={dayInfo.dateStr}>
          <div className="grid-shift-card shift-working">
            <span className="shift-card-time">{timeText}</span>
            <span className="shift-card-desc">Làm việc tại quầy</span>
          </div>
        </div>
      );
    } else if (status === 'PENDING') {
      return (
        <div className="grid-cell" key={dayInfo.dateStr}>
          <div className="grid-shift-card shift-pending-leave">
            <span className="shift-card-time">{timeText}</span>
            <span className="shift-card-desc">Yêu cầu nghỉ chờ duyệt</span>
          </div>
        </div>
      );
    } else if (status === 'APPROVED_OFF') {
      return (
        <div className="grid-cell" key={dayInfo.dateStr}>
          <div className="grid-shift-card shift-approved-leave">
            <span className="shift-card-time">{timeText}</span>
            <span className="shift-card-desc">Nghỉ phép đã duyệt</span>
          </div>
        </div>
      );
    } else if (status === 'CANCELLED') {
      return (
        <div className="grid-cell" key={dayInfo.dateStr}>
          <div className="grid-shift-card shift-cancelled">
            <span className="shift-card-time">{timeText}</span>
            <span className="shift-card-desc">Ca làm việc đã hủy</span>
          </div>
        </div>
      );
    } else if (status === 'REJECTED') {
      return (
        <div className="grid-cell" key={dayInfo.dateStr}>
          <div className="grid-shift-card shift-rejected-leave">
            <span className="shift-card-time">{timeText}</span>
            <span className="shift-card-desc">Yêu cầu nghỉ bị từ chối</span>
          </div>
        </div>
      );
    }

    return (
      <div className="grid-cell" key={dayInfo.dateStr}>
        <div className="grid-empty-shift">Nghỉ</div>
      </div>
    );
  };

  const selectedDoctor = doctorsList.find(d => d.id === selectedDoctorId);

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
              <option value="">-- Chọn bác sĩ --</option>
              {doctorsList.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialtyName || 'Đang cập nhật'})</option>
              ))}
            </select>
          )}
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
        {!selectedDoctorId ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }} className="helper-text">
            Vui lòng chọn bác sĩ để xem lịch trực.
          </div>
        ) : schedulesQuery.isLoading ? (
          <LoadingBlock label={`Đang tải lịch bác sĩ ${selectedDoctor?.name || ''}...`} />
        ) : schedulesQuery.error ? (
          <StateBlock
            variant="error"
            title="Lỗi tải lịch bác sĩ"
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
