import { Fragment, useMemo, useState } from "react";
import { useDoctorProfile } from "../../features/doctor/index.js";
import { useDoctorSchedules } from "../../features/schedule/hooks/useSchedules.js";
import {
  useApprovalRequests,
  useCreateLeaveRequest,
} from "../../features/approval/hooks/useApprovalRequests.js";
import { useTimeSlots } from "../../features/timeslot/hooks/useTimeSlots.js";
import { useBookingRules } from "../../features/admin/clinic-settings/hooks/useBookingRules.js";
import {
  buildVirtualSlots,
  filterSlotGroupsBySchedules,
  mergePersistedSlots,
} from "../../features/timeslot/virtual-slot.service.js";
import LeaveRequestForm from "../../features/approval/components/LeaveRequestForm.jsx";
import LoadingBlock from "../../shared/components/feedback/LoadingBlock.jsx";
import StateBlock from "../../shared/components/feedback/StateBlock.jsx";
import "./doctor.css";

const SCHEDULE_STATUS_LABELS = {
  WORKING: "Đang làm việc",
  APPROVED_OFF: "Đã duyệt nghỉ",
  PENDING: "Chờ duyệt nghỉ",
  CANCELLED: "Đã hủy",
  REJECTED: "Đã từ chối",
  NO_SCHEDULE: "Không có lịch",
};

