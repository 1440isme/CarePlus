import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMe } from '../../features/user/hooks/useMe.js';
import { useMyAppointments } from '../../features/appointment/hooks/useAppointments.js';
import { usePatientProfiles } from '../../features/patient-profile/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './patient-portal.css';

export default function PatientDashboard() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Queries
  const meQuery = useMe({ enabled: Boolean(accessToken) });
  const appointmentsQuery = useMyAppointments({ enabled: Boolean(accessToken) });
  const patientProfilesQuery = usePatientProfiles(
    { page: 1, limit: 100 },
    { enabled: Boolean(accessToken) }
  );

  const user = meQuery.data?.data?.user;
  const appointmentsList = appointmentsQuery.data?.data || [];
  const relativeProfiles = patientProfilesQuery.data?.data || [];

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

  // 1. Tên bệnh nhân
  const patientName = user?.name || 'Bệnh nhân';

  // 2. Lọc danh sách Lịch hẹn sắp tới (Chỉ trạng thái CONFIRMED hoặc CHECKED_IN và ngày khám >= hôm nay)
  const upcomingAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);
    return appointmentsList
      .filter((appt) => {
        const isUpcomingStatus = appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN';
        if (!isUpcomingStatus) return false;
        if (!appt.appointmentDate) return false;
        return appt.appointmentDate >= todayStr;
      })
      .sort((a, b) => {
        const dateA = a.appointmentDate + ' ' + (a.startTime || '00:00');
        const dateB = b.appointmentDate + ' ' + (b.startTime || '00:00');
        return dateA.localeCompare(dateB);
      })
      .slice(0, 4); // Lấy tối đa 4 lịch hẹn sắp tới
  }, [appointmentsList]);

  // 3. Số lượng Stats Cards
  const upcomingCount = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);
    return appointmentsList.filter(
      (appt) => (appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN') && appt.appointmentDate && appt.appointmentDate >= todayStr
    ).length;
  }, [appointmentsList]);

  const completedCount = useMemo(() => {
    return appointmentsList.filter((appt) => appt.status === 'COMPLETED').length;
  }, [appointmentsList]);

  const relativesCount = useMemo(() => {
    return relativeProfiles.filter((p) => p.isActive).length;
  }, [relativeProfiles]);

  // 4. Sinh danh sách dữ liệu lượt khám theo tháng (T1 -> T6 của năm hiện tại)
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = [0, 1, 2, 3, 4, 5]; // T1 -> T6
    
    const counts = months.map(m => {
      return appointmentsList.filter(appt => {
        if (!appt.appointmentDate) return false;
        const apptDate = new Date(appt.appointmentDate);
        const isValid = appt.status !== 'CANCELLED';
        return isValid && apptDate.getMonth() === m && apptDate.getFullYear() === currentYear;
      }).length;
    });

    const maxCount = Math.max(...counts, 1);

    return months.map((m, index) => {
      let displayCount = counts[index];
      let displayHeight = (displayCount / maxCount) * 100;

      // Fallback về mock data của Figma gốc nếu DB trống
      if (appointmentsList.length === 0) {
        const mockCounts = [0, 1, 0, 2, 1, 2];
        const mockMax = 2;
        displayCount = mockCounts[index];
        displayHeight = (mockCounts[index] / mockMax) * 100;
      }

      return {
        label: `T${m + 1}`,
        count: displayCount,
        heightPercent: Math.max(displayHeight, 5), // Tối thiểu 5% để cột không bị biến mất hoàn toàn
      };
    });
  }, [appointmentsList]);

  // 5. Sinh danh sách dữ liệu lượt khám theo chuyên khoa
  const specialtyData = useMemo(() => {
    const validAppts = appointmentsList.filter(appt => appt.status !== 'CANCELLED');
    
    // Fallback về mock data của Figma gốc nếu DB trống
    if (validAppts.length === 0) {
      return [
        { name: 'Nội tổng quát', count: 3, percentage: 50, color: '#14a7e2' },
        { name: 'Tim mạch', count: 1, percentage: 17, color: '#FFC10E' },
        { name: 'Da liễu', count: 1, percentage: 17, color: '#A78BFA' },
        { name: 'Nhi khoa', count: 1, percentage: 17, color: '#34D399' }
      ];
    }

    const map = {};
    validAppts.forEach(appt => {
      const specName = appt.specialty?.name || 'Khác';
      map[specName] = (map[specName] || 0) + 1;
    });

    const total = validAppts.length;
    const colors = ['#14a7e2', '#FFC10E', '#A78BFA', '#34D399', '#EC4899'];
    
    return Object.keys(map).map((name, index) => {
      const count = map[name];
      const percentage = Math.round((count / total) * 100);
      return {
        name,
        count,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.count - a.count).slice(0, 4); // Lấy top 4 chuyên khoa
  }, [appointmentsList]);

  if (!accessToken) {
    return (
      <StateBlock
        variant="warning"
        title="Yêu cầu đăng nhập"
        description="Vui lòng đăng nhập tài khoản bệnh nhân để xem trang tổng quan sức khỏe của bạn."
      />
    );
  }

  const isLoading = meQuery.isLoading || appointmentsQuery.isLoading || patientProfilesQuery.isLoading;
  const isError = meQuery.error || appointmentsQuery.error || patientProfilesQuery.error;

  return (
    <div className="patient-db-container">
      {/* Welcome Title */}
      <div className="patient-db-header">
        <h2 className="patient-db-title">Xin chào, {patientName}!</h2>
        <p className="patient-db-subtitle">Quản lý lịch khám và thông tin sức khỏe của bạn</p>
      </div>

      {isLoading ? (
        <LoadingBlock label="Đang tải thông tin tổng quan..." />
      ) : isError ? (
        <StateBlock
          variant="error"
          title="Không thể tải thông tin tổng quan"
          description={
            meQuery.error?.message ||
            appointmentsQuery.error?.message ||
            patientProfilesQuery.error?.message
          }
        />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="patient-db-stats-grid">
            {/* Card 1: Upcoming appointments */}
            <div className="patient-db-stat-card">
              <div className="patient-db-stat-icon-wrapper blue">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="patient-db-stat-info">
                <span className="patient-db-stat-value">{upcomingCount}</span>
                <span className="patient-db-stat-label">Lịch hẹn sắp tới</span>
              </div>
            </div>

            {/* Card 2: Completed visits */}
            <div className="patient-db-stat-card">
              <div className="patient-db-stat-icon-wrapper green">
                <svg viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="patient-db-stat-info">
                <span className="patient-db-stat-value">{completedCount}</span>
                <span className="patient-db-stat-label">Đã hoàn thành</span>
              </div>
            </div>

            {/* Card 3: Relatives Profiles */}
            <div className="patient-db-stat-card">
              <div className="patient-db-stat-icon-wrapper purple">
                <svg viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="patient-db-stat-info">
                <span className="patient-db-stat-value">{relativesCount}</span>
                <span className="patient-db-stat-label">Hồ sơ người thân</span>
              </div>
            </div>
          </div>

          {/* Section 1: Upcoming Appointments */}
          <div className="patient-db-section-card">
            <h3 className="patient-db-section-title">Lịch hẹn sắp tới</h3>
            {upcomingAppointments.length === 0 ? (
              <div className="patient-db-no-appts">
                <p className="patient-db-no-appts-text">Bạn hiện tại không có lịch khám sắp tới nào.</p>
                <Link to="/dat-lich" className="patient-db-no-appts-btn">
                  Đặt lịch khám ngay
                </Link>
              </div>
            ) : (
              <div className="patient-db-appointments-list">
                {upcomingAppointments.map((appt) => {
                  const formattedTime = appt.startTime ? appt.startTime.slice(0, 5) : '08:00';

                  return (
                    <div
                      key={appt.id}
                      onClick={() => setSelectedAppointmentId(appt.id)}
                      className="patient-db-appointment-card"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="patient-db-appointment-info">
                        <span className="patient-db-appointment-doctor">
                          {appt.doctor?.title || 'ThS.BS'} {appt.doctor?.name || appt.doctorName || 'Bác sĩ'}
                        </span>
                        <div className="patient-db-appointment-meta">
                          <div className="patient-db-appointment-meta-item">
                            <svg viewBox="0 0 24 24">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{appt.appointmentDate}</span>
                          </div>
                          <div className="patient-db-appointment-meta-item">
                            <svg viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{formattedTime}</span>
                          </div>
                          <div className="patient-db-appointment-meta-item specialty">
                            {appt.specialty?.name || 'N/A'}
                          </div>
                          <span className="patient-db-appointment-code">Mã: {appt.code}</span>
                        </div>
                      </div>

                      <div className="patient-db-appointment-patient">
                        <span className="patient-db-appointment-patient-name">{appt.patientName}</span>
                        <span className="patient-db-appointment-patient-relation">
                          Quan hệ: {appt.forSelf ? 'Bản thân' : (appt.patientProfile?.relationship || 'Người thân')}
                        </span>
                      </div>

                      <div className="patient-db-appointment-arrow">
                        <svg viewBox="0 0 24 24">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Frequency Charts (Split into 2 Columns) */}
          <div className="patient-db-sections-2col">
            {/* Column Left: Visits count by month */}
            <div className="patient-db-section-card">
              <h3 className="patient-db-section-title">Số lượt khám theo tháng</h3>
              <div className="patient-db-vcharts-container">
                {monthlyData.map((m, index) => (
                  <div key={index} className="patient-db-vchart-item">
                    <div className="patient-db-vchart-bar-wrapper">
                      {m.count > 0 && (
                        <span className="patient-db-vchart-value">{m.count}</span>
                      )}
                      <div
                        className={`patient-db-vchart-bar ${m.count > 0 ? 'active' : 'inactive'}`}
                        style={{ height: `${m.heightPercent}%` }}
                      />
                    </div>
                    <span className="patient-db-vchart-label">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column Right: Visits count by specialty */}
            <div className="patient-db-section-card">
              <h3 className="patient-db-section-title">Lịch hẹn theo chuyên khoa</h3>
              <div className="patient-db-hcharts-list">
                {specialtyData.map((s, index) => (
                  <div key={index} className="patient-db-hchart-item">
                    <div className="patient-db-hchart-header">
                      <span className="patient-db-hchart-name">{s.name}</span>
                      <span className="patient-db-hchart-value">
                        {s.count} lượt ({s.percentage}%)
                      </span>
                    </div>
                    <div className="patient-db-hchart-bar-bg">
                      <div
                        className="patient-db-hchart-bar-fill"
                        style={{
                          width: `${s.percentage}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Appointment Detail Drawer */}
      {selectedAppointmentId && selectedAppointment && (
        <>
          <div className="patient-appt-drawer-backdrop" onClick={() => setSelectedAppointmentId(null)} />
          <div className="patient-appt-drawer-content">
            <div className="patient-appt-drawer-header">
              <h2>Chi tiết cuộc hẹn</h2>
              <button
                type="button"
                className="patient-appt-drawer-close"
                onClick={() => setSelectedAppointmentId(null)}
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
                onClick={() => setSelectedAppointmentId(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
