import { useMemo, useState } from 'react';
import { useDoctorSchedules } from '../../schedule/hooks/useSchedules.js';
import LoadingBlock from '../../../shared/components/feedback/LoadingBlock.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const todayIso = formatIsoDate(new Date());

  const handleMonthChange = (direction) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDate('');
    setSelectedShift('');
    setFormError('');
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleMonthChange(-1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-700 capitalize">
          {monthDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => handleMonthChange(1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar grid */}
      {schedulesQuery.isLoading ? (
        <LoadingBlock label="Đang tải lịch tháng..." />
      ) : (
        <div className="select-none">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
              <div key={label} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((date) => {
              const isoDate = formatIsoDate(date);
              const schedules = schedulesByDate.get(isoDate) || [];
              const shifts = getWorkingShiftsForDate(schedules);
              const isCurrentMonth = date.getMonth() === monthDate.getMonth();
              const isSelected = isoDate === selectedDate;
              const isAvailable = shifts.size > 0;
              const isToday = isoDate === todayIso;
              const isPast = isoDate < todayIso;

              return (
                <button
                  key={isoDate}
                  type="button"
                  disabled={!isAvailable || isPast}
                  onClick={() => handleDateSelect(date)}
                  className={[
                    'relative flex flex-col items-center py-1.5 rounded-lg text-xs transition-all',
                    !isCurrentMonth ? 'opacity-30' : '',
                    isPast && isCurrentMonth ? 'opacity-40 cursor-not-allowed' : '',
                    isSelected
                      ? 'bg-[#49BCE2] text-white font-bold shadow-sm'
                      : isAvailable && !isPast
                        ? 'bg-blue-50 text-blue-700 hover:bg-[#49BCE2]/20 cursor-pointer font-medium border border-blue-100'
                        : 'text-gray-400 cursor-default',
                    isToday && !isSelected ? 'ring-2 ring-[#49BCE2] ring-offset-1' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="font-semibold leading-none">{date.getDate()}</span>
                  {isAvailable && (
                    <span className={`text-[8px] mt-0.5 leading-none ${isSelected ? 'text-white/80' : 'text-blue-500'}`}>
                      {getShiftOptions(shifts).filter(o => o.value !== 'ALL_DAY').map(o => o.label.replace('Ca ', '')).join('+')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected date & shift picker */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-2">Ngày & Ca nghỉ</p>
        {selectedDate ? (
          <>
            <p className="text-sm font-bold text-gray-900 mb-2">
              📅 {selectedDate.split('-').reverse().join('/')}
            </p>
            <div className="flex flex-wrap gap-2">
              {shiftOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedShift(option.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    selectedShift === option.value
                      ? 'bg-[#49BCE2] text-white border-[#49BCE2] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#49BCE2]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic">Chọn ngày có lịch làm việc trên lịch để tiếp tục.</p>
        )}
      </div>

      {/* Reason textarea */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="leave-reason" className="text-xs font-semibold text-gray-700">
          Lý do nghỉ <span className="text-red-500">*</span>
        </label>
        <textarea
          id="leave-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Mô tả lý do xin nghỉ (ít nhất 5 ký tự)..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white resize-none placeholder:text-gray-400 transition-colors"
        />
      </div>

      {/* Errors */}
      {(formError || submitError) && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{formError || submitError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedDate || !selectedShift}
          className="flex-1 py-2.5 bg-[#49BCE2] hover:bg-[#3ca4c7] text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu nghỉ'}
        </button>
      </div>
    </form>
  );
}
