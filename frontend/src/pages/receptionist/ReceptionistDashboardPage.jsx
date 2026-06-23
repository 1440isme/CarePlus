import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Stethoscope } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useAppointments, useUpdateAppointmentStatus } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

function StatusBadge({ status }) {
  const cfg = {
    CONFIRMED: { label: 'Đã xác nhận', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
    CHECKED_IN: { bg: '#F0FDF4', text: '#16A34A', label: 'Đã check-in', dot: '#22C55E' },
    COMPLETED: { bg: '#F0FDF4', text: '#15803D', label: 'Hoàn thành', dot: '#16A34A' },
    NO_SHOW: { bg: '#FEF2F2', text: '#EF4444', label: 'Vắng mặt', dot: '#EF4444' },
    CANCELLED: { bg: '#F5F5F5', text: '#888', label: 'Đã hủy', dot: '#aaa' },
  };
  const c = cfg[status] || { label: status, bg: '#F5F5F5', text: '#888', dot: '#aaa' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

export default function ReceptionistDashboardPage() {
  const { user } = useAuth();
  const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);

  const formattedDateHeading = new Date().toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const appointmentsQuery = useAppointments({ date: todayStr, limit: 100 });
  const updateStatusMutation = useUpdateAppointmentStatus();

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const todayAppointments = appointmentsQuery.data?.data || [];

  const total = todayAppointments.length;
  const checkedIn = todayAppointments.filter((a) => a.status === 'CHECKED_IN').length;
  const waiting = todayAppointments.filter((a) => a.status === 'CONFIRMED').length;
  const completed = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const noShow = todayAppointments.filter((a) => a.status === 'NO_SHOW').length;

  const handleUpdateStatus = async (id, newStatus, reason = '') => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        payload: { status: newStatus, reason, note: 'Cập nhật từ Lễ tân' },
      });
      setIsCancelling(false);
      setCancelReason('');
    } catch (error) {
      alert(`Lỗi cập nhật trạng thái: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const selectedAppointment = todayAppointments.find((a) => a.id === selectedAppointmentId);

  const kpiCards = [
    { label: 'Lịch hẹn hôm nay', value: total, color: '#49BCE2' },
    { label: 'Đã check-in', value: checkedIn, color: '#22C55E' },
    { label: 'Chờ khám', value: waiting, color: '#F59E0B' },
    { label: 'Đã hoàn thành', value: completed, color: '#6366F1' },
    { label: 'Vắng mặt', value: noShow, color: '#EF4444' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ngày {formattedDateHeading} — Quầy lễ tân
        </p>
      </div>

      {/* ── KPI Grid ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-xl shadow-xs p-4 flex flex-col gap-2"
          >
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <strong className="text-3xl font-bold" style={{ color }}>
              {value}
            </strong>
          </div>
        ))}
      </section>

      {/* ── Today's Appointments Table ── */}
      <section className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Lịch hẹn hôm nay</h3>
          {appointmentsQuery.isFetching && (
            <span className="text-xs text-gray-400 animate-pulse">Đang đồng bộ...</span>
          )}
        </div>

        {appointmentsQuery.isLoading ? (
          <div className="p-6">
            <LoadingBlock label="Đang tải lịch hẹn hôm nay..." />
          </div>
        ) : appointmentsQuery.error ? (
          <div className="p-6">
            <StateBlock
              variant="error"
              title="Không thể tải danh sách lịch hẹn"
              description={appointmentsQuery.error.message}
            />
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">Chưa có lịch khám nào trong ngày hôm nay.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Mã lịch
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Giờ
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Bệnh nhân
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Bác sĩ
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayAppointments.map((appointment) => {
                  const patientName = appointment.patientName || 'Bệnh nhân';
                  const doctorName =
                    appointment.doctor?.name || appointment.doctorName || 'Bác sĩ';
                  const time = appointment.timeSlot?.startTime
                    ? appointment.timeSlot.startTime.slice(0, 5)
                    : '08:00';

                  return (
                    <tr
                      key={appointment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <code className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {appointment.code}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{time}</td>
                      <td className="px-5 py-3.5 text-gray-700">{patientName}</td>
                      <td className="px-5 py-3.5 text-gray-700">{doctorName}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#49BCE2] hover:text-[#3ca4c5] hover:underline transition-colors"
                          onClick={() => {
                            setSelectedAppointmentId(appointment.id);
                            setIsCancelling(false);
                            setCancelReason('');
                          }}
                        >
                          Chi tiết →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Quick Action Links ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/receptionist/appointments/new"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-xs px-4 py-4 hover:border-[#49BCE2] hover:shadow-md transition-all group"
        >
          <span className="w-9 h-9 rounded-lg bg-[#EFF9FD] flex items-center justify-center group-hover:bg-[#49BCE2] transition-colors">
            <Plus className="w-4 h-4 text-[#49BCE2] group-hover:text-white" />
          </span>
          <span className="text-sm font-semibold text-gray-700">Đặt lịch mới</span>
        </Link>
        <Link
          to="/receptionist/appointments"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-xs px-4 py-4 hover:border-[#49BCE2] hover:shadow-md transition-all group"
        >
          <span className="w-9 h-9 rounded-lg bg-[#EFF9FD] flex items-center justify-center group-hover:bg-[#49BCE2] transition-colors">
            <Search className="w-4 h-4 text-[#49BCE2] group-hover:text-white" />
          </span>
          <span className="text-sm font-semibold text-gray-700">Tra cứu lịch hẹn</span>
        </Link>
        <Link
          to="/receptionist/doctors"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-xs px-4 py-4 hover:border-[#49BCE2] hover:shadow-md transition-all group"
        >
          <span className="w-9 h-9 rounded-lg bg-[#EFF9FD] flex items-center justify-center group-hover:bg-[#49BCE2] transition-colors">
            <Stethoscope className="w-4 h-4 text-[#49BCE2] group-hover:text-white" />
          </span>
          <span className="text-sm font-semibold text-gray-700">Danh sách bác sĩ</span>
        </Link>
      </section>

      {/* ── Appointment Detail Drawer ── */}
      {selectedAppointmentId && selectedAppointment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 50,
            display: 'flex',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAppointmentId(null);
          }}
        >
          <div
            style={{
              marginLeft: 'auto',
              width: '100%',
              maxWidth: 460,
              background: '#fff',
              height: '100%',
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-gray-900">Chi tiết cuộc hẹn</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mã: <span className="font-mono font-semibold">{selectedAppointment.code}</span>
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg"
                onClick={() => setSelectedAppointmentId(null)}
              >
                ×
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-5">
              {/* Status Row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Trạng thái</span>
                <StatusBadge status={selectedAppointment.status} />
              </div>

              {/* THÔNG TIN BÁC SĨ */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Thông tin Bác sĩ
                </h4>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Bác sĩ</span>
                    <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">
                      {selectedAppointment.doctor?.name || selectedAppointment.doctorName}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Chuyên khoa</span>
                    <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">
                      {selectedAppointment.specialty?.name || 'Đang cập nhật'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Giá khám</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {(selectedAppointment.consultationFee || 0).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* THÔNG TIN LỊCH KHÁM */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Thông tin Lịch khám
                </h4>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Ngày khám</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedAppointment.appointmentDate
                        ? selectedAppointment.appointmentDate.split('-').reverse().join('/')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Giờ khám</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedAppointment.timeSlot?.startTime?.slice(0, 5) || '08:00'} -{' '}
                      {selectedAppointment.timeSlot?.endTime?.slice(0, 5) || '08:30'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Mã lịch</span>
                    <span className="text-sm font-mono font-semibold text-gray-800">
                      {selectedAppointment.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* THÔNG TIN BỆNH NHÂN */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Thông tin Bệnh nhân
                </h4>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Họ tên</span>
                    <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">
                      {selectedAppointment.patientName}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Số điện thoại</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedAppointment.patientProfile?.phone ||
                        selectedAppointment.patient?.phone ||
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%] break-all">
                      {selectedAppointment.patientProfile?.email ||
                        selectedAppointment.patient?.email ||
                        selectedAppointment.patientEmail ||
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Giới tính</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedAppointment.patientProfile?.gender === 'MALE'
                        ? 'Nam'
                        : selectedAppointment.patientProfile?.gender === 'FEMALE'
                        ? 'Nữ'
                        : 'Khác'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start px-4 py-3">
                    <span className="text-sm text-gray-500">Ngày sinh</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedAppointment.patientProfile?.birthday
                        ? new Date(selectedAppointment.patientProfile.birthday).toLocaleDateString(
                            'vi-VN'
                          )
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TRIỆU CHỨNG */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Triệu chứng &amp; Lý do khám
                </h4>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedAppointment.reason || 'Không có triệu chứng ghi nhận.'}
                  </p>
                </div>
              </div>

              {/* Cancellation reason if cancelled */}
              {selectedAppointment.status === 'CANCELLED' &&
                selectedAppointment.cancellationReason && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Lý do hủy lịch
                    </h4>
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed">
                      {selectedAppointment.cancellationReason}
                    </div>
                  </div>
                )}
            </div>

            {/* Drawer Footer — Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 space-y-3">
              {updateStatusMutation.isPending ? (
                <LoadingBlock label="Đang cập nhật trạng thái..." />
              ) : (
                <>
                  {/* CONFIRMED actions */}
                  {selectedAppointment.status === 'CONFIRMED' && !isCancelling && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className="w-full bg-[#49BCE2] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#3ca4c5] transition"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'CHECKED_IN')}
                      >
                        ✓ Check-in
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg py-2.5 text-sm font-semibold hover:bg-amber-100 transition"
                          onClick={() => handleUpdateStatus(selectedAppointment.id, 'NO_SHOW')}
                        >
                          Vắng mặt
                        </button>
                        <button
                          type="button"
                          className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-100 transition"
                          onClick={() => setIsCancelling(true)}
                        >
                          Hủy lịch
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CHECKED_IN actions */}
                  {selectedAppointment.status === 'CHECKED_IN' && !isCancelling && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 bg-[#49BCE2] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#3ca4c5] transition"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                      >
                        Hoàn thành khám
                      </button>
                      <button
                        type="button"
                        className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-100 transition"
                        onClick={() => setIsCancelling(true)}
                      >
                        Hủy lịch
                      </button>
                    </div>
                  )}

                  {/* Cancel reason form */}
                  {isCancelling && (
                    <div className="space-y-3">
                      <label
                        htmlFor="cancelReasonInput"
                        className="block text-sm font-semibold text-gray-700"
                      >
                        Lý do hủy lịch <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="cancelReasonInput"
                        placeholder="Vui lòng nhập lý do hủy lịch..."
                        rows={3}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!cancelReason.trim()}
                          onClick={() =>
                            handleUpdateStatus(selectedAppointment.id, 'CANCELLED', cancelReason)
                          }
                        >
                          Xác nhận hủy
                        </button>
                        <button
                          type="button"
                          className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-200 transition"
                          onClick={() => {
                            setIsCancelling(false);
                            setCancelReason('');
                          }}
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Terminal states */}
                  {(selectedAppointment.status === 'COMPLETED' ||
                    selectedAppointment.status === 'CANCELLED' ||
                    selectedAppointment.status === 'NO_SHOW') && (
                    <p className="text-center text-xs text-gray-400 py-1">
                      Lịch hẹn này đã hoàn tất chu kỳ trạng thái.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
