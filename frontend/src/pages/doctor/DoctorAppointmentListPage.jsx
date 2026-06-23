import { useMemo, useState } from 'react';
import { useDoctorAppointments, useUpdateDoctorAppointmentStatus } from '../../features/appointment/hooks/useAppointments.js';
import { useDoctorProfile } from '../../features/doctor/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { Search, Calendar, Clock, X, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CHECKED_IN', label: 'Check-in' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'NO_SHOW', label: 'No-show' },
];

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('vi-VN');
}

function formatRelationship(value) {
  const map = {
    SELF: 'Bản thân',
    CHA: 'Cha',
    ME: 'Mẹ',
    CON: 'Con',
    VO: 'Vợ',
    CHONG: 'Chồng',
    ANH: 'Anh',
    CHI: 'Chị',
    EM: 'Em',
    ONG: 'Ông',
    BA: 'Bà',
    KHAC: 'Khác',
  };
  return map[value] || value || 'Bệnh nhân';
}

export default function DoctorAppointmentListPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const profileQuery = useDoctorProfile();
  const doctor = profileQuery.data?.data;

  const appointmentParams = useMemo(() => ({
    page,
    limit: 10,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
  }), [page, search, selectedStatus, selectedDate]);

  const appointmentsQuery = useDoctorAppointments(appointmentParams);
  const updateStatusMutation = useUpdateDoctorAppointmentStatus();

  const appointments = appointmentsQuery.data?.data || [];
  const meta = appointmentsQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        payload: { status },
      });
      // Close drawer if open
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(prev => ({ ...prev, status }));
      }
    } catch (error) {
      alert(`Lỗi cập nhật trạng thái: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedDate('');
    setPage(1);
  };

  if (profileQuery.isLoading) {
    return <LoadingBlock label="Đang tải hồ sơ bác sĩ..." />;
  }

  if (profileQuery.error) {
    return <StateBlock variant="error" title="Không thể tải hồ sơ bác sĩ" description={profileQuery.error.message} />;
  }

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

  const getStatusLabel = (status) => {
    const found = STATUS_OPTIONS.find(o => o.value === status);
    return found ? found.label : status;
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Lịch hẹn</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Theo dõi danh sách lịch hẹn của bác sĩ, tra cứu nhanh theo ngày và xem chi tiết từng cuộc hẹn.
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã lịch, bệnh nhân..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2]"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
          </div>

          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2]"
            value={selectedDate}
            onChange={(event) => {
              setPage(1);
              setSelectedDate(event.target.value);
            }}
          />

          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
            value={selectedStatus}
            onChange={(event) => {
              setPage(1);
              setSelectedStatus(event.target.value);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={resetFilters}
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value || 'all-pill'}
              type="button"
              className={`px-3.5 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${selectedStatus === option.value ? 'bg-[#EBF7FD] border-[#49BCE2] text-[#49BCE2]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              onClick={() => {
                setPage(1);
                setSelectedStatus(option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-5">
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Danh sách lịch hẹn</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Bác sĩ hiện tại: <strong className="text-gray-700">{doctor?.name}</strong> {doctor?.specialtyName ? `· ${doctor.specialtyName}` : ''}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
            {meta.total} lịch hẹn
          </span>
        </div>

        {appointmentsQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch hẹn..." />
        ) : appointmentsQuery.error ? (
          <StateBlock variant="error" title="Không thể tải lịch hẹn" description={appointmentsQuery.error.message} />
        ) : appointments.length === 0 ? (
          <StateBlock title="Chưa có lịch hẹn phù hợp" description="Hãy thay đổi bộ lọc hoặc quay lại sau khi có thêm dữ liệu từ hệ thống." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3.5">Mã lịch</th>
                    <th className="p-3.5">Bệnh nhân</th>
                    <th className="p-3.5">Ngày khám</th>
                    <th className="p-3.5">Khung giờ</th>
                    <th className="p-3.5">Lý do khám</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3.5">
                        <code className="font-mono text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-150">{appointment.code}</code>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-800">{appointment.patientName}</div>
                        <div className="text-xs text-gray-400">
                          {appointment.patientProfile?.relationship ? formatRelationship(appointment.patientProfile.relationship) : 'Bản thân'}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">{formatDate(appointment.appointmentDate)}</td>
                      <td className="p-3.5 whitespace-nowrap">{appointment.startTime} - {appointment.endTime}</td>
                      <td className="p-3.5 max-w-[200px] truncate text-gray-500">{appointment.reason || 'Không có lý do'}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusConfig(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            className="px-2.5 py-1 text-xs border border-[#49BCE2] text-[#49BCE2] rounded bg-white font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            Chi tiết
                          </button>
                          {appointment.status === 'CHECKED_IN' && (
                            <button
                              type="button"
                              className="px-2.5 py-1 text-xs bg-green-500 text-white rounded font-semibold hover:bg-green-600 transition-colors cursor-pointer"
                              onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                              disabled={updateStatusMutation.isPending}
                            >
                              Hoàn thành
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 ? (
              <div className="p-4 md:p-5 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Trang <strong>{meta.page}</strong> / <strong>{meta.totalPages}</strong>
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Trước
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    disabled={page === meta.totalPages}
                    onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                  >
                    Sau
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Appointment Detail drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAppointment(null)}>
          <div className="bg-white rounded-lg p-5 md:p-6 max-w-[440px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-base font-bold text-gray-800">Chi tiết lịch hẹn</h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              {[
                { label: 'Mã lịch', value: <code className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded border border-gray-150">{selectedAppointment.code}</code> },
                { label: 'Trạng thái', value: (
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusConfig(selectedAppointment.status)}`}>
                    {getStatusLabel(selectedAppointment.status)}
                  </span>
                )},
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-semibold text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Shift section */}
            <div className="bg-gray-50 rounded-lg p-3 mt-3 text-xs border border-gray-150 flex flex-col gap-2">
              <div className="font-bold text-gray-700">THÔNG TIN LỊCH KHÁM</div>
              {[
                { label: 'Ngày khám', value: formatDate(selectedAppointment.appointmentDate) },
                { label: 'Khung giờ', value: `${selectedAppointment.startTime} - ${selectedAppointment.endTime}` },
                { label: 'Chuyên khoa', value: selectedAppointment.specialty?.name || doctor?.specialtyName || '--' },
                { label: 'Giá tham khảo', value: `${(selectedAppointment.consultationFee || 0).toLocaleString('vi-VN')} VNĐ` }
              ].map(row => (
                <div key={row.label} className="flex justify-between border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Patient section */}
            <div className="bg-gray-50 rounded-lg p-3 mt-3 text-xs border border-gray-150 flex flex-col gap-2">
              <div className="font-bold text-gray-700">THÔNG TIN BỆNH NHÂN</div>
              {[
                { label: 'Người khám', value: selectedAppointment.patientName },
                { label: 'Số điện thoại', value: selectedAppointment.patientProfile?.phone || selectedAppointment.patient?.phone || '--' },
                { label: 'Email', value: selectedAppointment.patientProfile?.email || selectedAppointment.patient?.email || selectedAppointment.patientEmail || '--' },
                { label: 'Ngày sinh', value: selectedAppointment.patientProfile?.dateOfBirth || selectedAppointment.patient?.dateOfBirth || selectedAppointment.patientDob || '--' },
                { label: 'Quan hệ', value: formatRelationship(selectedAppointment.patientProfile?.relationship) }
              ].map(row => (
                <div key={row.label} className="flex justify-between border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>

            {selectedAppointment.reason && (
              <div className="mt-3.5 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-150">
                <div className="font-bold text-gray-700 mb-1">Triệu chứng & Lý do:</div>
                <div className="whitespace-pre-wrap">{selectedAppointment.reason}</div>
              </div>
            )}

            {selectedAppointment.note && (
              <div className="mt-3.5 p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                <div className="font-bold mb-1">Ghi chú:</div>
                <div>{selectedAppointment.note}</div>
              </div>
            )}

            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setSelectedAppointment(null)} className="flex-1 py-2.5 border border-gray-250 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-center text-gray-600 bg-white">
                Đóng
              </button>
              {selectedAppointment.status === 'CHECKED_IN' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Hoàn thành</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
