import { useState } from 'react';
import { useAppointments, useUpdateAppointmentStatus } from '../../features/appointment/hooks/useAppointments.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './receptionist.css';

export default function ReceptionistAppointmentManagementPage() {
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
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
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const appointmentsQuery = useAppointments(appointmentsParams);
  const updateStatusMutation = useUpdateAppointmentStatus();

  const appointmentsList = appointmentsQuery.data?.data || [];
  const paginationMeta = appointmentsQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', className: 'status-confirmed', dotClass: 'status-dot-confirmed' };
      case 'CHECKED_IN':
        return { label: 'Đã check-in', className: 'status-checked_in', dotClass: 'status-dot-checked_in' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', className: 'status-completed', dotClass: 'status-dot-completed' };
      case 'NO_SHOW':
        return { label: 'Không đến', className: 'status-no_show', dotClass: 'status-dot-no_show' };
      case 'CANCELLED':
        return { label: 'Đã hủy', className: 'status-cancelled', dotClass: 'status-dot-cancelled' };
      default:
        return { label: status, className: '', dotClass: '' };
    }
  };

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
    setPage(1); // Reset to page 1 on filter changes
    if (filterType === 'specialty') {
      setSelectedSpecialtyId(value);
      setSelectedDoctorId(''); // Reset doctor when specialty changes
    } else if (filterType === 'doctor') {
      setSelectedDoctorId(value);
    } else if (filterType === 'date') {
      setSelectedDate(value);
    } else if (filterType === 'status') {
      setSelectedStatus(value);
    } else if (filterType === 'search') {
      setSearch(value);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedSpecialtyId('');
    setSelectedDoctorId('');
    setSelectedDate('');
    setSelectedStatus('');
    setPage(1);
  };

  const selectedAppointment = appointmentsList.find(a => a.id === selectedAppointmentId);
  const specialtiesList = specialtiesQuery.data?.data || [];
  const doctorsList = doctorsQuery.data?.data || [];

  return (
    <div className="content-grid receptionist-page">
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '4px', fontWeight: 700 }}>Quản lý lịch hẹn</h2>
        <p className="helper-text">Tra cứu và cập nhật trạng thái lịch hẹn khám bệnh tại quầy</p>
      </div>

      {/* Filter Toolbar */}
      <section className="surface-card toolbar-filters" style={{ padding: '18px 20px', borderRadius: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          {/* Search input */}
          <input
            type="text"
            placeholder="Tìm bệnh nhân (Tên, SĐT, Email)..."
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem' }}
          />

          {/* Specialty Dropdown */}
          <select
            value={selectedSpecialtyId}
            onChange={(e) => handleFilterChange('specialty', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            <option value="">-- Tất cả chuyên khoa --</option>
            {specialtiesList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Doctor Dropdown */}
          <select
            value={selectedDoctorId}
            onChange={(e) => handleFilterChange('doctor', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            <option value="">-- Tất cả bác sĩ --</option>
            {doctorsList.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem' }}
          />

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="CONFIRMED">Đã xác nhận (Chờ khám)</option>
            <option value="CHECKED_IN">Đã check-in</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="NO_SHOW">Vắng mặt (Không đến)</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          {/* Clear Filters Button */}
          <button
            type="button"
            className="button-secondary"
            onClick={handleClearFilters}
            style={{ minHeight: 'auto', height: '38px', padding: '0 12px', fontSize: '0.9rem' }}
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* Main Grid Table */}
      <section className="surface-card" style={{ minHeight: '400px' }}>
        {appointmentsQuery.isLoading ? (
          <LoadingBlock label="Đang tải danh sách lịch hẹn..." />
        ) : appointmentsQuery.error ? (
          <StateBlock
            variant="error"
            title="Không thể tải lịch hẹn"
            description={appointmentsQuery.error.message}
          />
        ) : appointmentsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p className="helper-text">Không tìm thấy lịch hẹn nào khớp với bộ lọc.</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã lịch</th>
                  <th>Ngày khám</th>
                  <th>Giờ</th>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Chuyên khoa</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {appointmentsList.map((appointment) => {
                  const patientName = appointment.patientProfile 
                    ? appointment.patientProfile.name 
                    : (appointment.user?.name || appointment.patientEmail || 'Bệnh nhân');
                  
                  const doctorName = appointment.doctor?.name || appointment.doctorName || 'Bác sĩ';
                  const specialtyName = appointment.doctor?.specialtyName || appointment.specialtyName || 'N/A';
                  const time = appointment.timeSlot?.startTime 
                    ? appointment.timeSlot.startTime.slice(0, 5) 
                    : '08:00';
                  
                  const statusCfg = getStatusConfig(appointment.status);
                  const formattedDate = new Date(appointment.date).toLocaleDateString('vi-VN');

                  return (
                    <tr key={appointment.id}>
                      <td>
                        <code style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>
                          {appointment.code}
                        </code>
                      </td>
                      <td>{formattedDate}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-h)' }}>{time}</td>
                      <td>{patientName}</td>
                      <td>{doctorName}</td>
                      <td>{specialtyName}</td>
                      <td>
                        <span className={`status-chip ${statusCfg.className}`}>
                          <span className={`status-dot ${statusCfg.dotClass}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {appointment.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            className="button-primary"
                            onClick={() => handleUpdateStatus(appointment.id, 'CHECKED_IN')}
                            style={{ minHeight: 'auto', height: '28px', padding: '0 10px', fontSize: '0.78rem', borderRadius: '6px' }}
                          >
                            Check-in
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-detail-link"
                          onClick={() => {
                            setSelectedAppointmentId(appointment.id);
                            setIsCancelling(false);
                            setCancelReason('');
                          }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {paginationMeta.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span className="helper-text" style={{ fontSize: '0.88rem' }}>
                  Hiển thị trang <strong>{paginationMeta.page}</strong> / <strong>{paginationMeta.totalPages}</strong> (Tổng <strong>{paginationMeta.total}</strong> lịch khám)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    style={{ minHeight: 'auto', height: '34px', padding: '0 12px', fontSize: '0.85rem', borderRadius: '6px' }}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={page === paginationMeta.totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, paginationMeta.totalPages))}
                    style={{ minHeight: 'auto', height: '34px', padding: '0 12px', fontSize: '0.85rem', borderRadius: '6px' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Appointment Detail Drawer */}
      {selectedAppointmentId && selectedAppointment && (
        <>
          <div className="drawer-backdrop" onClick={() => setSelectedAppointmentId(null)} />
          <div className="drawer-content">
            <div className="drawer-header">
              <h2>Chi tiết cuộc hẹn</h2>
              <button 
                type="button" 
                className="drawer-close-btn"
                onClick={() => setSelectedAppointmentId(null)}
              >
                &times;
              </button>
            </div>

            <div className="drawer-body">
              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Trạng thái:</span>
                <span className={`status-chip ${getStatusConfig(selectedAppointment.status).className}`}>
                  <span className={`status-dot ${getStatusConfig(selectedAppointment.status).dotClass}`} />
                  {getStatusConfig(selectedAppointment.status).label}
                </span>
              </div>

              {/* Doctor Section */}
              <div>
                <h4 className="drawer-section-title">Thông tin Bác sĩ</h4>
                <div className="drawer-info-group">
                  <div className="info-row">
                    <span className="info-label">Bác sĩ</span>
                    <span className="info-value">{selectedAppointment.doctor?.name || selectedAppointment.doctorName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Chuyên khoa</span>
                    <span className="info-value">{selectedAppointment.doctor?.specialtyName || selectedAppointment.specialtyName || 'Đang cập nhật'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Giá khám</span>
                    <span className="info-value">
                      {(selectedAppointment.consultationFee || 0).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div>
                <h4 className="drawer-section-title">Thông tin Lịch khám</h4>
                <div className="drawer-info-group">
                  <div className="info-row">
                    <span className="info-label">Ngày khám</span>
                    <span className="info-value">
                      {new Date(selectedAppointment.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Giờ khám</span>
                    <span className="info-value">
                      {selectedAppointment.timeSlot?.startTime?.slice(0, 5) || '08:00'} - {selectedAppointment.timeSlot?.endTime?.slice(0, 5) || '08:30'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Mã lịch</span>
                    <span className="info-value" style={{ fontFamily: 'monospace' }}>
                      {selectedAppointment.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Section */}
              <div>
                <h4 className="drawer-section-title">Thông tin Bệnh nhân</h4>
                <div className="drawer-info-group">
                  <div className="info-row">
                    <span className="info-label">Họ tên</span>
                    <span className="info-value">
                      {selectedAppointment.patientProfile?.name || selectedAppointment.user?.name}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Số điện thoại</span>
                    <span className="info-value">
                      {selectedAppointment.patientProfile?.phone || selectedAppointment.user?.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">
                      {selectedAppointment.patientProfile?.email || selectedAppointment.user?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Giới tính</span>
                    <span className="info-value">
                      {selectedAppointment.patientProfile?.gender === 'MALE' ? 'Nam' : selectedAppointment.patientProfile?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Ngày sinh</span>
                    <span className="info-value">
                      {selectedAppointment.patientProfile?.birthday 
                        ? new Date(selectedAppointment.patientProfile.birthday).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Symptoms / Reason */}
              <div>
                <h4 className="drawer-section-title">Triệu chứng & Lý do khám</h4>
                <div className="drawer-info-group">
                  <div className="info-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <span className="info-value" style={{ textAlign: 'left', maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
                      {selectedAppointment.reason || 'Không có triệu chứng ghi nhận.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason if cancelled */}
              {selectedAppointment.status === 'CANCELLED' && selectedAppointment.cancellationReason && (
                <div>
                  <h4 className="drawer-section-title">Lý do hủy lịch</h4>
                  <div className="cancellation-reason-box">
                    {selectedAppointment.cancellationReason}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="drawer-footer">
              {updateStatusMutation.isPending ? (
                <LoadingBlock label="Đang cập nhật trạng thái..." />
              ) : (
                <>
                  {/* Status: CONFIRMED */}
                  {selectedAppointment.status === 'CONFIRMED' && !isCancelling && (
                    <div className="drawer-actions-row">
                      <button
                        type="button"
                        className="button-primary"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'CHECKED_IN')}
                      >
                        Check-in
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'NO_SHOW')}
                      >
                        Vắng mặt
                      </button>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={() => setIsCancelling(true)}
                      >
                        Hủy lịch
                      </button>
                    </div>
                  )}

                  {/* Status: CHECKED_IN */}
                  {selectedAppointment.status === 'CHECKED_IN' && !isCancelling && (
                    <div className="drawer-actions-row">
                      <button
                        type="button"
                        className="button-primary"
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                      >
                        Hoàn thành khám
                      </button>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={() => setIsCancelling(true)}
                      >
                        Hủy lịch
                      </button>
                    </div>
                  )}

                  {/* Cancellation Reason input form */}
                  {isCancelling && (
                    <div className="cancel-reason-form">
                      <label htmlFor="cancelReasonInput" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Lý do hủy lịch*
                      </label>
                      <textarea
                        id="cancelReasonInput"
                        placeholder="Vui lòng nhập lý do hủy lịch..."
                        rows={3}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="button-danger"
                          style={{ flex: 1 }}
                          disabled={!cancelReason.trim()}
                          onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED', cancelReason)}
                        >
                          Xác nhận hủy
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          style={{ flex: 1 }}
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

                  {/* Completed / Cancelled / No show -> Read-only warning */}
                  {(selectedAppointment.status === 'COMPLETED' || 
                    selectedAppointment.status === 'CANCELLED' || 
                    selectedAppointment.status === 'NO_SHOW') && (
                    <p style={{ textAlign: 'center', fontSize: '0.88rem', margin: 0 }} className="helper-text">
                      Lịch hẹn này đã hoàn tất chu kỳ trạng thái.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
