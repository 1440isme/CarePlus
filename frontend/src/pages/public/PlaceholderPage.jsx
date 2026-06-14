import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '20px'
      }}>🛠️</div>
      <h1 style={{
        fontSize: '28px',
        margin: '0 0 16px',
        color: 'var(--text-h)'
      }}>{title}</h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--text)',
        maxWidth: '500px',
        margin: '0 0 24px',
        lineHeight: '1.6'
      }}>
        Trang <strong>{title}</strong> hiện đang được đội ngũ lập trình viên CarePlus phát triển. Xin vui lòng quay lại sau!
      </p>
      <Link to="/" className="btn btn-primary">
        Quay lại Trang chủ
      </Link>
    </div>
  );
}
