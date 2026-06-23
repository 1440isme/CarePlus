import { useMemo, useState } from "react";
import { useDoctorSchedules } from "../../schedule/hooks/useSchedules.js";
import LoadingBlock from "../../../shared/components/feedback/LoadingBlock.jsx";

const SHIFT_LABELS = {
  MORNING: "Ca sáng",
  AFTERNOON: "Ca chiều",
  ALL_DAY: "Cả ngày",
};

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
    if (schedule.status !== "WORKING") return;
    const shift = schedule.workingShift || schedule.shift;
    if (shift === "ALL_DAY") {
      shifts.add("MORNING");
      shifts.add("AFTERNOON");
      return;
    }
    shifts.add(shift);
  });
  return shifts;
}

function getShiftOptions(shifts) {
  const options = [];
  if (shifts.has("MORNING"))
    options.push({ value: "MORNING", label: SHIFT_LABELS.MORNING });
  if (shifts.has("AFTERNOON"))
    options.push({ value: "AFTERNOON", label: SHIFT_LABELS.AFTERNOON });
  if (shifts.has("MORNING") && shifts.has("AFTERNOON"))
    options.push({ value: "ALL_DAY", label: SHIFT_LABELS.ALL_DAY });
  return options;
}

function getAllShiftOptions() {
  return [
    { value: "MORNING", label: SHIFT_LABELS.MORNING },
    { value: "AFTERNOON", label: SHIFT_LABELS.AFTERNOON },
    { value: "ALL_DAY", label: SHIFT_LABELS.ALL_DAY },
  ];
}

function isShiftAvailable(shift, availableShifts) {
  if (shift === "ALL_DAY") {
    return availableShifts.has("MORNING") && availableShifts.has("AFTERNOON");
  }
  return availableShifts.has(shift);
}

