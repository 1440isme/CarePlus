import { useParams, Link } from 'react-router-dom';
import { usePublicBlogBySlug, usePublicBlogs, BlogCard } from '../../features/blog/index.js';
import './blog-detail-page.css';

export default function BlogDetailPage() {
  const { slug } = useParams();

  // Fetch blog detail using React Query
  const { data: response, isLoading, isError, error, refetch } = usePublicBlogBySlug(slug);

  const blog = response?.data;

  // Fetch latest blogs for related/latest section
  const { data: latestResponse, isLoading: latestLoading } = usePublicBlogs({
    page: 1,
    limit: 4 // Fetch 4 to ensure we have 3 even if current blog is in the list
  });

  const latestBlogs = (latestResponse?.data ?? [])
    .filter((b) => b.slug !== slug)
    .slice(0, 3);

  // Format date
  const formattedDate = blog?.createdAt 
    ? new Date(blog.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  // Get first tag as main category
  const category = blog?.tags && blog.tags.length > 0 ? blog.tags[0] : 'Cẩm nang';

  if (isLoading) {
    return (
      <div className="blog-detail-loading-container">
        <div className="blog-detail-loading-skeleton">
          <div className="skeleton-title skeleton-shimmer"></div>
          <div className="skeleton-meta skeleton-shimmer"></div>
          <div className="skeleton-detail-image skeleton-shimmer"></div>
          <div className="skeleton-para skeleton-shimmer"></div>
          <div className="skeleton-para skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="blog-detail-error-container">
        <span className="error-icon">⚠️</span>
        <h2>Không thể tải bài viết</h2>
        <p>{error?.message || 'Có lỗi xảy ra trên hệ thống hoặc bài viết không tồn tại.'}</p>
        <div className="error-actions">
          <Link to="/cam-nang" className="btn-back">Quay về Cẩm nang</Link>
          <button onClick={() => refetch()} className="btn-retry">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <article className="blog-detail-container">
      {/* Back button */}
      <div className="blog-detail-header-nav">
        <Link to="/cam-nang" className="back-link">
          &larr; Quay về danh sách Cẩm nang
        </Link>
      </div>

      {/* Main header info */}
      <header className="blog-detail-header">
        <div className="blog-detail-badge-row">
          <span className="blog-category-badge">{category}</span>
        </div>
        
        <h1 className="blog-detail-title">{blog.title}</h1>
        
        <div className="blog-detail-meta">
          <div className="author-avatar-initials">
            {blog.author?.name ? blog.author.name.slice(0, 2).toUpperCase() : 'CP'}
          </div>
          <div className="author-info-text">
            <span className="author-name">Tác giả: <strong>{blog.author?.name || 'Chuyên gia CarePlus'}</strong></span>
            <span className="publish-date">Ngày đăng: {formattedDate}</span>
          </div>
        </div>
      </header>

      {/* Large Featured Image */}
      {blog.thumbnail && (
        <div className="blog-detail-image-wrapper">
          <img src={blog.thumbnail} alt={blog.title} className="blog-detail-featured-img" />
        </div>
      )}

      {/* Summary intro */}
      {blog.summary && (
        <div className="blog-detail-summary-box">
          <p>{blog.summary}</p>
        </div>
      )}

      {/* Article HTML body content */}
      <div 
        className="blog-detail-body ck-content" 
        dangerouslySetInnerHTML={{ __html: blog.content }} 
      />

      {/* Footer tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="blog-detail-footer-tags">
          <span className="tags-label">Thẻ chuyên khoa:</span>
          <div className="tags-list">
            {blog.tags.map((tag) => (
              <Link to={`/cam-nang?tag=${encodeURIComponent(tag)}`} key={tag} className="footer-tag-chip">
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest Articles recommendations */}
      <section className="blog-detail-related-section">
        <h2 className="related-section-title">Bài viết mới nhất</h2>
        {latestLoading ? (
          <div className="related-loading">Đang tải các bài viết mới...</div>
        ) : latestBlogs.length === 0 ? (
          <div className="related-empty">Không có bài viết liên quan khác.</div>
        ) : (
          <div className="related-blogs-grid">
            {latestBlogs.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
