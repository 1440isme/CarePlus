import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMyAppointments, useCancelMyAppointment } from '../../features/appointment/hooks/useAppointments.js';
import { usePatientProfiles } from '../../features/patient-profile/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './patient-portal.css';

export default function PatientAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appointmentIdParam = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Sync URL parameter to selected appointment ID and reset status to All
  useEffect(() => {
    if (appointmentIdParam) {
      setSelectedStatus('');
      setSelectedAppointmentId(appointmentIdParam);
    }
  }, [appointmentIdParam]);

  const handleCloseDrawer = () => {
    setSelectedAppointmentId(null);
    if (searchParams.has('id')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('id');
      setSearchParams(newParams, { replace: true });
    }
  };

  // Local state to mock reviewed status for interactive WOW effect
  const [reviewedAppointments, setReviewedAppointments] = useState({});

  // Query parameters
  const appointmentsParams = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const appointmentsQuery = useMyAppointments(appointmentsParams);
  const patientProfilesQuery = usePatientProfiles({ page: 1, limit: 100 });
  const cancelMutation = useCancelMyAppointment();

  const appointmentsList = appointmentsQuery.data?.data || [];
  const relativeProfiles = patientProfilesQuery.data?.data || [];

  // Client-side filtering for search, patient/relative and date range
  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter((appointment) => {
      // 1. Search filter
      let matchesSearch = true;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const code = (appointment.code || '').toLowerCase();
        const doctorName = (appointment.doctor?.name || appointment.doctorName || '').toLowerCase();
        const specialtyName = (appointment.specialty?.name || '').toLowerCase();
        const patientName = (appointment.patientName || '').toLowerCase();

        matchesSearch = code.includes(query) ||
          doctorName.includes(query) ||
          specialtyName.includes(query) ||
          patientName.includes(query);
      }

      // 2. Lọc theo Bệnh nhân / Người thân
      let matchesMember = true;
      if (selectedMemberId === 'self') {
        matchesMember = appointment.forSelf === true;
      } else if (selectedMemberId) {
        matchesMember = appointment.forSelf === false && appointment.patientProfileId === selectedMemberId;
      }

      // 3. Lọc theo Khoảng thời gian
      let matchesStartDate = true;
      if (filterStartDate) {
        matchesStartDate = appointment.appointmentDate >= filterStartDate;
      }

      let matchesEndDate = true;
      if (filterEndDate) {
        matchesEndDate = appointment.appointmentDate <= filterEndDate;
      }

      return matchesSearch && matchesMember && matchesStartDate && matchesEndDate;
    });
  }, [appointmentsList, search, selectedMemberId, filterStartDate, filterEndDate]);

  const selectedAppointment = appointmentsList.find(a => a.id === selectedAppointmentId);

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

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim() || !cancellingAppointmentId) return;

    try {
      await cancelMutation.mutateAsync({
        id: cancellingAppointmentId,
        payload: { reason: cancelReason }
      });
      setCancellingAppointmentId(null);
      setCancelReason('');
    } catch (error) {
      alert(`Lỗi hủy lịch hẹn: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const handleReviewClick = (appointmentId) => {
    setReviewedAppointments(prev => ({
      ...prev,
      [appointmentId]: true
    }));
  };

  const tabs = [
    { value: '', label: 'Tất cả' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'CHECKED_IN', label: 'Check-in' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'NO_SHOW', label: 'Vắng mặt' },
  ];

  return (
    <div className="patient-appt-page">
      {/* Header */}
      <div className="patient-appt-header-container">
        <h2 className="patient-appt-title">Lịch hẹn của tôi</h2>
      </div>

      {/* Search & Filter bar */}
      <div className="patient-appt-search-filter-container">
        <div className="patient-appt-search-wrapper">
          <svg className="patient-appt-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="patient-appt-search-input"
            placeholder="Tìm theo mã lịch, tên bác sĩ, chuyên khoa, người khám..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`patient-appt-filter-button ${showFilterPanel ? 'active' : ''}`}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', marginRight: '6px' }}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Lọc
        </button>
      </div>

      {/* Optional Filter Panel */}
      {showFilterPanel && (
        <div className="patient-appt-filter-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="patient-appt-filter-group">
            <label className="patient-appt-filter-label">Người khám:</label>
            <select
              className="patient-appt-filter-input"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              style={{ minWidth: '180px', height: '32px', padding: '0 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="">Tất cả người khám</option>
              <option value="self">Bản thân</option>
              {relativeProfiles.filter(p => p.isActive).map(p => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.relationship})</option>
              ))}
            </select>
          </div>
          
          <div className="patient-appt-filter-group">
            <label className="patient-appt-filter-label">Từ ngày:</label>
            <input
              type="date"
              className="patient-appt-filter-input"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>

          <div className="patient-appt-filter-group">
            <label className="patient-appt-filter-label">Đến ngày:</label>
            <input
              type="date"
              className="patient-appt-filter-input"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          {(selectedMemberId || filterStartDate || filterEndDate) && (
            <button
              className="patient-appt-clear-filter-btn"
              onClick={() => {
                setSelectedMemberId('');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="patient-appt-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`patient-appt-tab ${selectedStatus === tab.value ? 'active' : ''}`}
            onClick={() => setSelectedStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Data */}
      <div className="patient-appt-table-container">
        {appointmentsQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch hẹn..." />
        ) : appointmentsQuery.error ? (
          <StateBlock
            variant="error"
            title="Không thể tải lịch hẹn"
            description={appointmentsQuery.error.message}
          />
        ) : filteredAppointments.length === 0 ? (
          <StateBlock
            variant="empty"
            title="Không có lịch hẹn"
            description="Bạn không có cuộc hẹn khám bệnh nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <table className="patient-appt-table">
            <thead>
              <tr>
                <th>Mã lịch</th>
                <th>Ngày giờ</th>
                <th>Bác sĩ</th>
                <th>Chuyên khoa</th>
                <th>Người khám</th>
                <th>Giá tham khảo</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appt) => {
                const statusCfg = getStatusConfig(appt.status);
                const isReviewed = reviewedAppointments[appt.id] || appt.isReviewed;

                const formattedDate = appt.appointmentDate
                  ? appt.appointmentDate.split('-').reverse().join('/')
                  : 'N/A';

                const formattedTime = appt.startTime
                  ? appt.startTime.slice(0, 5)
                  : '08:00';

                return (
                  <tr key={appt.id}>
                    <td>
                      <code className="patient-appt-code">{appt.code}</code>
                    </td>
                    <td>
                      <div className="patient-appt-datetime">
                        <span className="patient-appt-date">{formattedDate}</span>
                        <span className="patient-appt-time">{formattedTime}</span>
                      </div>
                    </td>
                    <td className="patient-appt-doctor">
                      {appt.doctor?.name || appt.doctorName || 'Bác sĩ'}
                    </td>
                    <td className="patient-appt-specialty">
                      {appt.specialty?.name || 'Chuyên khoa'}
                    </td>
                    <td>
                      <div className="patient-appt-patient">
                        <span className="patient-appt-patient-name">{appt.patientName}</span>
                        <span className="patient-appt-patient-relationship">
                          Quan hệ: {appt.forSelf ? 'Bản thân' : (appt.patientProfile?.relationship || 'Người thân')}
                        </span>
                      </div>
                    </td>
                    <td className="patient-appt-price">
                      {(appt.consultationFee || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td>
                      <span className={`patient-appt-status-badge ${statusCfg.className}`}>
                        <span className={`patient-appt-status-dot ${statusCfg.dotClass}`} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="patient-appt-actions-cell">
                        <button
                          type="button"
                          className="patient-appt-action-btn btn-detail"
                          onClick={() => setSelectedAppointmentId(appt.id)}
                        >
                          Chi tiết
                        </button>

                        {appt.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            className="patient-appt-action-btn btn-cancel"
                            onClick={() => {
                              setCancellingAppointmentId(appt.id);
                              setCancelReason('');
                            }}
                          >
                            Hủy
                          </button>
                        )}

                        {appt.status === 'COMPLETED' && (
                          isReviewed ? (
                            <span className="patient-appt-action-btn btn-reviewed">
                              Đã đánh giá
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="patient-appt-action-btn btn-review"
                              onClick={() => handleReviewClick(appt.id)}
                            >
                              Đánh giá
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Appointment Detail Drawer */}
      {selectedAppointmentId && selectedAppointment && (
        <>
          <div className="patient-appt-drawer-backdrop" onClick={handleCloseDrawer} />
          <div className="patient-appt-drawer-content">
            <div className="patient-appt-drawer-header">
              <h2>Chi tiết cuộc hẹn</h2>
              <button
                type="button"
                className="patient-appt-drawer-close"
                onClick={handleCloseDrawer}
              >
                &times;
              </button>
            </div>

            <div className="patient-appt-drawer-body">
              {/* Status Section */}
              <div className="patient-appt-drawer-status-row">
                <span className="patient-appt-drawer-label" style={{ fontWeight: 700 }}>Trạng thái:</span>
                <span className={`patient-appt-status-badge ${getStatusConfig(selectedAppointment.status).className}`}>
                  <span className={`patient-appt-status-dot ${getStatusConfig(selectedAppointment.status).dotClass}`} />
                  {getStatusConfig(selectedAppointment.status).label}
                </span>
              </div>

              {/* Doctor Section */}
              <div className="patient-appt-drawer-section">
                <h4 className="patient-appt-drawer-section-title">Thông tin Bác sĩ</h4>
                <div className="patient-appt-drawer-info-group">
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Bác sĩ</span>
                    <span className="patient-appt-drawer-info-value">{selectedAppointment.doctor?.name || selectedAppointment.doctorName}</span>
                  </div>
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Chuyên khoa</span>
                    <span className="patient-appt-drawer-info-value">{selectedAppointment.specialty?.name || 'Đang cập nhật'}</span>
                  </div>
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Giá khám tham khảo</span>
                    <span className="patient-appt-drawer-info-value">
                      {(selectedAppointment.consultationFee || 0).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="patient-appt-drawer-section">
                <h4 className="patient-appt-drawer-section-title">Thông tin Lịch khám</h4>
                <div className="patient-appt-drawer-info-group">
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Ngày khám</span>
                    <span className="patient-appt-drawer-info-value">
                      {selectedAppointment.appointmentDate ? selectedAppointment.appointmentDate.split('-').reverse().join('/') : 'N/A'}
                    </span>
                  </div>
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Giờ khám</span>
                    <span className="patient-appt-drawer-info-value">
                      {selectedAppointment.startTime?.slice(0, 5) || '08:00'} - {selectedAppointment.endTime?.slice(0, 5) || '08:30'}
                    </span>
                  </div>
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Mã lịch</span>
                    <span className="patient-appt-drawer-info-value" style={{ fontFamily: 'monospace' }}>
                      {selectedAppointment.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Section */}
              <div className="patient-appt-drawer-section">
                <h4 className="patient-appt-drawer-section-title">Thông tin Bệnh nhân</h4>
                <div className="patient-appt-drawer-info-group">
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Họ tên người khám</span>
                    <span className="patient-appt-drawer-info-value">{selectedAppointment.patientName}</span>
                  </div>
                  <div className="patient-appt-drawer-info-row">
                    <span className="patient-appt-drawer-info-label">Quan hệ</span>
                    <span className="patient-appt-drawer-info-value">
                      {selectedAppointment.forSelf ? 'Bản thân' : (selectedAppointment.patientProfile?.relationship || 'Người thân')}
                    </span>
                  </div>
                  {selectedAppointment.patientDob && (
                    <div className="patient-appt-drawer-info-row">
                      <span className="patient-appt-drawer-info-label">Ngày sinh</span>
                      <span className="patient-appt-drawer-info-value">{selectedAppointment.patientDob}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason Section */}
              {selectedAppointment.reason && (
                <div className="patient-appt-drawer-section">
                  <h4 className="patient-appt-drawer-section-title">Triệu chứng & Lý do khám</h4>
                  <div className="patient-appt-drawer-info-group">
                    <div className="patient-appt-drawer-info-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <span className="patient-appt-drawer-info-value" style={{ textAlign: 'left', maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
                        {selectedAppointment.reason}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Reason Section */}
              {selectedAppointment.status === 'CANCELLED' && selectedAppointment.note && (
                <div className="patient-appt-drawer-section">
                  <h4 className="patient-appt-drawer-section-title" style={{ color: '#EF4444' }}>Lý do hủy lịch</h4>
                  <div className="patient-appt-drawer-cancellation-box">
                    {selectedAppointment.note || 'Không có lý do chi tiết.'}
                  </div>
                </div>
              )}
            </div>

            <div className="patient-appt-drawer-footer">
              <button
                type="button"
                className="patient-appt-drawer-btn-close"
                onClick={handleCloseDrawer}
              >
                Đóng
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingAppointmentId && (
        <>
          <div className="patient-appt-modal-backdrop" onClick={() => setCancellingAppointmentId(null)} />
          <div className="patient-appt-modal">
            <div className="patient-appt-modal-header">
              <h3 className="patient-appt-modal-title">Hủy lịch hẹn khám</h3>
              <button
                type="button"
                className="patient-appt-modal-close"
                onClick={() => setCancellingAppointmentId(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCancelSubmit}>
              <div className="patient-appt-modal-body">
                <p className="patient-appt-modal-desc">
                  Bạn có chắc chắn muốn hủy lịch hẹn khám này không? Thao tác này không thể hoàn tác.
                </p>
                <div className="patient-appt-form-group">
                  <label className="patient-appt-modal-label" htmlFor="cancelReason">
                    Lý do hủy lịch <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    id="cancelReason"
                    className="patient-appt-textarea"
                    placeholder="Vui lòng nhập lý do hủy lịch của bạn (bắt buộc)..."
                    rows={4}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="patient-appt-modal-footer">
                <button
                  type="button"
                  className="patient-appt-modal-btn btn-secondary"
                  onClick={() => setCancellingAppointmentId(null)}
                  disabled={cancelMutation.isPending}
                >
                  Không, giữ lại
                </button>
                <button
                  type="submit"
                  className="patient-appt-modal-btn btn-danger"
                  disabled={!cancelReason.trim() || cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