export default function LeaveRequestForm({
  doctorId,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const monthRange = useMemo(() => getMonthRange(monthDate), [monthDate]);
  const schedulesQuery = useDoctorSchedules(doctorId, {
    startDate: monthRange.startDate,
    endDate: monthRange.endDate,
    limit: 100,
  });

  const schedulesByDate = useMemo(() => {
    const grouped = new Map();
    const schedules = Array.isArray(schedulesQuery.data?.data)
      ? schedulesQuery.data.data
      : [];
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
    setMonthDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
    setSelectedDate("");
    setSelectedShift("");
  };

  const handleDateSelect = (date) => {
    const isoDate = formatIsoDate(date);
    const schedules = schedulesByDate.get(isoDate) || [];
    const shifts = getWorkingShiftsForDate(schedules);
    if (shifts.size === 0) return;

    setSelectedDate(isoDate);
    setSelectedShift(getShiftOptions(shifts)[0]?.value || "");
    setFormError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedDate || !selectedShift) {
      setFormError("Vui lòng chọn ngày có lịch làm việc và ca nghỉ.");
      return;
    }
    if (reason.trim().length < 5) {
      setFormError("Vui lòng nhập lý do nghỉ ít nhất 5 ký tự.");
      return;
    }

    onSubmit({
      type: "SCHEDULE_EXCEPTION",
      date: selectedDate,
      exceptionType: selectedShift === "ALL_DAY" ? "ALL_DAY" : "SHIFT",
      shift: selectedShift === "ALL_DAY" ? undefined : selectedShift,
      reason: reason.trim(),
    });
  };

  return (
    <form className="doctor-leave-form" onSubmit={handleSubmit}>
      <div className="doctor-leave-form-grid">
        <div className="doctor-leave-calendar-pane">
          <div className="doctor-leave-calendar-toolbar">
            <button
              type="button"
              className="button-secondary"
              onClick={() => handleMonthChange(-1)}
            >
              Tháng trước
            </button>
            <strong>
              {monthDate.toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              className="button-secondary"
              onClick={() => handleMonthChange(1)}
            >
              Tháng sau
            </button>
          </div>

          {schedulesQuery.isLoading ? (
            <LoadingBlock label="Đang tải lịch tháng..." />
          ) : null}

          {!schedulesQuery.isLoading ? (
            <div className="doctor-leave-calendar">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                <span key={label} className="doctor-leave-weekday">
                  {label}
                </span>
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
                    className={`doctor-leave-day ${isCurrentMonth ? "" : "is-muted"} ${isAvailable ? "has-schedule" : ""} ${isSelected ? "is-selected" : ""}`}
                    disabled={!isAvailable}
                    onClick={() => handleDateSelect(date)}
                  >
                    <strong>{date.getDate()}</strong>
                    {isAvailable ? (
                      <small>
                        {getShiftOptions(shifts)
                          .filter((item) => item.value !== "ALL_DAY")
                          .map((item) => item.label.replace("Ca ", ""))
                          .join(", ")}
                      </small>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="doctor-leave-detail-pane">
          <div className="doctor-leave-selected-panel">
            <h4>Thông tin nghỉ</h4>
            <p
              style={{
                fontSize: "1.05rem",
                color: selectedDate ? "#0898B8" : "#9CA3AF",
                fontWeight: selectedDate ? "800" : "600",
              }}
            >
              {selectedDate
                ? selectedDate.split("-").reverse().join("/")
                : "Chưa chọn ngày"}
            </p>
            {!selectedDate ? (
              <small
                style={{
                  color: "#6B7280",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  padding: "6px 8px",
                  display: "inline-block",
                }}
              >
                Vui lòng chọn một ngày có lịch làm việc bên trái
              </small>
            ) : null}
          </div>

          {shiftOptions.length > 0 ? (
            <div className="doctor-profile-field">
              <label style={{ marginBottom: "10px" }}>
                Chọn ca nghỉ <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div className="doctor-leave-shift-options">
                {getAllShiftOptions().map((option) => {
                  const isAvailable = isShiftAvailable(
                    option.value,
                    selectedWorkingShifts,
                  );
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`${
                        selectedShift === option.value ? "is-active" : ""
                      } ${!isAvailable ? "is-disabled" : ""}`}
                      disabled={!isAvailable}
                      onClick={() => setSelectedShift(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : selectedDate ? (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "#FEE2E2",
                border: "1px solid #FECACA",
                color: "#991B1B",
                fontSize: "0.9rem",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Ngày được chọn không có ca làm việc khả dụng
            </div>
          ) : null}

          <div className="doctor-profile-field">
            <label htmlFor="reason">
              Lý do nghỉ <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 200))}
              placeholder="Nhập lý do xin nghỉ (tối thiểu 5 ký tự)..."
              rows="4"
              style={{
                minHeight: "100px",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                resize: "vertical",
              }}
            />
            <small
              className="doctor-profile-helper"
              style={{ marginTop: "4px" }}
            >
              {reason.length > 0
                ? `${reason.length} ký tự`
                : "Hãy giải thích chi tiết lý do xin nghỉ"}
            </small>
          </div>

          {formError ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#FEE2E2",
                border: "1px solid #FECACA",
                color: "#991B1B",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              {formError}
            </div>
          ) : null}
          {submitError ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#FEE2E2",
                border: "1px solid #FECACA",
                color: "#991B1B",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              {submitError}
            </div>
          ) : null}

          <div className="doctor-leave-actions">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                background: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#6B7280",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "background 0.2s ease",
                opacity: isSubmitting ? "0.5" : "1",
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedDate ||
                !selectedShift ||
                reason.trim().length < 5
              }
              style={{
                background:
                  isSubmitting ||
                  !selectedDate ||
                  !selectedShift ||
                  reason.trim().length < 5
                    ? "#CBD5E1"
                    : "var(--cyan)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#ffffff",
                cursor:
                  isSubmitting ||
                  !selectedDate ||
                  !selectedShift ||
                  reason.trim().length < 5
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.2s ease",
              }}
            >
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu nghỉ"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
