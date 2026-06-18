import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function BookingWizardPage() {
  return (
    <div className="page-shell">
      <div className="surface-card simple-article">
        <h1>Đặt lịch khám</h1>
        <p>Trang booking wizard đã được nối đúng route `/dat-lich` để không còn dùng placeholder.</p>
        <p>Backend booking module của Dev 3 chưa sẵn sàng trong repo hiện tại, nên luồng stepper đang được cô lập rõ để tránh mock nghiệp vụ sai sự thật.</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <StateBlock
          variant="warning"
          title="Đang chờ API booking"
          description="Khi module appointment hoàn tất, page này sẽ được nối vào `feature/appointment` theo đúng step flow của Figma thay vì dùng dữ liệu giả."
        />
      </div>
    </div>
  );
}
