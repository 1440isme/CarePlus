import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function PatientAppointments() {
  return <StateBlock variant="warning" title="Lịch hẹn của tôi đang chờ API appointment" description="Không mock danh sách lịch hẹn khi backend appointment chưa sẵn sàng trong repo hiện tại." />;
}