const REQUEST_STATUS_LABELS = {
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const SLOT_STATUS_LABELS = {
  AVAILABLE: "Còn trống",
  BOOKED: "Đã đặt",
  LOCKED: "Đã nghỉ",
  EXPIRED: "Đã qua",
};

const VIEW_MODES = {
  WEEK: "WEEK",
  MONTH: "MONTH",
};

const SHIFT_DEFINITIONS = [
  {
    key: "MORNING",
    label: "Sáng",
    icon: "☀️",
    startField: "morningShiftStart",
    endField: "morningShiftEnd",
    defaultStart: "08:00",
    defaultEnd: "11:30",
  },
  {
    key: "AFTERNOON",
    label: "Chiều",
    icon: "🌤️",
    startField: "afternoonShiftStart",
    endField: "afternoonShiftEnd",
    defaultStart: "13:30",
    defaultEnd: "17:00",
  },
];

const WEEKDAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`;
}

function formatDayLabel(date) {
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
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

function buildMonthGrid(baseDate) {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const startDay = firstDay.getDay();
  const diff = startDay === 0 ? -6 : 1 - startDay;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() + diff);

  const dates = [];
  for (let index = 0; index < 42; index += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    dates.push(current);
  }

  return dates;
}

function buildVisibleRange(baseDate, viewMode) {
  if (viewMode === VIEW_MODES.MONTH) {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    return {
      startDate: formatIsoDate(start),
      endDate: formatIsoDate(end),
    };
  }

  const weekDates = buildWeek(baseDate);
  return {
    startDate: formatIsoDate(weekDates[0]),
    endDate: formatIsoDate(weekDates[6]),
  };
}

function formatShiftLabel(request) {
  if (!request) return "--";
  if (request.exceptionType === "ALL_DAY") return "Cả ngày";
  if (request.exceptionType === "SHIFT")
    return request.shift === "MORNING" ? "Ca sáng" : "Ca chiều";
  if (request.exceptionType === "TIME_RANGE")
    return `${request.startTime || "--"} - ${request.endTime || "--"}`;
  return request.exceptionType || "--";
}

function getScheduleStatusLabel(status) {
  return SCHEDULE_STATUS_LABELS[status] || "Không xác định";
}

function getRequestStatusLabel(status) {
  return REQUEST_STATUS_LABELS[status] || "Không xác định";
}

function getSlotStatusLabel(status) {
  return SLOT_STATUS_LABELS[status] || "";
}

function scheduleCoversShift(schedule, shiftKey) {
  const workingShift = schedule?.workingShift || schedule?.shift;
  return workingShift === "ALL_DAY" || workingShift === shiftKey;
}

function findShiftSchedule(daySchedules, shiftKey) {
  return daySchedules.find((schedule) => scheduleCoversShift(schedule, shiftKey));
}

function getShiftTimeText(schedule, shiftDefinition) {
  const start = schedule?.[shiftDefinition.startField] || shiftDefinition.defaultStart;
  const end = schedule?.[shiftDefinition.endField] || shiftDefinition.defaultEnd;
  return `${start} - ${end}`;
}

function getShiftDescription(schedule) {
  if (!schedule) return "Chưa có lịch";
  if (schedule.status === "APPROVED_OFF") return "Ca làm việc đã bị hủy";
  if (schedule.status === "PENDING") return "Đang chờ phê duyệt";
  if (schedule.status === "REJECTED") return "Đã bị từ chối";
  if (schedule.workingShift === "ALL_DAY") return "Có lịch làm việc";
  return `Có ${schedule.bookedSlots || 0} lịch khám`;
}

export default function DoctorWorkSchedulePage() {
  const todayIso = formatIsoDate(new Date());
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODES.WEEK);

  const profileQuery = useDoctorProfile();
  const doctor = profileQuery.data?.data;

  const weekDates = useMemo(() => buildWeek(baseDate), [baseDate]);
  const monthDates = useMemo(() => buildMonthGrid(baseDate), [baseDate]);
  const { startDate, endDate } = useMemo(
    () => buildVisibleRange(baseDate, viewMode),
    [baseDate, viewMode],
  );

  const schedulesQuery = useDoctorSchedules(doctor?.id, {
    startDate,
    endDate,
    limit: 100,
  });

  const slotsQuery = useTimeSlots({
    doctorId: doctor?.id,
    date: selectedDate,
  });
  const { data: systemSettingsResponse } = useBookingRules();

  const requestsQuery = useApprovalRequests({
    type: "SCHEDULE_EXCEPTION",
    page: 1,
    limit: 20,
  });

  const leaveMutation = useCreateLeaveRequest();

  const schedules = Array.isArray(schedulesQuery.data?.data)
    ? schedulesQuery.data.data
    : [];
  const schedulesByDate = useMemo(() => {
    return schedules.reduce((grouped, schedule) => {
      if (!grouped[schedule.workingDate]) grouped[schedule.workingDate] = [];
      grouped[schedule.workingDate].push(schedule);
      return grouped;
    }, {});
  }, [schedules]);
  const selectedSchedules = schedules.filter(
    (item) => item.workingDate === selectedDate,
  );
  const selectedSchedule = selectedSchedules[0];
  const requests = Array.isArray(requestsQuery.data?.data)
    ? requestsQuery.data.data
    : [];
  const weekSummary = useMemo(() => {
    return schedules.reduce(
      (summary, item) => {
        summary.booked += item.bookedSlots || 0;
        return summary;
      },
      {
        booked: 0,
      },
    );
  }, [schedules]);

  const slotData = slotsQuery.data?.data || null;
  const slotsByShift = useMemo(() => {
    const daySchedules = slotData?.schedules || selectedSchedules;
    if (daySchedules.length === 0) {
      return { morning: [], afternoon: [] };
    }

    return mergePersistedSlots(
      filterSlotGroupsBySchedules(
        buildVirtualSlots(systemSettingsResponse?.data),
        daySchedules,
      ),
      slotData?.slots || [],
    );
  }, [selectedSchedules, slotData, systemSettingsResponse?.data]);
  const selectedDateLabel =
    typeof selectedDate === "string" && selectedDate.includes("-")
      ? selectedDate.split("-").reverse().join("/")
      : selectedDate;
  const visibleRangeLabel =
    viewMode === VIEW_MODES.MONTH
      ? baseDate.toLocaleDateString("vi-VN", {
          month: "long",
          year: "numeric",
        })
      : formatDateRange(startDate, endDate);

  const handleSubmitLeave = async (values) => {
    await leaveMutation.mutateAsync(values);
    setIsLeaveModalOpen(false);
  };

  const moveVisibleRange = (direction) => {
    setBaseDate((current) => {
      const next = new Date(current);
      if (viewMode === VIEW_MODES.MONTH) {
        next.setMonth(current.getMonth() + direction);
      } else {
        next.setDate(current.getDate() + direction * 7);
      }
      return next;
    });
  };

  if (profileQuery.isLoading) {
    return <LoadingBlock label="Đang tải thông tin bác sĩ..." />;
  }

  if (profileQuery.error) {
    return (
      <StateBlock
        variant="error"
        title="Không thể tải hồ sơ bác sĩ"
        description={profileQuery.error.message}
      />
    );
  }

  return (
    <div className="content-grid doctor-page">
      <div className="doctor-page-header">
        <h2>Lịch làm việc</h2>
        <p>
          Theo dõi lịch trực trong tuần, xem slot theo ngày và gửi yêu cầu nghỉ
          đúng theo luồng phê duyệt.
        </p>
      </div>

      <section className="surface-card">
        <div className="doctor-calendar-toolbar">
          <div className="doctor-calendar-nav">
            <div className="doctor-calendar-switch">
              <button
                type="button"
                className="doctor-calendar-arrow"
                onClick={() => moveVisibleRange(-1)}
              >
                &larr;
              </button>
              <div className="doctor-calendar-range">
                {visibleRangeLabel}
              </div>
              <button
                type="button"
                className="doctor-calendar-arrow"
                onClick={() => moveVisibleRange(1)}
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
              Hôm nay
            </button>
          </div>

          <div className="doctor-hero-actions">
            <div className="doctor-schedule-view-tabs" role="tablist">
              <button
                type="button"
                className={viewMode === VIEW_MODES.WEEK ? "is-active" : ""}
                onClick={() => setViewMode(VIEW_MODES.WEEK)}
              >
                Tuần
              </button>
              <button
                type="button"
                className={viewMode === VIEW_MODES.MONTH ? "is-active" : ""}
                onClick={() => setViewMode(VIEW_MODES.MONTH)}
              >
                Tháng
              </button>
            </div>
            <button
              type="button"
              className="button-primary"
              onClick={() => setIsLeaveModalOpen(true)}
            >
              Gửi yêu cầu nghỉ
            </button>
          </div>
        </div>

        <div className="doctor-week-summary" style={{ marginTop: 18 }}>
          <span className="doctor-week-summary-pill">
            Lịch đã đặt trong {viewMode === VIEW_MODES.MONTH ? "tháng" : "tuần"}: {weekSummary.booked}
          </span>
        </div>
      </section>

      <section className="surface-card">
        <div className="doctor-section-title">
          <div>
            <h3>{viewMode === VIEW_MODES.WEEK ? "Lịch tuần" : "Lịch tháng"}</h3>
            <p>
              {viewMode === VIEW_MODES.WEEK
                ? "Bảng lịch được chia theo ca sáng và ca chiều để dễ theo dõi."
                : "Mỗi ô ngày được chia thành 2 dòng ca sáng và ca chiều, ngày có lịch sẽ được tô nhẹ."}
            </p>
          </div>
        </div>

        {schedulesQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch làm việc..." />
        ) : schedulesQuery.error ? (
          <StateBlock
            variant="error"
            title="Không thể tải lịch làm việc"
            description={schedulesQuery.error.message}
          />
        ) : (
          <div className="doctor-calendar-body">
            {viewMode === VIEW_MODES.WEEK ? (
              <div className="doctor-shift-table-wrap">
                <div className="doctor-shift-table">
                  <div className="doctor-shift-table-corner" />
                  {weekDates.map((date) => {
                    const isoDate = formatIsoDate(date);
                    return (
                      <div
                        key={isoDate}
                        className={`doctor-shift-table-head ${isoDate === todayIso ? "is-today" : ""}`}
                      >
                        <strong>{formatDayLabel(date)}</strong>
                        {isoDate === todayIso ? <span>Hôm nay</span> : null}
                      </div>
                    );
                  })}

                  {SHIFT_DEFINITIONS.map((shift) => (
                    <Fragment key={shift.key}>
                      <div key={`${shift.key}-label`} className="doctor-shift-row-label">
                        <span>{shift.icon}</span>
                        <strong>Ca {shift.label.toLowerCase()}</strong>
                      </div>
                      {weekDates.map((date) => {
                        const isoDate = formatIsoDate(date);
                        const daySchedules = schedulesByDate[isoDate] || [];
                        const schedule = findShiftSchedule(daySchedules, shift.key);
                        const isSelected = isoDate === selectedDate;

                        return (
                          <button
                            key={`${shift.key}-${isoDate}`}
                            type="button"
                            className={`doctor-shift-cell ${schedule ? "has-schedule" : ""} ${isSelected ? "is-selected" : ""} status-${String(schedule?.status || "empty").toLowerCase()}`}
                            onClick={() => setSelectedDate(isoDate)}
                          >
                            {schedule ? (
                              <span className="doctor-shift-card">
                                <strong>{getShiftTimeText(schedule, shift)}</strong>
                                <small>{getShiftDescription(schedule)}</small>
                              </span>
                            ) : (
                              <span className="doctor-shift-empty">Chưa có lịch</span>
                            )}
                          </button>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="doctor-month-calendar">
                {WEEKDAY_LABELS.map((weekday) => (
                  <div key={weekday} className="doctor-month-weekday">
                    {weekday}
                  </div>
                ))}

                {monthDates.map((date) => {
                  const isoDate = formatIsoDate(date);
                  const daySchedules = schedulesByDate[isoDate] || [];
                  const isToday = isoDate === todayIso;
                  const isSelected = isoDate === selectedDate;
                  const isMuted = date.getMonth() !== baseDate.getMonth();

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      className={`doctor-month-day ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${isMuted ? "is-muted" : ""}`}
                      onClick={() => setSelectedDate(isoDate)}
                    >
                      <span className="doctor-month-day-header">
                        <strong>{date.getDate()}</strong>
                        {isToday ? <small>Hôm nay</small> : null}
                      </span>

                      {SHIFT_DEFINITIONS.map((shift) => {
                        const schedule = findShiftSchedule(daySchedules, shift.key);
                        return (
                          <span
                            key={shift.key}
                            className={`doctor-month-shift-line ${schedule ? "has-schedule" : ""} status-${String(schedule?.status || "empty").toLowerCase()}`}
                          >
                            <span>{shift.label}</span>
                            <small>
                              {schedule
                                ? getScheduleStatusLabel(schedule.status)
                                : "Trống"}
                            </small>
                          </span>
                        );
                      })}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="split-panel">
        <div className="surface-card doctor-day-slots-card">
          <div className="doctor-section-title">
            <div>
              <h3>Chi tiết ngày {selectedDateLabel}</h3>
              <p>
                {selectedSchedule
                  ? `Trạng thái lịch: ${getScheduleStatusLabel(selectedSchedule.status)}`
                  : "Chưa có lịch trong ngày được chọn."}
              </p>
            </div>
            {selectedSchedule ? (
              <span
                className={`status-chip status-${String(selectedSchedule.status || "").toLowerCase()}`}
              >
                {getScheduleStatusLabel(selectedSchedule.status)}
              </span>
            ) : null}
          </div>

          {slotsQuery.isLoading ? (
            <LoadingBlock label="Đang tải khung giờ..." />
          ) : slotsQuery.error ? (
            <StateBlock
              variant="error"
              title="Không thể tải time slots"
              description={slotsQuery.error.message}
            />
          ) : !selectedSchedule ? (
            <StateBlock
              title="Ngày này chưa có lịch làm việc"
              description="Hệ thống sẽ hiển thị slot chi tiết khi đã có schedule cho ngày được chọn."
            />
          ) : (
            <>
              <div className="doctor-slot-group">
                <h4>Ca sáng</h4>
                <div className="doctor-slot-list">
                  {slotsByShift.morning.length > 0 ? (
                    slotsByShift.morning.map((slot) => (
                      <div
                        key={slot.id}
                        className={`doctor-slot-pill ${String(slot.status || "").toLowerCase()}`}
                      >
                        {slot.startTime} - {slot.endTime}
                        {getSlotStatusLabel(slot.status) ? <small>{getSlotStatusLabel(slot.status)}</small> : null}
                      </div>
                    ))
                  ) : (
                    <span className="doctor-table-note">
                      Không có slot ca sáng.
                    </span>
                  )}
                </div>
              </div>

              <div className="doctor-slot-group">
                <h4>Ca chiều</h4>
                <div className="doctor-slot-list">
                  {slotsByShift.afternoon.length > 0 ? (
                    slotsByShift.afternoon.map((slot) => (
                      <div
                        key={slot.id}
                        className={`doctor-slot-pill ${String(slot.status || "").toLowerCase()}`}
                      >
                        {slot.startTime} - {slot.endTime}
                        {getSlotStatusLabel(slot.status) ? <small>{getSlotStatusLabel(slot.status)}</small> : null}
                      </div>
                    ))
                  ) : (
                    <span className="doctor-table-note">
                      Không có slot ca chiều.
                    </span>
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
              <p>
                Theo dõi các yêu cầu đã gửi và trạng thái phê duyệt hiện tại.
              </p>
            </div>
          </div>

          {requestsQuery.isLoading ? (
            <LoadingBlock label="Đang tải yêu cầu nghỉ..." />
          ) : requestsQuery.error ? (
            <StateBlock
              variant="error"
              title="Không thể tải yêu cầu nghỉ"
              description={requestsQuery.error.message}
            />
          ) : requests.length === 0 ? (
            <StateBlock
              title="Chưa có yêu cầu nghỉ"
              description="Khi bác sĩ gửi yêu cầu nghỉ, lịch sử sẽ hiển thị tại đây."
            />
          ) : (
            <div className="doctor-request-grid">
              {requests.map((request) => (
                <article key={request.id} className="doctor-request-card">
                  <div className="doctor-request-card-header">
                    <div>
                      <strong>
                        {request.date
                          ? request.date.split("-").reverse().join("/")
                          : "--"}
                      </strong>
                      <p>{formatShiftLabel(request)}</p>
                    </div>
                    <span
                      className={`status-chip status-${String(request.status || "").toLowerCase()}`}
                    >
                      {getRequestStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="doctor-request-card-body">
                    <span>{request.reason}</span>
                    {request.rejectionReason ? (
                      <p>Phản hồi admin: {request.rejectionReason}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {isLeaveModalOpen ? (
        <>
          <div
            className="doctor-leave-backdrop"
            onClick={() => setIsLeaveModalOpen(false)}
          />
          <div className="doctor-leave-modal">
            <div className="doctor-leave-modal-header">
              <div>
                <h3>Yêu cầu nghỉ</h3>
                <p>Gửi yêu cầu nghỉ theo ngày hoặc theo ca.</p>
              </div>
              <button
                type="button"
                className="doctor-leave-close"
                onClick={() => setIsLeaveModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="doctor-leave-modal-body">
              <LeaveRequestForm
                doctorId={doctor?.id}
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
