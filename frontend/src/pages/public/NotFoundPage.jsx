import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-shell">
      <div className="surface-card simple-article">
        <h1>Không tìm thấy trang</h1>
        <p>Liên kết bạn truy cập hiện không tồn tại trong flow của CarePlus.</p>
        <Link className="button-primary" to="/">Quay về trang chủ</Link>
      </div>
    </div>
  );
}
