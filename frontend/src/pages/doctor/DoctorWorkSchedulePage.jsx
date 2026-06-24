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
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

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

const WEEKDAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "CN",
];

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
  return daySchedules.find((schedule) =>
    scheduleCoversShift(schedule, shiftKey),
  );
}

function getShiftTimeText(schedule, shiftDefinition) {
  const start =
    schedule?.[shiftDefinition.startField] || shiftDefinition.defaultStart;
  const end =
    schedule?.[shiftDefinition.endField] || shiftDefinition.defaultEnd;
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

function getScheduleCardTone(schedule) {
  if (!schedule) return "border-gray-200 bg-white text-gray-400";
  if (schedule.status === "PENDING")
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (schedule.status === "APPROVED_OFF" || schedule.status === "CANCELLED") {
    return "border-gray-200 bg-gray-100 text-gray-500";
  }
  if (schedule.status === "REJECTED")
    return "border-red-200 bg-red-50 text-red-600";
  return "border-[#49BCE2]/40 bg-[#EBF7FD] text-[#1587a8]";
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
  const pendingLeaveRequestCount = useMemo(() => {
    return requests.filter((request) => request.status === "PENDING").length;
  }, [requests]);
  const weekSummary = useMemo(() => {
    return schedules.reduce(
      (summary, item) => {
        summary.totalSchedules += 1;
        summary.available += item.availableSlots || 0;
        summary.booked += item.bookedSlots || 0;
        if (item.status === "APPROVED_OFF") summary.approvedOff += 1;
        return summary;
      },
      {
        totalSchedules: 0,
        available: 0,
        booked: 0,
        approvedOff: 0,
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

  const getStatusConfig = (status) => {
    switch (status) {
      case "CONFIRMED":
      case "WORKING":
        return "bg-[#EBF7FD] text-[#49BCE2] border-[#49BCE2]/20";
      case "APPROVED_OFF":
      case "REJECTED":
        return "bg-red-50 text-red-600 border-red-200";
      case "PENDING":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "APPROVED":
        return "bg-green-50 text-green-600 border-green-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-500 border-gray-250";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Lịch làm việc</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Theo dõi lịch trực trong tuần, xem slot theo ngày và gửi yêu cầu nghỉ
          đúng theo luồng phê duyệt.
        </p>
      </div>

      {/* Toolbar & stats card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 mb-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Week navigation */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              <button
                type="button"
                className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                onClick={() => moveVisibleRange(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-700 min-w-[130px] text-center">
                {visibleRangeLabel}
              </span>
              <button
                type="button"
                className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                onClick={() => moveVisibleRange(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                const now = new Date();
                setBaseDate(now);
                setSelectedDate(formatIsoDate(now));
              }}
            >
              Hôm nay
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === VIEW_MODES.WEEK ? "bg-[#49BCE2] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                onClick={() => setViewMode(VIEW_MODES.WEEK)}
              >
                Tuần
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === VIEW_MODES.MONTH ? "bg-[#49BCE2] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                onClick={() => setViewMode(VIEW_MODES.MONTH)}
              >
                Tháng
              </button>
            </div>
            <button
              type="button"
              className="px-4 py-2 bg-[#49BCE2] hover:bg-[#3ca4c7] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              onClick={() => setIsLeaveModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gửi yêu cầu nghỉ</span>
            </button>
          </div>
        </div>

        {/* Week Summary Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "Số ngày làm việc",
              value: weekSummary.totalSchedules,
              color: "bg-blue-50 text-blue-600 border-blue-100",
            },
            {
              label: "Số lịch hẹn",
              value: weekSummary.booked,
              color: "bg-indigo-50 text-indigo-600 border-indigo-100",
            },
            {
              label: "Chờ duyệt",
              value: pendingLeaveRequestCount,
              color: "bg-amber-50 text-amber-600 border-amber-100",
            },
            {
              label: "Nghỉ đã duyệt",
              value: weekSummary.approvedOff,
              color: "bg-red-50 text-red-600 border-red-100",
            },
          ].map((pill, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${pill.color}`}
            >
              {pill.label}: {pill.value}
            </span>
          ))}
        </div>
      </div>

      {/* Schedule calendar view */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 mb-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-800">
            {viewMode === VIEW_MODES.WEEK ? "Lịch tuần" : "Lịch tháng"}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {viewMode === VIEW_MODES.WEEK
              ? "Lịch được chia thành 2 dòng ca sáng và ca chiều."
              : "Mỗi ngày được chia thành 2 dòng đại diện cho ca sáng và ca chiều."}
          </p>
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
          <>
            {viewMode === VIEW_MODES.WEEK ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-[980px] grid grid-cols-[96px_repeat(7,minmax(120px,1fr))] bg-white">
                  <div className="min-h-[66px] border-r border-b border-gray-100 bg-gray-50" />
                  {weekDates.map((date) => {
                    const isoDate = formatIsoDate(date);
                    return (
                      <div
                        key={isoDate}
                        className={`min-h-[66px] border-r border-b border-gray-100 px-2 py-3 text-center ${isoDate === todayIso ? "bg-cyan-50" : "bg-gray-50"}`}
                      >
                        <div className="text-xs font-bold text-gray-700 capitalize">
                          {formatDayLabel(date)}
                        </div>
                        {isoDate === todayIso ? (
                          <span className="mt-1 inline-flex rounded-md bg-[#49BCE2] px-2 py-0.5 text-[10px] font-bold text-white">
                            Hôm nay
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  {SHIFT_DEFINITIONS.map((shift) => (
                    <Fragment key={shift.key}>
                      <div className="min-h-[88px] border-r border-b border-gray-100 bg-gray-50 px-2 py-3 flex items-center justify-center gap-1 text-xs font-bold text-gray-600">
                        <span>{shift.icon}</span>
                        <span>Ca {shift.label.toLowerCase()}</span>
                      </div>
                      {weekDates.map((date) => {
                        const isoDate = formatIsoDate(date);
                        const daySchedules = schedulesByDate[isoDate] || [];
                        const schedule = findShiftSchedule(
                          daySchedules,
                          shift.key,
                        );
                        const isSelected = isoDate === selectedDate;

                        return (
                          <button
                            key={`${shift.key}-${isoDate}`}
                            type="button"
                            className={`min-h-[88px] border-r border-b border-gray-100 p-2 text-left transition-colors hover:bg-gray-50 ${isSelected ? "shadow-[inset_0_0_0_2px_rgba(73,188,226,0.35)]" : ""}`}
                            onClick={() => setSelectedDate(isoDate)}
                          >
                            {schedule ? (
                              <span
                                className={`block min-h-[58px] rounded-lg border px-2.5 py-2 ${getScheduleCardTone(schedule)}`}
                              >
                                <strong className="block text-[11px] font-bold">
                                  {getShiftTimeText(schedule, shift)}
                                </strong>
                                <small className="mt-1 block text-[11px] font-semibold">
                                  {getShiftDescription(schedule)}
                                </small>
                              </span>
                            ) : (
                              <span className="grid min-h-[58px] place-items-center rounded-lg border border-dashed border-gray-200 text-[11px] font-semibold text-gray-400">
                                Chưa có lịch
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-[760px] grid grid-cols-7 bg-white">
                  {WEEKDAY_LABELS.map((weekday) => (
                    <div
                      key={weekday}
                      className="min-h-[40px] border-r border-b border-gray-100 bg-gray-50 grid place-items-center text-xs font-bold text-gray-500"
                    >
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
                        className={`min-h-[124px] border-r border-b border-gray-100 p-2 text-left transition-colors hover:bg-gray-50 ${isMuted ? "bg-gray-50/50 text-gray-300" : "bg-white"} ${isSelected ? "shadow-[inset_0_0_0_2px_rgba(73,188,226,0.35)]" : ""}`}
                        onClick={() => setSelectedDate(isoDate)}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <strong className="text-xs font-bold text-gray-700">
                            {date.getDate()}
                          </strong>
                          {isToday ? (
                            <span className="rounded-full bg-[#49BCE2] px-2 py-0.5 text-[9px] font-bold text-white">
                              Hôm nay
                            </span>
                          ) : null}
                        </div>

                        <div className="grid gap-1.5">
                          {SHIFT_DEFINITIONS.map((shift) => {
                            const schedule = findShiftSchedule(
                              daySchedules,
                              shift.key,
                            );
                            return (
                              <span
                                key={shift.key}
                                className={`flex min-h-[30px] items-center justify-between gap-1 rounded-md border px-2 py-1 ${getScheduleCardTone(schedule)}`}
                              >
                                <span className="text-[11px] font-bold">
                                  {shift.label}
                                </span>
                                <small className="text-[10px] font-semibold">
                                  {schedule
                                    ? getScheduleStatusLabel(schedule.status)
                                    : "Trống"}
                                </small>
                              </span>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail list and exceptions request logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Slots in detail */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                Chi tiết ngày {selectedDateLabel}
              </h3>
            </div>
            {selectedSchedule && (
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusConfig(selectedSchedule.status)}`}
              >
                {getScheduleStatusLabel(selectedSchedule.status)}
              </span>
            )}
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
            <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
              <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">
                Không có khung giờ làm việc nào.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Morning */}
              <div>
                <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                  Ca sáng
                </h4>
                {slotsByShift.morning.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
                    {slotsByShift.morning.map((slot) => (
                      <span
                        key={slot.id}
                        className={`min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-center text-[13px] font-semibold leading-tight flex items-center justify-center ${
                          slot.status === "BOOKED"
                            ? "bg-gray-100 border-gray-200 text-gray-400 opacity-60"
                            : slot.status === "LOCKED"
                              ? "bg-gray-100 border-gray-250 text-gray-500"
                              : "bg-green-50 border-green-200 text-green-600"
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Không trực sáng.</p>
                )}
              </div>

              {/* Afternoon */}
              <div>
                <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                  Ca chiều
                </h4>
                {slotsByShift.afternoon.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
                    {slotsByShift.afternoon.map((slot) => (
                      <span
                        key={slot.id}
                        className={`min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-center text-[13px] font-semibold leading-tight flex items-center justify-center ${
                          slot.status === "BOOKED"
                            ? "bg-gray-100 border-gray-200 text-gray-400 opacity-60"
                            : slot.status === "LOCKED"
                              ? "bg-gray-100 border-gray-250 text-gray-500"
                              : "bg-green-50 border-green-200 text-green-600"
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Không trực chiều.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: leave requests */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">
              Yêu cầu nghỉ gần đây
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Theo dõi lịch sử các yêu cầu xin nghỉ làm việc.
            </p>
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
            <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">
                Bác sĩ chưa gửi yêu cầu nghỉ nào.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-gray-800">
                        {request.date
                          ? request.date.split("-").reverse().join("/")
                          : "--"}
                      </strong>
                      <div className="text-gray-500 mt-0.5">
                        {formatShiftLabel(request)}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getStatusConfig(request.status)}`}
                    >
                      {getRequestStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="text-gray-600 border-t border-gray-100 pt-1.5 mt-0.5">
                    <strong>Lý do:</strong> {request.reason}
                    {request.rejectionReason && (
                      <p className="text-red-500 font-medium mt-1">
                        Phản hồi admin: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave request form modal */}
      {isLeaveModalOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLeaveModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-5 md:p-6 w-full max-w-[980px] max-h-[calc(100vh-32px)] overflow-y-auto shadow-lg border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Yêu cầu nghỉ
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Gửi yêu cầu nghỉ theo ngày hoặc theo ca.
                </p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <LeaveRequestForm
                doctorId={doctor?.id}
                onSubmit={handleSubmitLeave}
                onCancel={() => setIsLeaveModalOpen(false)}
                isSubmitting={leaveMutation.isPending}
                submitError={leaveMutation.error?.message}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
