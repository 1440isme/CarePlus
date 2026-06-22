import { useMemo, useState } from 'react';
import { useDoctorSchedules } from '../../schedule/hooks/useSchedules.js';
import LoadingBlock from '../../../shared/components/feedback/LoadingBlock.jsx';

const SHIFT_LABELS = {
  MORNING: 'Ca sáng',
  AFTERNOON: 'Ca chiều',
  ALL_DAY: 'Cả ngày',
};

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthRange(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
  };
}

function buildCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  const diffToMonday = firstDay.getDay() === 0 ? -6 : 1 - firstDay.getDay();
  calendarStart.setDate(firstDay.getDate() + diffToMonday);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function getWorkingShiftsForDate(schedules) {
  const shifts = new Set();
  schedules.forEach((schedule) => {
    if (schedule.status !== 'WORKING') return;
    const shift = schedule.workingShift || schedule.shift;
    if (shift === 'ALL_DAY') {
      shifts.add('MORNING');
      shifts.add('AFTERNOON');
      return;
    }
    shifts.add(shift);
  });
  return shifts;
}

function getShiftOptions(shifts) {
  const options = [];
  if (shifts.has('MORNING')) options.push({ value: 'MORNING', label: SHIFT_LABELS.MORNING });
  if (shifts.has('AFTERNOON')) options.push({ value: 'AFTERNOON', label: SHIFT_LABELS.AFTERNOON });
  if (shifts.size > 0) options.push({ value: 'ALL_DAY', label: SHIFT_LABELS.ALL_DAY });
  return options;
}

export default function LeaveRequestForm({ doctorId, onSubmit, onCancel, isSubmitting, submitError }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const monthRange = useMemo(() => getMonthRange(monthDate), [monthDate]);
  const schedulesQuery = useDoctorSchedules(doctorId, {
    startDate: monthRange.startDate,
    endDate: monthRange.endDate,
    limit: 100,
  });

  const schedulesByDate = useMemo(() => {
    const grouped = new Map();
    const schedules = Array.isArray(schedulesQuery.data?.data) ? schedulesQuery.data.data : [];
    schedules.forEach((schedule) => {
      const current = grouped.get(schedule.workingDate) || [];
      current.push(schedule);
      grouped.set(schedule.workingDate, current);
    });
    return grouped;
  }, [schedulesQuery.data?.data]);

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const selectedSchedules = schedulesByDate.get(selectedDate) || [];
  const selectedWorkingShifts = getWorkingShiftsForDate(selectedSchedules);
  const shiftOptions = getShiftOptions(selectedWorkingShifts);

  const handleMonthChange = (direction) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDate('');
    setSelectedShift('');
  };

  const handleDateSelect = (date) => {
    const isoDate = formatIsoDate(date);
    const schedules = schedulesByDate.get(isoDate) || [];
    const shifts = getWorkingShiftsForDate(schedules);
    if (shifts.size === 0) return;

    setSelectedDate(isoDate);
    setSelectedShift(getShiftOptions(shifts)[0]?.value || '');
    setFormError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedDate || !selectedShift) {
      setFormError('Vui lòng chọn ngày có lịch làm việc và ca nghỉ.');
      return;
    }
    if (reason.trim().length < 5) {
      setFormError('Vui lòng nhập lý do nghỉ ít nhất 5 ký tự.');
      return;
    }

    onSubmit({
      type: 'SCHEDULE_EXCEPTION',
      date: selectedDate,
      exceptionType: selectedShift === 'ALL_DAY' ? 'ALL_DAY' : 'SHIFT',
      shift: selectedShift === 'ALL_DAY' ? undefined : selectedShift,
      reason: reason.trim(),
    });
  };

  return (
    <form className="doctor-leave-form" onSubmit={handleSubmit}>
      <div className="doctor-leave-calendar-toolbar">
        <button type="button" className="button-secondary" onClick={() => handleMonthChange(-1)}>
          Tháng trước
        </button>
        <strong>
          {monthDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </strong>
        <button type="button" className="button-secondary" onClick={() => handleMonthChange(1)}>
          Tháng sau
        </button>
      </div>

      {schedulesQuery.isLoading ? <LoadingBlock label="Đang tải lịch tháng..." /> : null}

      {!schedulesQuery.isLoading ? (
        <div className="doctor-leave-calendar">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
            <span key={label} className="doctor-leave-weekday">{label}</span>
          ))}
          {calendarDays.map((date) => {
            const isoDate = formatIsoDate(date);
            const schedules = schedulesByDate.get(isoDate) || [];
            const shifts = getWorkingShiftsForDate(schedules);
            const isCurrentMonth = date.getMonth() === monthDate.getMonth();
            const isSelected = isoDate === selectedDate;
            const isAvailable = shifts.size > 0;

            return (
              <button
                key={isoDate}
                type="button"
                className={`doctor-leave-day ${isCurrentMonth ? '' : 'is-muted'} ${isAvailable ? 'has-schedule' : ''} ${isSelected ? 'is-selected' : ''}`}
                disabled={!isAvailable}
                onClick={() => handleDateSelect(date)}
              >
                <strong>{date.getDate()}</strong>
                {isAvailable ? <small>{getShiftOptions(shifts).filter((item) => item.value !== 'ALL_DAY').map((item) => item.label.replace('Ca ', '')).join(', ')}</small> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="doctor-leave-selected-panel">
        <h4>Ngày nghỉ đã chọn</h4>
        <p>{selectedDate ? selectedDate.split('-').reverse().join('/') : 'Chọn một ngày có lịch làm việc trên calendar.'}</p>
        {shiftOptions.length > 0 ? (
          <div className="doctor-leave-shift-options">
            {shiftOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={selectedShift === option.value ? 'is-active' : ''}
                onClick={() => setSelectedShift(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="doctor-profile-field">
        <label htmlFor="reason">Lý do nghỉ</label>
        <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>

      {formError ? <div className="field-error">{formError}</div> : null}
      {submitError ? <div className="field-error">{submitError}</div> : null}

      <div className="doctor-leave-actions">
        <button type="button" className="button-secondary" onClick={onCancel} disabled={isSubmitting}>
          Hủy bỏ
        </button>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu nghỉ'}
        </button>
      </div>
    </form>
  );
}
