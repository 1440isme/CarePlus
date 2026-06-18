import { useDoctorDashboard } from '../../features/doctor/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function DoctorAppointmentListPage() {
  const { data, isLoading, error } = useDoctorDashboard();
  const timeline = data?.data?.timeline || [];

  if (isLoading) {
    return <LoadingBlock label="Đang tải lịch hẹn..." />;
  }

  if (error) {
    return <StateBlock variant="error" title="Không thể tải lịch hẹn" description={error.message} />;
  }

  return (
    <div className="surface-card">
      <h2>Lịch hẹn hôm nay</h2>
      {timeline.length === 0 ? (
        <StateBlock title="Chưa có lịch hẹn" description="Danh sách lịch hẹn sẽ hiển thị khi có dữ liệu appointment." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã lịch</th>
              <th>Bệnh nhân</th>
              <th>Khung giờ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((item) => (
              <tr key={item.appointmentId}>
                <td>{item.code}</td>
                <td>{item.patientName}</td>
                <td>{item.startTime} - {item.endTime}</td>
                <td><span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
