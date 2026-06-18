import { Link } from 'react-router-dom';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './public-pages.css';

const articles = [
  { slug: 'phong-ngua-cam-cum', title: 'Phòng ngừa cảm cúm theo mùa', summary: 'Một số lưu ý quan trọng để chủ động bảo vệ sức khỏe cả gia đình.' },
  { slug: 'kham-suc-khoe-dinh-ky', title: 'Vì sao nên khám sức khỏe định kỳ?', summary: 'Theo dõi các mốc kiểm tra cần thiết để phát hiện sớm các yếu tố nguy cơ.' },
];

export default function BlogListPage() {
  return (
    <div className="page-shell">
      <div className="page-header-block">
        <div>
          <h1>Cẩm nang sức khỏe</h1>
          <p>Trang danh sách bài viết đã thay placeholder và giữ đúng flow public website.</p>
        </div>
      </div>

      <div className="cards-grid">
        {articles.map((article) => (
          <article key={article.slug} className="blog-card">
            <div className="blog-card-content">
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <Link className="button-secondary" to={`/cam-nang/${article.slug}`}>Đọc tiếp</Link>
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <StateBlock variant="warning" title="Đang chờ API blog" description="Danh sách bài viết hiện giữ route và layout sẵn sàng để thay bằng hook/service thật khi backend blog hoàn tất." />
      </div>
    </div>
  );
}
