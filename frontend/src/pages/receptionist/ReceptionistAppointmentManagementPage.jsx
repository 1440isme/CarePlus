import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppointments, useUpdateAppointmentStatus } from '../../features/appointment/hooks/useAppointments.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import socketService from '../../shared/services/socket.service.js';

function StatusBadge({ status }) {
  const cfg = {
    CONFIRMED: { label: 'Đã xác nhận', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
    CHECKED_IN: { label: 'Đã check-in', bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
    COMPLETED: { label: 'Hoàn thành', bg: '#F0FDF4', text: '#15803D', dot: '#16A34A' },
    NO_SHOW: { label: 'Vắng mặt', bg: '#FEF2F2', text: '#EF4444', dot: '#EF4444' },
    CANCELLED: { label: 'Đã hủy', bg: '#F5F5F5', text: '#888', dot: '#aaa' },
  };
  const c = cfg[status] || { label: status, bg: '#F5F5F5', text: '#888', dot: '#aaa' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

export default function ReceptionistAppointmentManagementPage() {
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateMode, setDateMode] = useState('today');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected appointment for detail Drawer
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch Filter Dropdown Data
  const specialtiesQuery = useSpecialties();
  const doctorsQuery = useDoctorList(
    selectedSpecialtyId ? { specialtyId: selectedSpecialtyId, limit: 100 } : { limit: 100 }
  );

  // Fetch Appointments Data
  const appointmentsParams = {
    page,
    limit,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(selectedSpecialtyId ? { specialtyId: selectedSpecialtyId } : {}),
    ...(selectedDoctorId ? { doctorId: selectedDoctorId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socketService.socket) return;

    const handleReload = () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    };

    socketService.socket.on('appointment:created', handleReload);
    socketService.socket.on('appointment:status-changed', handleReload);

    return () => {
      socketService.socket.off('appointment:created', handleReload);
      socketService.socket.off('appointment:status-changed', handleReload);
    };
  }, [queryClient]);

  const appointmentsQuery = useAppointments(appointmentsParams);
  const updateStatusMutation = useUpdateAppointmentStatus();

  const appointmentsList = appointmentsQuery.data?.data || [];
  const paginationMeta = appointmentsQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };

  const handleUpdateStatus = async (id, newStatus, reason = '') => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        payload: { status: newStatus, reason, note: 'Cập nhật từ Lễ tân Portal' }
      });
      setIsCancelling(false);
      setCancelReason('');
    } catch (error) {
      alert(`Lỗi cập nhật trạng thái: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setPage(1);
    if (filterType === 'specialty') {
      setSelectedSpecialtyId(value);
      setSelectedDoctorId('');
    } else if (filterType === 'doctor') {
      setSelectedDoctorId(value);
    } else if (filterType === 'date') {
      setSelectedDate(value);
      setDateMode('custom');
      setStartDate('');
      setEndDate('');
    } else if (filterType === 'status') {
      setSelectedStatus(value);
    } else if (filterType === 'search') {
      setSearch(value);
      if (value.trim()) {
        setDateMode('all');
        setSelectedDate('');
        setStartDate('');
        setEndDate('');
      }
    }
  };

  const handleDateModeChange = (mode) => {
    setPage(1);
    setDateMode(mode);
    if (mode === 'today') {
      setSelectedDate(todayStr);
      setStartDate('');
      setEndDate('');
    } else if (mode === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('sv').slice(0, 10);
      setSelectedDate(tomorrowStr);
      setStartDate('');
      setEndDate('');
    } else if (mode === 'week') {
      const d = new Date();
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mondayStr = monday.toLocaleDateString('sv').slice(0, 10);
      const sundayStr = sunday.toLocaleDateString('sv').slice(0, 10);
      setSelectedDate('');
      setStartDate(mondayStr);
      setEndDate(sundayStr);
    } else if (mode === 'range') {
      setSelectedDate('');
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === 'all') {
      setSelectedDate('');
      setStartDate('');
      setEndDate('');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedSpecialtyId('');
    setSelectedDoctorId('');
    setSelectedDate(todayStr);
    setStartDate('');
    setEndDate('');
    setDateMode('today');
    setSelectedStatus('');
    setPage(1);
  };

  const selectedAppointment = appointmentsList.find(a => a.id === selectedAppointmentId);
  const specialtiesList = specialtiesQuery.data?.data || [];
  const doctorsList = doctorsQuery.data?.data || [];

  const selectClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white text-gray-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
        <p className="text-sm text-gray-500 mt-1">Tra cứu và cập nhật trạng thái lịch hẹn khám bệnh tại quầy</p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm bệnh nhân (Tên, SĐT, Email hoặc Mã lịch)..."
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
          />
        </div>

        {/* Date + Dropdowns row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date mode toggle */}
          <div className="inline-flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'today', label: 'Hôm nay' },
              { key: 'tomorrow', label: 'Ngày mai' },
              { key: 'week', label: 'Tuần này' },
              { key: 'range', label: 'Khoảng ngày' },
            ].map((btn, i) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => handleDateModeChange(btn.key)}
                className={`px-3 py-2 text-xs font-semibold border-r border-gray-200 last:border-r-0 transition-colors ${
                  dateMode === btn.key
                    ? 'bg-[#49BCE2] text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Date picker(s) */}
          {dateMode !== 'range' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className={selectClass}
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setSelectedDate(''); setPage(1); }}
                className={selectClass}
              />
              <span className="text-sm text-gray-400">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setSelectedDate(''); setPage(1); }}
                className={selectClass}
              />
            </div>
          )}

          {/* Specialty */}
          <select
            value={selectedSpecialtyId}
            onChange={(e) => handleFilterChange('specialty', e.target.value)}
            className={selectClass}
          >
            <option value="">-- Chuyên khoa --</option>
            {specialtiesList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Doctor */}
          <select
            value={selectedDoctorId}
            onChange={(e) => handleFilterChange('doctor', e.target.value)}
            className={selectClass}
          >
            <option value="">-- Bác sĩ --</option>
            {doctorsList.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={selectClass}
          >
            <option value="">-- Trạng thái --</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CHECKED_IN">Đã check-in</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="NO_SHOW">Vắng mặt</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {appointmentsQuery.isLoading ? (
          <div className="p-8">
            <LoadingBlock label="Đang tải danh sách lịch hẹn..." />
          </div>
        ) : appointmentsQuery.error ? (
          <div className="p-8">
            <StateBlock
              variant="error"
              title="Không thể tải lịch hẹn"
              description={appointmentsQuery.error.message}
            />
          </div>
        ) : appointmentsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Không tìm thấy lịch hẹn nào khớp với bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Mã lịch', 'Ngày khám', 'Giờ', 'Bệnh nhân', 'Bác sĩ', 'Chuyên khoa', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointmentsList.map((appointment) => {
                    const patientName = appointment.patientName || 'Bệnh nhân';
                    const doctorName = appointment.doctor?.name || appointment.doctorName || 'Bác sĩ';
                    const specialtyName = appointment.specialty?.name || 'N/A';
                    const time = appointment.startTime
                      ? appointment.startTime.slice(0, 5)
                      : '08:00';
                    const formattedDate = appointment.appointmentDate
                      ? appointment.appointmentDate.split('-').reverse().join('/')
                      : 'N/A';

                    return (
                      <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <code className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {appointment.code}
                          </code>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">{formattedDate}</td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900">{time}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-gray-900">{patientName}</div>
                          {appointment.patientDob && (
                            <div className="text-xs text-gray-400 mt-0.5">NS: {appointment.patientDob}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">{doctorName}</td>
                        <td className="px-4 py-3.5 text-gray-500">{specialtyName}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 justify-end">
                            {appointment.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appointment.id, 'CHECKED_IN')}
                                className="px-2.5 py-1 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white text-xs rounded-lg font-semibold transition-colors"
                              >
                                Check-in
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppointmentId(appointment.id);
                                setIsCancelling(false);
                                setCancelReason('');
                              }}
                              className="text-[#49BCE2] hover:text-[#3ca4c5] text-xs font-semibold transition-colors"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginationMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Trang <strong>{paginationMeta.page}</strong> / <strong>{paginationMeta.totalPages}</strong>
                  {' '}(Tổng <strong>{paginationMeta.total}</strong> lịch khám)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page === paginationMeta.totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, paginationMeta.totalPages))}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Sau
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Appointment Detail Drawer */}
      {selectedAppointmentId && selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAppointmentId(null); }}
        >
          <div
            className="ml-auto h-full overflow-y-auto flex flex-col"
            style={{ width: '100%', maxWidth: 460, background: '#fff' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-base">Chi tiết cuộc hẹn</h2>
              <button
                type="button"
                onClick={() => setSelectedAppointmentId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-semibold text-gray-700">Trạng thái</span>
                <StatusBadge status={selectedAppointment.status} />
              </div>

              {/* Doctor Info */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin Bác sĩ</h4>
                <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {[
                    { label: 'Bác sĩ', value: selectedAppointment.doctor?.name || selectedAppointment.doctorName },
                    { label: 'Chuyên khoa', value: selectedAppointment.specialty?.name || 'Đang cập nhật' },
                    { label: 'Giá khám', value: `${(selectedAppointment.consultationFee || 0).toLocaleString('vi-VN')} VNĐ` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className="text-sm font-medium text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Info */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin Lịch khám</h4>
                <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {[
                    { label: 'Ngày khám', value: selectedAppointment.appointmentDate ? selectedAppointment.appointmentDate.split('-').reverse().join('/') : 'N/A' },
                    { label: 'Giờ khám', value: `${selectedAppointment.startTime?.slice(0, 5) || '08:00'} - ${selectedAppointment.endTime?.slice(0, 5) || '08:30'}` },
                    { label: 'Mã lịch', value: selectedAppointment.code, mono: true },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className={`text-sm font-medium text-gray-900 ${row.mono ? 'font-mono text-xs bg-gray-100 px-2 py-0.5 rounded' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin Bệnh nhân</h4>
                <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {[
                    { label: 'Họ tên', value: selectedAppointment.patientName },
                    { label: 'Số điện thoại', value: selectedAppointment.patientProfile?.phone || selectedAppointment.patient?.phone || 'N/A' },
                    { label: 'Email', value: selectedAppointment.patientProfile?.email || selectedAppointment.patient?.email || selectedAppointment.patientEmail || 'N/A' },
                    { label: 'Giới tính', value: selectedAppointment.patientProfile?.gender === 'MALE' ? 'Nam' : selectedAppointment.patientProfile?.gender === 'FEMALE' ? 'Nữ' : 'Khác' },
                    { label: 'Ngày sinh', value: selectedAppointment.patientProfile?.birthday ? new Date(selectedAppointment.patientProfile.birthday).toLocaleDateString('vi-VN') : 'N/A' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className="text-sm font-medium text-gray-900 text-right max-w-[240px] break-words">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Triệu chứng & Lý do khám</h4>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                  {selectedAppointment.reason || 'Không có triệu chứng ghi nhận.'}
                </div>
              </div>

              {/* Cancellation reason if cancelled */}
              {selectedAppointment.status === 'CANCELLED' && selectedAppointment.cancellationReason && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lý do hủy lịch</h4>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                    {selectedAppointment.cancellationReason}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer - Actions */}
            <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white space-y-2">
              {updateStatusMutation.isPending ? (
                <div className="py-2">
                  <LoadingBlock label="Đang cập nhật trạng thái..." />
                </div>
              ) : (
                <>
                  {selectedAppointment.status === 'CONFIRMED' && !isCancelling && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'CHECKED_IN')}
                        className="flex-1 py-2.5 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        ✓ Check-in
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'NO_SHOW')}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Vắng mặt
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCancelling(true)}
                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        Hủy lịch
                      </button>
                    </div>
                  )}

                  {selectedAppointment.status === 'CHECKED_IN' && !isCancelling && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        ✓ Hoàn thành khám
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCancelling(true)}
                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        Hủy lịch
                      </button>
                    </div>
                  )}

                  {isCancelling && (
                    <div className="space-y-2.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Lý do hủy lịch <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Vui lòng nhập lý do hủy lịch..."
                        rows={3}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!cancelReason.trim()}
                          onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED', cancelReason)}
                          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Xác nhận hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsCancelling(false); setCancelReason(''); }}
                          className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  )}

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
