import { Link } from 'react-router-dom';
import { useDoctorDashboard } from '../../features/doctor/index.js';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { APP_ROUTES } from '../../shared/constants/routes.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

function formatDisplayDate(value) {
  if (!value) return 'Hôm nay';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getInitials(name) {
  if (!name) return 'BS';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BS';
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDoctorDashboard();
  const dashboard = data?.data;
  const weekSchedules = dashboard?.weeklySchedule || [];
  const totalAvailableSlots = weekSchedules.reduce((sum, item) => sum + (item.availableSlots || 0), 0);
  const totalBookedSlots = weekSchedules.reduce((sum, item) => sum + (item.bookedSlots || 0), 0);
  const totalLockedSlots = weekSchedules.reduce((sum, item) => sum + (item.lockedSlots || 0), 0);

  if (isLoading) {
    return <LoadingBlock label="Đang tải dashboard bác sĩ..." />;
  }

  if (error) {
    return <StateBlock variant="error" title="Không thể tải dashboard" description={error.message} />;
  }

  const kpis = [
    { label: 'Lịch hẹn hôm nay', value: dashboard?.kpis?.totalAppointments ?? 0, icon: <Calendar className="w-[18px] h-[18px] text-[#49BCE2]" />, bg: 'bg-[#EBF7FD]' },
    { label: 'Đã check-in', value: dashboard?.kpis?.checkedInAppointments ?? 0, icon: <Clock className="w-[18px] h-[18px] text-[#3B82F6]" />, bg: 'bg-[#EFF6FF]' },
    { label: 'Đã hoàn thành', value: dashboard?.kpis?.completedAppointments ?? 0, icon: <CheckCircle className="w-[18px] h-[18px] text-[#16A34A]" />, bg: 'bg-[#F0FDF4]' },
    { label: 'No-show / Vắng mặt', value: dashboard?.kpis?.noShowAppointments ?? 0, icon: <XCircle className="w-[18px] h-[18px] text-[#EF4444]" />, bg: 'bg-[#FEF2F2]' },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-[#EBF7FD] text-[#49BCE2] border-[#49BCE2]/20';
      case 'CHECKED_IN':
        return 'bg-[#F3E8FF] text-[#7C3AED] border-[#7C3AED]/20';
      case 'COMPLETED':
        return 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/20';
      case 'NO_SHOW':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="font-sans">
      {/* Welcome Banner */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#49BCE2] text-white font-bold rounded-full flex items-center justify-center shrink-0 text-lg">
            {getInitials(user?.name)}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Xin chào, {user?.name || 'Bác sĩ CarePlus'}! 👨‍⚕️</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                {formatDisplayDate(dashboard?.today)}
              </span>
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#49BCE2]">
                Doctor Portal
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link className="px-3.5 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors" to={`${APP_ROUTES.doctorRoot}/lich-lam-viec`}>
            Lịch làm việc
          </Link>
          <Link className="px-3.5 py-2 bg-[#49BCE2] hover:bg-[#3ca4c7] text-white rounded-lg text-xs font-semibold transition-colors" to={`${APP_ROUTES.doctorRoot}/lich-hen`}>
            Xem lịch hẹn
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        {kpis.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-2.5">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Split panel: Timeline and Week summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Left Column: Timeline */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Timeline hôm nay</h3>
              <p className="text-xs text-gray-400 mt-0.5">Danh sách lịch hẹn trong ngày.</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {(dashboard?.timeline || []).length} cuộc hẹn
            </span>
          </div>

          {(dashboard?.timeline || []).length > 0 ? (
            <div className="flex flex-col gap-2">
              {dashboard.timeline.map((item) => (
                <div key={item.appointmentId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-150 hover:bg-[#EBF7FD] transition-colors cursor-pointer">
                  <div className="w-16 shrink-0">
                    <div className="text-sm font-bold text-gray-700">{item.startTime}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{item.endTime}</div>
                  </div>
                  <div className="w-0.5 h-8 bg-blue-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{item.patientName}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">Mã: {item.code}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusConfig(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Không có lịch hẹn nào hôm nay.</p>
            </div>
          )}
        </div>

        {/* Right Column: Week Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-800">Tổng quan lịch tuần này</h3>
            <p className="text-xs text-gray-400 mt-0.5">Phân bổ slot làm việc trong tuần.</p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: 'Slot khả dụng', value: totalAvailableSlots },
              { label: 'Slot đã đặt', value: totalBookedSlots },
              { label: 'Slot bị khóa', value: totalLockedSlots },
              { label: 'Lịch hôm nay', value: dashboard?.todaySchedule?.status || 'Chưa mở lịch', isText: true },
            ].map((row, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-500 font-medium">{row.label}</span>
                <span className={`font-bold ${row.isText ? 'text-[#49BCE2]' : 'text-gray-800'}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Week schedules list */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Lịch làm việc tuần này</h3>
            <p className="text-xs text-gray-400 mt-0.5">Các ngày đã mở lịch và số lượng khung giờ hiện có.</p>
          </div>
          <Link className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors" to={`${APP_ROUTES.doctorRoot}/lich-lam-viec`}>
            Lịch làm việc chi tiết
          </Link>
        </div>

        {weekSchedules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {weekSchedules.map((item) => (
              <div key={item.scheduleId} className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-gray-700">{formatDisplayDate(item.workingDate)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{item.doctor?.specialtyName || 'Chuyên khoa'}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getStatusConfig(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 mt-1 border-t border-gray-150 pt-2">
                  <div>Tổng: <span className="font-semibold text-gray-700">{item.totalSlots}</span></div>
                  <div>Trống: <span className="font-semibold text-green-600">{item.availableSlots}</span></div>
                  <div>Đã đặt: <span className="font-semibold text-blue-600">{item.bookedSlots}</span></div>
                  <div>Khóa: <span className="font-semibold text-red-500">{item.lockedSlots}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">Chưa có lịch làm việc trong tuần này.</p>
          </div>
        )}
      </div>
    </div>
  );
}
