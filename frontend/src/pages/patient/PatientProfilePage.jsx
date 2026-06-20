import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function PatientProfilePage() {
  return <StateBlock variant="warning" title="Thông tin cá nhân bệnh nhân đang chờ hoàn thiện" description="Page được giữ theo đúng flow portal, data layer sẽ nối vào user/patient-profile service khi backend sẵn sàng đầy đủ." />;
}
