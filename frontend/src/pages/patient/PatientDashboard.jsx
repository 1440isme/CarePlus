import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function PatientDashboard() {
  return <StateBlock variant="warning" title="Patient dashboard đang chờ backend" description="Khung route portal đã sẵn sàng. Khi appointment/patient-profile APIs hoàn tất, page này sẽ nối dữ liệu thật." />;
}
