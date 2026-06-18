import { useParams } from 'react-router-dom';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function BlogDetailPage() {
  const { slug } = useParams();

  return (
    <div className="page-shell">
      <article className="surface-card simple-article">
        <h1>Bài viết: {slug}</h1>
        <p>Trang chi tiết bài viết đã được nối route thật theo public flow.</p>
        <p>Khi API blog sẵn sàng, page này sẽ đọc slug và render nội dung thực qua `feature/blog/service`.</p>
      </article>
      <div style={{ marginTop: 24 }}>
        <StateBlock variant="warning" title="Đang chờ API blog detail" description="Không dùng mock article body quy mô lớn để tránh sai sự thật nghiệp vụ." />
      </div>
    </div>
  );
}
