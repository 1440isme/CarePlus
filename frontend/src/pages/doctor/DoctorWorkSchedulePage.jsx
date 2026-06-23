import { useMemo, useState } from "react";
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
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

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

function formatShiftLabel(request) {
  if (!request) return "--";
  if (request.exceptionType === "ALL_DAY") return "Cả ngày";
  if (request.exceptionType === "SHIFT")
    return request.shift === "MORNING" ? "Ca sáng" : "Ca chiều";
  if (request.exceptionType === "TIME_RANGE")
    return `${request.startTime || "--"} - ${request.endTime || "--"}`;
  return request.exceptionType || "--";
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
        summary.totalSchedules += 1;
        summary.available += item.availableSlots || 0;
        summary.booked += item.bookedSlots || 0;
        if (item.status === "PENDING") summary.pending += 1;
        if (item.status === "APPROVED_OFF") summary.approvedOff += 1;
        return summary;
      },
      {
        totalSchedules: 0,
        available: 0,
        booked: 0,
        pending: 0,
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

  const handleSubmitLeave = async (values) => {
    await leaveMutation.mutateAsync(values);
    setIsLeaveModalOpen(false);
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
      case 'CONFIRMED':
      case 'WORKING':
        return 'bg-[#EBF7FD] text-[#49BCE2] border-[#49BCE2]/20';
      case 'APPROVED_OFF':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-500 border-gray-250';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Lịch làm việc</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Theo dõi lịch trực trong tuần, xem slot theo ngày và gửi yêu cầu nghỉ đúng theo luồng phê duyệt.
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
                onClick={() =>
                  setBaseDate((current) => {
                    const next = new Date(current);
                    next.setDate(current.getDate() - 7);
                    return next;
                  })
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-700 min-w-[130px] text-center">
                {formatDateRange(startDate, endDate)}
              </span>
              <button
                type="button"
                className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                onClick={() =>
                  setBaseDate((current) => {
                    const next = new Date(current);
                    next.setDate(current.getDate() + 7);
                    return next;
                  })
                }
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
              Tuần này
            </button>
          </div>

          <div>
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
            { label: 'Ngày có lịch', value: weekSummary.totalSchedules, color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { label: 'Slot khả dụng', value: weekSummary.available, color: 'bg-green-50 text-green-600 border-green-100' },
            { label: 'Slot đã đặt', value: weekSummary.booked, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
            { label: 'Chờ duyệt', value: weekSummary.pending, color: 'bg-amber-50 text-amber-600 border-amber-100' },
            { label: 'Nghỉ đã duyệt', value: weekSummary.approvedOff, color: 'bg-red-50 text-red-600 border-red-100' },
          ].map((pill, idx) => (
            <span key={idx} className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg border ${pill.color}`}>
              {pill.label}: {pill.value}
            </span>
          ))}
        </div>
      </div>

      {/* Week calendar view */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 mb-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Lịch tuần</h3>

        {schedulesQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch làm việc..." />
        ) : schedulesQuery.error ? (
          <StateBlock
            variant="error"
            title="Không thể tải lịch làm việc"
            description={schedulesQuery.error.message}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDates.map((date) => {
              const isoDate = formatIsoDate(date);
              const schedule = schedules.find((item) => item.workingDate === isoDate);
              const isToday = isoDate === todayIso;
              const isSelected = isoDate === selectedDate;

              return (
                <div
                  key={isoDate}
                  onClick={() => setSelectedDate(isoDate)}
                  className={`p-3 rounded-lg border cursor-pointer flex flex-col gap-2 transition-all ${isSelected ? 'border-[#49BCE2] bg-[#EBF7FD]/20 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-gray-700">{formatDayLabel(date)}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{isToday ? 'Hôm nay' : 'Lịch tuần'}</div>
                    </div>
                    {schedule ? (
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded border ${getStatusConfig(schedule.status)}`}>
                        {schedule.status === 'WORKING' ? 'LÀM' : schedule.status}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded border bg-gray-50 text-gray-400 border-gray-150">OFF</span>
                    )}
                  </div>

                  {schedule ? (
                    <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 border-t border-gray-100 pt-1.5 mt-1">
                      <div>Tổng: <span className="font-semibold text-gray-700">{schedule.totalSlots}</span></div>
                      <div>Trống: <span className="font-semibold text-green-600">{schedule.availableSlots}</span></div>
                      <div>Đã đặt: <span className="font-semibold text-blue-600">{schedule.bookedSlots}</span></div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-1.5 mt-1">Không làm việc</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail list and exceptions request logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Slots in detail */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Chi tiết ngày {selectedDateLabel}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedSchedule
                  ? `Trạng thái: ${selectedSchedule.status}`
                  : "Chưa có lịch trực trong ngày này."}
              </p>
            </div>
            {selectedSchedule && (
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusConfig(selectedSchedule.status)}`}>
                {selectedSchedule.status}
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
              <p className="text-xs text-gray-400">Không có khung giờ làm việc nào.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Morning */}
              <div>
                <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Ca sáng</h4>
                {slotsByShift.morning.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {slotsByShift.morning.map((slot) => (
                      <span
                        key={slot.id}
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded border ${
                          slot.status === 'BOOKED' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                          slot.status === 'LOCKED' ? 'bg-gray-100 border-gray-250 text-gray-500' :
                          'bg-green-50 border-green-200 text-green-600'
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
                <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Ca chiều</h4>
                {slotsByShift.afternoon.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {slotsByShift.afternoon.map((slot) => (
                      <span
                        key={slot.id}
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded border ${
                          slot.status === 'BOOKED' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                          slot.status === 'LOCKED' ? 'bg-gray-100 border-gray-250 text-gray-500' :
                          'bg-green-50 border-green-200 text-green-600'
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
            <h3 className="text-sm font-bold text-gray-800">Yêu cầu nghỉ gần đây</h3>
            <p className="text-xs text-gray-400 mt-0.5">Theo dõi lịch sử các yêu cầu xin nghỉ làm việc.</p>
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
              <p className="text-xs text-gray-400">Bác sĩ chưa gửi yêu cầu nghỉ nào.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {requests.map((request) => (
                <div key={request.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-gray-800">
                        {request.date ? request.date.split("-").reverse().join("/") : "--"}
                      </strong>
                      <div className="text-gray-500 mt-0.5">{formatShiftLabel(request)}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getStatusConfig(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="text-gray-600 border-t border-gray-100 pt-1.5 mt-0.5">
                    <strong>Lý do:</strong> {request.reason}
                    {request.rejectionReason && (
                      <p className="text-red-500 font-medium mt-1">Phản hồi admin: {request.rejectionReason}</p>
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
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setIsLeaveModalOpen(false)}>
          <div className="bg-white rounded-lg p-5 md:p-6 max-w-[480px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">Yêu cầu nghỉ</h3>
                <p className="text-xs text-gray-400 mt-0.5">Gửi yêu cầu nghỉ theo ngày hoặc theo ca.</p>
              </div>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
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
