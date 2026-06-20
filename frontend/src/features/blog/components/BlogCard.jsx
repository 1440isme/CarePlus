import { Link } from 'react-router-dom';
import './blog-card.css';

export default function BlogCard({ blog }) {
  const { title, slug, summary, thumbnail, tags, createdAt } = blog;
  
  // Format tags: use the first tag as the main category badge, default to "Y tế"
  const category = tags && tags.length > 0 ? tags[0] : 'Y tế';
  
  // Format Date (vietnamese format DD/MM/YYYY fallback)
  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '';

  return (
    <Link to={`/cam-nang/${slug}`} className="blog-card-link">
      <article className="blog-card">
        <div className="blog-card-image-wrapper">
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="blog-card-img" />
          ) : (
            <div className="blog-card-img-placeholder">
              <span>📖</span>
            </div>
          )}
        </div>
        
        <div className="blog-card-content">
          <div className="blog-card-badge-row">
            <span className="blog-card-category-badge">{category}</span>
          </div>
          
          <h3 className="blog-card-title">{title}</h3>
          
          <p className="blog-card-summary">{summary || 'Đọc bài viết để tìm hiểu thêm thông tin...'}</p>
          
          <div className="blog-card-footer">
            <span className="blog-card-date">{formattedDate}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
