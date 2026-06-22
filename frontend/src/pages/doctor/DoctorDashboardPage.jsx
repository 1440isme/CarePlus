import { Link } from 'react-router-dom';
import { useDoctorDashboard } from '../../features/doctor/index.js';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { APP_ROUTES } from '../../shared/constants/routes.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './doctor.css';

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

  return (
    <div className="content-grid doctor-page">
      <section className="surface-card doctor-hero-card">
        <div className="doctor-hero-content">
          <div className="doctor-hero-main">
            <div className="doctor-avatar">{getInitials(user?.name)}</div>
            <div className="doctor-hero-title">
              <h2>{user?.name || 'Bác sĩ CarePlus'}</h2>
              <div className="doctor-hero-meta">
                <span className="doctor-meta-pill">{formatDisplayDate(dashboard?.today)}</span>
                <span className="doctor-meta-pill">Doctor Portal</span>
                <span className="doctor-meta-pill">Lịch hôm nay: {dashboard?.kpis?.totalAppointments ?? 0}</span>
              </div>
              <div className="doctor-hero-note">
                Theo dõi nhanh lịch hẹn trong ngày, tình trạng lịch làm việc trong tuần và các khung giờ đang cần lưu ý.
              </div>
            </div>
          </div>

          <div className="doctor-hero-actions">
            <Link className="button-secondary" to={`${APP_ROUTES.doctorRoot}/lich-lam-viec`}>Lịch làm việc</Link>
            <Link className="button-primary" to={`${APP_ROUTES.doctorRoot}/lich-hen`}>Xem lịch hẹn</Link>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card doctor-kpi-card doctor-kpi-total">
          <p>Lịch hẹn hôm nay</p>
          <strong>{dashboard?.kpis?.totalAppointments ?? 0}</strong>
        </article>
        <article className="metric-card doctor-kpi-card doctor-kpi-checked">
          <p>Đã check-in</p>
          <strong>{dashboard?.kpis?.checkedInAppointments ?? 0}</strong>
        </article>
        <article className="metric-card doctor-kpi-card doctor-kpi-completed">
          <p>Đã hoàn thành</p>
          <strong>{dashboard?.kpis?.completedAppointments ?? 0}</strong>
        </article>
        <article className="metric-card doctor-kpi-card doctor-kpi-noshow">
          <p>No-show</p>
          <strong>{dashboard?.kpis?.noShowAppointments ?? 0}</strong>
        </article>
      </section>

      <section className="split-panel">
        <div className="surface-card">
          <div className="doctor-section-title">
            <div>
              <h3>Timeline hôm nay</h3>
              <p>Danh sách lịch hẹn theo khung giờ trong ngày hiện tại.</p>
            </div>
            <span className="doctor-subtle-tag">{(dashboard?.timeline || []).length} cuộc hẹn</span>
          </div>

          {(dashboard?.timeline || []).length > 0 ? (
            <div className="doctor-timeline-list">
              {dashboard.timeline.map((item) => (
                <article key={item.appointmentId} className="doctor-timeline-card">
                  <div className="doctor-timeline-time">
                    <strong>{item.startTime}</strong>
                    <span>{item.endTime}</span>
                  </div>

                  <div className="doctor-timeline-patient">
                    <strong>{item.patientName}</strong>
                    <p>Mã lịch: {item.code}</p>
                  </div>

                  <div className="doctor-timeline-meta">
                    <span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span>
                    <span className="doctor-mini-code">{item.appointmentId}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <StateBlock title="Chưa có lịch hẹn hôm nay" description="Timeline sẽ hiển thị khi có dữ liệu appointment thực tế cho bác sĩ." />
          )}
        </div>

        <div className="surface-card">
          <div className="doctor-section-title">
            <div>
              <h3>Tổng quan lịch tuần này</h3>
              <p>Phân bổ slot và tình trạng ca trong 7 ngày gần nhất từ API dashboard.</p>
            </div>
          </div>

          <div className="doctor-summary-list">
            <div className="doctor-summary-row">
              <strong>Slot khả dụng</strong>
              <span>{totalAvailableSlots}</span>
            </div>
            <div className="doctor-summary-row">
              <strong>Slot đã đặt</strong>
              <span>{totalBookedSlots}</span>
            </div>
            <div className="doctor-summary-row">
              <strong>Slot bị khóa</strong>
              <span>{totalLockedSlots}</span>
            </div>
            <div className="doctor-summary-row">
              <strong>Lịch hôm nay</strong>
              <span>{dashboard?.todaySchedule?.status || 'Chưa mở lịch'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card">
        <div className="doctor-section-title">
          <div>
            <h3>Lịch làm việc tuần này</h3>
            <p>Các ngày đã mở lịch và số lượng khung giờ hiện có.</p>
          </div>
          <Link className="button-secondary" to={`${APP_ROUTES.doctorRoot}/lich-lam-viec`}>Mở lịch chi tiết</Link>
        </div>

        {weekSchedules.length > 0 ? (
          <div className="doctor-week-grid">
            {weekSchedules.map((item) => (
              <article key={item.scheduleId} className="doctor-week-day">
                <div className="doctor-week-day-header">
                  <div>
                    <strong>{formatDisplayDate(item.workingDate)}</strong>
                    <span>{item.doctor?.specialtyName || 'Lịch làm việc'}</span>
                  </div>
                  <span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span>
                </div>

                <div className="doctor-week-day-stats">
                  <span>Tổng slot: {item.totalSlots}</span>
                  <span>Khả dụng: {item.availableSlots}</span>
                  <span>Đã đặt: {item.bookedSlots}</span>
                  <span>Đang khóa: {item.lockedSlots}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <StateBlock title="Chưa có lịch trong tuần" description="Lịch làm việc tuần sẽ hiển thị khi admin đã mở lịch cho bác sĩ." />
        )}
      </section>
    </div>
  );
}
