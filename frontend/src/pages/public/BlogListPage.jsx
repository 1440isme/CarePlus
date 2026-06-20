import { useState, useEffect } from 'react';
import { usePublicBlogs } from '../../features/blog/index.js';
import BlogCard from '../../features/blog/components/BlogCard.jsx';
import './blog-list-page.css';

const TAG_FILTERS = ['Tất cả', 'Tim mạch', 'Tiêu hóa', 'Nhi khoa', 'Da liễu', 'Cơ Xương Khớp', 'Tai Mũi Họng', 'Sản phụ khoa'];

export default function BlogListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6; // Show 6 blogs per page

  // Debounce search keyword update
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchKeyword(searchQuery.trim());
      setCurrentPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch public blogs using React Query
  const blogsQuery = usePublicBlogs({
    page: currentPage,
    limit,
    search: searchKeyword || undefined,
    tag: selectedTag !== 'Tất cả' ? selectedTag : undefined,
  });

  const blogs = blogsQuery.data?.data ?? [];
  const meta = blogsQuery.data?.meta ?? { page: 1, limit: 6, total: 0, totalPages: 1 };

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    setCurrentPage(1); // Reset page on tag filter change
  };

  return (
    <div className="blog-list-page-container">
      {/* Hero section */}
      <section className="blog-list-hero">
        <div className="blog-list-hero-content">
          <h1>Cẩm nang sức khỏe</h1>
          <p>Kiến thức y tế hữu ích từ đội ngũ chuyên gia CarePlus</p>
        </div>
      </section>

      {/* Filter and Search Section */}
      <section className="blog-list-filters-section">
        <div className="blog-list-filters-container">
          <div className="blog-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blog-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search-btn">
                ✕
              </button>
            )}
          </div>

          <div className="blog-tag-chips">
            {TAG_FILTERS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section className="blog-grid-section">
        {blogsQuery.isLoading ? (
          <div className="blog-loading-grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="blog-skeleton-card">
                <div className="skeleton-image skeleton-shimmer"></div>
                <div className="skeleton-content">
                  <div className="skeleton-badge skeleton-shimmer"></div>
                  <div className="skeleton-title skeleton-shimmer"></div>
                  <div className="skeleton-text skeleton-shimmer"></div>
                  <div className="skeleton-text skeleton-shimmer short"></div>
                </div>
              </div>
            ))}
          </div>
        ) : blogsQuery.isError ? (
          <div className="blog-error-fallback">
            <span className="error-icon">⚠️</span>
            <h3>Đã có lỗi xảy ra khi tải bài viết</h3>
            <p>{blogsQuery.error?.message || 'Vui lòng kiểm tra lại đường truyền internet.'}</p>
            <button onClick={() => blogsQuery.refetch()} className="retry-btn">
              Thử lại
            </button>
          </div>
        ) : blogs.length === 0 ? (
          <div className="blog-empty-state">
            <span className="empty-icon">📖</span>
            <h3>Không tìm thấy bài viết nào</h3>
            <p>Hãy thử tìm kiếm với từ khóa khác hoặc lọc theo chuyên khoa khác.</p>
          </div>
        ) : (
          <>
            <div className="blog-cards-grid">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="blog-pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  &larr; Trước
                </button>
                
                <span className="pagination-info">
                  Trang <strong>{currentPage}</strong> / {meta.totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={currentPage === meta.totalPages}
                  className="pagination-btn"
                >
                  Sau &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
