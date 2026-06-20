import './feedback.css';

export default function LoadingBlock({ label = 'Đang tải dữ liệu...' }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true"></span>
      <span>{label}</span>
    </div>
  );
}
