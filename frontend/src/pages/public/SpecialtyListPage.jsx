import { Link } from 'react-router-dom';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './public-pages.css';

const specialties = [
  { slug: 'noi-khoa', name: 'Nội khoa', description: 'Theo dõi và điều trị các bệnh lý tổng quát thường gặp.' },
  { slug: 'nhi-khoa', name: 'Nhi khoa', description: 'Chăm sóc sức khỏe trẻ em theo quy trình của CarePlus.' },
  { slug: 'tim-mach', name: 'Tim mạch', description: 'Khám tầm soát và tư vấn các vấn đề tim mạch chuyên sâu.' },
  { slug: 'da-lieu', name: 'Da liễu', description: 'Thăm khám da liễu với lịch hẹn linh hoạt và theo dõi rõ ràng.' },
];

export default function SpecialtyListPage() {
  return (
    <div className="page-shell">
      <div className="page-header-block">
        <div>
          <h1>Chuyên khoa</h1>
          <p>Danh mục chuyên khoa đang được hiển thị theo route và content hierarchy của public website.</p>
        </div>
      </div>

      <div className="cards-grid">
        {specialties.map((specialty) => (
          <article key={specialty.slug} className="specialty-card-page">
            <div className="specialty-card-page-content">
              <h3>{specialty.name}</h3>
              <p>{specialty.description}</p>
              <Link className="button-secondary" to={`/chuyen-khoa/${specialty.slug}`}>Xem chi tiết</Link>
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <StateBlock
          variant="warning"
          title="API chuyên khoa chưa sẵn sàng"
          description="Page này đã được tách khỏi placeholder và giữ đúng route public. Khi backend specialty có route thật, chỉ cần thay thế data layer ở feature/service."
        />
      </div>
    </div>
  );
}
