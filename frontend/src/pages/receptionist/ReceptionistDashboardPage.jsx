import { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useAppointments, useUpdateAppointmentStatus } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './receptionist.css';

export default function ReceptionistDashboardPage() {
  const { user } = useAuth();
  const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);
  
  // Format current date for heading: e.g. "Ngày 20/6/2026 — Quầy lễ tân"
  const formattedDateHeading = new Date().toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

  const appointmentsQuery = useAppointments({ date: todayStr, limit: 100 });
  const updateStatusMutation = useUpdateAppointmentStatus();

  // Selected appointment for detail Drawer
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  // Control cancellation reason input state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const todayAppointments = appointmentsQuery.data?.data || [];
  
  // Calculate KPI metrics
  const total = todayAppointments.length;
  const checkedIn = todayAppointments.filter((a) => a.status === 'CHECKED_IN').length;
  const waiting = todayAppointments.filter((a) => a.status === 'CONFIRMED').length;
  const completed = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const noShow = todayAppointments.filter((a) => a.status === 'NO_SHOW').length;

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
        payload: { status: newStatus, reason, note: 'Cập nhật từ Lễ tân' }
      });
      setIsCancelling(false);
      setCancelReason('');
    } catch (error) {
      alert(`Lỗi cập nhật trạng thái: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const selectedAppointment = todayAppointments.find(a => a.id === selectedAppointmentId);

  return (
    <div className="content-grid receptionist-page">
      {/* Greetings */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '4px', fontWeight: 700 }}>
          Xin chào, {user?.name || 'Lê Thị Lệ Ngân'}! 👋
        </h2>
        <p className="helper-text" style={{ fontSize: '0.95rem' }}>
          Ngày {formattedDateHeading} — Quầy lễ tân
        </p>
      </div>

      {/* KPI Cards Grid */}
      <section className="metric-grid">
        <div className="metric-card metric-card-kpi kpi-total">
          <p>Lịch hẹn hôm nay</p>
          <strong className="kpi-value-total">{total}</strong>
        </div>
        <div className="metric-card metric-card-kpi kpi-checked-in">
          <p>Đã check-in</p>
          <strong className="kpi-value-checked-in">{checkedIn}</strong>
        </div>
        <div className="metric-card metric-card-kpi kpi-waiting">
          <p>Chờ khám</p>
          <strong className="kpi-value-waiting">{waiting}</strong>
        </div>
        <div className="metric-card metric-card-kpi kpi-completed">
          <p>Đã hoàn thành</p>
          <strong className="kpi-value-completed">{completed}</strong>
        </div>
        <div className="metric-card metric-card-kpi kpi-noshow">
          <p>Vắng mặt</p>
          <strong className="kpi-value-noshow">{noShow}</strong>
        </div>
      </section>

      {/* Today's Appointments - Expanded */}
      <section className="surface-card full-width-table-card">
        <div className="table-header-flex">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Lịch hẹn hôm nay</h3>
          {appointmentsQuery.isFetching && <span className="helper-text" style={{ fontSize: '0.8rem' }}>Đang đồng bộ...</span>}
        </div>

        {appointmentsQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch hẹn hôm nay..." />
        ) : appointmentsQuery.error ? (
          <StateBlock
            variant="error"
            title="Không thể tải danh sách lịch hẹn"
            description={appointmentsQuery.error.message}
          />
        ) : todayAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p className="helper-text">Chưa có lịch khám nào trong ngày hôm nay.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã lịch</th>
                <th>Giờ</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {todayAppointments.map((appointment) => {
                const patientName = appointment.patientProfile 
                  ? appointment.patientProfile.name 
                  : (appointment.user?.name || appointment.patientEmail || 'Bệnh nhân');
                
                const doctorName = appointment.doctor?.name || appointment.doctorName || 'Bác sĩ';
                const time = appointment.timeSlot?.startTime 
                  ? appointment.timeSlot.startTime.slice(0, 5) 
                  : '08:00';
                
                const statusCfg = getStatusConfig(appointment.status);

                return (
                  <tr key={appointment.id}>
                    <td>
                      <code style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>
                        {appointment.code}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-h)' }}>{time}</td>
                    <td>{patientName}</td>
                    <td>{doctorName}</td>
                    <td>
                      <span className={`status-chip ${statusCfg.className}`}>
                        <span className={`status-dot ${statusCfg.dotClass}`} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
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
                    <span className="info-value">{selectedAppointment.doctor?.specialtyName || 'Đang cập nhật'}</span>
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
