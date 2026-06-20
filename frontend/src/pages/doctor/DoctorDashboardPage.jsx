import { useDoctorDashboard } from '../../features/doctor/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function DoctorDashboardPage() {
  const { data, isLoading, error } = useDoctorDashboard();
  const dashboard = data?.data;

  if (isLoading) {
    return <LoadingBlock label="Đang tải dashboard bác sĩ..." />;
  }

  if (error) {
    return <StateBlock variant="error" title="Không thể tải dashboard" description={error.message} />;
  }

  return (
    <div className="content-grid">
      <section className="metric-grid">
        <article className="metric-card">
          <p>Lịch hẹn hôm nay</p>
          <strong>{dashboard?.kpis?.totalAppointments ?? 0}</strong>
        </article>
        <article className="metric-card">
          <p>Đã check-in</p>
          <strong>{dashboard?.kpis?.checkedInAppointments ?? 0}</strong>
        </article>
        <article className="metric-card">
          <p>Đã hoàn thành</p>
          <strong>{dashboard?.kpis?.completedAppointments ?? 0}</strong>
        </article>
        <article className="metric-card">
          <p>No-show</p>
          <strong>{dashboard?.kpis?.noShowAppointments ?? 0}</strong>
        </article>
      </section>

      <section className="split-panel">
        <div className="surface-card">
          <h2>Timeline hôm nay</h2>
          <div className="timeline-list">
            {(dashboard?.timeline || []).length > 0 ? (
              dashboard.timeline.map((item) => (
                <div key={item.appointmentId} className="timeline-item">
                  <div>
                    <strong>{item.patientName}</strong>
                    <p>{item.code}</p>
                  </div>
                  <div>
                    <div>{item.startTime} - {item.endTime}</div>
                    <span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <StateBlock title="Chưa có lịch hẹn hôm nay" description="Timeline sẽ hiển thị khi backend appointment có dữ liệu thực tế." />
            )}
          </div>
        </div>

        <div className="surface-card">
          <h2>Lịch làm việc tuần này</h2>
          <div className="timeline-list">
            {(dashboard?.weeklySchedule || []).map((item) => (
              <div key={item.scheduleId} className="timeline-item">
                <div>
                  <strong>{item.workingDate}</strong>
                  <p>{item.totalSlots} khung giờ</p>
                </div>
                <span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
