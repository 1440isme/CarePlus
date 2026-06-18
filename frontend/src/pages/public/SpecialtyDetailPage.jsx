import { useParams } from 'react-router-dom';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './public-pages.css';

export default function SpecialtyDetailPage() {
  const { slug } = useParams();

  return (
    <div className="page-shell">
      <div className="surface-card simple-article">
        <h1>Chi tiết chuyên khoa: {slug}</h1>
        <p>Route chi tiết chuyên khoa đã được cắm đúng theo system documentation và Figma flow.</p>
        <p>Nội dung và bác sĩ liên quan sẽ được nối qua feature `specialty` khi backend module này sẵn sàng.</p>
      </div>
      <div style={{ marginTop: 24 }}>
        <StateBlock variant="warning" title="Đang chờ API chuyên khoa" description="Không mock nghiệp vụ vượt mức. Page này đang cô lập rõ dependency backend còn thiếu." />
      </div>
    </div>
  );
}
