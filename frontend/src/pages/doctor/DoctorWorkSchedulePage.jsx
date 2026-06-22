import { useMemo, useState } from 'react';
import { useDoctorProfile } from '../../features/doctor/index.js';
import { useDoctorSchedules } from '../../features/schedule/hooks/useSchedules.js';
import { useApprovalRequests, useCreateLeaveRequest } from '../../features/approval/hooks/useApprovalRequests.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import { usePublicSystemSettings } from '../../features/admin/clinic-settings/hooks/usePublicSystemSettings.js';
import {
  buildVirtualSlots,
  filterSlotGroupsBySchedules,
  mergePersistedSlots,
} from '../../features/timeslot/virtual-slot.service.js';
import LeaveRequestForm from '../../features/approval/components/LeaveRequestForm.jsx';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './doctor.css';

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
}

function formatDayLabel(date) {
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function buildWeek(baseDate) {
  const pivot = new Date(baseDate);
  const day = pivot.getDay();
  const diff = pivot.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(pivot);
  monday.setDate(diff);

  const dates = [];
  for (let index = 0; index < 7; index += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    dates.push(current);
  }

  return dates;
}

function formatShiftLabel(request) {
  if (!request) return '--';
  if (request.exceptionType === 'ALL_DAY') return 'Cả ngày';
  if (request.exceptionType === 'SHIFT') return request.shift === 'MORNING' ? 'Ca sáng' : 'Ca chiều';
  if (request.exceptionType === 'TIME_RANGE') return `${request.startTime || '--'} - ${request.endTime || '--'}`;
  return request.exceptionType || '--';
}

export default function DoctorWorkSchedulePage() {
  const todayIso = formatIsoDate(new Date());
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const profileQuery = useDoctorProfile();
  const doctor = profileQuery.data?.data;

  const weekDates = useMemo(() => buildWeek(baseDate), [baseDate]);
  const startDate = formatIsoDate(weekDates[0]);
  const endDate = formatIsoDate(weekDates[6]);

  const schedulesQuery = useDoctorSchedules(doctor?.id, {
    startDate,
    endDate,
    limit: 100,
  });

  const slotsQuery = useTimeSlots({
    doctorId: doctor?.id,
    date: selectedDate,
  });
  const { data: systemSettingsResponse } = usePublicSystemSettings();

  const requestsQuery = useApprovalRequests({
    type: 'SCHEDULE_EXCEPTION',
    page: 1,
    limit: 20,
  });

  const leaveMutation = useCreateLeaveRequest();

  const schedules = Array.isArray(schedulesQuery.data?.data) ? schedulesQuery.data.data : [];
  const selectedSchedules = schedules.filter((item) => item.workingDate === selectedDate);
  const selectedSchedule = selectedSchedules[0];
  const requests = Array.isArray(requestsQuery.data?.data) ? requestsQuery.data.data : [];
  const weekSummary = useMemo(() => {
    return schedules.reduce((summary, item) => {
      summary.totalSchedules += 1;
      summary.available += item.availableSlots || 0;
      summary.booked += item.bookedSlots || 0;
      if (item.status === 'PENDING') summary.pending += 1;
      if (item.status === 'APPROVED_OFF') summary.approvedOff += 1;
      return summary;
    }, {
      totalSchedules: 0,
      available: 0,
      booked: 0,
      pending: 0,
      approvedOff: 0,
    });
  }, [schedules]);

  const slotData = slotsQuery.data?.data || null;
  const slotsByShift = useMemo(() => {
    const daySchedules = slotData?.schedules || selectedSchedules;
    if (daySchedules.length === 0) {
      return { morning: [], afternoon: [] };
    }

    return mergePersistedSlots(
      filterSlotGroupsBySchedules(buildVirtualSlots(systemSettingsResponse?.data), daySchedules),
      slotData?.slots || [],
    );
  }, [selectedSchedules, slotData, systemSettingsResponse?.data]);
  const selectedDateLabel =
    typeof selectedDate === 'string' && selectedDate.includes('-')
      ? selectedDate.split('-').reverse().join('/')
      : selectedDate;

  const handleSubmitLeave = async (values) => {
    await leaveMutation.mutateAsync(values);
    setIsLeaveModalOpen(false);
  };

  if (profileQuery.isLoading) {
    return <LoadingBlock label="Đang tải thông tin bác sĩ..." />;
  }

  if (profileQuery.error) {
    return <StateBlock variant="error" title="Không thể tải hồ sơ bác sĩ" description={profileQuery.error.message} />;
  }

  return (
    <div className="content-grid doctor-page">
      <div className="doctor-page-header">
        <h2>Lịch làm việc</h2>
        <p>Theo dõi lịch trực trong tuần, xem slot theo ngày và gửi yêu cầu nghỉ đúng theo luồng phê duyệt.</p>
      </div>

      <section className="surface-card">
        <div className="doctor-calendar-toolbar">
          <div className="doctor-calendar-nav">
            <div className="doctor-calendar-switch">
              <button
                type="button"
                className="doctor-calendar-arrow"
                onClick={() => setBaseDate((current) => {
                  const next = new Date(current);
                  next.setDate(current.getDate() - 7);
                  return next;
                })}
              >
                &larr;
              </button>
              <div className="doctor-calendar-range">{formatDateRange(startDate, endDate)}</div>
              <button
                type="button"
                className="doctor-calendar-arrow"
                onClick={() => setBaseDate((current) => {
                  const next = new Date(current);
                  next.setDate(current.getDate() + 7);
                  return next;
                })}
              >
                &rarr;
              </button>
            </div>

            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                const now = new Date();
                setBaseDate(now);
                setSelectedDate(formatIsoDate(now));
              }}
            >
              Tuần này
            </button>
          </div>

          <div className="doctor-hero-actions">
            <button type="button" className="button-primary" onClick={() => setIsLeaveModalOpen(true)}>
              Gửi yêu cầu nghỉ
            </button>
          </div>
        </div>

        <div className="doctor-week-summary" style={{ marginTop: 18 }}>
          <span className="doctor-week-summary-pill">Ngày có lịch: {weekSummary.totalSchedules}</span>
          <span className="doctor-week-summary-pill">Slot khả dụng: {weekSummary.available}</span>
          <span className="doctor-week-summary-pill">Slot đã đặt: {weekSummary.booked}</span>
          <span className="doctor-week-summary-pill">Yêu cầu chờ duyệt: {weekSummary.pending}</span>
          <span className="doctor-week-summary-pill">Ngày nghỉ đã duyệt: {weekSummary.approvedOff}</span>
        </div>
      </section>

      <section className="surface-card">
        <div className="doctor-section-title">
          <div>
            <h3>Lịch tuần</h3>
            <p>Chọn một ngày để xem chi tiết các khung giờ và tình trạng slot.</p>
          </div>
        </div>

        {schedulesQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch làm việc..." />
        ) : schedulesQuery.error ? (
          <StateBlock variant="error" title="Không thể tải lịch làm việc" description={schedulesQuery.error.message} />
        ) : (
          <div className="doctor-calendar-body">
            <div className="doctor-calendar-week">
              {weekDates.map((date) => {
                const isoDate = formatIsoDate(date);
                const schedule = schedules.find((item) => item.workingDate === isoDate);
                const isToday = isoDate === todayIso;
                const isSelected = isoDate === selectedDate;

                return (
                  <article
                    key={isoDate}
                    className={`doctor-calendar-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                  >
                    <div className="doctor-calendar-cell-header">
                      <button type="button" onClick={() => setSelectedDate(isoDate)}>
                        <strong>{formatDayLabel(date)}</strong>
                        <span>{isToday ? 'Hôm nay' : 'Lịch trong tuần'}</span>
                      </button>
                      <span className={`status-chip status-${String(schedule?.status || 'cancelled').toLowerCase()}`}>
                        {schedule?.status || 'NO_SCHEDULE'}
                      </span>
                    </div>

                    {schedule ? (
                      <div className="doctor-calendar-counts">
                        <span>Tổng slot: {schedule.totalSlots}</span>
                        <span>Khả dụng: {schedule.availableSlots}</span>
                        <span>Đã đặt: {schedule.bookedSlots}</span>
                        <span>Đang khóa: {schedule.lockedSlots}</span>
                      </div>
                    ) : (
                      <div className="doctor-calendar-counts">
                        <span>Chưa có lịch mở cho ngày này.</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="split-panel">
        <div className="surface-card doctor-day-slots-card">
          <div className="doctor-section-title">
            <div>
              <h3>Chi tiết ngày {selectedDateLabel}</h3>
              <p>{selectedSchedule ? `Trạng thái lịch: ${selectedSchedule.status}` : 'Chưa có lịch trong ngày được chọn.'}</p>
            </div>
            {selectedSchedule ? (
              <span className={`status-chip status-${String(selectedSchedule.status || '').toLowerCase()}`}>
                {selectedSchedule.status}
              </span>
            ) : null}
          </div>

          {slotsQuery.isLoading ? (
            <LoadingBlock label="Đang tải khung giờ..." />
          ) : slotsQuery.error ? (
            <StateBlock variant="error" title="Không thể tải time slots" description={slotsQuery.error.message} />
          ) : !selectedSchedule ? (
            <StateBlock title="Ngày này chưa có lịch làm việc" description="Hệ thống sẽ hiển thị slot chi tiết khi đã có schedule cho ngày được chọn." />
          ) : (
            <>
              <div className="doctor-slot-group">
                <h4>Ca sáng</h4>
                <div className="doctor-slot-list">
                  {slotsByShift.morning.length > 0 ? (
                    slotsByShift.morning.map((slot) => (
                      <div key={slot.id} className={`doctor-slot-pill ${String(slot.status || '').toLowerCase()}`}>
                        {slot.startTime} - {slot.endTime}
                      </div>
                    ))
                  ) : (
                    <span className="doctor-table-note">Không có slot ca sáng.</span>
                  )}
                </div>
              </div>

              <div className="doctor-slot-group">
                <h4>Ca chiều</h4>
                <div className="doctor-slot-list">
                  {slotsByShift.afternoon.length > 0 ? (
                    slotsByShift.afternoon.map((slot) => (
                      <div key={slot.id} className={`doctor-slot-pill ${String(slot.status || '').toLowerCase()}`}>
                        {slot.startTime} - {slot.endTime}
                      </div>
                    ))
                  ) : (
                    <span className="doctor-table-note">Không có slot ca chiều.</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="surface-card">
          <div className="doctor-section-title">
            <div>
              <h3>Yêu cầu nghỉ gần đây</h3>
              <p>Theo dõi các yêu cầu đã gửi và trạng thái phê duyệt hiện tại.</p>
            </div>
          </div>

          {requestsQuery.isLoading ? (
            <LoadingBlock label="Đang tải yêu cầu nghỉ..." />
          ) : requestsQuery.error ? (
            <StateBlock variant="error" title="Không thể tải yêu cầu nghỉ" description={requestsQuery.error.message} />
          ) : requests.length === 0 ? (
            <StateBlock title="Chưa có yêu cầu nghỉ" description="Khi bác sĩ gửi yêu cầu nghỉ, lịch sử sẽ hiển thị tại đây." />
          ) : (
            <div className="doctor-request-grid">
              {requests.map((request) => (
                <article key={request.id} className="doctor-request-card">
                  <div className="doctor-request-card-header">
                    <div>
                      <strong>{request.date ? request.date.split('-').reverse().join('/') : '--'}</strong>
                      <p>{formatShiftLabel(request)}</p>
                    </div>
                    <span className={`status-chip status-${String(request.status || '').toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="doctor-request-card-body">
                    <span>{request.reason}</span>
                    <p>Loại yêu cầu: {request.exceptionType}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {isLeaveModalOpen ? (
        <>
          <div className="doctor-leave-backdrop" onClick={() => setIsLeaveModalOpen(false)} />
          <div className="doctor-leave-modal">
            <div className="doctor-leave-modal-header">
              <div>
                <h3>Yêu cầu nghỉ</h3>
                <p>Gửi yêu cầu nghỉ theo ngày, theo ca hoặc theo khoảng giờ.</p>
              </div>
              <button type="button" className="doctor-leave-close" onClick={() => setIsLeaveModalOpen(false)}>
                &times;
              </button>
            </div>

            <div className="doctor-leave-modal-body">
              <LeaveRequestForm
                onSubmit={handleSubmitLeave}
                onCancel={() => setIsLeaveModalOpen(false)}
                isSubmitting={leaveMutation.isPending}
                submitError={leaveMutation.error?.message}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
